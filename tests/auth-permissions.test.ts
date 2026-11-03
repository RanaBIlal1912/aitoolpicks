// The permission matrix, the audit redaction and the sign-in provider, none of which need a database.
import { describe, expect, it } from "vitest";
import { hashIp, redact } from "../src/server/auth/audit.ts";
import { canActOnRow, canChangeFields, type Member } from "../src/server/auth/authorize.ts";
import { canAssignRole, grantsFor, isSensitiveField, PERMISSIONS, ROLES, scopeOf, type RoleKey } from "../src/server/auth/permissions.ts";
import { AuthUnavailableError, createSupabaseProvider } from "../src/server/auth/provider.ts";

const keysOf = (role: RoleKey) => grantsFor(role).map((g) => g.key);
const member = (role: RoleKey, id = 7): Member => ({ id, authUserId: "u", email: "m@example.com", displayName: "", role, permissions: new Set(keysOf(role)), aal: "aal1" });

describe("the permission matrix (design document section 3)", () => {
  it("has six system roles and permission keys of the form resource:action", () => {
    expect(ROLES.map((r) => r.key)).toEqual(["owner", "admin", "editor", "reviewer", "analyst", "contributor"]);
    for (const key of Object.keys(PERMISSIONS)) expect(key).toMatch(/^[a-z_]+:[a-z_*]+$/);
  });

  it("gives the owner every permission", () => {
    expect(keysOf("owner").sort()).toEqual(Object.keys(PERMISSIONS).sort());
  });

  it("only the owner can manage the team, change settings, read the audit log or delete a tool", () => {
    for (const key of ["team:invite", "team:role", "team:disable", "settings:write", "audit:read", "tools:delete"]) {
      expect(Object.keys(PERMISSIONS[key].grants), key).toEqual(["owner"]);
    }
  });

  it("an analyst can read analytics and nothing else", () => {
    expect(keysOf("analyst")).toEqual(["analytics:read"]);
  });

  it("a contributor can never publish, archive, delete, decide, or touch affiliate, settings, team or analytics", () => {
    const forbidden = Object.keys(PERMISSIONS).filter((k) => /:(publish|archive|delete|decide|write|invite|role|disable)$/.test(k) || /^(affiliate|settings|team|analytics|audit|submissions|system)/.test(k));
    for (const k of forbidden) expect(keysOf("contributor"), k).not.toContain(k);
    expect(scopeOf("contributor", "tools:update")).toBe("own_drafts");
  });

  it("only admins and owners can touch affiliate links; editors can see them", () => {
    expect(Object.keys(PERMISSIONS["affiliate:write"].grants).sort()).toEqual(["admin", "owner"]);
    expect(keysOf("editor")).toContain("affiliate:read");
    expect(keysOf("editor")).not.toContain("affiliate:write");
  });

  it("reviewers write reviews and verification records but cannot edit tools, blog or news", () => {
    for (const k of ["reviews:create", "reviews:update", "reviews:publish", "verification:write"]) expect(keysOf("reviewer")).toContain(k);
    for (const k of ["tools:update", "tools:publish", "blog:create", "news:create"]) expect(keysOf("reviewer")).not.toContain(k);
  });

  it("editors cannot publish reviews or record verification", () => {
    expect(keysOf("editor")).not.toContain("reviews:publish");
    expect(keysOf("editor")).not.toContain("verification:write");
  });

  it("only an owner may grant the owner role, and nobody else may manage roles at all", () => {
    expect(canAssignRole("owner", "owner")).toBe(true);
    expect(canAssignRole("owner", "editor")).toBe(true);
    for (const r of ["admin", "editor", "reviewer", "analyst", "contributor"] as RoleKey[]) {
      expect(canAssignRole(r, "owner")).toBe(false);
      expect(canAssignRole(r, "editor")).toBe(false);
    }
  });
});

describe("row and field scopes", () => {
  it("a contributor may change only their own drafts", () => {
    const c = member("contributor", 7);
    expect(canActOnRow(c, "tools:update", { createdBy: 7, status: "draft" })).toBe(true);
    expect(canActOnRow(c, "tools:update", { createdBy: 7, status: "in_review" })).toBe(true);
    expect(canActOnRow(c, "tools:update", { createdBy: 7, status: "published" })).toBe(false);
    expect(canActOnRow(c, "tools:update", { createdBy: 8, status: "draft" })).toBe(false);
    expect(canActOnRow(c, "tools:update", { createdBy: null, status: "draft" })).toBe(false);
    expect(canActOnRow(c, "tools:publish", { createdBy: 7, status: "draft" })).toBe(false);
  });

  it("an editor may change any row but not the sensitive fields when publishing a tool", () => {
    const e = member("editor");
    expect(canActOnRow(e, "tools:update", { createdBy: 99, status: "published" })).toBe(true);
    expect(canChangeFields(e, "tools:publish", ["tagline", "description", "status"])).toBe(true);
    for (const f of ["pricing_status", "pricing_model", "verification_status", "verified_at", "catalog_verified_on", "method", "affiliate_status"]) {
      expect(isSensitiveField(f), f).toBe(true);
      expect(canChangeFields(e, "tools:publish", ["tagline", f]), f).toBe(false);
    }
    expect(canChangeFields(member("admin"), "tools:publish", ["pricing_status"])).toBe(true);
  });

  it("without the permission nothing is allowed, whatever the scope", () => {
    expect(canActOnRow(member("analyst"), "tools:update", { createdBy: 7, status: "draft" })).toBe(false);
    expect(canChangeFields(member("analyst"), "tools:publish", ["tagline"])).toBe(false);
  });
});

