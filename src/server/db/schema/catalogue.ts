// Companies, categories, tools, pricing, sources and verification history (docs/platform/02-database.md section 3.1).
import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, numeric, pgTable, primaryKey, smallint, text, timestamp, unique, uniqueIndex } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { fkCol, HTTPS_PATTERN, pk, slug } from "./columns.ts";
import { contentColumns, publishedHasDate, slugFormat } from "./content.ts";
import { categoryCover, openSourceStatus, planAudience, pricingModel, pricingStatus, productStatus, sourceType, verificationStatus } from "./enums.ts";
import { teamMembers } from "./team.ts";

const https = (col: unknown) => sql`${col} ~ ${sql.raw(`'${HTTPS_PATTERN}'`)}`;

export const companies = pgTable(
  "companies",
  {
    id: pk(),
    slug: slug(),
    name: text("name").notNull(),
    website: text("website"),
    ...contentColumns(),
  },
  (t) => [
    unique("companies_slug_key").on(t.slug),
    uniqueIndex("companies_name_key").on(sql`lower(${t.name})`),
    slugFormat("companies", t.slug),
    publishedHasDate("companies", t.status, t.publishedAt),
    check("companies_website_https", sql`${t.website} is null or ${https(t.website)}`),
  ],
);

/** Top-level categories (parent_id null) and their subcategories (parent_id set). Depth is limited to two levels by a trigger. */
export const categories = pgTable(
  "categories",
  {
    id: pk(),
    slug: slug(),
    parentId: fkCol("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
    label: text("label").notNull(),
    shortLabel: text("short_label").notNull().default(""),
    blurb: text("blurb").notNull().default(""),
    cover: categoryCover("cover"),
    sortOrder: integer("sort_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    ...contentColumns(),
  },
  (t) => [
    // Slugs are unique among top-level categories, and unique within one parent for subcategories. Two subcategories under different
    // parents may share a slug (the real data has "generation" and "inference" twice), and a subcategory may reuse its parent's slug.
    uniqueIndex("categories_top_slug_key").on(t.slug).where(sql`${t.parentId} is null`),
    uniqueIndex("categories_child_slug_key").on(t.parentId, t.slug).where(sql`${t.parentId} is not null`),
    index("categories_parent_idx").on(t.parentId),
    index("categories_visible_idx").on(t.isVisible, t.sortOrder),
    slugFormat("categories", t.slug),
    publishedHasDate("categories", t.status, t.publishedAt),
    check("categories_top_has_cover", sql`${t.parentId} is not null or ${t.cover} is not null`),
  ],
);

export const tools = pgTable(
  "tools",
  {
    id: pk(),
    /** Equals today's tool id, so every URL and every affiliate key carries over. Immutable; a rename goes to `redirects`. */
    slug: slug(),
    name: text("name").notNull(),
    companyId: fkCol("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
    primaryCategoryId: fkCol("primary_category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
    subcategoryId: fkCol("subcategory_id").references(() => categories.id, { onDelete: "restrict" }),
    productStatus: productStatus("product_status").notNull().default("active"),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    websiteUrl: text("website_url").notNull(),
    hue: smallint("hue").notNull().default(210),
    platforms: text("platforms").array().notNull().default(sql`'{}'::text[]`),
    aliases: text("aliases").array().notNull().default(sql`'{}'::text[]`),
    keyFeature: text("key_feature"),
    logoSite: text("logo_site"),
    isFeatured: boolean("is_featured").notNull().default(false),
    openSourceStatus: openSourceStatus("open_source_status"),
    openSourceNote: text("open_source_note"),
    openSourceSource: text("open_source_source"),
    addedOn: date("added_on").notNull().defaultNow(),

    features: text("features").array().notNull().default(sql`'{}'::text[]`),
    useCases: text("use_cases").array().notNull().default(sql`'{}'::text[]`),
    audience: text("audience").array().notNull().default(sql`'{}'::text[]`),
    strengths: text("strengths").array().notNull().default(sql`'{}'::text[]`),
    limitations: text("limitations").array().notNull().default(sql`'{}'::text[]`),
    /** The researched profile (headline, capabilities, featureCards...). Validated by Zod on every write. */
    profile: jsonb("profile"),

    // Pricing summary: the latest human-approved state. Plans are rows in pricing_plans.
    pricingStatus: pricingStatus("pricing_status").notNull().default("unverified"),
    pricingModel: pricingModel("pricing_model").notNull().default("unknown"),
    pricingCheckedAt: date("pricing_checked_at"),
    pricingSourceUrl: text("pricing_source_url"),
    pricingRegionalNote: text("pricing_regional_note"),
    pricingFree: jsonb("pricing_free"),
    pricingApi: jsonb("pricing_api"),
    pricingTrial: text("pricing_trial"),
    pricingReference: jsonb("pricing_reference"),
    pricingNotes: text("pricing_notes").array().notNull().default(sql`'{}'::text[]`),

    // Verification summary: the latest human verification. History is in verification_checks.
    verificationStatus: verificationStatus("verification_status").notNull().default("partial"),
    verifiedAt: date("verified_at"),
    /** The date shown as "verified" in listings (field `verified` in the tool JSON); equals verified_at for most tools but not all. */
    catalogVerifiedOn: date("catalog_verified_on"),
    officialUrl: text("official_url"),
    pricingUrl: text("pricing_url"),
    verificationMethod: text("verification_method"),
    verificationNotes: text("verification_notes"),
    ...contentColumns(),
  },
  (t) => [
    unique("tools_slug_key").on(t.slug),
    index("tools_state_idx").on(t.status, t.deletedAt),
    index("tools_company_idx").on(t.companyId),
    index("tools_primary_category_idx").on(t.primaryCategoryId),
    index("tools_subcategory_idx").on(t.subcategoryId),
    index("tools_pricing_status_idx").on(t.pricingStatus),
    index("tools_verification_status_idx").on(t.verificationStatus),
    index("tools_aliases_idx").using("gin", t.aliases),
    slugFormat("tools", t.slug),
    publishedHasDate("tools", t.status, t.publishedAt),
    check("tools_website_https", https(t.websiteUrl)),
    check("tools_official_https", sql`${t.officialUrl} is null or ${https(t.officialUrl)}`),
    check("tools_pricing_url_https", sql`${t.pricingUrl} is null or ${https(t.pricingUrl)}`),
    check("tools_pricing_source_https", sql`${t.pricingSourceUrl} is null or ${https(t.pricingSourceUrl)}`),
    check("tools_open_source_source_https", sql`${t.openSourceSource} is null or ${https(t.openSourceSource)}`),
    check("tools_hue_range", sql`${t.hue} between 0 and 360`),
    check("tools_name_not_blank", sql`length(btrim(${t.name})) > 0`),
    // A tool the site calls "verified" must have a plan on record and a date: enforced by the publish function; here only the cheap part.
    check("tools_verified_has_date", sql`${t.pricingStatus} <> 'verified' or ${t.pricingCheckedAt} is not null`),
  ],
);

/** Every category a tool appears in (the primary one included, a trigger keeps it present). */
export const toolCategories = pgTable(
  "tool_categories",
  {
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
    categoryId: fkCol("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
    /** Position in the tool's own list (field `categories` in the JSON); the primary category is listed too. */
    position: integer("position").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.toolId, t.categoryId] }), index("tool_categories_category_idx").on(t.categoryId)],
);

export const toolAlternatives = pgTable(
  "tool_alternatives",
  {
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
    alternativeToolId: fkCol("alternative_tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.toolId, t.alternativeToolId] }),
    index("tool_alternatives_alt_idx").on(t.alternativeToolId),
    check("tool_alternatives_not_self", sql`${t.toolId} <> ${t.alternativeToolId}`),
  ],
);

export const pricingPlans = pgTable(
  "pricing_plans",
  {
    id: pk(),
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    audience: planAudience("audience").notNull(),
    currency: text("currency").notNull(),
    unit: text("unit").notNull(),
    monthly: numeric("monthly", { precision: 12, scale: 2 }),
    annual: numeric("annual", { precision: 12, scale: 2 }),
    annualTotal: numeric("annual_total", { precision: 12, scale: 2 }),
    billing: text("billing"),
    isCustom: boolean("is_custom").notNull().default(false),
    highlights: text("highlights").array().notNull().default(sql`'{}'::text[]`),
    limits: text("limits").array().notNull().default(sql`'{}'::text[]`),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("pricing_plans_tool_position_key").on(t.toolId, t.position),
    index("pricing_plans_tool_idx").on(t.toolId),
    check("pricing_plans_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
    check("pricing_plans_amounts_non_negative", sql`coalesce(${t.monthly}, 0) >= 0 and coalesce(${t.annual}, 0) >= 0 and coalesce(${t.annualTotal}, 0) >= 0`),
    check("pricing_plans_position_positive", sql`${t.position} >= 1`),
  ],
);

export const toolSources = pgTable(
  "tool_sources",
  {
    id: pk(),
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(1),
    label: text("label").notNull(),
    url: text("url").notNull(),
    type: sourceType("type").notNull().default("other"),
    checkedAt: date("checked_at"),
  },
  (t) => [unique("tool_sources_tool_position_key").on(t.toolId, t.position), index("tool_sources_tool_idx").on(t.toolId), check("tool_sources_url_https", https(t.url))],
);

/** History of verification. Automated rows (automated = true) never change the status shown on the tool; only a human does. */
export const verificationChecks = pgTable(
  "verification_checks",
  {
    id: pk(),
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
    status: verificationStatus("status").notNull(),
    method: text("method").notNull().default(""),
    notes: text("notes").notNull().default(""),
    automated: boolean("automated").notNull().default(false),
    checkedBy: fkCol("checked_by").references(() => teamMembers.id, { onDelete: "set null" }),
  },
  (t) => [
    index("verification_checks_tool_idx").on(t.toolId, t.checkedAt.desc()),
    // A human check names its person; an automated one does not.
    check("verification_checks_actor", sql`(${t.automated} and ${t.checkedBy} is null) or (not ${t.automated})`),
  ],
);
