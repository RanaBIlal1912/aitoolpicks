// Media, redirects, settings, analytics and rate limits (docs/platform/02-database.md section 3.8).
import { sql } from "drizzle-orm";
import { bigint, char, check, date, index, integer, jsonb, pgTable, primaryKey, smallint, text, timestamp, unique } from "drizzle-orm/pg-core";
import { pk } from "./columns.ts";
import { contentColumns } from "./content.ts";
import { analyticsEventName, deviceClass, mediaKind, mediaStorage } from "./enums.ts";
import { categories, tools } from "./catalogue.ts";
import { teamMembers } from "./team.ts";

/** Files. Existing files stay in the repository's public/ folder (storage = repo); new uploads go to Supabase Storage. */
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: pk(),
    storage: mediaStorage("storage").notNull().default("repo"),
    /** Path inside public/ (repo) or inside the bucket (supabase). Never a full URL. */
    path: text("path").notNull(),
    kind: mediaKind("kind").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes"),
    width: integer("width"),
    height: integer("height"),
    sha256: char("sha256", { length: 64 }),
    altText: text("alt_text").notNull().default(""),
    credit: text("credit"),
    sourceUrl: text("source_url"),
    toolId: bigint("tool_id", { mode: "number" }).references(() => tools.id, { onDelete: "set null" }),
    ...contentColumns(),
  },
  (t) => [
    unique("media_assets_storage_path_key").on(t.storage, t.path),
    index("media_assets_tool_idx").on(t.toolId),
    index("media_assets_kind_idx").on(t.kind),
    index("media_assets_sha_idx").on(t.sha256),
    check("media_assets_path_relative", sql`${t.path} !~ '^[a-z]+://' and ${t.path} !~ '\\.\\.'`),
    check("media_assets_mime_format", sql`${t.mime} ~ '^[a-z]+/[a-z0-9.+-]+$'`),
    check("media_assets_sha_format", sql`${t.sha256} is null or ${t.sha256} ~ '^[0-9a-f]{64}$'`),
    check("media_assets_size_positive", sql`coalesce(${t.bytes}, 1) > 0 and coalesce(${t.width}, 1) > 0 and coalesce(${t.height}, 1) > 0`),
  ],
);

/** Renamed slugs and the legacy .html addresses. The build turns these into real permanent redirects. */
export const redirects = pgTable(
  "redirects",
  {
    id: pk(),
    fromPath: text("from_path").notNull(),
    toPath: text("to_path").notNull(),
    statusCode: smallint("status_code").notNull().default(308),
    reason: text("reason").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("redirects_from_key").on(t.fromPath),
    check("redirects_status", sql`${t.statusCode} in (301, 302, 307, 308)`),
    check("redirects_paths", sql`${t.fromPath} ~ '^/' and ${t.toPath} ~ '^/' and ${t.fromPath} <> ${t.toPath}`),
  ],
);

export const siteSettings = pgTable(
  "site_settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: bigint("updated_by", { mode: "number" }).references(() => teamMembers.id, { onDelete: "set null" }),
  },
  (t) => [check("site_settings_key_format", sql`${t.key} ~ '^[a-z][a-z0-9_.]*$'`)],
);

/** Raw events, kept 90 days. Contains no personal data: no IP, no search text, no identifiers stored in the browser. */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: pk(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    event: analyticsEventName("event").notNull(),
    pathGroup: text("path_group").notNull().default(""),
    toolId: bigint("tool_id", { mode: "number" }).references(() => tools.id, { onDelete: "set null" }),
    categoryId: bigint("category_id", { mode: "number" }).references(() => categories.id, { onDelete: "set null" }),
    /** Only the length of a search text is kept, never the text. */
    queryLength: smallint("query_length"),
    resultCount: integer("result_count"),
    placement: text("placement"),
    deviceClass: deviceClass("device_class"),
    country: char("country", { length: 2 }),
    /** Optional daily-rotating salted hash for unique-visitor counts; null unless decision D-07 enables it. */
    visitorHash: text("visitor_hash"),
  },
  (t) => [
    index("analytics_events_time_idx").on(t.occurredAt.desc()),
    index("analytics_events_event_idx").on(t.event, t.occurredAt.desc()),
    index("analytics_events_tool_idx").on(t.toolId, t.occurredAt.desc()),
    check("analytics_events_country_format", sql`${t.country} is null or ${t.country} ~ '^[A-Z]{2}$'`),
    check("analytics_events_query_length", sql`${t.queryLength} is null or ${t.queryLength} between 0 and 500`),
  ],
);

/** Nightly rollup of analytics_events. Reports read this table, never the raw rows. */
export const analyticsDaily = pgTable(
  "analytics_daily",
  {
    day: date("day").notNull(),
    event: analyticsEventName("event").notNull(),
    /** 0 when the event has no tool or category (the key must be non-null to be part of the primary key). */
    toolId: bigint("tool_id", { mode: "number" }).notNull().default(0),
    categoryId: bigint("category_id", { mode: "number" }).notNull().default(0),
    pathGroup: text("path_group").notNull().default(""),
    count: integer("count").notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.event, t.toolId, t.categoryId, t.pathGroup] }), index("analytics_daily_event_idx").on(t.event, t.day.desc()), check("analytics_daily_count", sql`${t.count} >= 0`)],
);

/** Short-lived counters for app-level rate limits (login per email, submissions per IP hash, admin writes per member). Pruned hourly. */
export const rateLimitHits = pgTable(
  "rate_limit_hits",
  {
    keyHash: text("key_hash").notNull(),
    route: text("route").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.keyHash, t.route, t.windowStart] }), index("rate_limit_hits_window_idx").on(t.windowStart), check("rate_limit_hits_count", sql`${t.count} >= 1`)],
);

