// Builds docs/VERIFICATION_REPORT.md from the verification block in every content/tools/*.json record.
// Usage: node scripts/verification-report.mjs
import fs from "node:fs";

const dir = "content/tools";
const tools = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"))).sort((a, b) => a.name.localeCompare(b.name));
const by = (s) => tools.filter((t) => t.verification.status === s);
const manual = tools.filter((t) => t.verification.status !== "verified");
const renamed = tools.filter((t) => t.status === "renamed");

const lines = [];
lines.push("# Tool verification report", "");
lines.push(`Generated from \`content/tools/*.json\`. Method: each vendor's official site and pricing page were opened in the Claude desktop app's built-in browser and the page text was read. Nothing was purchased, no trial was started, no account was created and no sign-in prompt was accepted.`, "");
lines.push("## Totals", "", `| Measure | Count |`, `| --- | --- |`);
lines.push(`| Total tools checked | ${tools.length} |`);
for (const s of ["verified", "partial", "login-required", "custom-pricing", "unavailable", "discontinued"]) lines.push(`| ${s} | ${by(s).length} |`);
lines.push(`| Renamed by the vendor | ${renamed.length} (${renamed.map((t) => t.id).join(", ")}) |`, "");
lines.push("## Needs manual review", "", "These records are not fully verified. The note says what is missing.", "");
for (const t of manual) lines.push(`- **${t.name}** (\`${t.id}\`): ${t.verification.notes}`);
lines.push("", "## Every tool", "", "| Tool | Status | Checked | Official site | Pricing source |", "| --- | --- | --- | --- | --- |");
for (const t of tools) lines.push(`| ${t.name} | ${t.verification.status} | ${t.verification.checked} | ${t.verification.officialUrl} | ${t.verification.pricingUrl} |`);
lines.push("", "## Notes per tool", "");
for (const t of tools) lines.push(`### ${t.name}`, "", `Status: ${t.verification.status}. ${t.verification.notes}`, "");
fs.writeFileSync("docs/VERIFICATION_REPORT.md", lines.join("\n"));
console.log("wrote docs/VERIFICATION_REPORT.md", tools.length);
