// Imports models, articles, comparisons, reviews, news, roundups and the legacy redirects, and exports them back to their original shape.
// Same rules as the catalogue import (catalogue.ts): matched by slug, rewritten only when different, atomic, never deletes.
// Run it after the catalogue: everything here refers to tools.
import type { Sql } from "../db/client.ts";
import { canonical, importCatalogue, type GroupCount, type ImportResult } from "./catalogue.ts";
import { DEFAULT_ARTICLE_DATE, TOPIC_BY_CAT, type Article, type ComparisonJson, type ContentSource, type ModelJson, type NewsJson, type ReviewJson, type RoundupJson } from "./content-source.ts";
import { slugify, type Source } from "./source.ts";

/** A database row as the driver returns it; columns are read by name and cast where used. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export type ContentGroup = "models" | "articles" | "comparisons" | "reviews" | "news" | "roundups" | "redirects";
export type ContentImportResult = { dryRun: boolean; groups: Record<ContentGroup, GroupCount> };
class DryRunRollback extends Error {}

type Exported<T> = { key: string; sort: number; item: T };
export type ArticleItem = Omit<Article, "date" | "html"> & { date: string; html: string; topic: string; kind: "guide" | "comparison" };
export type NewsItemJson = NewsJson & { image?: Record<string, unknown> };
export type ContentExport = {
  models: Exported<ModelJson>[]; articles: Exported<ArticleItem>[]; comparisons: Exported<ComparisonJson>[]; reviews: Exported<ReviewJson>[]; news: Exported<NewsItemJson>[];
  roundups: Exported<RoundupJson>[]; redirects: Exported<{ from: string; to: string }>[];
};

const clean = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))) as Partial<T>;
const by = <T extends Row>(rows: T[], col: string) => {
  const m = new Map<string, T[]>();
  for (const r of rows) (m.get(String(r[col])) ?? m.set(String(r[col]), []).get(String(r[col]))!).push(r);
  return m;
};

/** What the files say, in the same shape the database exports. */
export function desired(src: ContentSource) {
  const comparisonArticles = new Set(src.comparisons.map((c) => c.article));
  const articles: ArticleItem[] = src.articles.map((a) => ({ ...a, date: a.date ?? DEFAULT_ARTICLE_DATE, topic: TOPIC_BY_CAT[a.cat], kind: comparisonArticles.has(a.slug) ? "comparison" : "guide" }));
  const news: NewsItemJson[] = src.news.map((n) => (src.newsImages[n.slug] ? { ...n, image: src.newsImages[n.slug] } : n));
  const redirects = [
    { from: "/about.html", to: "/about/" }, { from: "/disclosure.html", to: "/affiliate-disclosure/" },
    ...src.articles.map((a) => ({ from: `/${a.slug}.html`, to: `/${comparisonArticles.has(a.slug) ? "compare" : "blog"}/${a.slug}/` })),
  ];
  return { models: src.models, articles, comparisons: src.comparisons, reviews: src.reviews, news, roundups: src.roundups, redirects };
}

