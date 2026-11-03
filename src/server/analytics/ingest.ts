// Event ingest (docs/platform/06-analytics-statistics-verification.md section 1). Dormant: with `enabled` false nothing is read, parsed or stored.
// Privacy by construction: the schema has no field for a name, an e-mail address, an IP address, a user-agent string, search text or a browser identifier,
// the validator rejects any extra field, and the only things derived from the request (device class, country) are coarse and stored without the request.
import { createHmac } from "node:crypto";
import { z } from "zod";
import type { Sql } from "../db/client.ts";
import { consume } from "../auth/rate-limit.ts";

export const PATH_GROUPS = ["home", "tools", "tool", "category", "blog", "compare", "news", "reviews", "best", "ecosystem", "pricing", "other"] as const;
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80);
const pathGroup = z.enum(PATH_GROUPS);
const placement = z.string().regex(/^[a-z0-9_-]{1,40}$/);

export const eventSchema = z.discriminatedUnion("event", [
  z.object({ event: z.literal("page_view"), pathGroup }).strict(),
  z.object({ event: z.literal("tool_view"), tool: slug }).strict(),
  z.object({ event: z.literal("category_visit"), category: slug }).strict(),
  z.object({ event: z.literal("directory_search"), queryLength: z.number().int().min(0).max(500), resultCount: z.number().int().min(0).max(100000) }).strict(),
  z.object({ event: z.literal("outbound_official"), tool: slug, placement: placement.optional() }).strict(),
  z.object({ event: z.literal("outbound_affiliate"), tool: slug, placement: placement.optional() }).strict(),
  z.object({ event: z.literal("submission_created") }).strict(),
]);
export type AnalyticsEvent = z.infer<typeof eventSchema>;

export type IngestContext = {
  enabled: boolean;
  userAgent?: string;
  /** Two-letter country from the hosting platform's coarse location header. */
  country?: string;
  /** Used only to rate limit and, if visitorHash is on, to count unique visitors. Never stored as is. */
  ip?: string;
  salt?: string;
  /** Decision D-07: off unless explicitly enabled. */
  visitorHash?: boolean;
  now?: Date;
};
export type IngestStatus = "disabled" | "invalid" | "bot" | "rate_limited" | "stored" | "error";

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|uptime|curl|wget|python|java\/|go-http|node-fetch|axios|okhttp|libwww|scrapy|httpclient/i;
export const isBot = (ua: string | undefined) => !ua || ua.length < 10 || BOT.test(ua);
export const deviceClassOf = (ua: string): "mobile" | "tablet" | "desktop" => (/ipad|tablet|kindle|silk/i.test(ua) ? "tablet" : /mobi|android|iphone|ipod/i.test(ua) ? "mobile" : "desktop");

/** A daily-rotating, salted, one-way hash. Cannot be reversed or linked across days. */
export const visitorHashOf = (ip: string, ua: string, salt: string, day: string) => createHmac("sha256", `${salt}|${day}`).update(`${ip}|${ua}`).digest("hex").slice(0, 32);

/** Validate and store one event. Never throws, never returns detail about why: the page that sent it must not be affected or informed. */
export async function ingestEvent(sql: Sql, input: unknown, ctx: IngestContext): Promise<IngestStatus> {
  if (!ctx.enabled) return "disabled";
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return "invalid";
  if (isBot(ctx.userAgent)) return "bot";
  try {
    if (ctx.ip && ctx.salt) {
      const r = await consume(sql, ctx.ip, "analytics.event", { limit: 120, windowSeconds: 60 }, { salt: ctx.salt, at: ctx.now });
      if (!r.allowed) return "rate_limited";
    }
    const e = parsed.data;
    const toolSlug = "tool" in e ? e.tool : null;
    const categorySlug = "category" in e ? e.category : null;
    const [ids] = await sql<{ tool_id: number | null; category_id: number | null }[]>`
      select (select id from tools where slug = ${toolSlug} and status = 'published' and deleted_at is null) as tool_id,
             (select id from categories where slug = ${categorySlug} and parent_id is null and status = 'published' and deleted_at is null) as category_id`;
    if ((toolSlug && !ids.tool_id) || (categorySlug && !ids.category_id)) return "invalid"; // unknown ids are dropped, not stored
    const now = ctx.now ?? new Date();
    const country = ctx.country && /^[A-Z]{2}$/.test(ctx.country) ? ctx.country : null;
    const visitor = ctx.visitorHash && ctx.salt && ctx.ip && ctx.userAgent ? visitorHashOf(ctx.ip, ctx.userAgent, ctx.salt, now.toISOString().slice(0, 10)) : null;
    await sql`
      insert into analytics_events (occurred_at, event, path_group, tool_id, category_id, query_length, result_count, placement, device_class, country, visitor_hash)
      values (${now}, ${e.event}::analytics_event_name, ${e.event === "page_view" ? e.pathGroup : e.event === "tool_view" ? "tool" : e.event === "category_visit" ? "category" : ""},
        ${ids.tool_id ?? null}, ${ids.category_id ?? null}, ${e.event === "directory_search" ? e.queryLength : null}, ${e.event === "directory_search" ? e.resultCount : null},
        ${"placement" in e ? (e.placement ?? null) : null}, ${deviceClassOf(ctx.userAgent!)}::device_class, ${country}, ${visitor})`;
    return "stored";
  } catch {
    return "error";
  }
}
