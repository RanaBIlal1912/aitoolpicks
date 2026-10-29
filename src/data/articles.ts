// Articles are stored as HTML files in /content/articles (ported from the original site, nothing lost).
// Metadata lives in /content/articles.json. This module is server-only (it reads files at build time).
import fs from "node:fs";
import path from "node:path";
import { COMPARISONS } from "./compare";
import { withBase } from "@/lib/site";

export type TopicId = "freelancing" | "writing" | "design" | "business" | "websites" | "students";

export const TOPICS: { id: TopicId; label: string; blurb: string }[] = [
  { id: "freelancing", label: "Freelancing", blurb: "Find clients, write proposals and get paid." },
  { id: "writing", label: "AI writing", blurb: "Assistants, proofreading and prompts." },
  { id: "design", label: "Design", blurb: "Clean visuals without design skills." },
  { id: "business", label: "Small business", blurb: "A small stack that does the work." },
  { id: "websites", label: "Websites & hosting", blurb: "Portfolios, domains and first sites." },
  { id: "students", label: "Students", blurb: "Study help and honest AI use." },
];

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
};

type Raw = { slug: string; title: string; description: string; icon: string; cat: string; blurb: string };

export type Article = Raw & {
  topic: TopicId;
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
  return {
    ...a,
    topic: TOPIC_BY_CAT[a.cat] ?? "freelancing",
    kind: COMPARISON_SLUGS.has(a.slug) ? "comparison" : "guide",
    date: PUBLISHED,
    words,
    minutes: Math.max(2, Math.round(words / 200)),
    href: articleHref(a.slug),
  };
});

export const GUIDES = ARTICLES.filter((a) => a.kind === "guide");

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

const STATIC_PAGES: Record<string, string> = {
  "index.html": "/",
  "about.html": "/about/",
  "disclosure.html": "/affiliate-disclosure/",
};

/** Read an article's HTML and point its old `slug.html` links at the new routes. */
export function getArticleHtml(slug: string): string {
  const html = fs.readFileSync(path.join(ROOT, "content", "articles", `${slug}.html`), "utf-8");
  return html.replace(/href="([a-z0-9-]+\.html)"/g, (m, file: string) => {
    if (STATIC_PAGES[file]) return `href="${withBase(STATIC_PAGES[file])}"`;
    const s = file.replace(/\.html$/, "");
    return getArticle(s) ? `href="${withBase(articleHref(s))}"` : m;
  });
}

export function articlesInTopic(id: TopicId): Article[] {
  return ARTICLES.filter((a) => a.topic === id);
}
