// Data verification. Writes reports/verification-<kind>.json and .md and exits 1 only when there are ERRORS (never for warnings).
//   node scripts/verify/run.ts data                     offline checks on the database
//   node scripts/verify/run.ts links [--limit=N]        network checks of outward addresses (polite; run on a schedule, not at build)
//   node scripts/verify/run.ts site [--out=out]         checks on the built site (run `npm run build` first)
// Add --record to also store the findings as automated rows in the verification history. They never change a status.
import fs from "node:fs";
import { createSql } from "../../src/server/db/client.ts";
import { runDataChecks } from "../../src/server/verify/checks.ts";
import { buildReport, hasErrors, reportMarkdown, type Finding, type ReviewQueueItem } from "../../src/server/verify/findings.ts";
import { checkUrls, collectUrls, linkFindings } from "../../src/server/verify/links.ts";
import { recordAutomated } from "../../src/server/verify/record.ts";
import { checkBuiltSite } from "../../src/server/verify/site.ts";
import { databaseEnvOrExit, hostOf } from "../db/env.ts";

const kind = process.argv[2];
const flag = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
if (!["data", "links", "site"].includes(kind)) {
  console.error("Usage: node scripts/verify/run.ts data|links|site [--record] [--limit=N] [--out=out]");
  process.exit(2);
}
const env = databaseEnvOrExit();
const sql = createSql(env.url, { ssl: env.DATABASE_SSL, max: 1, applicationName: "aitoolpicks-verify" });
try {
  let findings: Finding[] = [];
  let queue: ReviewQueueItem[] = [];
  if (kind === "data") ({ findings, humanReviewQueue: queue } = await runDataChecks(sql));
  if (kind === "links") {
    const refs = await collectUrls(sql);
    const limit = flag("limit") ? Number(flag("limit")) : undefined;
    console.log(`Checking ${new Set(refs.map((r) => r.url)).size} distinct addresses${limit ? ` (first ${limit})` : ""}. This takes a few minutes; hosts are asked one request at a time.`);
    const results = await checkUrls(refs, { limit });
    findings = linkFindings(refs.filter((r) => results.has(r.url)), results);
    console.log(`Checked ${results.size}: ${[...results.values()].filter((r) => r.kind === "ok").length} fine, ${[...results.values()].filter((r) => r.kind === "blocked").length} refused automated checks, ${[...results.values()].filter((r) => r.kind !== "ok" && r.kind !== "blocked").length} to look at.`);
  }
  if (kind === "site") findings = await checkBuiltSite(sql, { outDir: flag("out") ?? "out", basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "/aitoolpicks" });

  const report = buildReport(kind as "data" | "links" | "site", hostOf(env.url), findings, queue);
  fs.mkdirSync("reports", { recursive: true });
  fs.writeFileSync(`reports/verification-${kind}.json`, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(`reports/verification-${kind}.md`, reportMarkdown(report));
  console.log(`${report.counts.error} error(s), ${report.counts.warning} warning(s), ${report.counts.info} note(s). Wrote reports/verification-${kind}.json and .md`);
  if (process.argv.includes("--record")) {
    const n = await recordAutomated(sql, findings, `automated: ${kind} check`);
    console.log(`Recorded ${n} automated entr${n === 1 ? "y" : "ies"} in the verification history. No status was changed.`);
  }
  if (hasErrors(report)) process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
