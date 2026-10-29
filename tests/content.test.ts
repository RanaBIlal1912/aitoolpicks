import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLES, getArticleHtml, getArticleParts } from "@/data/articles";
import { COMPARISONS } from "@/data/compare";
import { NEWS, NEWS_TAGS } from "@/data/news";
import { REVIEWS } from "@/data/reviews";
import { CATEGORIES, TOOLS, getCategory, getTool } from "@/data/tools";
import { ROUNDUPS } from "@/data/roundups";
import { COVERS, COVER_IDS, coverPath } from "@/data/covers";
import { AFFILIATE_LINKS } from "@/lib/affiliate";
import { PRICES } from "@/lib/prices";
import { MORE, NAV } from "@/lib/site";

const KNOWN_ROUTES = new Set(["/", "/about/", "/affiliate-disclosure/", ...ARTICLES.map((a) => a.href)]);
const WORDS = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

describe("articles", () => {
  it("keeps every original article, with unique slugs", () => {
    expect(ARTICLES.length).toBeGreaterThanOrEqual(13);
    expect(new Set(ARTICLES.map((a) => a.slug)).size).toBe(ARTICLES.length);
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
      expect(getArticleHtml(a.slug).length, a.slug).toBeGreaterThan(400);
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

  it("only references affiliate ids that exist in the catalog and prices that are verified", () => {
    for (const a of ARTICLES) {
      const html = getArticleHtml(a.slug);
      for (const m of html.matchAll(/data-aff="([\w-]+)"/g)) expect(getTool(m[1]), `${a.slug}: ${m[1]}`).toBeTruthy();
      for (const m of html.matchAll(/data-price="([\w-]+)"/g)) expect(getTool(m[1]), `${a.slug}: ${m[1]}`).toBeTruthy();
    }
  });

  it("has article files only for known articles (no orphan content)", () => {
    const files = fs.readdirSync(path.join(process.cwd(), "content", "articles")).map((f) => f.replace(/\.html$/, ""));
    expect(files.sort()).toEqual(ARTICLES.map((a) => a.slug).sort());
  });

  it("keeps the home page and primary messaging free of country-specific positioning", () => {
    const home = fs.readFileSync(path.join(process.cwd(), "src", "app", "page.tsx"), "utf-8");
    const layout = fs.readFileSync(path.join(process.cwd(), "src", "app", "layout.tsx"), "utf-8");
    const site = fs.readFileSync(path.join(process.cwd(), "src", "lib", "site.ts"), "utf-8");
    for (const src of [home, layout, site]) expect(src.toLowerCase()).not.toContain("pakistan");
    expect(NAV.map((n) => n.label.toLowerCase()).join(" ")).not.toContain("pakistan");
  });
});

describe("reviews, comparisons and roundups", () => {
  it("links every review to a real tool and every tool review to a real page", () => {
    const slugs = new Set(REVIEWS.map((r) => r.slug));
    for (const r of REVIEWS) expect(getTool(r.toolId), r.slug).toBeTruthy();
    for (const t of TOOLS.filter((t) => t.review)) expect(slugs.has(t.review!), t.id).toBe(true);
  });

  it("does not describe an unverified tool as having a verified price", () => {
    for (const r of REVIEWS) {
      const t = getTool(r.toolId)!;
      if (t.pricingStatus === "unverified") expect(r.pricingNote.toLowerCase(), r.slug).toMatch(/blocked|could not|not publish|not verified/);
    }
  });

  it("only uses price ids that have a reference price", () => {
    for (const c of COMPARISONS)
      for (const row of c.rows)
        for (const cell of [row.left, row.right]) if (typeof cell !== "string") expect(getTool(cell.price), cell.price).toBeTruthy();
  });

  it("builds each best-of guide from real tools in the right category", () => {
    expect(ROUNDUPS.length).toBeGreaterThanOrEqual(6);
    for (const r of ROUNDUPS) {
      expect(getCategory(r.category), r.slug).toBeTruthy();
      expect(r.picks.length, r.slug).toBeGreaterThanOrEqual(3);
      for (const p of r.picks) {
        const t = getTool(p.id);
        expect(t, `${r.slug}: ${p.id}`).toBeTruthy();
        expect(t!.categories, `${r.slug}: ${p.id}`).toContain(r.category);
        if (t!.pricingStatus === "unverified") expect(p.why.toLowerCase(), `${r.slug}: ${p.id}`).toMatch(/blocked|could not|not verified|do not publish/);
      }
    }
  });
});

describe("prices and affiliate links", () => {
  it("stores one reference price per verified tool, with an official https source", () => {
    for (const [id, p] of Object.entries(PRICES)) {
      expect(getTool(id)?.pricingStatus, id).not.toBe("unverified");
      expect(p.amount, id).toBeGreaterThanOrEqual(0);
      expect(p.source, id).toMatch(/^https:\/\//);
      expect(p.checked, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("only contains empty values or https URLs for affiliate links", () => {
    for (const [id, v] of Object.entries(AFFILIATE_LINKS)) {
      const urls = typeof v === "string" ? [v] : Object.values(v);
      for (const u of urls) expect(u === "" || /^https:\/\//.test(u), id).toBe(true);
    }
  });

  it("has an affiliate slot for every tool, so a real link can be added without code changes elsewhere", () => {
    for (const t of TOOLS) expect(t.id in AFFILIATE_LINKS, t.id).toBe(true);
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

  it("uses only existing covers for categories", () => {
    for (const c of CATEGORIES) expect(COVER_IDS, c.slug).toContain(c.cover);
  });
});

describe("navigation and news", () => {
  it("puts Blog and AI News first in the main navigation and links the pricing hub", () => {
    expect(NAV[0].href).toBe("/blog/");
    expect(NAV[1].href).toBe("/news/");
    expect(NAV.map((n) => n.href)).toEqual(expect.arrayContaining(["/tools/", "/reviews/", "/compare/", "/pricing/"]));
    expect(MORE.map((n) => n.href)).toEqual(expect.arrayContaining(["/best/", "/methodology/", "/about/", "/contact/"]));
  });

  it("gives every news item a known tag, a real date and an https source", () => {
    expect(NEWS.length).toBeGreaterThanOrEqual(12);
    for (const n of NEWS) {
      expect(NEWS_TAGS, n.title).toContain(n.tag);
      expect(n.date, n.title).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.url, n.title).toMatch(/^https:\/\//);
      for (const id of n.tools ?? []) expect(getTool(id), `${n.title}: ${id}`).toBeTruthy();
    }
    expect(new Set(NEWS.map((n) => n.url)).size).toBe(NEWS.length);
  });
});
