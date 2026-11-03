// Seeding, sign-in resolution, team rules, audit and rate limiting against a disposable database, with a fake sign-in provider.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { writeAudit } from "../src/server/auth/audit.ts";
import { AuthError, requireMember, type AuthDeps, type Member } from "../src/server/auth/authorize.ts";
import { PERMISSIONS, ROLES, type RoleKey } from "../src/server/auth/permissions.ts";
import { AuthUnavailableError, type AuthProvider, type AuthUser } from "../src/server/auth/provider.ts";
import { consume, LIMITS, prune } from "../src/server/auth/rate-limit.ts";
import { seedAccess } from "../src/server/auth/seed.ts";
import { changeRole, disableMember, enableMember, inviteMember } from "../src/server/auth/team.ts";
import { freshDatabase, pg } from "./helpers/db.ts";

const available = pg().available;

/** A sign-in provider whose tokens are plain words: "token:<name>" maps to a user set up by the test. */
class FakeProvider implements AuthProvider {
  users = new Map<string, AuthUser>();
  down = false;
  invites: string[] = [];
  bans: [string, boolean][] = [];
  failInvite = false;
  failBan = false;
  add(name: string, email: string, opts: Partial<AuthUser> = {}) {
    const authUserId = `00000000-0000-4000-8000-${String(this.users.size + 1).padStart(12, "0")}`;
    this.users.set(name, { authUserId, email, emailConfirmed: true, aal: "aal1", ...opts });
    return authUserId;
  }
  async verifyAccessToken(token: string) {
    if (this.down) throw new AuthUnavailableError();
    return this.users.get(token.replace(/^token:/, "")) ?? null;
  }
  async inviteUser(email: string) {
    if (this.failInvite) throw new Error("invite failed");
    this.invites.push(email);
    return { authUserId: "00000000-0000-4000-8000-ffffffffffff" };
  }
  async setBanned(id: string, banned: boolean) {
    if (this.failBan) throw new Error("ban failed");
    this.bans.push([id, banned]);
  }
}

