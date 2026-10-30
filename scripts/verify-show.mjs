// Prints a compact view of the stored record(s) so a browser check can be compared against it.
// Usage: node scripts/verify-show.mjs id1 id2 ...
import fs from "node:fs";

for (const id of process.argv.slice(2)) {
  const t = JSON.parse(fs.readFileSync(`content/tools/${id}.json`, "utf8"));
  const p = t.pricing;
  console.log(`\n=== ${id} | ${t.name} | ${t.vendor} | ${t.website} | cat=${t.category} | alt=${(t.alternatives || []).join(",")}`);
  console.log(`tagline: ${t.tagline}`);
  console.log(`pricing: ${p.status}/${p.model} src=${p.source} trial=${p.trial ?? "-"}`);
  console.log(`free: ${p.free?.available} ${p.free?.details ?? ""}`);
  for (const pl of p.plans || []) {
    console.log(
      `  - ${pl.name} [${pl.audience}] ${pl.currency} m=${pl.monthly ?? "-"} a=${pl.annual ?? "-"} unit=${pl.unit}${pl.custom ? " CUSTOM" : ""}${pl.note ? " note=" + pl.note : ""}${pl.limits ? " limits=" + pl.limits.join("; ") : ""}`,
    );
  }
  if (p.api) console.log(`api: ${p.api.summary}`);
  if (p.regional) console.log(`regional: ${p.regional}`);
}
