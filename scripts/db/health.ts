// Prints the database health report. Exit code 0 = ok, 1 = degraded or down, 2 = settings missing.
//   node scripts/db/health.ts          readable summary
//   node scripts/db/health.ts --json   machine-readable JSON
import { createSql } from "../../src/server/db/client.ts";
import { runHealth } from "../../src/server/db/health.ts";
import { expectedTablesFromSql, readJournalWhen } from "../../src/server/db/migrations.ts";
import { databaseEnvOrExit } from "./env.ts";

const env = databaseEnvOrExit();
const sql = createSql(env.url, { ssl: env.DATABASE_SSL, max: 1, applicationName: "aitoolpicks-health" });
try {
  const report = await runHealth(sql, { expectedMigrations: readJournalWhen(), expectedTables: expectedTablesFromSql() });
  if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Database health: ${report.status.toUpperCase()}  (${report.checkedAt})`);
    for (const c of report.checks) console.log(`  ${c.ok ? "ok  " : "FAIL"} ${c.name.padEnd(20)} ${String(c.ms).padStart(4)} ms  ${c.detail}`);
  }
  process.exitCode = report.status === "ok" ? 0 : 1;
} finally {
  await sql.end({ timeout: 5 });
}
