// Applies pending migrations from /drizzle. Applied migrations are skipped, so running it twice is harmless.
//   node scripts/db/migrate.ts
// A database that is not on this computer needs --confirm=<its host name>, so a migration never reaches a hosted database by accident.
import { createSql } from "../../src/server/db/client.ts";
import { runMigrations } from "../../src/server/db/migrations.ts";
import { databaseEnvOrExit, hostOf, isLocal } from "./env.ts";

const env = databaseEnvOrExit();
const host = hostOf(env.url);
if (!isLocal(env.url) && !process.argv.includes(`--confirm=${host}`)) {
  console.error(`This would migrate the database at ${host}, which is not on this computer.`);
  console.error(`Re-run with --confirm=${host} if that is what you intend.`);
  process.exit(2);
}
const sql = createSql(env.url, { ssl: env.DATABASE_SSL, max: 1, applicationName: "aitoolpicks-migrate" });
try {
  await runMigrations(sql);
  console.log(`Migrations are up to date on ${host}.`);
} finally {
  await sql.end({ timeout: 5 });
}
