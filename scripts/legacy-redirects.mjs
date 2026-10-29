// Runs after `next build`. The original site used URLs like /best-ai-writing-tools.html.
// GitHub Pages cannot do server redirects, so we write small redirect pages at the old addresses
// (meta refresh + JavaScript + canonical link) so existing links and search results keep working.
import fs from "node:fs";
import path from "node:path";

const out = path.resolve("out");
// Same default as next.config.mjs: the site is served under /aitoolpicks on GitHub Pages.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/aitoolpicks";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ranabilal1912.github.io/aitoolpicks").replace(/\/$/, "");

const articles = JSON.parse(fs.readFileSync("content/articles.json", "utf-8"));
const map = new Map([
  ["about.html", "/about/"],
  ["disclosure.html", "/affiliate-disclosure/"],
]);
for (const a of articles) {
  const area = fs.existsSync(path.join(out, "compare", a.slug, "index.html")) ? "compare" : "blog";
  map.set(`${a.slug}.html`, `/${area}/${a.slug}/`);
}

let n = 0;
for (const [file, target] of map) {
  if (!fs.existsSync(path.join(out, target.replace(/^\//, ""), "index.html"))) {
    throw new Error(`Redirect target missing for ${file}: ${target}`);
  }
  const rel = `${basePath}${target}`;
  const abs = `${siteUrl}${target}`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>This page has moved | AI Tool Picks</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="canonical" href="${abs}">
<meta http-equiv="refresh" content="0; url=${rel}">
<script>location.replace(${JSON.stringify(rel)});</script>
</head><body style="font-family:system-ui;background:#05060f;color:#eceffd;padding:2rem">
<p>This page has moved to <a style="color:#8fd3ff" href="${rel}">${abs}</a>.</p>
</body></html>
`;
  fs.writeFileSync(path.join(out, file), html);
  n++;
}
fs.writeFileSync(path.join(out, ".nojekyll"), "");
console.log(`legacy-redirects: wrote ${n} redirect pages and .nojekyll`);
