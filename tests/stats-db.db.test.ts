// The database statistics must equal what the site computes from the JSON files today, number for number, and must move when the data moves.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CATEGORIES, toolsInCategory } from "../src/data/tools";
import { STATS, statsFor } from "../src/lib/stats";
import { importAll } from "../src/server/import/content.ts";
import { loadContent } from "../src/server/import/content-source.ts";
import { loadSource } from "../src/server/import/source.ts";
import { getAllStats, getCategoryStats } from "../src/server/stats/index.ts";
import { freshDatabase, pg } from "./helpers/db.ts";

describe.skipIf(!pg().available)("statistics service", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  const cat = loadSource(process.cwd());
  const content = loadContent(process.cwd(), cat);

  beforeAll(async () => {
    db = await freshDatabase();
    await importAll(db.sql, cat, content);
  }, 60_000);
  afterAll(async () => db?.drop());

  it("catalogue totals equal the site's own figures (STATS)", async () => {
    const { catalog } = await getAllStats(db.sql);
    expect(catalog).toEqual({ ...STATS });
  });

  it("every category page's figures equal the site's own (categoryStats)", async () => {
    for (const c of CATEGORIES) expect(await getCategoryStats(db.sql, c.slug), c.slug).toEqual(statsFor(toolsInCategory(c.slug)));
  });

  it("content figures equal the files", async () => {
    const { content: c } = await getAllStats(db.sql);
    expect(c.reviewsDocumentation + c.reviewsHandsOn).toBe(content.reviews.length);
    expect(c.reviewsHandsOn).toBe(0);
    expect(c.guides + c.comparisonArticles).toBe(content.articles.length);
    expect(c.comparisonArticles).toBe(content.comparisons.length);
    expect(c.newsTotal).toBe(content.news.length);
    expect(c.newsListed).toBe(content.news.filter((n) => !n.sameStoryAs).length);
    expect(c.roundups).toBe(content.roundups.length);
    expect(c.models).toBe(content.models.length);
  });

  it("affiliate and submission figures equal the files and add up", async () => {
    const { affiliate, submissions } = await getAllStats(db.sql);
    const by = (s: string) => Object.values(cat.affiliate).filter((e) => e.status === s).length;
    expect(affiliate).toEqual({ approved: by("approved"), pending: by("pending"), unavailable: by("unavailable"), ordinary: by("ordinary"), links: 0 });
    expect(Object.values(submissions).every((v) => v === 0)).toBe(true);
  });

  it("moves with the data: archiving a tool, hiding a category and adding a submission change the right numbers only", async () => {
    const before = await getAllStats(db.sql);
    await db.sql`update tools set status = 'archived' where slug = 'chatgpt'`;
    await db.sql`update categories set is_visible = false where slug = 'assistants' and parent_id is null`;
    await db.sql`insert into tool_submissions (name, website_url, website_host, company, description, features, pricing_url) values ('Test Tool', 'https://test.example.com', 'test.example.com', 'Test Co', ${"d".repeat(40)}, ${"f".repeat(20)}, 'https://test.example.com/pricing')`;
    const after = await getAllStats(db.sql);
    expect(after.catalog.tools).toBe(before.catalog.tools - 1);
    expect(after.catalog.categories).toBe(before.catalog.categories - 1);
    expect(after.catalog.partial).toBe(before.catalog.partial - 1); // ChatGPT's pricing status is "partial"
    expect(after.catalog.verified).toBe(before.catalog.verified);
    expect(after.submissions).toMatchObject({ total: 1, new: 1 });
    expect(after.content).toEqual(before.content);
  });

  it("the views obey the database's access rules: the public API roles cannot read them", async () => {
    for (const role of ["anon", "authenticated"]) {
      const c = await db.sql.reserve();
      try {
        await c.unsafe(`set role ${role}`);
        await expect(c.unsafe("select * from v_stats_catalog")).rejects.toThrow(/permission denied/);
      } finally {
        await c.unsafe("reset role");
        c.release();
      }
    }
  });
});
