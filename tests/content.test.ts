import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLES, getArticleHtml } from "@/data/articles";
import { COMPARISONS } from "@/data/compare";
import { NEWS } from "@/data/news";
import { REVIEWS } from "@/data/reviews";
import { TOOLS } from "@/data/tools";
import { AFFILIATE_LINKS } from "@/lib/affiliate";
import { PRICES } from "@/lib/prices";

const KNOWN_ROUTES = new Set([
  "/",
  "/about/",
  "/affiliate-disclosure/",
  ...ARTICLES.map((a) => a.href),
]);

describe("articles", () => {
  it("keeps all 13 original articles with unique slugs", () => {
    expect(ARTICLES).toHaveLength(13);
    expect(new Set(ARTICLES.map((a) => a.slug)).size).toBe(13);
  });

  it("has an HTML body, title and description for each article", () => {
    for (const a of ARTICLES) {
      const html = getArticleHtml(a.slug);
      expect(html.length, a.slug).toBeGreaterThan(400);
      expect(a.title.length).toBeGreaterThan(10);
      expect(a.description.length).toBeGreaterThan(30);
      expect(a.description.length, a.slug).toBeLessThanOrEqual(200);
    }
  });

  it("rewrites every internal link to a route that exists", () => {
    for (const a of ARTICLES) {
      const html = getArticleHtml(a.slug);
      expect(html, a.slug).not.toMatch(/href="[a-z0-9-]+\.html"/);
      for (const m of html.matchAll(/href="([^"#]+)"/g)) {
        const href = m[1];
        if (/^https?:/.test(href)) continue;
        expect(KNOWN_ROUTES.has(href), `${a.slug} -> ${href}`).toBe(true);
      }
    }
  });

  it("only references affiliate ids and price ids that exist", () => {
    const toolIds = new Set(TOOLS.map((t) => t.id));
    for (const a of ARTICLES) {
      const html = getArticleHtml(a.slug);
      for (const m of html.matchAll(/data-aff="(\w+)"/g)) expect(toolIds.has(m[1]), `${a.slug}: ${m[1]}`).toBe(true);
      for (const m of html.matchAll(/data-price="(\w+)"/g)) expect(PRICES[m[1]], `${a.slug}: ${m[1]}`).toBeTruthy();
    }
  });

  it("has article files only for known articles (no orphan content)", () => {
    const files = fs.readdirSync(path.join(process.cwd(), "content", "articles")).map((f) => f.replace(/\.html$/, ""));
    expect(files.sort()).toEqual(ARTICLES.map((a) => a.slug).sort());
  });
});

describe("tools, reviews and comparisons", () => {
  it("has unique tool ids and valid official https URLs", () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    for (const t of TOOLS) expect(t.officialUrl, t.id).toMatch(/^https:\/\//);
  });

  it("links every review to a real tool and every tool review to a real page", () => {
    const slugs = new Set(REVIEWS.map((r) => r.slug));
    for (const r of REVIEWS) expect(TOOLS.find((t) => t.id === r.toolId), r.slug).toBeTruthy();
    for (const t of TOOLS.filter((t) => t.review)) expect(slugs.has(t.review!), t.id).toBe(true);
  });

  it("only uses price ids that have a verified price", () => {
    for (const c of COMPARISONS)
      for (const row of c.rows)
        for (const cell of [row.left, row.right]) if (typeof cell !== "string") expect(PRICES[cell.price], cell.price).toBeTruthy();
  });

  it("stores prices in USD with an official https source", () => {
    for (const [id, p] of Object.entries(PRICES)) {
      expect(p.usd, id).toBeGreaterThan(0);
      expect(p.source, id).toMatch(/^https:\/\//);
    }
  });
});

describe("no fabricated affiliate links", () => {
  it("only contains empty values or https URLs", () => {
    for (const [id, v] of Object.entries(AFFILIATE_LINKS)) {
      const urls = typeof v === "string" ? [v] : Object.values(v);
      for (const u of urls) expect(u === "" || /^https:\/\//.test(u), id).toBe(true);
    }
  });

  it("has a key for every tool in the directory", () => {
    for (const t of TOOLS) expect(t.id in AFFILIATE_LINKS, t.id).toBe(true);
  });
});

describe("news", () => {
  it("gives every item an ISO date, an https source link and a summary", () => {
    expect(NEWS.length).toBeGreaterThanOrEqual(5);
    for (const n of NEWS) {
      expect(n.date, n.title).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(n.date)), n.title).toBe(false);
      expect(n.url, n.title).toMatch(/^https:\/\//);
      expect(n.summary.length, n.title).toBeGreaterThan(20);
    }
    expect(new Set(NEWS.map((n) => n.url)).size).toBe(NEWS.length);
  });
});
