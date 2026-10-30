// Applies a batch of browser-check results to content/tools/*.json.
// Usage: node scripts/verify-apply.mjs patch.json
// patch = { "<id>": { "verification": {status, officialUrl, pricingUrl, notes, ...}, "set": { "pricing.free.details": "...", "pricing.plans.1.monthly": 25 } } }
// "set" paths use dots and array indices; a value of null deletes the key. Every touched record gets verification.checked = today.
import fs from "node:fs";

const patch = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const today = new Date().toISOString().slice(0, 10);

function setPath(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = /^\d+$/.test(keys[i]) ? Number(keys[i]) : keys[i];
    if (cur[k] === undefined) cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[k];
  }
  const last = /^\d+$/.test(keys.at(-1)) ? Number(keys.at(-1)) : keys.at(-1);
  if (value === null) {
    if (Array.isArray(cur)) cur.splice(last, 1);
    else delete cur[last];
  } else cur[last] = value;
}

for (const [id, p] of Object.entries(patch)) {
  const file = `content/tools/${id}.json`;
  const t = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [path, value] of Object.entries(p.set || {})) setPath(t, path, value);
  if (p.verification) {
    t.verification = { ...p.verification, checked: today, method: "Opened in the Claude desktop built-in browser; page text read" };
    t.verified = today;
    if (t.pricing) t.pricing.checked = today;
  }
  fs.writeFileSync(file, JSON.stringify(t, null, 2) + "\n");
  console.log("updated", id);
}
