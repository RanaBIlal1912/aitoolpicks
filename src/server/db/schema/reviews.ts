// Reviews, hands-on testing records and evidence (docs/platform/02-database.md section 3.2). The rules mirror src/lib/review-trust.ts.
import { sql } from "drizzle-orm";
import { check, date, index, integer, jsonb, numeric, pgTable, text, unique } from "drizzle-orm/pg-core";
import { fkCol, HTTPS_PATTERN, pk, slug } from "./columns.ts";
import { contentColumns, publishedHasDate, slugFormat } from "./content.ts";
import { reviewMethod } from "./enums.ts";
import { tools } from "./catalogue.ts";
import { mediaAssets } from "./system.ts";
import { teamMembers } from "./team.ts";

export const reviews = pgTable(
  "reviews",
  {
    id: pk(),
    slug: slug(),
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    bestFor: text("best_for").notNull().default(""),
    skipIf: text("skip_if").notNull().default(""),
    pricingNote: text("pricing_note").notNull().default(""),
    verdict: text("verdict").notNull().default(""),
    useCases: text("use_cases").array().notNull().default(sql`'{}'::text[]`),
    pros: text("pros").array().notNull().default(sql`'{}'::text[]`),
    cons: text("cons").array().notNull().default(sql`'{}'::text[]`),
    /** Required on every review. "hands-on" needs a review_testing row (a deferred trigger enforces it). There is no score or rating column on purpose. */
    method: reviewMethod("method").notNull(),
    /** Who stands behind the page: a team member, or a free-text name such as "AI Tool Picks editors". */
    reviewerMemberId: fkCol("reviewer_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
    reviewerName: text("reviewer_name").notNull().default("AI Tool Picks editors"),
    /** When the facts on the page were last checked against the vendor's pages. */
    factsCheckedAt: date("facts_checked_at"),
    ...contentColumns(),
  },
  (t) => [
    unique("reviews_slug_key").on(t.slug),
    index("reviews_tool_idx").on(t.toolId),
    index("reviews_state_idx").on(t.status, t.method),
    slugFormat("reviews", t.slug),
    publishedHasDate("reviews", t.status, t.publishedAt),
    check("reviews_reviewer_named", sql`length(btrim(${t.reviewerName})) > 0`),
  ],
);

/** One row per hands-on review. A documentation review never has one. */
export const reviewTesting = pgTable(
  "review_testing",
  {
    reviewId: fkCol("review_id").primaryKey().references(() => reviews.id, { onDelete: "cascade" }),
    testedBy: text("tested_by").notNull(),
    role: text("role").notNull(),
    plan: text("plan").notNull(),
    region: text("region").notNull(),
    testedFrom: date("tested_from").notNull(),
    testedTo: date("tested_to").notNull(),
    hours: numeric("hours", { precision: 6, scale: 1 }),
    tasks: jsonb("tasks").notNull().default(sql`'[]'::jsonb`),
    worked: text("worked").array().notNull().default(sql`'{}'::text[]`),
    failed: text("failed").array().notNull().default(sql`'{}'::text[]`),
    notReproduced: text("not_reproduced").array().notNull().default(sql`'{}'::text[]`),
    /** An explicit statement even when the answer is "None". */
    conflicts: text("conflicts").notNull(),
  },
  (t) => [
    check("review_testing_dates_ordered", sql`${t.testedTo} >= ${t.testedFrom}`),
    check("review_testing_text_present", sql`length(btrim(${t.testedBy})) > 0 and length(btrim(${t.role})) > 0 and length(btrim(${t.plan})) > 0 and length(btrim(${t.region})) > 0 and length(btrim(${t.conflicts})) > 0`),
    check("review_testing_hours_positive", sql`${t.hours} is null or ${t.hours} > 0`),
    check("review_testing_tasks_array", sql`jsonb_typeof(${t.tasks}) = 'array' and jsonb_array_length(${t.tasks}) >= 1`),
    check("review_testing_has_worked_and_failed", sql`cardinality(${t.worked}) >= 1 and cardinality(${t.failed}) >= 1`),
  ],
);

export const reviewEvidence = pgTable(
  "review_evidence",
  {
    id: pk(),
    reviewId: fkCol("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url"),
    mediaAssetId: fkCol("media_asset_id").references(() => mediaAssets.id, { onDelete: "restrict" }),
    caption: text("caption"),
    altText: text("alt_text"),
    position: integer("position").notNull().default(1),
  },
  (t) => [
    index("review_evidence_review_idx").on(t.reviewId),
    check("review_evidence_label_present", sql`length(btrim(${t.label})) > 0`),
    check("review_evidence_url_https", sql`${t.url} is null or ${t.url} ~ ${sql.raw(`'${HTTPS_PATTERN}'`)}`),
    check("review_evidence_has_target", sql`${t.url} is not null or ${t.mediaAssetId} is not null`),
    check("review_evidence_screenshot_alt", sql`${t.mediaAssetId} is null or length(btrim(coalesce(${t.altText}, ''))) > 0`),
  ],
);
