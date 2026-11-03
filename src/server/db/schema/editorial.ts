// Authors, blog posts, comparisons, news (docs/platform/02-database.md section 3.3) and the best-of and model collections (section 3.4).
import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, pgTable, primaryKey, smallint, text, timestamp, unique, uniqueIndex } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { fkCol, HTTPS_PATTERN, pk, slug } from "./columns.ts";
import { contentColumns, publishedHasDate, slugFormat } from "./content.ts";
import { blogKind, blogTopic, newsKind, newsTag } from "./enums.ts";
import { categories, companies, tools } from "./catalogue.ts";
import { mediaAssets } from "./system.ts";
import { teamMembers } from "./team.ts";

const https = (col: unknown) => sql`${col} ~ ${sql.raw(`'${HTTPS_PATTERN}'`)}`;

export const authors = pgTable(
  "authors",
  {
    id: pk(),
    slug: slug(),
    name: text("name").notNull(),
    bio: text("bio").notNull().default(""),
    teamMemberId: fkCol("team_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
    ...contentColumns(),
  },
  (t) => [unique("authors_slug_key").on(t.slug), slugFormat("authors", t.slug), publishedHasDate("authors", t.status, t.publishedAt)],
);

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: pk(),
    slug: slug(),
    kind: blogKind("kind").notNull().default("guide"),
    topic: blogTopic("topic").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    blurb: text("blurb").notNull().default(""),
    icon: text("icon").notNull().default(""),
    /** The label shown on cards (the "cat" field in articles.json). */
    categoryLabel: text("category_label").notNull().default(""),
    /** Country the guide is written for (field `region` in articles.json), when it is not general. */
    region: text("region"),
    /** Position in the original file; the site keeps that order for items that share a date. */
    sortOrder: integer("sort_order").notNull().default(0),
    /** Sanitised HTML (decision D-13). Keeps the data-aff and data-price attributes the pages rely on. */
    bodyHtml: text("body_html").notNull(),
    authorId: fkCol("author_id").references(() => authors.id, { onDelete: "set null" }),
    featuredMediaId: fkCol("featured_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalOverride: text("canonical_override"),
    ...contentColumns(),
  },
  (t) => [
    unique("blog_posts_slug_key").on(t.slug),
    index("blog_posts_state_idx").on(t.status, t.publishedAt.desc()),
    index("blog_posts_topic_idx").on(t.topic),
    slugFormat("blog_posts", t.slug),
    publishedHasDate("blog_posts", t.status, t.publishedAt),
    check("blog_posts_canonical_https", sql`${t.canonicalOverride} is null or ${https(t.canonicalOverride)}`),
    check("blog_posts_body_present", sql`length(btrim(${t.bodyHtml})) > 0`),
  ],
);

