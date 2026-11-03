// The link checker and the report writers, which need no database.
import { describe, expect, it } from "vitest";
import { buildReport, finding, hasErrors, reportMarkdown } from "../src/server/verify/findings.ts";
import { checkUrl, checkUrls, linkFindings, type FetchLike, type UrlRef } from "../src/server/verify/links.ts";
import { validHttpsUrl } from "../src/server/verify/checks.ts";

const res = (status: number, url: string, cancel?: () => Promise<void>) => ({ status, url, body: { cancel: cancel ?? (async () => undefined) } });

describe("validHttpsUrl", () => {
  it("accepts ordinary https addresses and refuses everything else", () => {
    expect(validHttpsUrl("https://example.com/pricing?x=1")).toBe(true);
    for (const bad of ["http://example.com", "https://localhost/", "https://example.com/a b", "https://user:pw@example.com/", "ftp://example.com", "example.com", "", null, undefined, 5]) expect(validHttpsUrl(bad), String(bad)).toBe(false);
  });
});

describe("checkUrl", () => {
  it("classifies the answers", async () => {
    const f: Record<string, FetchLike> = {
      ok: async (u) => res(200, u),
      gone: async (u) => res(404, u),
      error: async (u) => res(503, u),
      blocked: async (u) => res(429, u),
      moved: async () => res(200, "https://elsewhere.example.org/page"),
      sameSiteWww: async () => res(200, "https://www.example.com/pricing"),
      down: async () => { throw new TypeError("fetch failed"); },
      slow: async () => { const e = new Error("t"); e.name = "TimeoutError"; throw e; },
    };
    expect((await checkUrl("https://example.com/", { fetch: f.ok })).kind).toBe("ok");
    expect((await checkUrl("https://example.com/", { fetch: f.gone })).kind).toBe("broken");
    expect((await checkUrl("https://example.com/", { fetch: f.error })).kind).toBe("broken");
    expect((await checkUrl("https://example.com/", { fetch: f.blocked })).kind).toBe("blocked");
    expect((await checkUrl("https://example.com/", { fetch: f.moved })).kind).toBe("moved-off-site");
    expect((await checkUrl("https://example.com/", { fetch: f.sameSiteWww })).kind).toBe("ok");
    expect(await checkUrl("https://example.com/", { fetch: f.down })).toMatchObject({ kind: "broken", error: "could not connect" });
    expect(await checkUrl("https://example.com/", { fetch: f.slow })).toMatchObject({ kind: "broken", error: "timed out" });
  });

  it("falls back to GET when a host refuses HEAD, sends an identifying User-Agent, and reads no page body", async () => {
    const seen: { method: string; ua: string }[] = [];
    let cancelled = 0;
    const fetchLike: FetchLike = async (u, init) => {
      seen.push({ method: init.method, ua: init.headers["User-Agent"] });
      return res(init.method === "HEAD" ? 405 : 200, u, async () => { cancelled++; });
    };
    expect((await checkUrl("https://example.com/", { fetch: fetchLike })).kind).toBe("ok");
    expect(seen.map((s) => s.method)).toEqual(["HEAD", "GET"]);
    expect(seen[0].ua).toMatch(/AIToolPicksLinkCheck/);
    expect(cancelled).toBe(2);
  });
});

describe("checkUrls", () => {
  const refs = (urls: string[]): UrlRef[] => urls.map((url, i) => ({ url, entityType: "tool", entityId: `t${i}`, field: "website_url" }));

  it("checks each distinct address once, and one request at a time per host", async () => {
    const inflight = new Map<string, number>();
    let maxPerHost = 0;
    let calls = 0;
    const fetchLike: FetchLike = async (u) => {
      calls++;
      const h = new URL(u).hostname;
      inflight.set(h, (inflight.get(h) ?? 0) + 1);
      maxPerHost = Math.max(maxPerHost, inflight.get(h)!);
      await new Promise((r) => setTimeout(r, 15));
      inflight.set(h, inflight.get(h)! - 1);
      return res(200, u);
    };
    const list = refs(["https://a.example.com/1", "https://a.example.com/2", "https://a.example.com/3", "https://b.example.org/", "https://a.example.com/1"]);
    const out = await checkUrls(list, { fetch: fetchLike, perHostDelayMs: 0, concurrency: 4 });
    expect(out.size).toBe(4);
    expect(calls).toBe(4);
    expect(maxPerHost).toBe(1);
  });

  it("respects the limit", async () => {
    const out = await checkUrls(refs(["https://a.example.com/", "https://b.example.com/", "https://c.example.com/"]), { fetch: async (u) => res(200, u), limit: 2 });
    expect(out.size).toBe(2);
  });
});

describe("linkFindings", () => {
  it("turns problems into warnings and notes, never errors, and says nothing about fine links", () => {
    const list: UrlRef[] = ["ok", "gone", "moved", "blocked"].map((id) => ({ url: `https://${id}.example.com/`, entityType: "tool", entityId: id, field: "website_url" }));
    const results = new Map([
      ["https://ok.example.com/", { url: "https://ok.example.com/", status: 200, finalUrl: "https://ok.example.com/", kind: "ok" as const }],
      ["https://gone.example.com/", { url: "https://gone.example.com/", status: 404, finalUrl: null, kind: "broken" as const }],
      ["https://moved.example.com/", { url: "https://moved.example.com/", status: 200, finalUrl: "https://other.example.net/", kind: "moved-off-site" as const }],
      ["https://blocked.example.com/", { url: "https://blocked.example.com/", status: 403, finalUrl: null, kind: "blocked" as const }],
    ]);
    const fs = linkFindings(list, results);
    expect(fs.map((f) => [f.entityId, f.severity])).toEqual([["gone", "warning"], ["moved", "warning"], ["blocked", "info"]]);
    expect(fs.every((f) => f.severity !== "error")).toBe(true);
  });
});

describe("reports", () => {
  const fs = [
    finding("pricing", "warning", "tool", "b", "stale"),
    finding("invalid-url", "error", "tool", "a", "bad", { field: "website_url" }),
    finding("news", "info", "news", "n1", "unchecked"),
    finding("invalid-url", "error", "tool", "a", "worse", { field: "pricing_url" }),
  ];

  it("orders findings by severity then check then record, counts them, and gives stable ids", () => {
    const r = buildReport("data", "test", fs, [], "2026-11-03T00:00:00.000Z");
    expect(r.counts).toEqual({ error: 2, warning: 1, info: 1 });
    expect(r.findings.map((f) => f.id)).toEqual(["invalid-url:tool:a:pricing_url", "invalid-url:tool:a:website_url", "pricing:tool:b", "news:news:n1"]);
    expect(r.byCheck["invalid-url"]).toEqual({ error: 2, warning: 0, info: 0 });
    expect(buildReport("data", "test", [...fs].reverse(), [], "2026-11-03T00:00:00.000Z")).toEqual(r);
    expect(hasErrors(r)).toBe(true);
    expect(hasErrors(buildReport("data", "test", fs.filter((f) => f.severity !== "error")))).toBe(false);
  });

  it("the Markdown report groups by severity and says automated checks never verify anything", () => {
    const md = reportMarkdown(buildReport("data", "test", fs, [{ entityType: "tool", entityId: "b", reason: "Pricing is partial." }]));
    expect(md).toMatch(/## Errors \(2\)/);
    expect(md).toMatch(/## Warnings \(1\)/);
    expect(md).toMatch(/## Needs a person \(1\)/);
    expect(md).toMatch(/does not make a tool verified/);
  });
});
