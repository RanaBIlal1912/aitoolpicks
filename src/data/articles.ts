// Articles are stored as HTML files in /content/articles (ported from the original site, nothing lost).
// Metadata lives in /content/articles.json. This module is server-only (it reads files at build time).
import fs from "node:fs";
import path from "node:path";
import { COMPARISONS } from "./compare";
import { withBase } from "@/lib/site";
import type { CoverId } from "./covers";

import { COVER_BY_TOPIC, TOPICS, type TopicId } from "./topics";

export { COVER_BY_TOPIC, TOPICS };
export type { TopicId };

const TOPIC_BY_CAT: Record<string, TopicId> = {
  "Start here": "freelancing",
  Freelancers: "freelancing",
  Writing: "writing",
  Comparison: "writing",
  Design: "design",
  "Small business": "business",
  Websites: "websites",
  Hosting: "websites",
  Students: "students",
  "AI for developers": "developers",
  "AI productivity": "productivity",
  "Image and video": "imagevideo",
  "Beginner guides": "beginners",
};

type Raw = { slug: string; title: string; description: string; icon: string; cat: string; blurb: string; region?: string; date?: string };

export type Article = Raw & {
  topic: TopicId;
  cover: CoverId;
  /** Catalog tool ids the guide links to, used for its cover and for related tools. */
  tools: string[];
  kind: "guide" | "comparison";
  date: string;
  words: number;
  minutes: number;
  href: string;
};

const ROOT = process.cwd();
const RAW: Raw[] = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "articles.json"), "utf-8"));
const COMPARISON_SLUGS = new Set(COMPARISONS.map((c) => c.article));

// Article dates: the guides were published together on the date below.
const PUBLISHED = "2026-10-29";

function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

export function articleHref(slug: string): string {
  return COMPARISON_SLUGS.has(slug) ? `/compare/${slug}/` : `/blog/${slug}/`;
}

export const ARTICLES: Article[] = RAW.map((a) => {
  const words = wordCount(fs.readFileSync(path.join(ROOT, "content", "articles", `${a.slug}.html`), "utf-8"));
  const topic = TOPIC_BY_CAT[a.cat] ?? "freelancing";
  const rawHtml = fs.readFileSync(path.join(ROOT, "content", "articles", `${a.slug}.html`), "utf-8");
  const tools = Array.from(new Set(Array.from(rawHtml.matchAll(/data-aff="([a-z0-9-]+)"/g), (m) => m[1])));
  return {
    ...a,
    tools,
    topic,
    cover: COVER_BY_TOPIC[topic],
    kind: COMPARISON_SLUGS.has(a.slug) ? "comparison" : "guide",
    date: a.date ?? PUBLISHED,
    words,
    minutes: Math.max(2, Math.round(words / 200)),
    href: articleHref(a.slug),
  };
});

// Newest first; the original guides share one date, so their order from articles.json is kept.
ARTICLES.sort((x, y) => y.date.localeCompare(x.date));

export const GUIDES = ARTICLES.filter((a) => a.kind === "guide");

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

const STATIC_PAGES: Record<string, string> = {
  "index.html": "/",
  "about.html": "/about/",
  "disclosure.html": "/affiliate-disclosure/",
  "pricing.html": "/pricing/",
  "tools.html": "/tools/",
  "compare.html": "/compare/",
};

function slugify(t: string): string {
  return t
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type TocItem = { id: string; text: string };

/** Read an article's HTML, point its old `slug.html` links at the new routes and give each h2 an anchor id. */
export function getArticleParts(slug: string): { html: string; toc: TocItem[] } {
  let html = fs.readFileSync(path.join(ROOT, "content", "articles", `${slug}.html`), "utf-8");
  html = html.replace(/href="([a-z0-9-]+\.html)"/g, (m, file: string) => {
    if (STATIC_PAGES[file]) return `href="${withBase(STATIC_PAGES[file])}"`;
    const s = file.replace(/\.html$/, "");
    return getArticle(s) ? `href="${withBase(articleHref(s))}"` : m;
  });
  const toc: TocItem[] = [];
  const seen = new Set<string>();
  html = html.replace(/<h2>(.*?)<\/h2>/g, (_m, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&rsquo;/g, "’");
    let id = slugify(inner) || "section";
    while (seen.has(id)) id += "-2";
    seen.add(id);
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html, toc };
}

export function getArticleHtml(slug: string): string {
  return getArticleParts(slug).html;
}

/** Articles that link to a tool through a `data-aff` button, for "mentioned in" lists. */
export function articlesMentioning(toolId: string): Article[] {
  return ARTICLES.filter((a) =>
    fs.readFileSync(path.join(ROOT, "content", "articles", `${a.slug}.html`), "utf-8").includes(`data-aff="${toolId}"`),
  );
}

export function articlesInTopic(id: TopicId): Article[] {
  return ARTICLES.filter((a) => a.topic === id);
}
