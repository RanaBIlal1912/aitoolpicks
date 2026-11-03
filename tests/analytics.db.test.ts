// Analytics: dormant by default, nothing personal stored, bad input dropped quietly, nightly rollup and retention, and the summary the admin page reads.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handleEventRequest, MAX_BODY_BYTES } from "../src/server/analytics/handler.ts";
import { deviceClassOf, ingestEvent, isBot, visitorHashOf, type IngestContext } from "../src/server/analytics/ingest.ts";
import { purgeRaw, rollupDaily, runNightly } from "../src/server/analytics/rollup.ts";
import { analyticsSummary } from "../src/server/analytics/summary.ts";
import type { Member } from "../src/server/auth/authorize.ts";
import { importAll } from "../src/server/import/content.ts";
import { loadContent } from "../src/server/import/content-source.ts";
import { loadSource } from "../src/server/import/source.ts";
import { freshDatabase, pg } from "./helpers/db.ts";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const UA_PHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const SALT = "a-long-enough-analytics-salt";
const member = (...p: string[]): Member => ({ id: 1, authUserId: "u", email: "m@example.com", displayName: "", role: "analyst", permissions: new Set(p), aal: "aal1" });

describe("pure helpers", () => {
  it("recognises bots and missing user agents, and classifies devices", () => {
    for (const ua of [undefined, "", "short", "Googlebot/2.1", "curl/8.0.1 (x86_64)", "HeadlessChrome/126", "Mozilla/5.0 (compatible; bingbot/2.0)", "python-requests/2.31", "Lighthouse"]) expect(isBot(ua), String(ua)).toBe(true);
    expect(isBot(UA)).toBe(false);
    expect(deviceClassOf(UA)).toBe("desktop");
    expect(deviceClassOf(UA_PHONE)).toBe("mobile");
    expect(deviceClassOf("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet");
  });

  it("the visitor hash is salted, daily, one-way and not the address", () => {
    const h = visitorHashOf("203.0.113.9", UA, SALT, "2026-11-03");
    expect(h).toMatch(/^[0-9a-f]{32}$/);
    expect(h).toBe(visitorHashOf("203.0.113.9", UA, SALT, "2026-11-03"));
    expect(h).not.toBe(visitorHashOf("203.0.113.9", UA, SALT, "2026-11-04"));
    expect(h).not.toBe(visitorHashOf("203.0.113.10", UA, SALT, "2026-11-03"));
    expect(h).not.toBe(visitorHashOf("203.0.113.9", UA, "another-long-enough-salt", "2026-11-03"));
    expect(h).not.toContain("203");
  });
});

describe.skipIf(!pg().available)("analytics", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  const on: IngestContext = { enabled: true, userAgent: UA, country: "PK", ip: "203.0.113.9", salt: SALT };
  const count = async () => Number((await db.sql`select count(*)::int n from analytics_events`)[0].n);
  const last = async () => (await db.sql`select * from analytics_events order by id desc limit 1`)[0];

  beforeAll(async () => {
    db = await freshDatabase();
    const cat = loadSource(process.cwd());
    await importAll(db.sql, cat, loadContent(process.cwd(), cat));
  }, 60_000);
  afterAll(async () => db?.drop());

  describe("dormant by default", () => {
    it("stores nothing, whatever arrives, when switched off", async () => {
      expect(await ingestEvent(db.sql, { event: "page_view", pathGroup: "home" }, { ...on, enabled: false })).toBe("disabled");
      expect(await ingestEvent(db.sql, "garbage", { ...on, enabled: false })).toBe("disabled");
      expect(await count()).toBe(0);
    });

    it("the request handler accepts and ignores events when switched off, without parsing them", async () => {
      const deps = { sql: db.sql, enabled: false };
      expect(await handleEventRequest(deps, { method: "POST", contentType: "application/json", body: "{not json" })).toEqual({ status: 204 });
      expect(await handleEventRequest(deps, { method: "POST", contentType: "application/json", body: JSON.stringify({ event: "page_view", pathGroup: "home" }), userAgent: UA })).toEqual({ status: 204 });
      expect(await count()).toBe(0);
    });
  });

  describe("what is stored", () => {
    it("keeps each kind of event with only its own fields", async () => {
      expect(await ingestEvent(db.sql, { event: "page_view", pathGroup: "blog" }, on)).toBe("stored");
      expect(await last()).toMatchObject({ event: "page_view", path_group: "blog", tool_id: null, device_class: "desktop", country: "PK", visitor_hash: null });
      expect(await ingestEvent(db.sql, { event: "tool_view", tool: "claude" }, { ...on, userAgent: UA_PHONE })).toBe("stored");
      expect(await last()).toMatchObject({ event: "tool_view", path_group: "tool", device_class: "mobile" });
      expect((await last()).tool_id).not.toBeNull();
      expect(await ingestEvent(db.sql, { event: "category_visit", category: "assistants" }, on)).toBe("stored");
      expect((await last()).category_id).not.toBeNull();
      expect(await ingestEvent(db.sql, { event: "outbound_affiliate", tool: "claude", placement: "hero-cta" }, on)).toBe("stored");
      expect(await last()).toMatchObject({ event: "outbound_affiliate", placement: "hero-cta" });
      expect(await ingestEvent(db.sql, { event: "outbound_official", tool: "claude" }, on)).toBe("stored");
      expect(await ingestEvent(db.sql, { event: "submission_created" }, on)).toBe("stored");
    });

    it("keeps only the length of a search, never its text", async () => {
      expect(await ingestEvent(db.sql, { event: "directory_search", queryLength: 12, resultCount: 7 }, on)).toBe("stored");
      expect(await last()).toMatchObject({ event: "directory_search", query_length: 12, result_count: 7 });
      expect(await ingestEvent(db.sql, { event: "directory_search", queryLength: 12, resultCount: 7, query: "my secret search" }, on)).toBe("invalid");
    });

    it("the table has no column that could hold a name, address, IP, user agent or search text", async () => {
      const cols = (await db.sql`select column_name from information_schema.columns where table_name = 'analytics_events' order by ordinal_position`).map((c) => c.column_name);
      expect(cols).toEqual(["id", "occurred_at", "event", "path_group", "tool_id", "category_id", "query_length", "result_count", "placement", "device_class", "country", "visitor_hash"]);
    });

    it("nothing about the request ends up in any stored value", async () => {
      const rows = JSON.stringify(await db.sql`select * from analytics_events`);
      expect(rows).not.toContain("203.0.113.9");
      expect(rows).not.toContain("Mozilla");
      expect(rows).not.toContain("secret search");
    });
  });

  describe("what is dropped", () => {
    it("unknown events, extra fields, bad values, unknown or unpublished tools and categories", async () => {
      const before = await count();
      for (const bad of [null, {}, { event: "nope" }, { event: "page_view" }, { event: "page_view", pathGroup: "admin" }, { event: "page_view", pathGroup: "home", ip: "1.2.3.4" }, { event: "tool_view", tool: "Not A Slug" }, { event: "tool_view", tool: "no-such-tool" }, { event: "category_visit", category: "no-such" }, { event: "outbound_official", tool: "claude", placement: "has spaces" }, { event: "directory_search", queryLength: -1, resultCount: 0 }, { event: "directory_search", queryLength: 9999, resultCount: 0 }, { event: "directory_search", queryLength: 1.5, resultCount: 0 }]) {
        expect(await ingestEvent(db.sql, bad, on), JSON.stringify(bad)).toBe("invalid");
      }
      await db.sql`update tools set status = 'archived' where slug = 'zapier'`;
      expect(await ingestEvent(db.sql, { event: "tool_view", tool: "zapier" }, on)).toBe("invalid");
      expect(await count()).toBe(before);
    });

    it("bots and requests without a user agent", async () => {
      const before = await count();
      expect(await ingestEvent(db.sql, { event: "page_view", pathGroup: "home" }, { ...on, userAgent: "Googlebot/2.1 (+http://www.google.com/bot.html)" })).toBe("bot");
      expect(await ingestEvent(db.sql, { event: "page_view", pathGroup: "home" }, { ...on, userAgent: undefined })).toBe("bot");
      expect(await count()).toBe(before);
    });

    it("an invalid country becomes empty rather than being stored", async () => {
      await ingestEvent(db.sql, { event: "page_view", pathGroup: "home" }, { ...on, country: "pk" });
      expect((await last()).country).toBeNull();
      await ingestEvent(db.sql, { event: "page_view", pathGroup: "home" }, { ...on, country: "<script>" });
      expect((await last()).country).toBeNull();
    });
  });

  describe("limits and the optional visitor count", () => {
    it("refuses the 121st event from one address in a minute", async () => {
      const at = new Date("2026-11-03T10:00:30Z");
      const r: string[] = [];
      for (let i = 0; i < 122; i++) r.push(await ingestEvent(db.sql, { event: "page_view", pathGroup: "home" }, { ...on, ip: "198.51.100.7", now: at }));
      expect(r.filter((x) => x === "stored")).toHaveLength(120);
      expect(r.slice(120)).toEqual(["rate_limited", "rate_limited"]);
      expect(await ingestEvent(db.sql, { event: "page_view", pathGroup: "home" }, { ...on, ip: "198.51.100.8", now: at })).toBe("stored");
    });

    it("stores a visitor hash only when asked, one per day and address", async () => {
      await ingestEvent(db.sql, { event: "page_view", pathGroup: "home" }, { ...on, visitorHash: true, ip: "192.0.2.1", now: new Date("2026-11-03T09:00:00Z") });
      const a = (await last()).visitor_hash;
      await ingestEvent(db.sql, { event: "page_view", pathGroup: "home" }, { ...on, visitorHash: true, ip: "192.0.2.1", now: new Date("2026-11-03T21:00:00Z") });
      const b = (await last()).visitor_hash;
      await ingestEvent(db.sql, { event: "page_view", pathGroup: "home" }, { ...on, visitorHash: true, ip: "192.0.2.1", now: new Date("2026-11-04T09:00:00Z") });
      const c = (await last()).visitor_hash;
      expect(a).toMatch(/^[0-9a-f]{32}$/);
      expect(b).toBe(a);
      expect(c).not.toBe(a);
      expect(a).not.toContain("192");
    });
  });

  describe("the request handler", () => {
    const deps = () => ({ sql: db.sql, enabled: true, salt: SALT, siteOrigin: "https://example.com" });
    const post = (body: unknown, extra: Partial<Parameters<typeof handleEventRequest>[1]> = {}) =>
      handleEventRequest(deps(), { method: "POST", contentType: "application/json", body: typeof body === "string" ? body : JSON.stringify(body), userAgent: UA, ip: "192.0.2.50", origin: "https://example.com", ...extra });

    it("answers by the rules and keeps only good events", async () => {
      const before = await count();
      expect(await post({ event: "page_view", pathGroup: "news" })).toEqual({ status: 204 });
      expect(await count()).toBe(before + 1);
      expect(await post({ event: "page_view", pathGroup: "news" }, { contentType: "text/plain;charset=UTF-8" })).toEqual({ status: 204 }); // what sendBeacon sends
      expect(await handleEventRequest(deps(), { method: "GET", body: "" })).toEqual({ status: 405 });
      expect(await post({ event: "page_view", pathGroup: "news" }, { contentType: "text/html" })).toEqual({ status: 415 });
      expect(await post("x".repeat(MAX_BODY_BYTES + 1))).toEqual({ status: 413 });
      expect(await post({ event: "page_view", pathGroup: "news" }, { origin: "https://evil.example.net" })).toEqual({ status: 403 });
      expect(await post("{broken")).toEqual({ status: 400 });
      const mid = await count();
      expect(await post({ event: "page_view", pathGroup: "admin" })).toEqual({ status: 204 }); // a dropped event looks the same as a kept one
      expect(await count()).toBe(mid);
    });
  });

  describe("nightly rollup and retention", () => {
    const put = async (day: string, n: number, event = "page_view", group = "home", toolSlug: string | null = null) => {
      for (let i = 0; i < n; i++) {
        await db.sql`insert into analytics_events (occurred_at, event, path_group, tool_id) values (${`${day}T12:00:00Z`}, ${event}::analytics_event_name, ${group}, ${toolSlug ? db.sql`(select id from tools where slug = ${toolSlug})` : null})`;
      }
    };
    beforeAll(async () => {
      await db.sql`delete from analytics_events`;
      await db.sql`delete from rate_limit_hits`;
      await put("2026-08-01", 3);
      await put("2026-10-30", 4);
      await put("2026-10-30", 2, "tool_view", "tool", "claude");
      await put("2026-11-02", 5);
      await put("2026-11-03", 7);
    });

    it("rolls up every finished day, leaves today alone, and is repeatable", async () => {
      const r = await rollupDaily(db.sql, { today: "2026-11-03" });
      expect(r.days).toBe(3);
      const rows = await db.sql`select day::text d, event::text e, path_group g, tool_id::int t, count from analytics_daily order by day, event`;
      expect(rows.map((x) => `${x.d} ${x.e} ${x.g} ${x.t > 0 ? "tool" : "-"} ${x.count}`)).toEqual([
        "2026-08-01 page_view home - 3",
        "2026-10-30 page_view home - 4",
        "2026-10-30 tool_view tool tool 2",
        "2026-11-02 page_view home - 5",
      ]);
      await rollupDaily(db.sql, { today: "2026-11-03" });
      expect((await db.sql`select sum(count)::int n from analytics_daily`)[0].n).toBe(14);
      await rollupDaily(db.sql, { today: "2026-11-03", includeToday: true });
      expect((await db.sql`select sum(count)::int n from analytics_daily where day = '2026-11-03'`)[0].n).toBe(7);
    });

    it("never deletes a day that has not been rolled up, or one inside the retention period", async () => {
      await put("2026-07-01", 2); // old, but never rolled up
      expect(await purgeRaw(db.sql, { today: "2026-11-03" })).toBe(3); // only 2026-08-01 (rolled up, older than 90 days)
      expect((await db.sql`select count(*)::int n from analytics_events where occurred_at::date = '2026-07-01'`)[0].n).toBe(2);
      expect((await db.sql`select count(*)::int n from analytics_events where occurred_at::date >= '2026-10-30'`)[0].n).toBe(18);
    });

    it("keeps the totals of days whose raw events are gone, even when the job runs again", async () => {
      await runNightly(db.sql, { today: "2026-11-03" });
      expect((await db.sql`select count from analytics_daily where day = '2026-08-01'`)[0].count).toBe(3);
      expect((await db.sql`select count(*)::int n from analytics_events where occurred_at::date = '2026-08-01'`)[0].n).toBe(0);
      // the day that had no daily rows is rolled up now, and only then becomes eligible
      expect((await db.sql`select count from analytics_daily where day = '2026-07-01'`)[0].count).toBe(2);
      expect((await db.sql`select count(*)::int n from analytics_events where occurred_at::date = '2026-07-01'`)[0].n).toBe(0);
    });
  });

  describe("the summary for the admin page", () => {
    it("is for people with analytics:read only", async () => {
      await expect(analyticsSummary(db.sql, member("tools:read"), { today: "2026-11-03" })).rejects.toMatchObject({ status: 403 });
    });

    it("totals, top tools, path groups and the daily series for the window", async () => {
      const s = await analyticsSummary(db.sql, member("analytics:read"), { today: "2026-11-03", days: 7 });
      expect(s.from).toBe("2026-10-28");
      expect(s.totals).toMatchObject({ page_view: 16, tool_view: 2 }); // 4 + 5 + 7 over the seven days, today included because it was rolled up above
      expect(s.topTools).toEqual([{ slug: "claude", name: "Claude", views: 2, official: 0, affiliate: 0 }]);
      expect(s.pathGroups).toEqual([{ group: "home", views: 16 }]);
      expect(s.daily.map((d) => [d.day, d.pageViews])).toEqual([["2026-10-30", 4], ["2026-11-02", 5], ["2026-11-03", 7]]);
      const wide = await analyticsSummary(db.sql, member("analytics:read"), { today: "2026-11-03", days: 120 });
      expect(wide.from).toBe("2026-07-07");
      expect(wide.totals.page_view).toBe(3 + 4 + 5 + 7); // 1 Aug is inside 120 days; the 1 Jul rows are outside the window
    });
  });
});
