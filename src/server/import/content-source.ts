// The editorial content that is not in content/tools: models, articles, comparisons, reviews, news and roundups. Some of it is JSON, some of it is
// written as TypeScript arrays in src/data; both are read without running the site's code and validated strictly.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { readExportedArray } from "./ts-data.ts";
import { slugify, SourceError, type Source } from "./source.ts";

const SLUG = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const url = z.string().regex(/^https:\/\/[^/ ]+\.[^/ ]+/);

export const modelSchema = z
  .object({
    id: SLUG, name: z.string().min(1), company: z.string().min(1), released: date.optional(), details: z.array(z.string()).min(1).optional(),
    summary: z.string().min(1), licence: z.string().min(1), tools: z.array(SLUG), toolNote: z.string(), news: SLUG.optional(),
    sources: z.array(z.object({ label: z.string().min(1), url, checked: date }).strict()),
  })
  .strict();
export type ModelJson = z.infer<typeof modelSchema>;

export const articleSchema = z
  .object({ slug: SLUG, title: z.string().min(1), description: z.string().min(1), icon: z.string(), cat: z.string().min(1), blurb: z.string(), region: z.string().optional(), date: date.optional() })
  .strict();
export type ArticleMeta = z.infer<typeof articleSchema>;
export type Article = ArticleMeta & { html: string };

const cell = z.union([z.string(), z.object({ price: SLUG }).strict()]);
export const comparisonSchema = z
  .object({
    slug: SLUG, article: SLUG, leftLabel: z.string().min(1), rightLabel: z.string().min(1), leftTool: SLUG.optional(), rightTool: SLUG.optional(),
    rows: z.array(z.object({ label: z.string(), left: cell, right: cell }).strict()),
  })
  .strict();
export type ComparisonJson = z.infer<typeof comparisonSchema>;

export const reviewSchema = z
  .object({
    method: z.literal("documentation"), slug: SLUG, toolId: SLUG, title: z.string().min(1), summary: z.string().min(1), useCases: z.array(z.string()), pros: z.array(z.string()),
    cons: z.array(z.string()), bestFor: z.string(), skipIf: z.string(), pricingNote: z.string(), verdict: z.string(),
  })
  .strict();
export type ReviewJson = z.infer<typeof reviewSchema>;

const NEWS_KINDS = ["New product", "Feature update", "Model release", "Research", "Policy update", "Company announcement", "Open standard"] as const;
const NEWS_TAGS = ["Products", "Models", "Research", "Policy & safety", "Company news", "Open standards"] as const;
export const newsSchema = z
  .object({
    slug: SLUG, kind: z.enum(NEWS_KINDS), importance: z.union([z.literal(1), z.literal(2), z.literal(3)]), title: z.string().min(1), date, source: z.string().min(1), url, tag: z.enum(NEWS_TAGS),
    summary: z.string().min(1), tools: z.array(SLUG).min(1).optional(), dateFromUrl: z.literal(true).optional(), matters: z.string(), sameStoryAs: SLUG.optional(),
  })
  .strict();
export type NewsJson = z.infer<typeof newsSchema>;

export const newsImageSchema = z.object({ imageUrl: url.optional(), file: z.string(), credit: z.string(), page: url, alt: z.string(), width: z.number().optional(), height: z.number().optional() }).passthrough();

export const roundupSchema = z
  .object({
    slug: SLUG, title: z.string().min(1), category: SLUG, description: z.string(), intro: z.array(z.string()), criteria: z.array(z.string()),
    picks: z.array(z.object({ id: SLUG, badge: z.string().min(1), why: z.string().min(1) }).strict()).min(1), note: z.string().optional(),
  })
  .strict();
export type RoundupJson = z.infer<typeof roundupSchema>;

export type ContentSource = {
  models: ModelJson[]; articles: Article[]; comparisons: ComparisonJson[]; reviews: ReviewJson[]; news: NewsJson[]; newsImages: Record<string, Record<string, unknown>>; roundups: RoundupJson[];
};

/** The topic each article category belongs to (copied from src/data/articles.ts; the site derives it the same way). */
export const TOPIC_BY_CAT: Record<string, string> = {
  "Start here": "freelancing", Freelancers: "freelancing", Writing: "writing", Comparison: "comparisons", Design: "design", "Small business": "business", Websites: "websites",
  Hosting: "websites", Students: "students", "AI for developers": "developers", "AI productivity": "productivity", "Image and video": "imagevideo", "Beginner guides": "beginners",
  "AI research": "research", "AI automation": "automation", "AI marketing": "marketing", "AI security and privacy": "security", "AI for business": "business",
};
/** Articles without their own date share this one (PUBLISHED in src/data/articles.ts). */
export const DEFAULT_ARTICLE_DATE = "2026-10-29";

const parseAll = <T>(schema: z.ZodType<T>, items: unknown[], label: string, problems: string[]): T[] =>
  items.flatMap((x, i) => {
    const r = schema.safeParse(x);
    if (r.success) return [r.data];
    problems.push(...r.error.issues.map((e) => `${label}[${i}]${(x as { slug?: string })?.slug ? ` (${(x as { slug: string }).slug})` : ""}: ${e.path.join(".") || "(root)"}: ${e.message}`));
    return [];
  });