export async function exportContent(sql: Sql): Promise<ContentExport> {
  const toolSlug = new Map((await sql<Row[]>`select id, slug from tools`).map((r) => [String(r.id), r.slug as string]));
  const slugOf = (id: unknown) => (id === null || id === undefined ? undefined : toolSlug.get(String(id)));

  const modelRows = await sql<Row[]>`select m.*, c.name as company_name, n.slug as news_slug, m.released::text as released_t from models m join companies c on c.id = m.company_id left join news_items n on n.id = m.news_item_id order by m.sort_order, m.id`;
  const modelTools = by(await sql<Row[]>`select model_id, tool_id from model_tools order by model_id, position`, "model_id");
  const models = modelRows.map((m) => ({
    key: m.slug as string, sort: m.sort_order as number,
    item: { id: m.slug, name: m.name, company: m.company_name, ...clean({ released: m.released_t, details: m.details }), summary: m.summary, licence: m.licence,
      tools: (modelTools.get(String(m.id)) ?? []).map((r) => slugOf(r.tool_id)), toolNote: m.tool_note, ...clean({ news: m.news_slug }), sources: m.sources } as unknown as ModelJson,
  }));

  const articleRows = await sql<Row[]>`select b.*, b.published_at::date::text as published_t from blog_posts b order by b.sort_order, b.id`;
  const articles = articleRows.map((a) => ({
    key: a.slug as string, sort: a.sort_order as number,
    item: { slug: a.slug, title: a.title, description: a.description, icon: a.icon, cat: a.category_label, blurb: a.blurb, ...clean({ region: a.region }), date: a.published_t, html: a.body_html, topic: a.topic, kind: a.kind } as unknown as ArticleItem,
  }));
  const postSlug = new Map(articleRows.map((a) => [String(a.id), a.slug as string]));

  const cmpRows = await sql<Row[]>`select * from comparisons order by sort_order, id`;
  const comparisons = cmpRows.map((c) => ({
    key: c.slug as string, sort: c.sort_order as number,
    item: { slug: c.slug, article: postSlug.get(String(c.blog_post_id)), leftLabel: c.left_label, rightLabel: c.right_label, ...clean({ leftTool: slugOf(c.left_tool_id), rightTool: slugOf(c.right_tool_id) }), rows: c.rows } as unknown as ComparisonJson,
  }));

  const reviewRows = await sql<Row[]>`select * from reviews order by sort_order, id`;
  const reviews = reviewRows.map((r) => ({
    key: r.slug as string, sort: r.sort_order as number,
    item: { method: r.method, slug: r.slug, toolId: slugOf(r.tool_id), title: r.title, summary: r.summary, useCases: r.use_cases, pros: r.pros, cons: r.cons, bestFor: r.best_for, skipIf: r.skip_if, pricingNote: r.pricing_note, verdict: r.verdict } as unknown as ReviewJson,
  }));

  const newsRows = await sql<Row[]>`select n.*, s.name as source_name, o.slug as same_slug, n.published_on::text as date_t from news_items n join news_sources s on s.id = n.source_id left join news_items o on o.id = n.same_story_as_id order by n.sort_order, n.id`;
  const newsTools = by(await sql<Row[]>`select news_item_id, tool_id from news_tools order by news_item_id, position`, "news_item_id");
  const news = newsRows.map((n) => ({
    key: n.slug as string, sort: n.sort_order as number,
    item: { slug: n.slug, kind: n.kind, importance: n.importance, title: n.title, date: n.date_t, source: n.source_name, url: n.source_url, tag: n.tag, summary: n.summary,
      ...clean({ tools: (newsTools.get(String(n.id)) ?? []).map((r) => slugOf(r.tool_id)), dateFromUrl: n.date_from_url ? true : undefined }), matters: n.matters, ...clean({ sameStoryAs: n.same_slug, image: n.image }) } as unknown as NewsItemJson,
  }));

  const rdRows = await sql<Row[]>`select r.*, c.slug as category_slug from roundups r left join categories c on c.id = r.category_id order by r.sort_order, r.id`;
  const picks = by(await sql<Row[]>`select * from roundup_picks order by roundup_id, position`, "roundup_id");
  const roundups = rdRows.map((r) => ({
    key: r.slug as string, sort: r.sort_order as number,
    item: { slug: r.slug, title: r.title, category: r.category_slug, description: r.description, intro: r.intro, criteria: r.criteria,
      picks: (picks.get(String(r.id)) ?? []).map((p) => ({ id: slugOf(p.tool_id), badge: p.badge, why: p.why })), ...clean({ note: r.note }) } as unknown as RoundupJson,
  }));

  const redirects = (await sql<Row[]>`select from_path, to_path from redirects order by id`).map((r, i) => ({ key: r.from_path as string, sort: i + 1, item: { from: r.from_path as string, to: r.to_path as string } }));
  return { models, articles, comparisons, reviews, news, roundups, redirects };
}

// ---------------------------------------------------------------------------------------------------------------------------------
const zero = (): GroupCount => ({ inserted: 0, updated: 0, unchanged: 0 });

