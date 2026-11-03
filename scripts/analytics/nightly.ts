// The nightly analytics job: roll raw events into daily totals, then delete raw events older than 90 days that are already rolled up.
//   node scripts/analytics/nightly.ts          (a database that is not on this computer needs --confirm=<host>)
// Safe to run any number of times. Does nothing harmful when analytics are off: there are simply no events.
import { runNightly } from "../../src/server/analytics/rollup.ts";
import { createSql } from "../../src/server/db/client.ts";
import { databaseEnvOrExit, hostOf, isLocal } from "../db/env.ts";

const env = databaseEnvOrExit();
const host = hostOf(env.url);
if (!isLocal(env.url) && !process.argv.includes(`--confirm=${host}`)) {
  console.error(`This would change analytics data in the database at ${host}, which is not on this computer. Re-run with --confirm=${host} if that is what you intend.`);
  process.exit(2);
}
const sql = createSql(env.url, { ssl: env.DATABASE_SSL, max: 1, applicationName: "aitoolpicks-analytics-nightly" });
try {
  const r = await runNightly(sql);
  console.log(`Rolled up ${r.days} day(s) into ${r.rows} row(s); removed ${r.purged} raw event(s) older than 90 days.`);
} finally {
  await sql.end({ timeout: 5 });
}
