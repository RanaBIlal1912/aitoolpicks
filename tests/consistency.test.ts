import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIES, TOOLS } from "../src/data/tools";
import { ARTICLES } from "../src/data/articles";
import { NEWS } from "../src/data/news";

const root = process.cwd();
const files = fs.readdirSync(path.join(root, "content/tools")).filter((f) => f.endsWith(".json"));
const verified = TOOLS.filter((t) => t.pricingStatus === "verified").length;
const guides = ARTICLES.filter((a) => a.kind === "guide").length;
const text = (route: string) => {
  const f = path.join(root, "out", route, "index.html");
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ") : null;
};

describe("one source of truth for the counts", () => {
  it("publishes exactly the records in content/tools, with unique ids and no empty categories", () => {
    expect(TOOLS.length).toBe(files.length);
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((t) => t.name.toLowerCase())).size).toBe(TOOLS.length);
    const used = new Set(TOOLS.flatMap((t) => t.categories));
    expect(CATEGORIES.length).toBe(used.size);
    for (const c of CATEGORIES) expect(TOOLS.some((t) => t.categories.includes(c.slug)), c.slug).toBe(true);
  });
  it("does not count a tool as verified without an official source and a check date", () => {
    for (const f of files) {
      const r = JSON.parse(fs.readFileSync(path.join(root, "content/tools", f), "utf8"));
      if (r.pricing?.status !== "verified") continue;
      expect(r.pricing.source, r.id).toMatch(/^https:\/\//);
      expect(r.pricing.checked, r.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// These read the built site (npm run build first); they are skipped when out/ does not exist.
const built = fs.existsSync(path.join(root, "out/index.html"));
describe.skipIf(!built)("the built pages state the same numbers", () => {
  it("tools directory", () => {
    const t = text("tools")!;
    expect(t).toContain(`${TOOLS.length} tools across ${CATEGORIES.length} categories`);
    expect(t).toContain(`fully verified for ${verified} of them`);
  });
  it("home page", () => {
    const t = text("")!;
    expect(t).toContain(`${TOOLS.length} tools`);
    expect(t).toContain(`${verified} with fully verified prices`);
  });
  it("pricing page", () => {
    const t = text("pricing")!;
    expect(t).toContain(`${verified} verified`);
    expect(t).toContain(`${TOOLS.length} tools`);
  });
  it("blog and news", () => {
    // The list shows every article: guides plus the two comparison articles that live under /compare/.
    expect(text("blog")!).toContain(`${ARTICLES.length} guides`);
    expect(text("news")!).toContain(`${NEWS.length} stories`);
  });
  it("sitemap lists every tool, guide and story once", () => {
    const xml = fs.readFileSync(path.join(root, "out/sitemap.xml"), "utf8");
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs).size).toBe(locs.length);
    for (const t of TOOLS) expect(locs.some((l) => l.endsWith(`/tools/${t.id}/`)), t.id).toBe(true);
    expect(locs.filter((l) => /\/news\/[^/]+\/$/.test(l)).length).toBe(NEWS.length);
    expect(locs.filter((l) => /\/blog\/[^/]+\/$/.test(l)).length).toBe(guides);
  });
});
