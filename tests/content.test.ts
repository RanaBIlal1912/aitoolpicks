import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLES, getArticleHtml, getArticleParts } from "@/data/articles";
import { COMPARISONS } from "@/data/compare";
import { NEWS } from "@/data/news";
import { REVIEWS } from "@/data/reviews";
import { CATEGORIES, TOOLS, categoryFromSlug, categorySlug } from "@/data/tools";
import { TOOL_DETAILS } from "@/data/tool-details";
import { COVERS, COVER_IDS, coverPath } from "@/data/covers";
import { NEWS_TAGS } from "@/data/news";
import { NAV } from "@/lib/site";
import { AFFILIATE_LINKS } from "@/lib/affiliate";
import { PRICES } from "@/lib/prices";

const KNOWN_ROUTES = new Set([
  "/",
  "/about/",
  "/affiliate-disclosure/",
  ...ARTICLES.map((a) => a.href),
]);

const WORDS = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

describe("articles", () => {
  it("keeps all 13 original articles with unique slugs", () => {
    expect(ARTICLES).toHaveLength(13);
    expect(new Set(ARTICLES.map((a) => a.slug)).size).toBe(13);
  });

  it("has substantial content in every guide (no thin placeholder pages)", () => {
    for (const a of ARTICLES) expect(WORDS(getArticleHtml(a.slug)), a.slug).toBeGreaterThanOrEqual(230);
    const total = ARTICLES.reduce((n, a) => n + WORDS(getArticleHtml(a.slug)), 0);
    expect(total).toBeGreaterThan(5500);
  });

  it("gives every h2 an anchor id for the table of contents", () => {
    for (const a of ARTICLES) {
      const { html, toc } = getArticleParts(a.slug);
      expect(toc.length, a.slug).toBeGreaterThanOrEqual(2);
      for (const t of toc) expect(html, `${a.slug}#${t.id}`).toContain(`id="${t.id}"`);
      expect(new Set(toc.map((t) => t.id)).size).toBe(toc.length);
    }
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

describe("tool pages and categories", () => {
  it("has a write-up for every tool in the directory", () => {
    for (const t of TOOLS) {
      const d = TOOL_DETAILS[t.id];
      expect(d, t.id).toBeTruthy();
      expect(d.overview.length, t.id).toBeGreaterThan(60);
      expect(d.goodFor.length, t.id).toBeGreaterThanOrEqual(3);
      expect(d.consider.length, t.id).toBeGreaterThanOrEqual(3);
    }
    expect(Object.keys(TOOL_DETAILS).sort()).toEqual(TOOLS.map((t) => t.id).sort());
  });

  it("maps every category to a page and back", () => {
    for (const c of CATEGORIES) {
      expect(categoryFromSlug(categorySlug(c))).toBe(c);
      expect(TOOLS.some((t) => t.category === c), c).toBe(true);
    }
  });
});

describe("cover images", () => {
  it("exist on disk in all three sizes, and every cover has alt text", () => {
    for (const id of COVER_IDS) {
      expect(COVERS[id].alt.length).toBeGreaterThan(20);
      for (const size of ["full", "og", "sm"] as const) {
        const f = path.join(process.cwd(), "public", coverPath(id, size));
        expect(fs.existsSync(f), f).toBe(true);
        expect(fs.statSync(f).size, f).toBeGreaterThan(5000);
      }
    }
  });
});

describe("navigation and news", () => {
  it("puts Blog and AI News first in the main navigation", () => {
    expect(NAV[0].href).toBe("/blog/");
    expect(NAV[1].href).toBe("/news/");
    expect(NAV.map((n) => n.href)).toEqual(expect.arrayContaining(["/tools/", "/reviews/", "/compare/", "/about/"]));
  });

  it("uses only known tags on news items and shows several items", () => {
    expect(NEWS.length).toBeGreaterThanOrEqual(8);
    for (const n of NEWS) expect(NEWS_TAGS, n.title).toContain(n.tag);
  });
});
