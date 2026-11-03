// Database health checks. Used by the command line (npm run db:health) now and by the /api/health/db route and the admin dashboard later.
// A report never contains a connection string, a password or a raw driver error: messages are cleaned before they are returned.
import type { Sql } from "./client.ts";

export type CheckResult = { name: string; ok: boolean; detail: string; ms: number };
export type HealthReport = { status: "ok" | "degraded" | "down"; checkedAt: string; checks: CheckResult[] };

/** Remove anything that looks like a connection string, a password or a server address from an error message. */
export function cleanMessage(input: unknown): string {
  const raw = input instanceof Error ? input.message : String(input);
  return raw
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, "[connection string removed]")
    .replace(/password[^\s,;]*/gi, "[removed]")
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}(?::\d{1,5})?\b/g, "[address removed]")
    .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)+(?::\d{1,5})?\b/gi, "[host removed]")
    .slice(0, 240);
}

async function timed(name: string, fn: () => Promise<{ ok: boolean; detail: string }>): Promise<CheckResult> {
  const t0 = performance.now();
  try {
    const r = await fn();
    return { name, ok: r.ok, detail: r.detail, ms: Math.round(performance.now() - t0) };
  } catch (e) {
    const code = typeof e === "object" && e && "code" in e ? ` (${String((e as { code: unknown }).code)})` : "";
    return { name, ok: false, detail: `${cleanMessage(e)}${code}`, ms: Math.round(performance.now() - t0) };
  }
}

export const checkConnection = (sql: Sql) =>
  timed("connection", async () => {
    const [row] = await sql<{ v: string }[]>`select current_setting('server_version') as v`;
    return { ok: true, detail: `PostgreSQL ${row.v}` };
  });

/**
 * Compares the migrations recorded in the database with the migrations in the repository.
 * `expected` holds the "when" value of every journal entry (see readJournalWhen).
 */
export const checkMigrations = (sql: Sql, expected: readonly number[]) =>
  timed("migrations", async () => {
    const hasTable = await sql<{ ok: boolean }[]>`select to_regclass('drizzle.__drizzle_migrations') is not null as ok`;
    if (!hasTable[0].ok) return { ok: false, detail: `no migration table yet; ${expected.length} pending` };
    const rows = await sql<{ created_at: string }[]>`select created_at from drizzle.__drizzle_migrations`;
    const applied = new Set(rows.map((r) => Number(r.created_at)));
    const pending = expected.filter((w) => !applied.has(w));
    const unknown = [...applied].filter((w) => !expected.includes(w));
    if (pending.length) return { ok: false, detail: `${pending.length} pending of ${expected.length}` };
    if (unknown.length) return { ok: false, detail: `${unknown.length} applied migration(s) are not in this repository (a newer version has run)` };
    return { ok: true, detail: `${applied.size} of ${expected.length} applied` };
  });

/** Every table in the public schema must have Row Level Security enabled (docs/platform/03-security-and-access.md). */
export const checkRowLevelSecurity = (sql: Sql) =>
  timed("row_level_security", async () => {
    const rows = await sql<{ relname: string }[]>`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity order by c.relname`;
    if (rows.length) return { ok: false, detail: `RLS is OFF for: ${rows.map((r) => r.relname).join(", ")}` };
    const [n] = await sql<{ n: number }[]>`select count(*)::int as n from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relkind in ('r', 'p')`;
    return { ok: true, detail: `enabled on all ${n.n} tables` };
  });

/** The browser-facing Supabase roles must hold no privilege on any application table. */
export const checkPublicRolesHaveNoAccess = (sql: Sql) =>
  timed("public_roles_locked", async () => {
    const roles = await sql<{ rolname: string }[]>`select rolname from pg_roles where rolname in ('anon', 'authenticated')`;
    if (!roles.length) return { ok: true, detail: "anon and authenticated roles do not exist here" };
    const rows = await sql<{ grantee: string; table_name: string }[]>`
      select distinct grantee, table_name from information_schema.role_table_grants
      where table_schema = 'public' and grantee in ('anon', 'authenticated') limit 5`;
    if (rows.length) return { ok: false, detail: `${rows[0].grantee} can reach ${rows[0].table_name}${rows.length > 1 ? " and more" : ""}` };
    return { ok: true, detail: "anon and authenticated hold no table privileges" };
  });

export const checkExpectedTables = (sql: Sql, expected: readonly string[]) =>
  timed("tables", async () => {
    const rows = await sql<{ tablename: string }[]>`select tablename from pg_tables where schemaname = 'public'`;
    const have = new Set(rows.map((r) => r.tablename));
    const missing = expected.filter((t) => !have.has(t));
    return missing.length ? { ok: false, detail: `missing: ${missing.join(", ")}` } : { ok: true, detail: `${expected.length} expected tables present` };
  });

/** Run every check. "down" means the database cannot be reached; "degraded" means it answers but something is wrong. */
export async function runHealth(sql: Sql, options: { expectedMigrations: readonly number[]; expectedTables: readonly string[] }): Promise<HealthReport> {
  const connection = await checkConnection(sql);
  const checkedAt = new Date().toISOString();
  if (!connection.ok) return { status: "down", checkedAt, checks: [connection] };
  const checks = [connection, await checkMigrations(sql, options.expectedMigrations), await checkExpectedTables(sql, options.expectedTables), await checkRowLevelSecurity(sql), await checkPublicRolesHaveNoAccess(sql)];
  return { status: checks.every((c) => c.ok) ? "ok" : "degraded", checkedAt, checks };
}
