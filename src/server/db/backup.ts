// Backups and restore checks (docs/platform/04-migration-and-hosting.md section 6). A backup is a PostgreSQL custom-format dump plus a manifest with
// the row count of every table and a checksum; it can be encrypted with a passphrase. A restore check loads a dump into a scratch database, compares
// every table with the manifest and runs the health checks, then drops the scratch database. A backup you have not restored is not a backup.
//
// Passwords never go on a command line (they would show in the process list): the connection is passed to pg_dump and pg_restore in PG* variables.
import { spawnSync } from "node:child_process";
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createSql, type Sql } from "./client.ts";
import { runHealth } from "./health.ts";
import { expectedTablesFromSql, readJournalWhen } from "./migrations.ts";

const exe = process.platform === "win32" ? ".exe" : "";

/** Find pg_dump / pg_restore: PG_BIN_DIR, then PATH, then the usual install folders. */
export function findPgTool(name: "pg_dump" | "pg_restore"): string | null {
  const dirs: string[] = [];
  if (process.env.PG_BIN_DIR) dirs.push(process.env.PG_BIN_DIR);
  for (const p of (process.env.PATH ?? "").split(path.delimiter)) dirs.push(p);
  for (const r of process.platform === "win32" ? ["C:/Program Files/PostgreSQL"] : ["/usr/lib/postgresql", "/opt/homebrew/opt", "/usr/local/opt"]) {
    try {
      for (const v of fs.readdirSync(r).sort().reverse()) dirs.push(path.join(r, v, "bin"), path.join(r, v));
    } catch {
      /* folder missing */
    }
  }
  for (const d of dirs) if (d && fs.existsSync(path.join(d, `${name}${exe}`))) return path.join(d, `${name}${exe}`);
  return null;
}

