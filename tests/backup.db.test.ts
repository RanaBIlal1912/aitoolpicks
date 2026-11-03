// Backups: encryption on its own, then a real pg_dump / pg_restore round trip against disposable databases holding the real imported content.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { backupDatabase, decryptFile, encryptFile, findPgTool, pgEnv, restoreCheck, sha256File } from "../src/server/db/backup.ts";
import { importAll } from "../src/server/import/content.ts";
import { loadContent } from "../src/server/import/content-source.ts";
import { loadSource } from "../src/server/import/source.ts";
import { freshDatabase, pg } from "./helpers/db.ts";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aitp-backup-"));
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
const PASS = "a-long-enough-backup-passphrase";

describe("encryption", () => {
  const plain = path.join(tmp, "plain.bin");
  beforeAll(() => fs.writeFileSync(plain, Buffer.from(Array.from({ length: 5000 }, (_, i) => i % 251))));

  it("round-trips and does not leave the content readable", () => {
    const enc = path.join(tmp, "a.enc");
    const dec = path.join(tmp, "a.dec");
    encryptFile(plain, enc, PASS);
    expect(fs.readFileSync(enc).includes(fs.readFileSync(plain).subarray(100, 200))).toBe(false);
    decryptFile(enc, dec, PASS);
    expect(fs.readFileSync(dec).equals(fs.readFileSync(plain))).toBe(true);
  });

  it("two encryptions of the same file differ (fresh salt and nonce)", () => {
    encryptFile(plain, path.join(tmp, "b1.enc"), PASS);
    encryptFile(plain, path.join(tmp, "b2.enc"), PASS);
    expect(sha256File(path.join(tmp, "b1.enc"))).not.toBe(sha256File(path.join(tmp, "b2.enc")));
  });

  it("refuses a wrong passphrase, a damaged file, a file that is not a backup, and a weak passphrase", () => {
    const enc = path.join(tmp, "c.enc");
    encryptFile(plain, enc, PASS);
    expect(() => decryptFile(enc, path.join(tmp, "x"), "another-long-enough-passphrase")).toThrow(/wrong or the backup file is damaged/);
    const damaged = Buffer.from(fs.readFileSync(enc));
    damaged[damaged.length - 10] ^= 0xff;
    fs.writeFileSync(path.join(tmp, "d.enc"), damaged);
    expect(() => decryptFile(path.join(tmp, "d.enc"), path.join(tmp, "x"), PASS)).toThrow(/damaged/);
    expect(() => decryptFile(plain, path.join(tmp, "x"), PASS)).toThrow(/not an encrypted backup/);
    expect(() => encryptFile(plain, path.join(tmp, "e.enc"), "short")).toThrow(/at least 12/);
  });
});

describe("connection settings", () => {
  it("passes the password in the environment, never in an argument, and chooses TLS by host", () => {
    const e = pgEnv("postgres://app:p%40ss@db.example.com:6543/postgres");
    expect(e).toMatchObject({ PGHOST: "db.example.com", PGPORT: "6543", PGUSER: "app", PGPASSWORD: "p@ss", PGDATABASE: "postgres", PGSSLMODE: "require" });
    expect(pgEnv("postgres://u@127.0.0.1:5432/x").PGSSLMODE).toBe("disable");
    expect(pgEnv("postgres://u@127.0.0.1:5432/x", "other").PGDATABASE).toBe("other");
  });
});

