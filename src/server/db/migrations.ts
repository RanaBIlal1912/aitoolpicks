// Reading and applying the migrations in /drizzle. Node only (uses the file system), so it is kept apart from the client and the health checks.
import fs from "node:fs";
import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb, type Sql } from "./client.ts";

/** The /drizzle folder of the repository, resolved when called so it follows the current working directory. */
export const migrationsFolder = () => path.resolve("drizzle");

type Journal = { entries: { idx: number; tag: string; when: number }[] };

export function readJournal(folder = migrationsFolder()): Journal {
  return JSON.parse(fs.readFileSync(path.join(folder, "meta", "_journal.json"), "utf8")) as Journal;
}

/** The "when" value of every migration in the repository, in order. This is what the database records as created_at. */
export function readJournalWhen(folder = migrationsFolder()): number[] {
  return readJournal(folder).entries.map((e) => e.when);
}

/** Table names created by the migrations, found in the SQL, so the health check needs no second list. */
export function expectedTablesFromSql(folder = migrationsFolder()): string[] {
  const names = new Set<string>();
  for (const f of fs.readdirSync(folder).filter((x) => x.endsWith(".sql"))) {
    for (const m of fs.readFileSync(path.join(folder, f), "utf8").matchAll(/^CREATE TABLE "([a-z_]+)"/gm)) names.add(m[1]);
  }
  return [...names].sort();
}

/** Apply every pending migration. Safe to run again: applied migrations are skipped. */
export async function runMigrations(sql: Sql, folder = migrationsFolder()): Promise<void> {
  await migrate(createDb(sql), { migrationsFolder: folder, migrationsSchema: "drizzle", migrationsTable: "__drizzle_migrations" });
}