describe.skipIf(!available)("access control", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  let provider: FakeProvider;
  let deps: AuthDeps;
  const as = (name: string) => `token:${name}`;
  const status = async (p: Promise<unknown>) => p.then(() => 0, (e: AuthError) => `${e.status}:${e.code}`);

  /** Create a member directly in the database and sign them in, returning the Member. */
  const addMember = async (name: string, role: RoleKey, state: "active" | "invited" = "active") => {
    const email = `${name}@example.com`;
    const authUserId = provider.add(name, email);
    await db.sql`insert into team_members (email, role_id, status, auth_user_id) values (${email}, (select id from roles where key = ${role}), ${state}, ${state === "active" ? authUserId : null})`;
    return state === "active" ? requireMember(deps, as(name)) : (undefined as unknown as Member);
  };

  beforeAll(async () => {
    db = await freshDatabase();
    provider = new FakeProvider();
    deps = { sql: db.sql, provider, ipSalt: "a-long-enough-ip-salt" };
    await seedAccess(db.sql);
  });
  afterAll(async () => db?.drop());

  describe("seeding", () => {
    it("makes the tables equal the code, grant for grant", async () => {
      const rows = await db.sql<{ r: string; p: string }[]>`select r.key r, p.key p from role_permissions rp join roles r on r.id = rp.role_id join permissions p on p.id = rp.permission_id`;
      const inDb = new Set(rows.map((x) => `${x.r}|${x.p}`));
      const inCode = new Set(Object.entries(PERMISSIONS).flatMap(([k, p]) => Object.keys(p.grants).map((r) => `${r}|${k}`)));
      expect(inDb).toEqual(inCode);
      expect((await db.sql`select key from roles`).map((r) => r.key).sort()).toEqual(ROLES.map((r) => r.key).sort());
    });

    it("a second run changes nothing and writes no audit row", async () => {
      const before = await db.sql`select count(*)::int n from audit_logs`;
      const r = await seedAccess(db.sql);
      expect(r.changed).toBe(false);
      expect((await db.sql`select count(*)::int n from audit_logs`)[0].n).toBe(before[0].n);
    });

    it("restores a grant that was removed by hand and removes one that was added by hand, and says so in the audit log", async () => {
      await db.sql`delete from role_permissions where role_id = (select id from roles where key = 'editor') and permission_id = (select id from permissions where key = 'blog:publish')`;
      await db.sql`insert into role_permissions (role_id, permission_id) values ((select id from roles where key = 'analyst'), (select id from permissions where key = 'tools:delete'))`;
      const r = await seedAccess(db.sql);
      expect(r.grantsAdded).toEqual(["editor|blog:publish"]);
      expect(r.grantsRemoved).toEqual(["analyst|tools:delete"]);
      const [log] = await db.sql`select action, actor_member_id from audit_logs where action = 'access.seeded' order by id desc limit 1`;
      expect(log.action).toBe("access.seeded");
    });
  });

  describe("requireMember", () => {
    it("401 without a token or with one the server rejects", async () => {
      expect(await status(requireMember(deps, undefined))).toBe("401:not_signed_in");
      expect(await status(requireMember(deps, ""))).toBe("401:not_signed_in");
      expect(await status(requireMember(deps, "token:nobody"))).toBe("401:invalid_session");
    });

    it("503 when the sign-in service is down, never a pass", async () => {
      await addMember("ana", "owner");
      provider.down = true;
      expect(await status(requireMember(deps, as("ana")))).toBe("503:auth_unavailable");
      provider.down = false;
      expect(await status(requireMember(deps, as("ana")))).toBe(0);
    });

    it("403 for someone who signed in but is not on the team, or whose address is unconfirmed", async () => {
      provider.add("stranger", "stranger@example.com");
      expect(await status(requireMember(deps, as("stranger")))).toBe("403:not_a_team_member");
      provider.add("unconfirmed", "invitee@example.com", { emailConfirmed: false });
      await db.sql`insert into team_members (email, role_id, status) values ('invitee@example.com', (select id from roles where key = 'editor'), 'invited')`;
      expect(await status(requireMember(deps, as("unconfirmed")))).toBe("403:email_not_confirmed");
    });

    it("activates an invited member the first time their confirmed address signs in, and records it", async () => {
      provider.add("invitee", "invitee@example.com");
      const m = await requireMember(deps, as("invitee"));
      expect(m.role).toBe("editor");
      const [row] = await db.sql`select status, auth_user_id from team_members where email = 'invitee@example.com'`;
      expect(row.status).toBe("active");
      expect(row.auth_user_id).toBe(provider.users.get("invitee")!.authUserId);
      const [log] = await db.sql`select action, actor_member_id from audit_logs where action = 'auth.member_activated' order by id desc limit 1`;
      expect(Number(log.actor_member_id)).toBe(m.id);
    });

    it("a second account cannot claim an address that is already linked", async () => {
      provider.add("thief", "invitee@example.com");
      expect(await status(requireMember(deps, as("thief")))).toBe("403:not_a_team_member");
    });

    it("an invitation cannot be claimed with a different capitalisation of the address by a second user", async () => {
      await db.sql`insert into team_members (email, role_id, status) values ('Mixed@Example.com', (select id from roles where key = 'reviewer'), 'invited')`;
      provider.add("mixed", "mixed@example.com");
      expect((await requireMember(deps, as("mixed"))).role).toBe("reviewer");
    });

    it("checks the permission, from the database, on every request", async () => {
      const analyst = await addMember("anders", "analyst");
      expect(await status(requireMember(deps, as("anders"), "analytics:read"))).toBe(0);
      expect(await status(requireMember(deps, as("anders"), "tools:read"))).toBe("403:forbidden");
      expect(analyst.permissions.has("tools:read")).toBe(false);
      // a role change takes effect on the next request
      await db.sql`update team_members set role_id = (select id from roles where key = 'editor') where email = 'anders@example.com'`;
      expect(await status(requireMember(deps, as("anders"), "tools:read"))).toBe(0);
      expect(await status(requireMember(deps, as("anders"), "analytics:read"))).toBe(0); // editors may read analytics too
      expect(await status(requireMember(deps, as("anders"), "team:invite"))).toBe("403:forbidden");
    });

    it("a disabled member is refused on the very next request even though the token is still valid", async () => {
      await addMember("dora", "editor");
      expect(await status(requireMember(deps, as("dora"), "tools:read"))).toBe(0);
      await db.sql`update team_members set status = 'disabled', disabled_at = now() where email = 'dora@example.com'`;
      expect(await status(requireMember(deps, as("dora"), "tools:read"))).toBe("403:account_disabled");
    });

    it("owners and admins need a second factor when that is switched on; others do not", async () => {
      const mfa = { ...deps, requireMfa: true };
      expect(await status(requireMember(mfa, as("ana")))).toBe("403:mfa_required");
      provider.users.set("ana", { ...provider.users.get("ana")!, aal: "aal2" });
      expect(await status(requireMember(mfa, as("ana")))).toBe(0);
      await addMember("edie", "editor");
      expect(await status(requireMember(mfa, as("edie")))).toBe(0);
    });

    it("stores when the member was last seen, at most every five minutes", async () => {
      await requireMember(deps, as("ana"));
      const [a] = await db.sql`select last_seen_at from team_members where email = 'ana@example.com'`;
      await requireMember(deps, as("ana"));
      const [b] = await db.sql`select last_seen_at from team_members where email = 'ana@example.com'`;
      expect(b.last_seen_at.getTime()).toBe(a.last_seen_at.getTime());
    });
  });

  describe("team management", () => {
    let owner: Member;
    beforeAll(async () => {
      owner = await requireMember(deps, as("ana"));
    });

    it("an owner invites a member: row, e-mail request and audit row", async () => {
      const r = await inviteMember(deps, owner, { email: "  New.Person@Example.com ", role: "editor" }, { ip: "203.0.113.5", requestId: "req-1" });
      expect(r.email).toBe("new.person@example.com");
      expect(provider.invites).toContain("new.person@example.com");
      const [m] = await db.sql`select status, invited_by from team_members where email = 'new.person@example.com'`;
      expect(m.status).toBe("invited");
      expect(Number(m.invited_by)).toBe(owner.id);
      const [log] = await db.sql`select action, request_id, ip_hash from audit_logs where action = 'team.invited' order by id desc limit 1`;
      expect(log.request_id).toBe("req-1");
      expect(log.ip_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(log.ip_hash).not.toBe("203.0.113.5");
    });

    it("an admin, an editor and an analyst cannot invite anyone", async () => {
      await addMember("adam", "admin");
      for (const n of ["adam", "edie", "anders"]) {
        const m = await requireMember(deps, as(n));
        expect(await status(inviteMember(deps, m, { email: "x@example.com", role: "contributor" }))).toBe("403:forbidden");
      }
    });

    it("only an owner can grant the owner role", async () => {
      const second = await inviteMember(deps, owner, { email: "second.owner@example.com", role: "owner" });
      expect(second.role).toBe("owner");
    });

    it("refuses a duplicate address, a bad address and an unknown role", async () => {
      expect(await status(inviteMember(deps, owner, { email: "NEW.PERSON@example.com", role: "editor" }))).toBe("409:already_member");
      await expect(inviteMember(deps, owner, { email: "not-an-address", role: "editor" })).rejects.toThrow();
      await expect(inviteMember(deps, owner, { email: "ok@example.com", role: "superuser" as RoleKey })).rejects.toThrow();
    });

    it("leaves no half-created member when the invitation e-mail fails", async () => {
      provider.failInvite = true;
      await expect(inviteMember(deps, owner, { email: "lost@example.com", role: "editor" })).rejects.toThrow(/invite failed/);
      provider.failInvite = false;
      expect((await db.sql`select count(*)::int n from team_members where email = 'lost@example.com'`)[0].n).toBe(0);
      expect((await db.sql`select count(*)::int n from audit_logs where entity_id = 'lost@example.com'`)[0].n).toBe(0);
    });

    it("changes a role, audits before and after, and refuses to change your own", async () => {
      const edie = await requireMember(deps, as("edie"));
      await changeRole(deps, owner, edie.id, "reviewer");
      const [log] = await db.sql`select before, after from audit_logs where action = 'team.role_changed' order by id desc limit 1`;
      expect(log.before).toEqual({ role: "editor" });
      expect(log.after).toEqual({ role: "reviewer" });
      expect((await requireMember(deps, as("edie"))).role).toBe("reviewer");
      expect(await status(changeRole(deps, owner, owner.id, "admin"))).toBe("403:cannot_change_own_role");
    });

    it("an admin cannot change roles, even with the id of a lower member", async () => {
      const adam = await requireMember(deps, as("adam"));
      const edie = await requireMember(deps, as("edie"));
      expect(await status(changeRole(deps, adam, edie.id, "admin"))).toBe("403:forbidden");
    });

    it("the last active owner cannot be demoted or disabled, even when the caller's own view is out of date", async () => {
      // "stale" believes it is an owner, but the database already says admin: the database rule must still stop the change.
      await addMember("sam", "admin");
      const stale: Member = { ...(await requireMember(deps, as("sam"))), role: "owner", permissions: new Set(["team:role", "team:disable"]) };
      const second = await db.sql`select id from team_members where email = 'second.owner@example.com'`;
      await db.sql`update team_members set status = 'disabled', disabled_at = now() where id = ${second[0].id}`;
      const [{ id: onlyOwner }] = await db.sql`select id from team_members where email = 'ana@example.com'`;
      expect(await status(changeRole(deps, stale, Number(onlyOwner), "admin"))).toBe("409:last_owner");
      expect(await status(disableMember(deps, stale, Number(onlyOwner)))).toBe("409:last_owner");
      expect((await db.sql`select status from team_members where id = ${onlyOwner}`)[0].status).toBe("active");
    });

    it("disables a member (database first), blocks them at the sign-in service, and re-enables them", async () => {
      const dora = await db.sql`select id, auth_user_id from team_members where email = 'dora@example.com'`;
      await db.sql`update team_members set status = 'active', disabled_at = null where id = ${dora[0].id}`;
      const r = await disableMember(deps, owner, Number(dora[0].id));
      expect(r.providerSynced).toBe(true);
      expect(provider.bans.at(-1)).toEqual([dora[0].auth_user_id, true]);
      expect(await status(requireMember(deps, as("dora")))).toBe("403:account_disabled");
      const back = await enableMember(deps, owner, Number(dora[0].id));
      expect(back.providerSynced).toBe(true);
      expect(await status(requireMember(deps, as("dora")))).toBe(0);
    });

    it("a member is still disabled when the sign-in service cannot be told, and the answer says so", async () => {
      const edie = await requireMember(deps, as("edie"));
      provider.failBan = true;
      const r = await disableMember(deps, owner, edie.id);
      provider.failBan = false;
      expect(r.providerSynced).toBe(false);
      expect(await status(requireMember(deps, as("edie")))).toBe("403:account_disabled");
    });

    it("nobody disables themselves", async () => {
      expect(await status(disableMember(deps, owner, owner.id))).toBe("403:cannot_disable_self");
    });

    it("enabling a member who is not disabled is refused", async () => {
      expect(await status(enableMember(deps, owner, owner.id))).toBe("409:not_disabled");
    });
  });

  describe("audit log", () => {
    it("redacts secrets before they reach the table", async () => {
      await writeAudit(db.sql, { actor: null, action: "test.redaction", after: { email: "a@b.co", password: "hunter2", nested: { token: "abc" } } });
      const [row] = await db.sql`select after from audit_logs where action = 'test.redaction'`;
      expect(JSON.stringify(row.after)).not.toMatch(/hunter2|abc/);
      expect(row.after.email).toBe("a@b.co");
    });

    it("cannot be changed afterwards, even by the account that wrote it", async () => {
      await expect(db.sql`update audit_logs set action = 'x.y' where action = 'test.redaction'`).rejects.toThrow(/append-only/);
      await expect(db.sql`delete from audit_logs`).rejects.toThrow(/append-only/);
    });

    it("rejects an action that is not a dotted verb", async () => {
      await expect(writeAudit(db.sql, { actor: null, action: "NotValid" })).rejects.toThrow();
    });
  });

  describe("rate limiting", () => {
    const opts = { salt: "a-long-enough-rate-salt" };
    const t0 = new Date("2026-11-03T12:00:10Z");

    it("allows the limit and refuses the next attempt, with a retry time", async () => {
      const results = [];
      for (let i = 0; i < 6; i++) results.push(await consume(db.sql, "victim@example.com", "login", LIMITS.login, { ...opts, at: t0 }));
      expect(results.map((r) => r.allowed)).toEqual([true, true, true, true, true, false]);
      expect(results[4].remaining).toBe(0);
      expect(results[5].retryAfterSeconds).toBeGreaterThan(0);
      expect(results[5].retryAfterSeconds).toBeLessThanOrEqual(900);
    });

    it("counts each key and each route separately, ignoring capitalisation", async () => {
      expect((await consume(db.sql, "other@example.com", "login", LIMITS.login, { ...opts, at: t0 })).allowed).toBe(true);
      expect((await consume(db.sql, "victim@example.com", "admin.mutation", LIMITS.adminMutation, { ...opts, at: t0 })).allowed).toBe(true);
      expect((await consume(db.sql, "VICTIM@Example.com", "login", LIMITS.login, { ...opts, at: t0 })).allowed).toBe(false);
    });

    it("starts again in the next window", async () => {
      const later = new Date(t0.getTime() + LIMITS.login.windowSeconds * 1000);
      expect((await consume(db.sql, "victim@example.com", "login", LIMITS.login, { ...opts, at: later })).allowed).toBe(true);
    });

    it("counts correctly under concurrent attempts", async () => {
      const rs = await Promise.all(Array.from({ length: 10 }, () => consume(db.sql, "burst@example.com", "login", { limit: 3, windowSeconds: 60 }, { ...opts, at: t0 })));
      expect(rs.filter((r) => r.allowed)).toHaveLength(3);
    });

    it("stores no e-mail address or IP in the table", async () => {
      const rows = await db.sql`select key_hash from rate_limit_hits`;
      for (const r of rows) expect(r.key_hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("prunes old counters", async () => {
      expect(await prune(db.sql, 3600)).toBeGreaterThan(0);
      expect((await db.sql`select count(*)::int n from rate_limit_hits`)[0].n).toBe(0);
    });
  });
});