describe("audit helpers", () => {
  it("redacts secrets at any depth and leaves ordinary data alone", () => {
    const out = redact({ email: "a@b.co", password: "pw1", nested: { apiKey: "k1", api_key: "k2", token: "t1", Authorization: "Bearer z9", list: [{ secret: "s1", name: "n" }] }, service_role_key: "q1" }) as Record<string, unknown>;
    expect(JSON.stringify(out)).not.toMatch(/pw1|k1|k2|t1|Bearer z9|s1|q1/);
    expect(out.email).toBe("a@b.co");
    expect((out.nested as { list: { name: string }[] }).list[0].name).toBe("n");
  });

  it("survives cycles", () => {
    const a: Record<string, unknown> = { name: "a" };
    a.self = a;
    expect(() => redact(a)).not.toThrow();
  });

  it("hashes an IP with the salt, and stores nothing without one", () => {
    expect(hashIp("203.0.113.9", "a-long-enough-salt")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIp("203.0.113.9", "a-long-enough-salt")).not.toBe(hashIp("203.0.113.9", "another-long-salt!!"));
    expect(hashIp("203.0.113.9", undefined)).toBeNull();
    expect(hashIp(undefined, "a-long-enough-salt")).toBeNull();
  });
});

describe("the Supabase provider (against a fake server)", () => {
  const jwt = (payload: object) => `aaa.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.ccc`;
  const calls: { url: string; init: RequestInit }[] = [];
  const provider = (handler: (url: string, init: RequestInit) => Response | Promise<Response>) =>
    createSupabaseProvider({
      url: "https://proj.example.co/",
      anonKey: "anon-key-0123456789",
      serviceRoleKey: "service-key-0123456789",
      fetch: (async (u: string, i: RequestInit) => {
        calls.push({ url: u, init: i });
        return handler(u, i);
      }) as unknown as typeof fetch,
    });
  const id = "123e4567-e89b-42d3-a456-426614174000";

  it("accepts a token the server accepts, with the assurance level", async () => {
    const p = provider(() => Response.json({ id, email: "Ana@Example.com", email_confirmed_at: "2026-11-01T00:00:00Z" }));
    expect(await p.verifyAccessToken(jwt({ aal: "aal2" }))).toEqual({ authUserId: id, email: "ana@example.com", emailConfirmed: true, aal: "aal2" });
    const last = calls.at(-1)!;
    expect(last.url).toBe("https://proj.example.co/auth/v1/user");
    expect((last.init.headers as Record<string, string>).apikey).toBe("anon-key-0123456789");
  });

  it("reports an unconfirmed address as unconfirmed", async () => {
    const p = provider(() => Response.json({ id, email: "a@b.co", email_confirmed_at: null }));
    expect((await p.verifyAccessToken(jwt({})))?.emailConfirmed).toBe(false);
  });

  it("returns null for a rejected token, and does not call the server for something that is not a token", async () => {
    const before = calls.length;
    const p = provider(() => new Response("{}", { status: 401 }));
    expect(await p.verifyAccessToken(jwt({}))).toBeNull();
    expect(calls.length).toBe(before + 1);
    expect(await p.verifyAccessToken("not a token")).toBeNull();
    expect(await p.verifyAccessToken("a.b.c".padEnd(5000, "c"))).toBeNull();
    expect(calls.length).toBe(before + 1);
  });

  it("treats an outage, a server error or nonsense as unavailable, never as a valid user", async () => {
    await expect(provider(() => { throw new Error("ECONNREFUSED"); }).verifyAccessToken(jwt({}))).rejects.toBeInstanceOf(AuthUnavailableError);
    await expect(provider(() => new Response("oops", { status: 500 })).verifyAccessToken(jwt({}))).rejects.toBeInstanceOf(AuthUnavailableError);
    await expect(provider(() => Response.json({ hello: "world" })).verifyAccessToken(jwt({}))).rejects.toBeInstanceOf(AuthUnavailableError);
  });

  it("invites with the service-role key and never echoes the address in an error", async () => {
    const ok = provider(() => Response.json({ id }));
    expect(await ok.inviteUser("new@example.com")).toEqual({ authUserId: id });
    const sent = calls.at(-1)!;
    expect(sent.url).toContain("/auth/v1/invite");
    expect((sent.init.headers as Record<string, string>).Authorization).toBe("Bearer service-key-0123456789");
    const bad = provider(() => new Response(JSON.stringify({ msg: "new@example.com is rate limited" }), { status: 429 }));
    await expect(bad.inviteUser("new@example.com")).rejects.toThrow(/429/);
    await bad.inviteUser("new@example.com").catch((e: Error) => expect(e.message).not.toContain("new@example.com"));
  });

  it("blocks and unblocks through the admin endpoint", async () => {
    const p = provider(() => Response.json({}));
    await p.setBanned(id, true);
    expect(JSON.parse(String(calls.at(-1)!.init.body))).toEqual({ ban_duration: "876000h" });
    await p.setBanned(id, false);
    expect(JSON.parse(String(calls.at(-1)!.init.body))).toEqual({ ban_duration: "none" });
    await expect(provider(() => new Response("", { status: 500 })).setBanned(id, true)).rejects.toThrow(/500/);
  });
});
