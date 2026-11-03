// Models, articles, comparisons, reviews, news, roundups and redirects, imported from the real files into a disposable database.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { importAll, importContent } from "../src/server/import/content.ts";
import { loadContent, type ContentSource } from "../src/server/import/content-source.ts";
import { loadSource } from "../src/server/import/source.ts";
import { readExportedArray } from "../src/server/import/ts-data.ts";
import { verifyCatalogue, verifyContent } from "../src/server/import/verify.ts";
import { freshDatabase, pg } from "./helpers/db.ts";

const available = pg().available;
const cat = loadSource(process.cwd());
const content = loadContent(process.cwd(), cat);
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const fullReport = async (sql: Parameters<typeof verifyCatalogue>[0], c: ContentSource) => verifyContent(sql, c, await verifyCatalogue(sql, cat));

describe("reading TypeScript data files", () => {
  it("finds the news, roundups and comparisons the site shows", () => {
    expect(content.news).toHaveLength(17);
    expect(content.roundups.flatMap((r) => r.picks)).toHaveLength(29);
    expect(content.comparisons).toHaveLength(2);
    expect(content.reviews).toHaveLength(17);
    expect(content.articles).toHaveLength(30);
    expect(content.models).toHaveLength(9);
  });

  it("refuses a file or a name that is not there", () => {
    expect(() => readExportedArray("src/data/news.ts", "NOPE")).toThrow(/no exported constant/);
  });

  it("article bodies are read with Unix line endings, so the database does not depend on the machine", () => {
    for (const a of content.articles) expect(a.html).not.toContain("\r");
  });
});

describe.skipIf(!available)("importing editorial content", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  beforeAll(async () => {
    db = await freshDatabase();
  });
  afterAll(async () => db?.drop());

  it("a dry run on an empty database reports everything as new and writes nothing", async () => {
    const r = await importAll(db.sql, cat, content, { dryRun: true });
    expect(r.content.groups.news.inserted).toBe(17);
    expect(r.content.groups.redirects.inserted).toBe(32);
    const [{ n }] = await db.sql`select (select count(*) from tools) + (select count(*) from news_items) as n`;
    expect(Number(n)).toBe(0);
  });

  it("imports everything and the verification report passes", async () => {
    const r = await importAll(db.sql, cat, content);
    expect(r.content.groups.articles).toEqual({ inserted: 30, updated: 0, unchanged: 0 });
    expect(r.content.groups.reviews.inserted).toBe(17);
    const report = await fullReport(db.sql, content);
    expect(report.checks.filter((c) => !c.ok), JSON.stringify(report.checks.filter((c) => !c.ok))).toEqual([]);
    expect(report.checks.filter((c) => c.name.startsWith("8.")).length).toBe(7);
  });

  it("a second run changes zero rows", async () => {
    const r = await importAll(db.sql, cat, content);
    for (const [g, v] of Object.entries(r.content.groups)) expect(v, g).toMatchObject({ inserted: 0, updated: 0 });
    expect(r.catalogue.groups.tools).toMatchObject({ inserted: 0, updated: 0 });
  });

  it("an edit to one news item updates exactly that item", async () => {
    const c = clone(content);
    c.news[4].summary = "Edited summary.";
    const r = await importContent(db.sql, c);
    expect(r.groups.news).toMatchObject({ inserted: 0, updated: 1 });
    expect((await fullReport(db.sql, c)).ok).toBe(true);
    expect((await fullReport(db.sql, content)).ok).toBe(false);
    await importContent(db.sql, content);
    expect((await fullReport(db.sql, content)).ok).toBe(true);
  });

  it("keeps the order of articles: moving one is an update, and the export follows the file", async () => {
    const c = clone(content);
    const [first] = c.articles.splice(0, 1);
    c.articles.splice(5, 0, first);
    const r = await importContent(db.sql, c);
    expect(r.groups.articles.updated).toBeGreaterThanOrEqual(1);
    const rep = await fullReport(db.sql, c);
    expect(rep.checks.filter((x) => !x.ok)).toEqual([]);
    await importContent(db.sql, content);
  });

  it("changing a tool's data-aff button changes which tools the article is linked to", async () => {
    const c = clone(content);
    const a = c.articles.find((x) => /data-aff="chatgpt"/.test(x.html))!;
    a.html = a.html.replaceAll('data-aff="chatgpt"', 'data-aff="claude"');
    await importContent(db.sql, c);
    const rows = await db.sql`select t.slug from blog_post_tools p join tools t on t.id = p.tool_id join blog_posts b on b.id = p.post_id where b.slug = ${a.slug}`;
    expect(rows.map((r) => r.slug)).toContain("claude");
    expect(rows.map((r) => r.slug)).not.toContain("chatgpt");
    await importContent(db.sql, content);
  });

  it("the verification report notices a row changed behind the importer's back", async () => {
    await db.sql`update reviews set verdict = 'tampered' where slug = 'chatgpt'`;
    const report = await fullReport(db.sql, content);
    expect(report.ok).toBe(false);
    expect(report.checks.find((c) => c.name.includes("reviews, same content"))?.detail).toContain("chatgpt");
    await importContent(db.sql, content);
    expect((await fullReport(db.sql, content)).ok).toBe(true);
  });

  it("the database refuses a hands-on review without a testing record", async () => {
    await expect(db.sql`update reviews set method = 'hands-on' where slug = 'chatgpt'`).rejects.toThrow();
  });

  it("a bad record stops the whole import and leaves the database unchanged", async () => {
    const c = clone(content);
    c.roundups[0].picks[0].badge = "";
    c.news[0].summary = "should not be kept";
    // an empty badge is allowed by the database; an unknown tool is not
    c.roundups[1].picks[0].id = "no-such-tool";
    await expect(importContent(db.sql, c)).rejects.toThrow();
    const [row] = await db.sql`select summary from news_items where slug = ${content.news[0].slug}`;
    expect(row.summary).toBe(content.news[0].summary);
  });
});
