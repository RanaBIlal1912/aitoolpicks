// Static audit of the built site (out/): internal links and assets resolve, one h1, unique title/description, canonical, alt text, valid JSON-LD, unique ids.
// Run after `npm run build`: node scripts/audit-out.mjs   (exit code 1 when anything is found)
import fs from "node:fs";
import path from "node:path";
const out = path.join(process.cwd(), "out");
const BASE = "/aitoolpicks";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pages = walk(out).filter((f) => f.endsWith(".html") && !/404|legacy|_not-found/.test(f) && !fs.readFileSync(f, "utf8").includes("This page has moved"));
const problems = [];
const titles = new Map(), descs = new Map();
const exists = (u) => {
  let p = decodeURIComponent(u.split("#")[0].split("?")[0]);
  if (!p.startsWith(BASE)) return true;
  p = p.slice(BASE.length) || "/";
  const f = path.join(out, p);
  return fs.existsSync(f) && (fs.statSync(f).isFile() || fs.existsSync(path.join(f, "index.html")));
};
let links = 0;
for (const f of pages) {
  const rel = "/" + path.relative(out, f).split(path.sep).join("/");
  const h = fs.readFileSync(f, "utf8");
  const add = (m) => problems.push(`${rel}: ${m}`);
  const body = h.replace(/<script[\s\S]*?<\/script>/g, "");
  if (!f.includes("redirect")) {
    const h1 = (body.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) add(`${h1} h1 elements`);
    const title = h.match(/<title>([^<]*)<\/title>/)?.[1];
    const desc = h.match(/<meta name="description" content="([^"]*)"/)?.[1];
    if (!title) add("no title"); else titles.set(title, [...(titles.get(title) ?? []), rel]);
    if (!desc) add("no meta description"); else descs.set(desc, [...(descs.get(desc) ?? []), rel]);
    if (!/<link rel="canonical" href="https:\/\/ranabilal1912\.github\.io\/aitoolpicks\//.test(h)) add("no canonical");
  }
  for (const m of body.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) add("img without alt: " + m[0].slice(0, 80));
  for (const m of h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { add("invalid JSON-LD"); } }
  const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) add("duplicate ids: " + [...new Set(dup)].join(", "));
  for (const m of body.matchAll(/(?:href|src)="(\/aitoolpicks[^"]*)"/g)) { links++; if (!exists(m[1])) add("broken internal reference " + m[1]); }
  for (const m of body.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) add("target=_blank without noopener: " + m[0].slice(0, 90));
}
for (const [t, r] of titles) if (r.length > 1) problems.push(`duplicate title "${t.slice(0, 60)}" on ${r.length} pages: ${r.slice(0, 3).join(", ")}`);
for (const [t, r] of descs) if (r.length > 1) problems.push(`duplicate description "${t.slice(0, 50)}" on ${r.length} pages: ${r.slice(0, 3).join(", ")}`);
console.log(`checked ${pages.length} pages, ${links} internal references`);
const uniq = [...new Set(problems)];
console.log(uniq.length ? uniq.slice(0, 80).join("\n") + (uniq.length > 80 ? `\n... ${uniq.length - 80} more` : "") : "no problems found");
process.exit(uniq.length ? 1 : 0);