export function loadContent(root: string, catalogue: Source): ContentSource {
  const problems: string[] = [];
  const json = (rel: string) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8")) as unknown;
  const models = parseAll(modelSchema, json("content/models.json") as unknown[], "content/models.json", problems);
  const articles: Article[] = parseAll(articleSchema, json("content/articles.json") as unknown[], "content/articles.json", problems).map((a) => ({
    ...a, html: fs.readFileSync(path.join(root, "content/articles", `${a.slug}.html`), "utf8").replace(/\r\n/g, "\n"),
  }));
  const comparisons = parseAll(comparisonSchema, readExportedArray(path.join(root, "src/data/compare.ts"), "COMPARISONS"), "src/data/compare.ts", problems);
  const reviewsExtra = json("content/reviews-extra.json");
  const reviews = parseAll(reviewSchema, readExportedArray(path.join(root, "src/data/reviews.ts"), "REVIEWS", { extra: reviewsExtra }), "src/data/reviews.ts", problems);
  const news = parseAll(newsSchema, readExportedArray(path.join(root, "src/data/news.ts"), "NEWS"), "src/data/news.ts", problems);
  const roundups = parseAll(roundupSchema, readExportedArray(path.join(root, "src/data/roundups.ts"), "ROUNDUPS"), "src/data/roundups.ts", problems);
  const newsImages = json("content/news-images.json") as Record<string, Record<string, unknown>>;
  for (const [k, v] of Object.entries(newsImages)) if (!newsImageSchema.safeParse(v).success) problems.push(`content/news-images.json ${k}: not a valid image record`);

  // Cross references.
  const toolIds = new Set(catalogue.tools.map((t) => t.id));
  const topSlugs = new Set(catalogue.categories.map((c) => c.slug));
  const need = (ok: boolean, msg: string) => { if (!ok) problems.push(msg); };
  const dup = (label: string, xs: string[]) => { const s = new Set<string>(); for (const x of xs) { need(!s.has(x), `${label}: duplicate "${x}"`); s.add(x); } };
  dup("models", models.map((m) => m.id)); dup("articles", articles.map((a) => a.slug)); dup("comparisons", comparisons.map((c) => c.slug)); dup("reviews", reviews.map((r) => r.slug));
  dup("news", news.map((n) => n.slug)); dup("news urls", news.map((n) => n.url)); dup("roundups", roundups.map((r) => r.slug));
  const newsSlugs = new Set(news.map((n) => n.slug));
  const articleSlugs = new Set(articles.map((a) => a.slug));
  for (const m of models) {
    for (const t of m.tools) need(toolIds.has(t), `model ${m.id}: unknown tool "${t}"`);
    need(!m.news || newsSlugs.has(m.news), `model ${m.id}: unknown news item "${m.news}"`);
  }
  for (const a of articles) {
    need(a.cat in TOPIC_BY_CAT, `article ${a.slug}: category "${a.cat}" has no topic`);
    for (const m of a.html.matchAll(/data-aff="([a-z0-9-]+)"/g)) need(toolIds.has(m[1]), `article ${a.slug}: data-aff points at unknown tool "${m[1]}"`);
  }
  for (const c of comparisons) {
    need(articleSlugs.has(c.article), `comparison ${c.slug}: unknown article "${c.article}"`);
    for (const t of [c.leftTool, c.rightTool]) need(!t || toolIds.has(t), `comparison ${c.slug}: unknown tool "${t}"`);
    for (const r of c.rows) for (const x of [r.left, r.right]) if (typeof x !== "string") need(toolIds.has(x.price), `comparison ${c.slug}: price of unknown tool "${x.price}"`);
  }
  for (const r of reviews) need(toolIds.has(r.toolId), `review ${r.slug}: unknown tool "${r.toolId}"`);
  for (const n of news) {
    for (const t of n.tools ?? []) need(toolIds.has(t), `news ${n.slug}: unknown tool "${t}"`);
    need(!n.sameStoryAs || (newsSlugs.has(n.sameStoryAs) && n.sameStoryAs !== n.slug), `news ${n.slug}: bad sameStoryAs "${n.sameStoryAs}"`);
  }
  for (const k of Object.keys(newsImages)) need(newsSlugs.has(k), `content/news-images.json: "${k}" is not a news item`);
  for (const r of roundups) {
    need(topSlugs.has(r.category), `roundup ${r.slug}: unknown category "${r.category}"`);
    for (const p of r.picks) need(toolIds.has(p.id), `roundup ${r.slug}: unknown tool "${p.id}"`);
    need(new Set(r.picks.map((p) => p.id)).size === r.picks.length, `roundup ${r.slug}: a tool is picked twice`);
  }
  for (const t of catalogue.tools) need(!t.review || reviews.some((r) => r.slug === t.review && r.toolId === t.id), `tool ${t.id}: review "${t.review}" does not exist for it`);
  void slugify;
  if (problems.length) throw new SourceError(problems);
  return { models, articles, comparisons, reviews, news, newsImages, roundups };
}

export function countContent(c: ContentSource) {
  return {
    models: c.models.length, modelToolLinks: c.models.reduce((n, m) => n + m.tools.length, 0), articles: c.articles.length, comparisons: c.comparisons.length, reviews: c.reviews.length,
    newsItems: c.news.length, newsToolLinks: c.news.reduce((n, x) => n + (x.tools?.length ?? 0), 0), newsImages: Object.keys(c.newsImages).length, roundups: c.roundups.length,
    roundupPicks: c.roundups.reduce((n, r) => n + r.picks.length, 0), redirects: c.articles.length + 2,
  };
}
