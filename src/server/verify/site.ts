// Checks on the BUILT site (design section 3.1, checks 4, 12 and 13), for CI after `npm run build`: every internal link and image points at a file that
// exists, and the published tool, review, comparison, guide, news, roundup and category pages are exactly the ones in the sitemap.
import fs from "node:fs";
import path from "node:path";
import type { Sql } from "../db/client.ts";
import { finding, type Finding } from "./findings.ts";

const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

/** The pages the database says exist, as site paths (trailing slash). Only the areas the database fully owns are listed. */
export async function expectedPaths(sql: Sql): Promise<Set<string>> {
  const set = new Set<string>();
  const add = (rows: { slug: string }[], f: (s: string) => string[]) => rows.forEach((r) => f(r.slug).forEach((p) => set.add(p)));
  add(await sql`select slug from tools where status = 'published' and deleted_at is null`, (s) => [`/tools/${s}/`, `/tools/${s}/alternatives/`]);
  add(await sql`select slug from reviews where status = 'published' and deleted_at is null`, (s) => [`/reviews/${s}/`]);
  add(await sql`select slug from comparisons where status = 'published' and deleted_at is null`, (s) => [`/compare/${s}/`]);
  add(await sql`select slug from blog_posts where status = 'published' and deleted_at is null and kind = 'guide'`, (s) => [`/blog/${s}/`]);
  add(await sql`select slug from news_items where status = 'published' and deleted_at is null and same_story_as_id is null`, (s) => [`/news/${s}/`]);
  add(await sql`select slug from roundups where status = 'published' and deleted_at is null`, (s) => [`/best/${s}/`]);
  add(await sql`select slug from categories where status = 'published' and deleted_at is null and parent_id is null and is_visible`, (s) => [`/tools/category/${s}/`]);
  return set;
}

/** The prefixes whose pages are fully described by the database. Pages outside them (home, ecosystem, topics) are not compared. */
const OWNED = [/^\/tools\/[^/]+\/$/, /^\/tools\/[^/]+\/alternatives\/$/, /^\/tools\/category\/[^/]+\/$/, /^\/reviews\/[^/]+\/$/, /^\/compare\/[^/]+\/$/, /^\/blog\/[^/]+\/$/, /^\/news\/[^/]+\/$/, /^\/best\/[^/]+\/$/];
const isOwned = (p: string) => !/^\/blog\/topic\//.test(p) && OWNED.some((r) => r.test(p));

export async function checkBuiltSite(sql: Sql, options: { outDir: string; basePath?: string }): Promise<Finding[]> {
  const out: Finding[] = [];
  const base = options.basePath ?? "/aitoolpicks";
  const root = options.outDir;
  if (!fs.existsSync(path.join(root, "index.html"))) throw new Error(`${root} has no index.html; run the build first`);

  // 13 sitemap
  const sitemapFile = path.join(root, "sitemap.xml");
  if (!fs.existsSync(sitemapFile)) out.push(finding("sitemap", "error", "site", "sitemap.xml", "The built site has no sitemap.xml."));
  else {
    const paths = new Set([...fs.readFileSync(sitemapFile, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => { try { return new URL(m[1]).pathname.replace(new RegExp(`^${base}`), "") || "/"; } catch { return m[1]; } }));
    const expected = await expectedPaths(sql);
    for (const p of expected) if (!paths.has(p)) out.push(finding("sitemap", "error", "page", p, "A published page is missing from the sitemap."));
    for (const p of paths) if (isOwned(p) && !expected.has(p)) out.push(finding("sitemap", "error", "page", p, "The sitemap lists a page that is not published in the database."));
  }

  // 12, 4 internal links and images
  const exists = (urlPath: string) => {
    const clean = decodeURIComponent(urlPath.split("#")[0].split("?")[0]).replace(new RegExp(`^${base}`), "");
    const rel = clean.replace(/^\//, "");
    const candidates = [path.join(root, rel), path.join(root, rel, "index.html"), path.join(root, `${rel}.html`)];
    return candidates.some((c) => fs.existsSync(c) && fs.statSync(c).isFile());
  };
  const seen = new Set<string>();
  for (const file of walk(root).filter((f) => f.endsWith(".html"))) {
    const page = "/" + path.relative(root, file).replace(/\\/g, "/").replace(/index\.html$/, "");
    const html = fs.readFileSync(file, "utf8");
    for (const m of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
      const [, attr, target] = m;
      if (!target.startsWith(`${base}/`) || target.startsWith(`${base}/_next/`)) continue;
      const key = `${page}|${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!exists(target)) out.push(finding(attr === "src" ? "image" : "internal-link", "error", "page", page, `${attr === "src" ? "The file" : "The link"} ${target} does not exist in the built site.`, { field: attr }));
    }
  }
  return out;
}
