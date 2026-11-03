import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { createSql, sslFor } from "../src/server/db/client.ts";
import { checkConnection, checkMigrations, checkPublicRolesHaveNoAccess, checkRowLevelSecurity, cleanMessage, runHealth } from "../src/server/db/health.ts";
import { expectedTablesFromSql, readJournalWhen } from "../src/server/db/migrations.ts";
import { freshDatabase } from "./helpers/db.ts";

describe("health helpers that need no database", () => {
  it("removes connection strings and passwords from messages", () => {
    const m = cleanMessage(new Error("connect failed for postgres://app:hunter2@db.example.com:5432/postgres: password authentication failed for user app"));
    expect(m).not.toContain("hunter2");
    expect(m).not.toContain("postgres://");
    expect(m).toContain("[connection string removed]");
    expect(cleanMessage(new Error("connect ECONNREFUSED 10.1.2.3:6543"))).not.toMatch(/10\.1\.2\.3|6543/);
    expect(cleanMessage(new Error("getaddrinfo ENOTFOUND db.abcd.supabase.co"))).not.toContain("supabase");
  });

  it("decides TLS from the host: off for localhost, required for anything else, unless overridden", () => {
    expect(sslFor("postgres://u@localhost/db")).toBe(false);
    expect(sslFor("postgres://u@127.0.0.1/db")).toBe(false);
    expect(sslFor("postgres://u@db.abc.supabase.co/postgres")).toBe("require");
    expect(sslFor("postgres://u@db.abc.supabase.co/postgres", "disable")).toBe(false);
    expect(sslFor("postgres://u@localhost/db", "require")).toBe("require");
    expect(sslFor("not a url")).toBe("require");
  });

  it("reads the migration journal and finds every designed table in the SQL", () => {
    expect(readJournalWhen().length).toBeGreaterThanOrEqual(2);
    expect(expectedTablesFromSql()).toContain("tools");
    expect(expectedTablesFromSql()).toContain("audit_logs");
  });
});

const info = inject("pg");
const d = describe.skipIf(!info.available);

d("health checks against the test database", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  beforeAll(async () => {
    db = await freshDatabase();
  });
  afterAll(async () => {
    await db?.drop();
  });

  const options = () => ({ expectedMigrations: readJournalWhen(), expectedTables: expectedTablesFromSql() });

  it("reports ok on a fully migrated database", async () => {
    const r = await runHealth(db.sql, options());
    expect(r.checks.map((c) => `${c.name}:${c.ok}`)).toEqual(["connection:true", "migrations:true", "tables:true", "row_level_security:true", "public_roles_locked:true"]);
    expect(r.status).toBe("ok");
    expect(JSON.stringify(r)).not.toMatch(/postgres:\/\//);
    expect(r.checks[1].detail).toMatch(/^\d+ of \d+ applied$/);
  });

  it("reports degraded when a table has Row Level Security off", async () => {
    await db.sql`alter table redirects disable row level security`;
    const c = await checkRowLevelSecurity(db.sql);
    expect(c.ok).toBe(false);
    expect(c.detail).toContain("redirects");
    expect((await runHealth(db.sql, options())).status).toBe("degraded");
    await db.sql`alter table redirects enable row level security`;
    expect((await checkRowLevelSecurity(db.sql)).ok).toBe(true);
  });

  it("reports degraded when a public role is granted access", async () => {
    await db.sql`grant select on tools to anon`;
    const c = await checkPublicRolesHaveNoAccess(db.sql);
    expect(c.ok).toBe(false);
    expect(c.detail).toMatch(/anon can reach tools/);
    await db.sql`revoke select on tools from anon`;
    expect((await checkPublicRolesHaveNoAccess(db.sql)).ok).toBe(true);
  });

  it("reports pending migrations, and migrations from a newer version of the code", async () => {
    const real = readJournalWhen();
    const pending = await checkMigrations(db.sql, [...real, real.at(-1)! + 1000]);
    expect(pending.ok).toBe(false);
    expect(pending.detail).toMatch(/1 pending of 3/);
    const newer = await checkMigrations(db.sql, real.slice(0, 1));
    expect(newer.ok).toBe(false);
    expect(newer.detail).toMatch(/not in this repository/);
  });

  it("reports a missing table", async () => {
    const r = await runHealth(db.sql, { ...options(), expectedTables: [...expectedTablesFromSql(), "invented_table"] });
    expect(r.status).toBe("degraded");
    expect(r.checks.find((c) => c.name === "tables")!.detail).toContain("invented_table");
  });

  it("says there is no migration table on an empty database", async () => {
    const info2 = inject("pg");
    if (!info2.available) return;
    const admin = createSql(info2.adminUrl, { ssl: "disable" });
    await admin.unsafe("create database t_empty_health");
    await admin.end({ timeout: 5 });
    const sql = createSql(info2.adminUrl.replace(/\/postgres$/, "/t_empty_health"), { ssl: "disable" });
    try {
      const c = await checkMigrations(sql, readJournalWhen());
      expect(c.ok).toBe(false);
      expect(c.detail).toMatch(/no migration table yet/);
    } finally {
      await sql.end({ timeout: 5 });
      const a = createSql(info2.adminUrl, { ssl: "disable" });
      await a.unsafe("drop database t_empty_health with (force)");
      await a.end({ timeout: 5 });
    }
  });

  it("reports down, without leaking the address, when the database cannot be reached", async () => {
    const dead = createSql("postgres://app:topsecretpw@127.0.0.1:1/nothing", { ssl: "disable" });
    try {
      const r = await runHealth(dead, options());
      expect(r.status).toBe("down");
      expect(r.checks).toHaveLength(1);
      expect(JSON.stringify(r)).not.toContain("topsecretpw");
      expect(JSON.stringify(r)).not.toContain("127.0.0.1:1");
    } finally {
      await dead.end({ timeout: 2 });
    }
  });

  it("measures a connection check in milliseconds", async () => {
    const c = await checkConnection(db.sql);
    expect(c.ok).toBe(true);
    expect(c.ms).toBeGreaterThanOrEqual(0);
    expect(c.detail).toMatch(/^PostgreSQL \d+/);
  });
});