export const blogPostTools = pgTable(
  "blog_post_tools",
  {
    postId: fkCol("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.toolId] }), index("blog_post_tools_tool_idx").on(t.toolId)],
);

export const comparisons = pgTable(
  "comparisons",
  {
    id: pk(),
    slug: slug(),
    blogPostId: fkCol("blog_post_id").notNull().references(() => blogPosts.id, { onDelete: "restrict" }),
    leftLabel: text("left_label").notNull(),
    /** Position in the original file; the site keeps that order for items that share a date. */
    sortOrder: integer("sort_order").notNull().default(0),
    rightLabel: text("right_label").notNull(),
    leftToolId: fkCol("left_tool_id").references(() => tools.id, { onDelete: "set null" }),
    rightToolId: fkCol("right_tool_id").references(() => tools.id, { onDelete: "set null" }),
    /** [{ label, left, right }] where a cell is text or { price: toolSlug }. */
    rows: jsonb("rows").notNull().default(sql`'[]'::jsonb`),
    ...contentColumns(),
  },
  (t) => [
    unique("comparisons_slug_key").on(t.slug),
    slugFormat("comparisons", t.slug),
    publishedHasDate("comparisons", t.status, t.publishedAt),
    check("comparisons_rows_array", sql`jsonb_typeof(${t.rows}) = 'array'`),
  ],
);

export const newsSources = pgTable(
  "news_sources",
  {
    id: pk(),
    name: text("name").notNull(),
    website: text("website"),
    isOfficial: boolean("is_official").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("news_sources_name_key").on(sql`lower(${t.name})`), check("news_sources_website_https", sql`${t.website} is null or ${https(t.website)}`)],
);

export const newsItems = pgTable(
  "news_items",
  {
    id: pk(),
    slug: slug(),
    kind: newsKind("kind").notNull(),
    tag: newsTag("tag").notNull(),
    importance: smallint("importance").notNull().default(1),
    title: text("title").notNull(),
    /** The source's own publication date. */
    publishedOn: date("published_on").notNull(),
    dateFromUrl: boolean("date_from_url").notNull().default(false),
    sourceId: fkCol("source_id").notNull().references(() => newsSources.id, { onDelete: "restrict" }),
    sourceUrl: text("source_url").notNull(),
    summary: text("summary").notNull(),
    matters: text("matters").notNull().default(""),
    /** Set when this item reports a story already listed under another item. */
    sameStoryAsId: fkCol("same_story_as_id").references((): AnyPgColumn => newsItems.id, { onDelete: "set null" }),
    /** Position in the original file; the site keeps that order for items that share a date. */
    sortOrder: integer("sort_order").notNull().default(0),
    sourceVerifiedAt: date("source_verified_at"),
    sourceVerifiedBy: fkCol("source_verified_by").references(() => teamMembers.id, { onDelete: "set null" }),
    image: jsonb("image"),
    ...contentColumns(),
  },
  (t) => [
    unique("news_items_slug_key").on(t.slug),
    unique("news_items_source_url_key").on(t.sourceUrl),
    index("news_items_state_idx").on(t.status, t.publishedOn.desc()),
    index("news_items_source_idx").on(t.sourceId),
    slugFormat("news_items", t.slug),
    publishedHasDate("news_items", t.status, t.publishedAt),
    check("news_items_importance_range", sql`${t.importance} between 1 and 3`),
    check("news_items_source_https", https(t.sourceUrl)),
    check("news_items_not_own_duplicate", sql`${t.sameStoryAsId} is null or ${t.sameStoryAsId} <> ${t.id}`),
  ],
);

export const newsTools = pgTable(
  "news_tools",
  {
    newsItemId: fkCol("news_item_id").notNull().references(() => newsItems.id, { onDelete: "cascade" }),
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.newsItemId, t.toolId] }), index("news_tools_tool_idx").on(t.toolId)],
);

export const roundups = pgTable(
  "roundups",
  {
    id: pk(),
    slug: slug(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    categoryId: fkCol("category_id").references(() => categories.id, { onDelete: "set null" }),
    intro: text("intro").array().notNull().default(sql`'{}'::text[]`),
    criteria: text("criteria").array().notNull().default(sql`'{}'::text[]`),
    /** Position in the original file; the site keeps that order for items that share a date. */
    sortOrder: integer("sort_order").notNull().default(0),
    note: text("note"),
    ...contentColumns(),
  },
  (t) => [unique("roundups_slug_key").on(t.slug), slugFormat("roundups", t.slug), publishedHasDate("roundups", t.status, t.publishedAt)],
);

export const roundupPicks = pgTable(
  "roundup_picks",
  {
    roundupId: fkCol("roundup_id").notNull().references(() => roundups.id, { onDelete: "cascade" }),
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    badge: text("badge").notNull(),
    why: text("why").notNull(),
  },
  (t) => [primaryKey({ columns: [t.roundupId, t.toolId] }), unique("roundup_picks_position_key").on(t.roundupId, t.position), index("roundup_picks_tool_idx").on(t.toolId), check("roundup_picks_position_positive", sql`${t.position} >= 1`)],
);

export const models = pgTable(
  "models",
  {
    id: pk(),
    slug: slug(),
    name: text("name").notNull(),
    companyId: fkCol("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
    released: date("released"),
    summary: text("summary").notNull(),
    licence: text("licence").notNull(),
    toolNote: text("tool_note").notNull().default(""),
    /** Position in the original file; the site keeps that order for items that share a date. */
    sortOrder: integer("sort_order").notNull().default(0),
    /** The news story that announced the model (field `news` in models.json). */
    newsItemId: fkCol("news_item_id").references(() => newsItems.id, { onDelete: "set null" }),
    details: text("details").array().notNull().default(sql`'{}'::text[]`),
    /** [{ label, url, checked }] */
    sources: jsonb("sources").notNull().default(sql`'[]'::jsonb`),
    ...contentColumns(),
  },
  (t) => [unique("models_slug_key").on(t.slug), index("models_company_idx").on(t.companyId), slugFormat("models", t.slug), publishedHasDate("models", t.status, t.publishedAt), check("models_sources_array", sql`jsonb_typeof(${t.sources}) = 'array'`)],
);

export const modelTools = pgTable(
  "model_tools",
  {
    modelId: fkCol("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.modelId, t.toolId] }), index("model_tools_tool_idx").on(t.toolId)],
);
