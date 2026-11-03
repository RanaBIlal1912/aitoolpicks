// The old addresses of the original site (/some-guide.html) and where they lead now. Used by next.config.mjs to send real permanent redirects on a
// server host (Vercel), and checked by a test against the same mapping the data importer stores and the GitHub Pages stub script writes.
import fs from "node:fs";
import path from "node:path";

export function legacyRedirects(root = process.cwd()) {
  const articles = JSON.parse(fs.readFileSync(path.join(root, "content", "articles.json"), "utf8"));
  const compareSource = fs.readFileSync(path.join(root, "src", "data", "compare.ts"), "utf8");
  const comparisons = new Set([...compareSource.matchAll(/article:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));
  return [
    { source: "/about.html", destination: "/about/" },
    { source: "/disclosure.html", destination: "/affiliate-disclosure/" },
    ...articles.map((a) => ({ source: `/${a.slug}.html`, destination: `/${comparisons.has(a.slug) ? "compare" : "blog"}/${a.slug}/` })),
  ];
}
