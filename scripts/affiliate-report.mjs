// Builds docs/AFFILIATE_STATUS.md from content/affiliate.json: what is approved, pending, unavailable, and which programmes still need an application.
// Usage: node scripts/affiliate-report.mjs   (or npm run affiliate:report)
import fs from "node:fs";

const { programs } = JSON.parse(fs.readFileSync("content/affiliate.json", "utf8"));
const name = (id) => {
  const f = `content/tools/${id}.json`;
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).name : `${id} (no such tool)`;
};
const by = (s) => Object.entries(programs).filter(([, e]) => e.status === s);
const tools = fs.readdirSync("content/tools").filter((f) => f.endsWith(".json")).length;

const L = [];
L.push("# Affiliate status", "");
L.push("Generated from `content/affiliate.json` by `npm run affiliate:report`. Do not edit by hand. A tool with no entry is an ordinary link (no affiliate relationship).", "");
L.push("| Status | Meaning | Tools |", "| --- | --- | --- |");
L.push(`| approved | We hold an official affiliate link; buttons use it and are marked as affiliate links | ${by("approved").length} |`);
L.push(`| pending | We applied and are waiting; buttons still go to the official site | ${by("pending").length} |`);
L.push(`| unavailable | The programme's own page says we cannot join | ${by("unavailable").length} |`);
L.push(`| ordinary | No affiliate relationship | ${tools - by("approved").length - by("pending").length - by("unavailable").length} of ${tools} |`, "");
L.push("Nothing earns a commission until a programme's status is `approved` and its official link is in the file.", "");

const apply = by("ordinary").filter(([, e]) => e.programme);
L.push("## Programmes that still need an application", "");
if (apply.length === 0) L.push("None.", "");
else {
  L.push("These programmes exist and look usable for this site, but nobody has applied. Read the terms on the programme's own page first (`docs/AFFILIATE_PROGRAMS.md` has the research).", "");
  L.push("| Tool | Network | Apply / terms | Note | Checked |", "| --- | --- | --- | --- | --- |");
  for (const [id, e] of apply) L.push(`| ${name(id)} (\`${id}\`) | ${e.programme.network} | <${e.programme.applyUrl}> | ${e.note ?? ""} | ${e.programme.checked} |`);
  L.push("");
}
const unclear = by("ordinary").filter(([, e]) => !e.programme && e.note);
if (unclear.length) {
  L.push("## Unconfirmed", "", "| Tool | Why it is not on the list above |", "| --- | --- |");
  for (const [id, e] of unclear) L.push(`| ${name(id)} (\`${id}\`) | ${e.note} |`);
  L.push("");
}
L.push("## Unavailable", "");
if (by("unavailable").length === 0) L.push("None.", "");
else {
  L.push("| Tool | Reason | Source | Checked |", "| --- | --- | --- | --- |");
  for (const [id, e] of by("unavailable")) L.push(`| ${name(id)} (\`${id}\`) | ${e.note ?? ""} | ${e.source ? `<${e.source}>` : ""} | ${e.checked ?? ""} |`);
  L.push("");
}
for (const s of ["pending", "approved"]) {
  L.push(`## ${s[0].toUpperCase()}${s.slice(1)}`, "");
  if (by(s).length === 0) L.push("None.", "");
  else for (const [id, e] of by(s)) L.push(`- ${name(id)} (\`${id}\`)${e.note ? `: ${e.note}` : ""}`), L.push("");
}
fs.writeFileSync("docs/AFFILIATE_STATUS.md", L.join("\n"));
console.log("wrote docs/AFFILIATE_STATUS.md", Object.keys(programs).length, "entries");
