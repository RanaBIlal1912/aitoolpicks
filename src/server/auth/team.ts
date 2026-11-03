// Team management: invite, change role, disable, enable. Each function checks the actor's permission, applies the rules that are not in the
// permission matrix (docs/platform/03-security-and-access.md section 3), and writes the audit row in the same transaction as the change.
// The database enforces the last-owner rule on top, so a bug here cannot remove the last owner.
import { z } from "zod";
import type { Sql } from "../db/client.ts";
import { writeAudit } from "./audit.ts";
import { AuthError, type AuthDeps, type Member } from "./authorize.ts";
import { canAssignRole, ROLES, type RoleKey } from "./permissions.ts";

const emailSchema = z.string().trim().toLowerCase().max(254).regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "not an e-mail address");
const roleSchema = z.enum(ROLES.map((r) => r.key) as [RoleKey, ...RoleKey[]]);
type Row = { id: number; email: string; status: string; role_key: RoleKey; auth_user_id: string | null };

const need = (actor: Member, permission: string) => {
  if (!actor.permissions.has(permission)) throw new AuthError(403, "forbidden", `missing permission ${permission}`);
};
const sqlOf = (tx: unknown) => tx as Sql;
const isCode = (e: unknown, code: string) => typeof e === "object" && e !== null && (e as { code?: string }).code === code;

async function target(tx: Sql, id: number): Promise<Row> {
  const [row] = await tx<Row[]>`select m.id, m.email, m.status, m.auth_user_id, r.key as role_key from team_members m join roles r on r.id = m.role_id where m.id = ${id} for update of m`;
  if (!row) throw new AuthError(409, "no_such_member");
  return { ...row, id: Number(row.id) };
}

/** Run a change; turn the database's last-owner refusal into a clear answer. */
async function guarded<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (isCode(e, "23514") && /last active owner/.test((e as Error).message)) throw new AuthError(409, "last_owner", "the last active owner cannot be removed, demoted or disabled");
    throw e;
  }
}

export async function inviteMember(deps: AuthDeps, actor: Member, input: { email: string; role: RoleKey }, ctx: { requestId?: string; ip?: string } = {}) {
  need(actor, "team:invite");
  const email = emailSchema.parse(input.email);
  const role = roleSchema.parse(input.role);
  if (!canAssignRole(actor.role, role)) throw new AuthError(403, "cannot_grant_role", `a ${actor.role} cannot grant ${role}`);
  return deps.sql.begin(async (raw) => {
    const tx = sqlOf(raw);
    let member: { id: number };
    try {
      [member] = await tx<{ id: number }[]>`
        insert into team_members (email, role_id, status, invited_by, invited_at) values (${email}, (select id from roles where key = ${role}), 'invited', ${actor.id}, now()) returning id`;
    } catch (e) {
      if (isCode(e, "23505")) throw new AuthError(409, "already_member");
      throw e;
    }
    await writeAudit(tx, { actor: actor.id, action: "team.invited", entityType: "team_member", entityId: member.id, after: { email, role }, ...ctx }, { ipSalt: deps.ipSalt });
    // The invitation e-mail goes out last: if it fails, the row above is rolled back and nobody is left half-invited.
    await deps.provider.inviteUser(email);
    return { id: Number(member.id), email, role };
  });
}

export async function changeRole(deps: AuthDeps, actor: Member, targetId: number, newRole: RoleKey, ctx: { requestId?: string; ip?: string } = {}) {
  need(actor, "team:role");
  const role = roleSchema.parse(newRole);
  if (targetId === actor.id) throw new AuthError(403, "cannot_change_own_role");
  return guarded(() =>
    deps.sql.begin(async (raw) => {
      const tx = sqlOf(raw);
      const m = await target(tx, targetId);
      if (!canAssignRole(actor.role, role) || (m.role_key === "owner" && actor.role !== "owner")) throw new AuthError(403, "cannot_grant_role", `a ${actor.role} cannot change ${m.role_key} to ${role}`);
      if (m.role_key === role) return { id: m.id, role };
      await tx`update team_members set role_id = (select id from roles where key = ${role}) where id = ${m.id}`;
      await writeAudit(tx, { actor: actor.id, action: "team.role_changed", entityType: "team_member", entityId: m.id, before: { role: m.role_key }, after: { role }, ...ctx }, { ipSalt: deps.ipSalt });
      return { id: m.id, role };
    }),
  );
}

/** Disable a member. The database change decides: it is checked on every request. The auth-server block is best effort and reported. */
export async function disableMember(deps: AuthDeps, actor: Member, targetId: number, ctx: { requestId?: string; ip?: string } = {}) {
  need(actor, "team:disable");
  if (targetId === actor.id) throw new AuthError(403, "cannot_disable_self");
  const m = await guarded(() =>
    deps.sql.begin(async (raw) => {
      const tx = sqlOf(raw);
      const row = await target(tx, targetId);
      if (row.role_key === "owner" && actor.role !== "owner") throw new AuthError(403, "cannot_disable_owner");
      await tx`update team_members set status = 'disabled', disabled_at = now() where id = ${row.id}`;
      await writeAudit(tx, { actor: actor.id, action: "team.disabled", entityType: "team_member", entityId: row.id, before: { status: row.status }, after: { status: "disabled" }, ...ctx }, { ipSalt: deps.ipSalt });
      return row;
    }),
  );
  return { id: m.id, providerSynced: await syncBan(deps, m.auth_user_id, true) };
}

export async function enableMember(deps: AuthDeps, actor: Member, targetId: number, ctx: { requestId?: string; ip?: string } = {}) {
  need(actor, "team:disable");
  const m = await deps.sql.begin(async (raw) => {
    const tx = sqlOf(raw);
    const row = await target(tx, targetId);
    if (row.status !== "disabled") throw new AuthError(409, "not_disabled");
    // Someone who never signed in goes back to "invited"; everyone else is active again.
    const status = row.auth_user_id ? "active" : "invited";
    await tx`update team_members set status = ${status}, disabled_at = null where id = ${row.id}`;
    await writeAudit(tx, { actor: actor.id, action: "team.enabled", entityType: "team_member", entityId: row.id, before: { status: "disabled" }, after: { status }, ...ctx }, { ipSalt: deps.ipSalt });
    return row;
  });
  return { id: m.id, providerSynced: await syncBan(deps, m.auth_user_id, false) };
}

async function syncBan(deps: AuthDeps, authUserId: string | null, banned: boolean): Promise<boolean> {
  if (!authUserId) return true;
  try {
    await deps.provider.setBanned(authUserId, banned);
    return true;
  } catch {
    return false;
  }
}