/** The PG* variables for a connection string. The password is not in any argument. */
export function pgEnv(url: string, databaseOverride?: string): NodeJS.ProcessEnv {
  const u = new URL(url);
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(u.hostname);
  return {
    ...process.env,
    PGHOST: u.hostname.replace(/^\[|\]$/g, ""),
    PGPORT: u.port || "5432",
    PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password),
    PGDATABASE: databaseOverride ?? (u.pathname.replace(/^\//, "") || "postgres"),
    PGSSLMODE: local ? "disable" : "require",
    PGCONNECT_TIMEOUT: "15",
  };
}

export const sha256File = (file: string) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");

export async function tableCounts(sql: Sql): Promise<Record<string, number>> {
  const tables = await sql<{ tablename: string }[]>`select tablename from pg_tables where schemaname = 'public' order by tablename`;
  const out: Record<string, number> = {};
  for (const t of tables) out[t.tablename] = Number((await sql.unsafe<{ n: string }[]>(`select count(*) as n from public."${t.tablename.replace(/"/g, "")}"`))[0].n);
  return out;
}

export type Manifest = { createdAt: string; host: string; database: string; migrations: number; tables: Record<string, number>; sha256: string; bytes: number; encrypted: boolean; pgDump: string };

/** Dump the database to `outFile` (custom format, no owners) and write `<outFile>.manifest.json` next to it. */
export async function backupDatabase(url: string, outFile: string, options: { passphrase?: string } = {}): Promise<Manifest> {
  const pgDump = findPgTool("pg_dump");
  if (!pgDump) throw new Error("pg_dump was not found. Install the PostgreSQL client tools or set PG_BIN_DIR.");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const raw = options.passphrase ? `${outFile}.plain.tmp` : outFile;
  const r = spawnSync(pgDump, ["--format=custom", "--no-owner", "--compress=6", `--file=${raw}`], { env: pgEnv(url), encoding: "utf8", windowsHide: true });
  if (r.status !== 0) {
    fs.rmSync(raw, { force: true });
    throw new Error(`pg_dump failed: ${(r.stderr || "").replace(/postgres(ql)?:\/\/\S+/g, "[connection string removed]").slice(0, 400)}`);
  }
  const sql = createSql(url, { max: 1, applicationName: "aitoolpicks-backup" });
  let tables: Record<string, number>;
  let migrations = 0;
  try {
    tables = await tableCounts(sql);
    migrations = Number((await sql`select count(*)::int n from drizzle.__drizzle_migrations`.catch(() => [{ n: 0 }]))[0].n);
  } finally {
    await sql.end({ timeout: 5 });
  }
  if (options.passphrase) {
    encryptFile(raw, outFile, options.passphrase);
    fs.rmSync(raw, { force: true });
  }
  const u = new URL(url);
  const manifest: Manifest = {
    createdAt: new Date().toISOString(),
    host: u.hostname,
    database: u.pathname.replace(/^\//, ""),
    migrations,
    tables,
    sha256: sha256File(outFile),
    bytes: fs.statSync(outFile).size,
    encrypted: !!options.passphrase,
    pgDump: (spawnSync(pgDump, ["--version"], { encoding: "utf8" }).stdout || "").trim(),
  };
  fs.writeFileSync(`${outFile}.manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

// ---- encryption: scrypt-derived key, AES-256-GCM. File layout: "ATPB1" | salt(16) | iv(12) | tag(16) | ciphertext ----
const MAGIC = Buffer.from("ATPB1");
export function encryptFile(inFile: string, outFile: string, passphrase: string): void {
  if (passphrase.length < 12) throw new Error("The backup passphrase must be at least 12 characters.");
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", scryptSync(passphrase, salt, 32), iv);
  const body = Buffer.concat([cipher.update(fs.readFileSync(inFile)), cipher.final()]);
  fs.writeFileSync(outFile, Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), body]));
}
export function decryptFile(inFile: string, outFile: string, passphrase: string): void {
  const buf = fs.readFileSync(inFile);
  if (!buf.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error("This file is not an encrypted backup made by this tool.");
  const salt = buf.subarray(5, 21), iv = buf.subarray(21, 33), tag = buf.subarray(33, 49);
  const decipher = createDecipheriv("aes-256-gcm", scryptSync(passphrase, salt, 32), iv);
  decipher.setAuthTag(tag);
  try {
    fs.writeFileSync(outFile, Buffer.concat([decipher.update(buf.subarray(49)), decipher.final()]));
  } catch {
    throw new Error("The passphrase is wrong or the backup file is damaged.");
  }
}

export type RestoreCheck = { ok: boolean; problems: string[]; database: string; tables: number; rows: number; health: string };

/**
 * Load a backup into a NEW scratch database on the server `adminUrl` points at, compare every table with the manifest, run the health checks, and drop
 * the scratch database (unless `keep`). Needs permission to create databases, so it runs against a local PostgreSQL, never against production.
 */
export async function restoreCheck(adminUrl: string, dumpFile: string, options: { passphrase?: string; keep?: boolean } = {}): Promise<RestoreCheck> {
  const pgRestore = findPgTool("pg_restore");
  if (!pgRestore) throw new Error("pg_restore was not found. Install the PostgreSQL client tools or set PG_BIN_DIR.");
  const manifestFile = `${dumpFile}.manifest.json`;
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8")) as Manifest;
  const problems: string[] = [];
  if (sha256File(dumpFile) !== manifest.sha256) problems.push("The backup file does not match its recorded checksum (changed or damaged).");

  let plain = dumpFile;
  if (manifest.encrypted) {
    if (!options.passphrase) throw new Error("This backup is encrypted; a passphrase is required.");
    plain = `${dumpFile}.restore.tmp`;
    decryptFile(dumpFile, plain, options.passphrase);
  }
  const name = `restore_check_${Date.now()}`;
  const admin = createSql(adminUrl, { max: 1, applicationName: "aitoolpicks-restore-check" });
  try {
    await admin.unsafe(`create database ${name}`);
    // The dump refers to roles that exist at server level; make sure they do (a hosted Supabase project already has them).
    await admin.unsafe(`do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'app') then create role app nologin; end if; end $$`);
    const r = spawnSync(pgRestore, ["--no-owner", "--exit-on-error", `--dbname=${name}`, plain], { env: pgEnv(adminUrl, name), encoding: "utf8", windowsHide: true });
    if (r.status !== 0) problems.push(`pg_restore failed: ${(r.stderr || "").replace(/postgres(ql)?:\/\/\S+/g, "[removed]").slice(0, 300)}`);
    const target = new URL(adminUrl);
    target.pathname = `/${name}`;
    const sql = createSql(target.toString(), { max: 1, applicationName: "aitoolpicks-restore-check" });
    let rows = 0;
    let health = "not run";
    try {
      const got = await tableCounts(sql);
      for (const [t, n] of Object.entries(manifest.tables)) {
        if (!(t in got)) problems.push(`Table ${t} is missing after the restore.`);
        else if (got[t] !== n) problems.push(`Table ${t}: backup had ${n} rows, the restore has ${got[t]}.`);
      }
      for (const t of Object.keys(got)) if (!(t in manifest.tables)) problems.push(`Table ${t} was not in the backup's manifest.`);
      rows = Object.values(got).reduce((a, b) => a + b, 0);
      const h = await runHealth(sql, { expectedMigrations: readJournalWhen(), expectedTables: expectedTablesFromSql() });
      health = h.status;
      if (h.status !== "ok") problems.push(`Health checks after restore: ${h.status} (${h.checks.filter((c) => !c.ok).map((c) => `${c.name}: ${c.detail}`).join("; ")})`);
    } finally {
      await sql.end({ timeout: 5 });
    }
    return { ok: problems.length === 0, problems, database: name, tables: Object.keys(manifest.tables).length, rows, health };
  } finally {
    if (plain !== dumpFile) fs.rmSync(plain, { force: true });
    if (!options.keep) await admin.unsafe(`drop database if exists ${name} with (force)`).catch(() => undefined);
    await admin.end({ timeout: 5 });
  }
}
