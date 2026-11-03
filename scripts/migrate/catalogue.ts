// Imports the JSON catalogue into the database and verifies it.
//   node scripts/migrate/catalogue.ts --dry-run          show what would change, write nothing
//   node scripts/migrate/catalogue.ts                    import (a database that is not on this computer needs --confirm=<host>)
//   node scripts/migrate/catalogue.ts --verify [--report] verify only; --report writes reports/migration-verification.{json,md}
// Originals in content/ are only read. Nothing in the database is ever deleted.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createSql } from "../../src/server/db/client.ts";
import { importCatalogue } from "../../src/server/import/catalogue.ts";
import { loadSource, SourceError } from "../../src/server/import/source.ts";
import { reportMarkdown, verifyCatalogue } from "../../src/server/import/verify.ts";
import { databaseEnvOrExit, hostOf, isLocal } from "../db/env.ts";

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const env = databaseEnvOrExit();
const host = hostOf(env.url);
if (!isLocal(env.url) && !has(`--confirm=${host}`)) {
  console.error(`This would write to the database at ${host}, which is not on this computer. Re-run with --confirm=${host} if that is what you intend.`);
  process.exit(2);
}

let src;
try {
  src = loadSource(process.cwd());
} catch (e) {
  if (e instanceof SourceError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
const sql = createSql(env.url, { ssl: env.DATABASE_SSL, max: 1, applicationName: "aitoolpicks-import" });
try {
  if (!has("--verify")) {
    const r = await importCatalogue(sql, src, { dryRun: has("--dry-run") });
    console.log(`${r.dryRun ? "DRY RUN (nothing written)" : "Imported"} into ${host}:`);
    for (const [k, v] of Object.entries(r.groups)) console.log(`  ${k.padEnd(18)} inserted ${v.inserted}, updated ${v.updated}, unchanged ${v.unchanged}`);
    for (const [k, v] of Object.entries(r.extra)) if (v.length) console.log(`  in the database but not in the files (kept): ${k}: ${v.join(", ")}`);
  }
  if (!has("--dry-run")) {
    const report = await verifyCatalogue(sql, src);
    for (const c of report.checks) console.log(`  [${c.ok ? "pass" : "FAIL"}] ${c.name}: ${c.detail}`);
    console.log(report.ok ? "Verification passed." : "Verification FAILED.");
    if (has("--report")) {
      let commit: string | undefined;
      try { commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim(); } catch { /* not a git checkout */ }
      fs.mkdirSync("reports", { recursive: true });
      fs.writeFileSync("reports/migration-verification.json", JSON.stringify({ host, commit, ...report }, null, 2) + "\n");
      fs.writeFileSync("reports/migration-verification.md", reportMarkdown(report, { host, commit }));
      console.log("Wrote reports/migration-verification.json and .md");
    }
    if (!report.ok) process.exitCode = 1;
  }
} finally {
  await sql.end({ timeout: 5 });
}
