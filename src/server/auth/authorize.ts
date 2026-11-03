// The data access layer's gate (docs/platform/03-security-and-access.md section 4): every admin page, Server Action and Route Handler calls
// requireMember(...) before it reads or writes anything. It asks the auth server whether the token is valid, loads the member and role from
// the database on every call (so a disabled member or a changed role takes effect at once), and checks the permission.
import type { Sql } from "../db/client.ts";
import { writeAudit } from "./audit.ts";
import { AuthUnavailableError, type AuthProvider, type AuthUser } from "./provider.ts";
import { isSensitiveField, scopeOf, type RoleKey } from "./permissions.ts";

export class AuthError extends Error {
  /** 401 not signed in, 403 signed in but not allowed, 409 the change conflicts with a rule, 503 sign-in service down */
  constructor(public status: 401 | 403 | 409 | 503, public code: string, message?: string) {
    super(message ?? code);
    this.name = "AuthError";
  }
}

export type Member = { id: number; authUserId: string; email: string; displayName: string; role: RoleKey; permissions: ReadonlySet<string>; aal: AuthUser["aal"] };
export type AuthDeps = {
  sql: Sql;
  provider: AuthProvider;
  /** Owners and admins must have signed in with a second factor. Off until MFA is set up for the team. */
  requireMfa?: boolean;
  ipSalt?: string;
};

const SEEN_EVERY_MINUTES = 5;

type MemberRow = { id: number; auth_user_id: string | null; email: string; display_name: string; status: string; role_key: RoleKey };

async function loadPermissions(sql: Sql, memberId: number): Promise<Set<string>> {
  const rows = await sql<{ key: string }[]>`
    select p.key from team_members m join role_permissions rp on rp.role_id = m.role_id join permissions p on p.id = rp.permission_id where m.id = ${memberId}`;
  return new Set(rows.map((r) => r.key));
}

/** Find the team member for an authenticated user. An invited member is activated the first time their confirmed e-mail address signs in. */
async function resolveMember(deps: AuthDeps, user: AuthUser): Promise<Member> {
  const { sql } = deps;
  let [row] = await sql<MemberRow[]>`
    select m.id, m.auth_user_id, m.email, m.display_name, m.status, r.key as role_key
    from team_members m join roles r on r.id = m.role_id where m.auth_user_id = ${user.authUserId}`;
  if (!row) {
    // Only a confirmed address can claim an invitation, and only once.
    if (!user.emailConfirmed) throw new AuthError(403, "email_not_confirmed");
    row = await sql.begin(async (tx) => {
      const [claimed] = await tx<MemberRow[]>`
        update team_members set auth_user_id = ${user.authUserId}, status = 'active', last_seen_at = now()
        where lower(email) = ${user.email.toLowerCase()} and auth_user_id is null and status = 'invited'
        returning id, auth_user_id, email, display_name, status, (select key from roles where id = role_id) as role_key`;
      if (claimed) await writeAudit(tx as unknown as Sql, { actor: claimed.id, action: "auth.member_activated", entityType: "team_member", entityId: claimed.id, after: { email: claimed.email, role: claimed.role_key } }, { ipSalt: deps.ipSalt });
      return claimed;
    });
    if (!row) throw new AuthError(403, "not_a_team_member");
  }
  if (row.status === "disabled") throw new AuthError(403, "account_disabled");
  if (row.status !== "active") throw new AuthError(403, "not_a_team_member");
  await sql`update team_members set last_seen_at = now() where id = ${row.id} and (last_seen_at is null or last_seen_at < now() - make_interval(mins => ${SEEN_EVERY_MINUTES}))`;
  return { id: Number(row.id), authUserId: user.authUserId, email: row.email, displayName: row.display_name, role: row.role_key, permissions: await loadPermissions(sql, Number(row.id)), aal: user.aal };
}

/**
 * Authenticate the request and, when `permission` is given, authorize it. Throws AuthError (401, 403 or 503); returns the member otherwise.
 * `token` is the access token from the session cookie.
 */
export async function requireMember(deps: AuthDeps, token: string | null | undefined, permission?: string): Promise<Member> {
  if (!token) throw new AuthError(401, "not_signed_in");
  let user: AuthUser | null;
  try {
    user = await deps.provider.verifyAccessToken(token);
  } catch (e) {
    if (e instanceof AuthUnavailableError) throw new AuthError(503, "auth_unavailable");
    throw e;
  }
  if (!user) throw new AuthError(401, "invalid_session");
  const member = await resolveMember(deps, user);
  if (deps.requireMfa && (member.role === "owner" || member.role === "admin") && member.aal !== "aal2") throw new AuthError(403, "mfa_required");
  if (permission && !member.permissions.has(permission)) throw new AuthError(403, "forbidden", `missing permission ${permission}`);
  return member;
}

export const can = (member: Member, permission: string) => member.permissions.has(permission);

/**
 * Row-level rule for scoped grants. A contributor may change only rows they created while those are draft or in review; every other role with
 * the permission may change any row. Call it in the repository function, with the row as it is in the database.
 */
export function canActOnRow(member: Member, permission: string, row: { createdBy: number | null; status: string }): boolean {
  if (!can(member, permission)) return false;
  const scope = scopeOf(member.role, permission);
  if (scope === "own_drafts") return row.createdBy === member.id && (row.status === "draft" || row.status === "in_review");
  return scope !== undefined;
}

/** Field-level rule for the "non_sensitive" scope: an editor may not change pricing, verification, method or affiliate fields. */
export function canChangeFields(member: Member, permission: string, fields: readonly string[]): boolean {
  if (!can(member, permission)) return false;
  return scopeOf(member.role, permission) !== "non_sensitive" || !fields.some(isSensitiveField);
}