const tools = findPgTool("pg_dump") && findPgTool("pg_restore");
describe.skipIf(!pg().available || !tools)("backup and restore against real databases", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  let plain: string;
  let encrypted: string;
  let manifest: Awaited<ReturnType<typeof backupDatabase>>;
  const adminUrl = () => pg().available ? (pg() as { adminUrl: string }).adminUrl : "";

  beforeAll(async () => {
    db = await freshDatabase();
    const cat = loadSource(process.cwd());
    await importAll(db.sql, cat, loadContent(process.cwd(), cat));
    plain = path.join(tmp, "plain.dump");
    encrypted = path.join(tmp, "secret.dump");
    manifest = await backupDatabase(db.url, plain);
    await backupDatabase(db.url, encrypted, { passphrase: PASS });
  }, 120_000);
  afterAll(async () => db?.drop());

  it("writes a manifest with every table's row count, the migrations and a checksum", () => {
    expect(Object.keys(manifest.tables)).toHaveLength(39);
    expect(manifest.tables.tools).toBe(69);
    expect(manifest.tables.pricing_plans).toBe(288);
    expect(manifest.migrations).toBe(5);
    expect(manifest.sha256).toBe(sha256File(plain));
    expect(manifest.encrypted).toBe(false);
    expect(JSON.parse(fs.readFileSync(`${plain}.manifest.json`, "utf8")).sha256).toBe(manifest.sha256);
  });

  it("an encrypted backup is marked, unreadable as a dump, and leaves no plain copy behind", () => {
    expect(JSON.parse(fs.readFileSync(`${encrypted}.manifest.json`, "utf8")).encrypted).toBe(true);
    expect(fs.readFileSync(encrypted).subarray(0, 5).toString()).toBe("ATPB1");
    expect(fs.readdirSync(tmp).filter((f) => f.endsWith(".tmp"))).toEqual([]);
  });

  it("the plain backup restores into a scratch database with every table equal and the health checks green", async () => {
    const r = await restoreCheck(adminUrl(), plain);
    expect(r.problems).toEqual([]);
    expect(r).toMatchObject({ ok: true, tables: 39, health: "ok" });
    expect(r.rows).toBeGreaterThan(1000);
    expect((await db.sql`select count(*)::int n from pg_database where datname like 'restore_check_%'`)[0].n).toBe(0); // the scratch database is dropped
  });

  it("the encrypted backup restores with the passphrase, and not without it or with a wrong one", async () => {
    expect((await restoreCheck(adminUrl(), encrypted, { passphrase: PASS })).ok).toBe(true);
    await expect(restoreCheck(adminUrl(), encrypted)).rejects.toThrow(/passphrase is required/);
    await expect(restoreCheck(adminUrl(), encrypted, { passphrase: "another-long-enough-passphrase" })).rejects.toThrow(/wrong or the backup file is damaged/);
    expect(fs.readdirSync(tmp).filter((f) => f.endsWith(".tmp"))).toEqual([]);
  });

  it("notices a changed file and a manifest that disagrees with the data", async () => {
    const copy = path.join(tmp, "copy.dump");
    fs.copyFileSync(plain, copy);
    const m = JSON.parse(fs.readFileSync(`${plain}.manifest.json`, "utf8"));
    m.tables.tools = 70;
    delete m.tables.redirects;
    fs.writeFileSync(`${copy}.manifest.json`, JSON.stringify(m));
    const r = await restoreCheck(adminUrl(), copy);
    expect(r.ok).toBe(false);
    expect(r.problems.join(" ")).toMatch(/Table tools: backup had 70 rows, the restore has 69/);
    expect(r.problems.join(" ")).toMatch(/Table redirects was not in the backup's manifest/);
    const damaged = Buffer.from(fs.readFileSync(plain));
    damaged[Math.floor(damaged.length / 2)] ^= 0xff;
    fs.writeFileSync(copy, damaged);
    fs.writeFileSync(`${copy}.manifest.json`, fs.readFileSync(`${plain}.manifest.json`));
    const bad = await restoreCheck(adminUrl(), copy);
    expect(bad.ok).toBe(false);
    expect(bad.problems.join(" ")).toMatch(/checksum/);
  });

  it("a failed dump leaves no half-written file and does not echo the connection string", async () => {
    const out = path.join(tmp, "nope.dump");
    const err = await backupDatabase("postgres://nobody:hunter2@127.0.0.1:1/none", out).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).not.toContain("hunter2");
    expect(fs.existsSync(out)).toBe(false);
  });
});