export async function importContent(sql: Sql, src: ContentSource, options: { dryRun?: boolean } = {}): Promise<ContentImportResult> {
  const want = desired(src);
  const result: ContentImportResult = { dryRun: !!options.dryRun, groups: { models: zero(), articles: zero(), comparisons: zero(), reviews: zero(), news: zero(), roundups: zero(), redirects: zero() } };
  try {
    await sql.begin(async (txRaw) => {
      const tx = txRaw as unknown as Sql;
      const have = await exportContent(tx);
      const idOf = async (table: string, col = "slug") => new Map((await tx.unsafe<Row[]>(`select id, ${col} as k from ${table}`)).map((r) => [r.k as string, r.id as string]));
      const toolId = await idOf("tools");
      const T = (slug: string) => toolId.get(slug)!;
      /** Decide what to do with one item: "new", "changed" (data or position) or "same", and count it. */
      const decide = (group: ContentGroup, key: string, item: unknown, idx: number, existing: Exported<unknown>[]) => {
        const e = existing.find((x) => x.key === key);
        const state = !e ? "new" : (group !== "redirects" && e.sort !== idx + 1) || canonical(e.item) !== canonical(item) ? "changed" : "same";
        result.groups[group][state === "new" ? "inserted" : state === "changed" ? "updated" : "unchanged"]++;
        return state;
      };

      // News (models point at it, so it comes first).
      const sourceId = await idOf("news_sources", "lower(name)");
      for (const name of new Set(src.news.map((n) => n.source))) {
        if (!sourceId.has(name.toLowerCase())) {
          const [r] = await tx<Row[]>`insert into news_sources (name) values (${name}) returning id`;
          sourceId.set(name.toLowerCase(), r.id);
        }
      }
      const newsId = await idOf("news_items");
      for (const [i, n] of want.news.entries()) {
        const state = decide("news", n.slug, n, i, have.news);
        if (state === "same") continue;
        const row = {
          kind: n.kind, tag: n.tag, importance: n.importance, title: n.title, published_on: n.date, date_from_url: n.dateFromUrl === true, source_id: sourceId.get(n.source.toLowerCase()),
          source_url: n.url, summary: n.summary, matters: n.matters, image: n.image ? tx.json(n.image as never) : null, sort_order: i + 1,
        };
        if (state === "new") {
          const [r] = await tx<Row[]>`insert into news_items ${tx({ slug: n.slug, ...row, status: "published", published_at: `${n.date}T00:00:00Z` } as never)} returning id`;
          newsId.set(n.slug, r.id);
        } else await tx`update news_items set ${tx(row as never)} where id = ${newsId.get(n.slug)!}`;
      }
      for (const n of want.news) {
        const id = newsId.get(n.slug)!;
        await tx`update news_items set same_story_as_id = ${n.sameStoryAs ? newsId.get(n.sameStoryAs)! : null} where id = ${id} and same_story_as_id is distinct from ${n.sameStoryAs ? newsId.get(n.sameStoryAs)! : null}`;
        const current = (await tx<Row[]>`select tool_id from news_tools where news_item_id = ${id} order by position`).map((r) => String(r.tool_id));
        const wanted = (n.tools ?? []).map((t) => String(T(t)));
        if (canonical(current) !== canonical(wanted)) {
          await tx`delete from news_tools where news_item_id = ${id}`;
          for (const [i, t] of (n.tools ?? []).entries()) await tx`insert into news_tools (news_item_id, tool_id, position) values (${id}, ${T(t)}, ${i + 1})`;
        }
      }

      // Articles, and the tools each links to (derived from its data-aff buttons, as the site does).
      const postId = await idOf("blog_posts");
      for (const [i, a] of want.articles.entries()) {
        const state = decide("articles", a.slug, a, i, have.articles);
        if (state === "same") continue;
        const row = { kind: a.kind, topic: a.topic, title: a.title, description: a.description, blurb: a.blurb, icon: a.icon, category_label: a.cat, region: a.region ?? null, body_html: a.html, sort_order: i + 1 };
        if (state === "new") {
          const [r] = await tx<Row[]>`insert into blog_posts ${tx({ slug: a.slug, ...row, status: "published", published_at: `${a.date}T00:00:00Z` } as never)} returning id`;
          postId.set(a.slug, r.id);
        } else await tx`update blog_posts set ${tx({ ...row, published_at: `${a.date}T00:00:00Z` } as never)} where id = ${postId.get(a.slug)!}`;
      }
      for (const a of want.articles) {
        const id = postId.get(a.slug)!;
        const mentioned = [...new Set([...a.html.matchAll(/data-aff="([a-z0-9-]+)"/g)].map((m) => m[1]))];
        const current = (await tx<Row[]>`select tool_id from blog_post_tools where post_id = ${id}`).map((r) => String(r.tool_id)).sort();
        const wanted = mentioned.map((t) => String(T(t))).sort();
        if (canonical(current) !== canonical(wanted)) {
          await tx`delete from blog_post_tools where post_id = ${id}`;
          for (const t of mentioned) await tx`insert into blog_post_tools (post_id, tool_id) values (${id}, ${T(t)})`;
        }
      }

      const cmpId = await idOf("comparisons");
      for (const [i, c] of want.comparisons.entries()) {
        const state = decide("comparisons", c.slug, c, i, have.comparisons);
        if (state === "same") continue;
        const row = { blog_post_id: postId.get(c.article)!, left_label: c.leftLabel, right_label: c.rightLabel, left_tool_id: c.leftTool ? T(c.leftTool) : null, right_tool_id: c.rightTool ? T(c.rightTool) : null, rows: tx.json(c.rows as never), sort_order: i + 1 };
        if (state === "new") await tx`insert into comparisons ${tx({ slug: c.slug, ...row, status: "published" } as never)}`;
        else await tx`update comparisons set ${tx(row as never)} where id = ${cmpId.get(c.slug)!}`;
      }

      const reviewId = await idOf("reviews");
      for (const [i, r] of want.reviews.entries()) {
        const state = decide("reviews", r.slug, r, i, have.reviews);
        if (state === "same") continue;
        const row = { tool_id: T(r.toolId), title: r.title, summary: r.summary, best_for: r.bestFor, skip_if: r.skipIf, pricing_note: r.pricingNote, verdict: r.verdict, use_cases: r.useCases, pros: r.pros, cons: r.cons, method: r.method, sort_order: i + 1 };
        if (state === "new") await tx`insert into reviews ${tx({ slug: r.slug, ...row, status: "published" } as never)}`;
        else await tx`update reviews set ${tx(row as never)} where id = ${reviewId.get(r.slug)!}`;
      }

      // Models: the company is named, not slugged, in models.json, so it is created when no tool has it as vendor.
      const companyId = await idOf("companies");
      const modelId = await idOf("models");
      for (const [i, m] of want.models.entries()) {
        const state = decide("models", m.id, m, i, have.models);
        let cid = companyId.get(slugify(m.company));
        if (!cid) {
          const [r] = await tx<Row[]>`insert into companies (slug, name, status) values (${slugify(m.company)}, ${m.company}, 'published') returning id`;
          cid = r.id as string;
          companyId.set(slugify(m.company), cid);
        }
        if (state === "same") continue;
        const row = { name: m.name, company_id: cid, released: m.released ?? null, summary: m.summary, licence: m.licence, tool_note: m.toolNote, details: m.details ?? [], sources: tx.json(m.sources as never), news_item_id: m.news ? newsId.get(m.news)! : null, sort_order: i + 1 };
        if (state === "new") {
          const [r] = await tx<Row[]>`insert into models ${tx({ slug: m.id, ...row, status: "published" } as never)} returning id`;
          modelId.set(m.id, r.id);
        } else await tx`update models set ${tx(row as never)} where id = ${modelId.get(m.id)!}`;
        await tx`delete from model_tools where model_id = ${modelId.get(m.id)!}`;
        for (const [j, t] of m.tools.entries()) await tx`insert into model_tools (model_id, tool_id, position) values (${modelId.get(m.id)!}, ${T(t)}, ${j + 1})`;
      }

      const catId = await idOf("categories");
      const topCat = new Map((await tx<Row[]>`select id, slug from categories where parent_id is null`).map((r) => [r.slug as string, r.id as string]));
      void catId;
      const roundupId = await idOf("roundups");
      for (const [i, r] of want.roundups.entries()) {
        const state = decide("roundups", r.slug, r, i, have.roundups);
        if (state === "same") continue;
        const row = { title: r.title, description: r.description, category_id: topCat.get(r.category)!, intro: r.intro, criteria: r.criteria, note: r.note ?? null, sort_order: i + 1 };
        if (state === "new") {
          const [x] = await tx<Row[]>`insert into roundups ${tx({ slug: r.slug, ...row, status: "published" } as never)} returning id`;
          roundupId.set(r.slug, x.id);
        } else await tx`update roundups set ${tx(row as never)} where id = ${roundupId.get(r.slug)!}`;
        await tx`delete from roundup_picks where roundup_id = ${roundupId.get(r.slug)!}`;
        for (const [j, p] of r.picks.entries()) await tx`insert into roundup_picks (roundup_id, tool_id, position, badge, why) values (${roundupId.get(r.slug)!}, ${T(p.id)}, ${j + 1}, ${p.badge}, ${p.why})`;
      }

      for (const [i, r] of want.redirects.entries()) {
        const state = decide("redirects", r.from, r, i, have.redirects);
        if (state === "new") await tx`insert into redirects (from_path, to_path, status_code, reason) values (${r.from}, ${r.to}, 308, 'legacy .html address')`;
        else if (state === "changed") await tx`update redirects set to_path = ${r.to} where from_path = ${r.from}`;
      }
      if (options.dryRun) throw new DryRunRollback();
    });
  } catch (e) {
    if (!(e instanceof DryRunRollback)) throw e;
  }
  return result;
}

/**
 * The whole import in one transaction: catalogue first, then content. A dry run rolls everything back, so what it reports is exactly what a real run
 * would do, including on an empty database. (The inner imports open savepoints inside this transaction.)
 */
export async function importAll(sql: Sql, src: Source, content: ContentSource, options: { dryRun?: boolean } = {}) {
  let out!: { catalogue: ImportResult; content: ContentImportResult };
  try {
    await sql.begin(async (txRaw) => {
      const tx = txRaw as unknown as Sql;
      const catalogue = await importCatalogue(tx, src);
      const c = await importContent(tx, content);
      out = { catalogue: { ...catalogue, dryRun: !!options.dryRun }, content: { ...c, dryRun: !!options.dryRun } };
      if (options.dryRun) throw new DryRunRollback();
    });
  } catch (e) {
    if (!(e instanceof DryRunRollback)) throw e;
  }
  return out;
}
