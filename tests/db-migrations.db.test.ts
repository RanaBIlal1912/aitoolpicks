// Needs the disposable test database (tests/global-setup.ts). Skipped, with the reason printed, when none could be started.
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { runMigrations } from "../src/server/db/migrations.ts";
import { asRole, failure, freshDatabase, pg } from "./helpers/db.ts";

const info = inject("pg");
if (!info.available) console.warn(`[db tests skipped] ${info.reason}`);
const d = describe.skipIf(!info.available);

d("migrations on a real PostgreSQL", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  beforeAll(async () => {
    db = await freshDatabase();
  });
  afterAll(async () => {
    await db?.drop();
  });

  it("created every table, and running the migrations again changes nothing", async () => {
    const before = await db.sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
    await runMigrations(db.sql);
    const after = await db.sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
    expect(after[0].n).toBe(before[0].n);
    const [t] = await db.sql`select count(*)::int as n from pg_tables where schemaname = 'public'`;
    expect(t.n).toBe(39);
  });

  it("enabled Row Level Security on every public table", async () => {
    const off = await db.sql`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`;
    expect(off.map((r) => r.relname)).toEqual([]);
  });

  it("gives every table a policy for the app role, and the audit log only read and append", async () => {
    const rows = await db.sql`select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by tablename, policyname`;
    const tables = await db.sql`select tablename from pg_tables where schemaname = 'public'`;
    const covered = new Set(rows.map((r) => r.tablename));
    for (const t of tables) expect(covered.has(t.tablename), `${t.tablename} has no policy for the app role`).toBe(true);
    const audit = rows.filter((r) => r.tablename === "audit_logs").map((r) => `${r.policyname}:${r.cmd}`).sort();
    expect(audit).toEqual(["app_append:INSERT", "app_read:SELECT"]);
  });

  it("every table is granted to the app role and to nobody else", async () => {
    const grants = await db.sql`select table_name, grantee from information_schema.role_table_grants where table_schema = 'public' and grantee not in ('postgres') group by table_name, grantee`;
    const stray = grants.filter((g) => g.grantee !== "app");
    expect(stray).toEqual([]);
    const tables = await db.sql`select tablename from pg_tables where schemaname = 'public'`;
    const granted = new Set(grants.map((g) => g.table_name));
    for (const t of tables) expect(granted.has(t.tablename), `${t.tablename} not granted to app`).toBe(true);
  });

  it("locks the browser-facing roles out completely", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      const e = await failure(() => asRole(db.sql, role, (s) => s`select * from tools limit 1`));
      expect(e?.code, role).toBe("42501");
      const w = await failure(() => asRole(db.sql, role, (s) => s`insert into site_settings (key, value) values ('x', '1')`));
      expect(w?.code, role).toBe("42501");
      const fn = await failure(() => asRole(db.sql, role, (s) => s`select public.prune_rate_limit_hits()`));
      expect(fn?.code, `${role} may not call functions`).toBe("42501");
    }
  });

  it("lets the app role read and write content", async () => {
    await asRole(db.sql, "app", async (s) => {
      await s`insert into site_settings (key, value) values ('test.key', '{"a":1}'::jsonb)`;
      const r = await s`select value from site_settings where key = 'test.key'`;
      expect(r[0].value).toEqual({ a: 1 });
      await s`delete from site_settings where key = 'test.key'`;
    });
  });

  it("keeps the app role unable to change the schema", async () => {
    const e = await failure(() => asRole(db.sql, "app", (s) => s`create table public.sneaky (id int)`));
    expect(e?.code).toBe("42501");
    const t = await failure(() => asRole(db.sql, "app", (s) => s`truncate table tools cascade`));
    expect(t?.code).toBe("42501");
  });
});

d("the template database used by the other test files", () => {
  it("is available and migrated", () => {
    expect(pg().available).toBe(true);
  });
});
