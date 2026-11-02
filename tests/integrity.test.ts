import { describe, expect, it } from "vitest";
import { CATEGORIES, TOOLS, toolsInCategory } from "../src/data/tools";
import { ARTICLES } from "../src/data/articles";
import { LISTED_NEWS, NEWS, getNews } from "../src/data/news";
import { Claimed, canonicalUrl, normalizeKey, titleSimilarity } from "../src/lib/dedupe";
import { allocateHomeTools } from "../src/lib/home-tools";

/** Returns the values that occur more than once, so a failure names the duplicate. */
function repeats<T>(items: T[], key: (item: T) => string): string[] {
  const seen = new Map<string, number>();
  for (const i of items) seen.set(key(i), (seen.get(key(i)) ?? 0) + 1);
  return [...seen].filter(([, n]) => n > 1).map(([k]) => k);
}

describe("tools are unique", () => {
  it("has one record per id, per normalised id and per normalised name", () => {
    expect(repeats(TOOLS, (t) => t.id)).toEqual([]);
    expect(repeats(TOOLS, (t) => normalizeKey(t.id))).toEqual([]);
    expect(repeats(TOOLS, (t) => normalizeKey(t.name))).toEqual([]);
  });
  it("never lists two records for the same official page", () => {
    // Several products legitimately live under github.com, so the whole address (host and path) is compared, not the host.
    expect(repeats(TOOLS, (t) => canonicalUrl(t.officialUrl))).toEqual([]);
  });
  it("lists each tool once inside every category", () => {
    for (const c of CATEGORIES) expect(repeats(toolsInCategory(c.slug), (t) => t.id), c.slug).toEqual([]);
  });
});

describe("news is unique", () => {
  it("has one item per slug, address and headline", () => {
    expect(repeats(NEWS, (n) => n.slug)).toEqual([]);
    expect(repeats(NEWS, (n) => canonicalUrl(n.url))).toEqual([]);
    expect(repeats(NEWS, (n) => normalizeKey(n.title))).toEqual([]);
  });
  it("links a second report of a story to the item that is listed", () => {
    for (const n of NEWS.filter((x) => x.sameStoryAs)) {
      const primary = getNews(n.sameStoryAs!);
      expect(primary, n.slug).toBeTruthy();
      expect(primary!.sameStoryAs, `${n.slug} points at a duplicate`).toBeUndefined();
      expect(n.sameStoryAs).not.toBe(n.slug);
    }
  });
  it("does not list two items that look like one story unless they are linked", () => {
    // Same day and the same two or more tools, or near-identical headlines on the same day.
    const withTools = LISTED_NEWS.filter((n) => (n.tools?.length ?? 0) >= 2);
    expect(repeats(withTools, (n) => `${n.date}|${[...(n.tools ?? [])].sort().join(",")}`)).toEqual([]);
    for (let i = 0; i < LISTED_NEWS.length; i++) {
      for (let j = i + 1; j < LISTED_NEWS.length; j++) {
        const [x, y] = [LISTED_NEWS[i], LISTED_NEWS[j]];
        if (x.date === y.date) expect(titleSimilarity(x.title, y.title), `${x.slug} / ${y.slug}`).toBeLessThan(0.6);
      }
    }
  });
  it("keeps every item reachable even when it is not listed", () => {
    expect(LISTED_NEWS.length).toBe(NEWS.filter((n) => !n.sameStoryAs).length);
    expect(LISTED_NEWS.length).toBeLessThan(NEWS.length + 1);
  });
});

describe("articles are unique", () => {
  it("has one article per slug, address and headline", () => {
    expect(repeats(ARTICLES, (a) => a.slug)).toEqual([]);
    expect(repeats(ARTICLES, (a) => a.href)).toEqual([]);
    expect(repeats(ARTICLES, (a) => normalizeKey(a.title))).toEqual([]);
  });
});

describe("the home page shows each tool once", () => {
  const home = allocateHomeTools();
  const sections = {
    trending: (home.trending?.rows ?? []).map((r) => r.id),
    picks: home.picks,
    recent: home.recent.map((t) => t.id),
    hero: home.hero,
    ribbon: home.ribbon.map((t) => t.id),
  };
  it("gives every section a different set of tools", () => {
    const all = Object.values(sections).flat();
    expect(repeats(all, (id) => id)).toEqual([]);
  });
  it("only shows tools that exist", () => {
    for (const id of Object.values(sections).flat()) expect(TOOLS.some((t) => t.id === id), id).toBe(true);
  });
  it("fills the sections it promises", () => {
    expect(sections.picks.length).toBe(5);
    expect(sections.recent.length).toBe(6);
    expect(sections.hero.length).toBe(6);
  });
});

describe("Claimed", () => {
  it("skips items already taken and duplicates inside the candidate list", () => {
    const used = new Claimed();
    expect(used.take(["a", "b", "b", "c"], 2, (x) => x)).toEqual(["a", "b"]);
    expect(used.take(["a", "c", "d"], 5, (x) => x)).toEqual(["c", "d"]);
  });
});
