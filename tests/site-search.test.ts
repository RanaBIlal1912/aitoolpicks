import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOOLS, getTool } from "../src/data/tools";
import { ARTICLES } from "../src/data/articles";
import { LISTED_NEWS, NEWS } from "../src/data/news";
import { buildContentIndex } from "../src/lib/search-index";
import { searchSite } from "../src/lib/site-search";

const docs = buildContentIndex();
const LISTING_PAGES = ["/tools/", "/blog/", "/news/", "/compare/", "/pricing/"];

describe("global search opens the exact page", () => {
  it("finds every tool by its name and links to that tool's own page", () => {
    for (const t of TOOLS) {
      const r = searchSite(t.name, docs).find((x) => x.type === "tool" && x.id === t.id);
      expect(r, `${t.name} not found`).toBeTruthy();
      expect(r!.href).toBe(`/tools/${t.id}/`);
    }
  });

  it("puts the tool that was typed first", () => {
    for (const name of ["ChatGPT", "Claude", "Midjourney", "Notion", "Perplexity", "ElevenLabs"]) {
      const first = searchSite(name, docs)[0];
      expect(first.type, name).toBe("tool");
      expect(first.title.toLowerCase(), name).toContain(name.toLowerCase());
      expect(first.href).toBe(`/tools/${getTool(first.id)!.id}/`);
    }
  });

  it("finds every blog article by its title and links to that article", () => {
    for (const a of ARTICLES) {
      const r = searchSite(a.title, docs).find((x) => x.type === "article" && x.id === a.slug);
      expect(r, `${a.title} not found`).toBeTruthy();
      expect(r!.href).toBe(a.href);
    }
  });

  it("finds every listed news story by its headline and links to that story", () => {
    for (const n of LISTED_NEWS) {
      const r = searchSite(n.title, docs).find((x) => x.type === "news" && x.id === n.slug);
      expect(r, `${n.title} not found`).toBeTruthy();
      expect(r!.href).toBe(`/news/${n.slug}/`);
    }
  });

  it("never sends a result to a listing page", () => {
    for (const q of ["chat", "video", "pricing", "claude", "mistral", "freelancer", "ai", "transcription", "open"]) {
      for (const r of searchSite(q, docs)) expect(LISTING_PAGES, `${q} -> ${r.href}`).not.toContain(r.href);
    }
  });

  it("only points at pages that exist", () => {
    const tools = new Set(TOOLS.map((t) => `/tools/${t.id}/`));
    const articles = new Set(ARTICLES.map((a) => a.href));
    const news = new Set(NEWS.map((n) => `/news/${n.slug}/`));
    for (const q of ["claude", "guide", "coding", "mistral", "price", "meeting"]) {
      for (const r of searchSite(q, docs)) {
        const set = r.type === "tool" ? tools : r.type === "article" ? articles : news;
        expect(set.has(r.href), `${q}: ${r.type} ${r.href}`).toBe(true);
      }
    }
  });

  it("labels every result and gives it a title and a short description", () => {
    const rs = searchSite("claude", docs);
    expect(rs.length).toBeGreaterThan(0);
    for (const r of rs) {
      expect(["tool", "article", "news"]).toContain(r.type);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.description.length).toBeGreaterThan(0);
    }
    expect(new Set(rs.map((r) => r.type)).size).toBeGreaterThan(1);
  });

  it("has no duplicate results, and shows a story that has two reports only once", () => {
    for (const q of ["mistral", "claude", "hugging face", "ai", "model"]) {
      const rs = searchSite(q, docs);
      expect(new Set(rs.map((r) => r.href)).size, q).toBe(rs.length);
      expect(new Set(rs.map((r) => `${r.type}:${r.title.toLowerCase()}`)).size, q).toBe(rs.length);
    }
    const hrefs = searchSite("mistral large trillion", docs).map((r) => r.href);
    expect(hrefs).not.toContain("/news/mistral-releases-trillion-parameter-weights/");
  });

  it("returns an empty list (for the empty state) when nothing matches or the query is too short", () => {
    expect(searchSite("zzzqxv", docs)).toEqual([]);
    expect(searchSite("qqqq wwwwzz", docs)).toEqual([]);
    expect(searchSite("", docs)).toEqual([]);
    expect(searchSite("a", docs)).toEqual([]);
  });
});

// ---- The built home page: every Trending card is one link to its own tool ------------------------------------------------------------------

const homeFile = path.join(process.cwd(), "out", "index.html");
const built = fs.existsSync(homeFile);

type Node = { tag: string; cls: string; href?: string };
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "path", "circle", "rect", "line", "polyline", "polygon", "stop", "use"]);

/** Walks the HTML and returns, for each <a class="tile-link">, the chain of ancestors from its card down to the link. */
function tileLinks(html: string): { href: string; chain: Node[] }[] {
  const stack: Node[] = [];
  const found: { href: string; chain: Node[] }[] = [];
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(\/?)>/g)) {
    const [, close, tag, attrs, selfClose] = m;
    const name = tag.toLowerCase();
    if (close) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === name) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const cls = /class="([^"]*)"/.exec(attrs)?.[1] ?? "";
    const href = /href="([^"]*)"/.exec(attrs)?.[1];
    if (name === "a" && /\btile-link\b/.test(cls)) {
      const start = stack.map((n) => /\btile\b/.test(n.cls)).lastIndexOf(true);
      if (start >= 0) found.push({ href: href ?? "", chain: stack.slice(start) });
    }
    if (!selfClose && !VOID.has(name)) stack.push({ tag: name, cls, href });
  }
  return found;
}

describe.skipIf(!built)("home page cards are fully clickable", () => {
  const html = built ? fs.readFileSync(homeFile, "utf8") : "";
  const links = tileLinks(html);
  const positioned = (n: Node) => /(^|\s)(relative|absolute|fixed|sticky)(\s|$)/.test(n.cls);

  it("has one link per Trending card, each to a different, existing tool", () => {
    const section = html.split('aria-label="Trending AI tools"')[1]?.split("</section>")[0] ?? "";
    expect(section.length).toBeGreaterThan(0);
    const hrefs = [...section.matchAll(/<a[^>]*class="[^"]*tile-link[^"]*"[^>]*href="([^"]+)"|<a[^>]*href="([^"]+)"[^>]*class="[^"]*tile-link/g)].map((m) => m[1] ?? m[2]);
    expect(hrefs.length).toBeGreaterThanOrEqual(3);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const h of hrefs) {
      const id = /\/tools\/([a-z0-9-]+)\/$/.exec(h)?.[1];
      expect(id && TOOLS.some((t) => t.id === id), h).toBeTruthy();
    }
  });

  it("has no positioned wrapper between a card and its link, so the link covers the whole card", () => {
    expect(links.length).toBeGreaterThan(8);
    for (const l of links) {
      const [card, ...inner] = l.chain;
      // .tile is position: relative in globals.css, so the link's stretched ::after is sized by the card itself.
      expect(/(^|\s)tile(\s|$)/.test(card.cls), `${l.href}: card must be a .tile`).toBe(true);
      expect(inner.filter(positioned).map((n) => n.cls), `${l.href}: positioned wrapper would shrink the clickable area`).toEqual([]);
    }
  });

  it("makes each Trending card show a pointer and put no second link inside it", () => {
    const section = html.split('aria-label="Trending AI tools"')[1]?.split("</section>")[0] ?? "";
    const cards = section.split("<article").slice(1);
    for (const c of cards) {
      expect(c).toMatch(/cursor-pointer/);
      expect((c.match(/<a[\s>]/g) ?? []).length).toBe(1);
    }
  });
});
