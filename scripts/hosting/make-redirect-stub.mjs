// Cutover helper. GitHub Pages cannot send a real 301, so after the site moves to its new domain the old address is replaced by a small stub: one page per old
// URL that points search engines (canonical link) and visitors (instant refresh) at the same page on the new domain.
//   node scripts/hosting/make-redirect-stub.mjs --to=https://www.example.com [--from=out] [--dest=redirect-stub]
// Needs the GitHub Pages build (npm run build) so that every old address is known from its sitemap and its legacy pages. Reads `out/`, writes `redirect-stub/`.
// Nothing is deployed: you publish the folder yourself, and only when the new site is live and checked.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Every old path (relative to the site root, no base path) that should redirect. */
export function oldPaths({ from, basePath = "/aitoolpicks" }) {
  const paths = new Set();
  const sitemap = path.join(from, "sitemap.xml");
  if (!fs.existsSync(sitemap)) throw new Error(`${sitemap} not found; run the build first`);
  for (const m of fs.readFileSync(sitemap, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const p = new URL(m[1]).pathname.replace(new RegExp(`^${basePath}`), "") || "/";
    paths.add(p.endsWith("/") ? p : `${p}/`);
  }
  // The legacy .html pages the original site had; the build wrote them next to the new pages.
  // Only pages that are redirects (the Search Console verification file, for one, is an .html file that must not be treated as an old page).
  for (const f of fs.readdirSync(from)) {
    if (!f.endsWith(".html") || ["index.html", "404.html"].includes(f)) continue;
    if (/<meta http-equiv="refresh"/.test(fs.readFileSync(path.join(from, f), "utf8"))) paths.add(`/${f}`);
  }
  return [...paths].sort();
}

export function redirectPage(destination) {
  const d = esc(destination);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>This page has moved | AI Tool Picks</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="canonical" href="${d}">
<meta http-equiv="refresh" content="0; url=${d}">
<script>location.replace(${JSON.stringify(destination).replace(/</g, "\\u003c")});</script>
</head><body style="font-family:system-ui;padding:2rem">
<p>This page has moved to <a href="${d}">${d}</a>.</p>
</body></html>
`;
}

export function buildStub({ from = "out", dest = "redirect-stub", to, basePath = "/aitoolpicks" }) {
  let origin;
  try {
    origin = new URL(to);
  } catch {
    throw new Error("--to must be a full address such as https://www.example.com");
  }
  if (origin.protocol !== "https:" || origin.pathname.replace(/\/+$/, "") !== "" || origin.search || origin.hash) throw new Error("--to must be the https address of the new site's root, with no path");
  const absFrom = path.resolve(from);
  const absDest = path.resolve(dest);
  if (absDest === absFrom || absDest.startsWith(absFrom + path.sep) || absFrom.startsWith(absDest + path.sep)) throw new Error("--dest must be a separate folder from the build");
  fs.rmSync(absDest, { recursive: true, force: true });
  const written = [];
  for (const p of oldPaths({ from: absFrom, basePath })) {
    const file = p.endsWith("/") ? path.join(absDest, p, "index.html") : path.join(absDest, p);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, redirectPage(new URL(p.endsWith(".html") ? legacyTarget(p, absFrom, basePath) : p, origin).toString()));
    written.push(p);
  }
  // Anything else that used to exist (a deep link we did not list) lands on the new home page rather than on an error.
  fs.writeFileSync(path.join(absDest, "404.html"), redirectPage(new URL("/", origin).toString()));
  fs.writeFileSync(path.join(absDest, ".nojekyll"), "");
  return { written, dest: absDest };
}

/** Where a legacy /name.html page goes: read it from the redirect page the build wrote (so the mapping lives in one place). */
function legacyTarget(p, from, basePath) {
  const html = fs.readFileSync(path.join(from, p.slice(1)), "utf8");
  const m = /<meta http-equiv="refresh" content="0; url=([^"]+)"/.exec(html);
  if (!m) throw new Error(`${p} has no redirect target`);
  return m[1].replace(new RegExp(`^${basePath}`), "");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const arg = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? d;
  const to = arg("to");
  if (!to) {
    console.error("Usage: node scripts/hosting/make-redirect-stub.mjs --to=https://www.example.com [--from=out] [--dest=redirect-stub]");
    process.exit(2);
  }
  const r = buildStub({ from: arg("from", "out"), dest: arg("dest", "redirect-stub"), to });
  console.log(`Wrote ${r.written.length} redirect pages plus 404.html to ${r.dest}. Nothing was published.`);
}
