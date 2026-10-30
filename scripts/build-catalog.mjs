// Validates every tool record and writes the small generated files the app imports.
// Usage: node scripts/build-catalog.mjs [--report]
import fs from "node:fs";
import path from "node:path";
import { buildDetail, buildIndex, buildLinks, buildPriceRefs, healthReport, validateAll } from "./catalog-lib.mjs";

const root = process.cwd();
const { entries, errors } = validateAll(root);
if (errors.length) {
  console.error(`Catalog has ${errors.length} problem(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const out = path.join(root, "src", "data", "generated");
fs.mkdirSync(out, { recursive: true });
const write = (name, data) => fs.writeFileSync(path.join(out, name), JSON.stringify(data, null, 1) + "\n");
write("catalog-index.json", buildIndex(entries));
write("catalog-detail.json", buildDetail(entries));
write("price-refs.json", buildPriceRefs(entries));
write("tool-links.json", buildLinks(entries));

const h = healthReport(entries);
console.log(`catalog: ${h.total} tools. pricing verified ${h.byStatus.verified.length}, partial ${h.byStatus.partial.length}, unverified ${h.byStatus.unverified.length}. stale: ${h.stale.length}.`);
if (process.argv.includes("--report")) {
  console.log("Needs attention (not fully verified):", h.needsAttention.join(", "));
  console.log("Stale (older than the recheck window):", h.stale.join(", ") || "none");
}
