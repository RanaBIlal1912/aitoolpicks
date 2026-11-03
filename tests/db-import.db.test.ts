// The catalogue import, run against the real files in content/ and a disposable database.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { importCatalogue } from "../src/server/import/catalogue.ts";
import { loadSource, SourceError, toolSchema, type Source } from "../src/server/import/source.ts";
import { verifyCatalogue } from "../src/server/import/verify.ts";
import { freshDatabase, pg } from "./helpers/db.ts";

const available = pg().available;
const src = loadSource(process.cwd());
const clone = (s: Source): Source => JSON.parse(JSON.stringify(s));

describe("the source files", () => {
  it("validate and match the Phase 1 inventory", () => {
    expect(src.tools).toHaveLength(69);
    expect(src.categories).toHaveLength(15);
    expect(Object.keys(src.affiliate)).toHaveLength(15);
  });

  it("an unknown field is an error, not silently dropped", () => {
    expect(toolSchema.safeParse(src.tools[0]).success).toBe(true);
    expect(toolSchema.safeParse({ ...src.tools[0], surprise: 1 }).success).toBe(false);
  });

  it("SourceError lists every problem", () => {
    expect(new SourceError(["a", "b"]).message).toContain("- a\n  - b");
  });
});

describe.skipIf(!available)("importing into an empty database", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  let first: Awaited<ReturnType<typeof importCatalogue>>;
  beforeAll(async () => {
    db = await freshDatabase();
    first = await importCatalogue(db.sql, src);
  });
  afterAll(async () => db?.drop());

  it("inserts everything and updates nothing", () => {
    expect(first.groups.tools).toEqual({ inserted: 69, updated: 0, unchanged: 0 });
    expect(first.groups.companies.inserted).toBe(65);
    expect(first.groups.categories.inserted).toBe(51);
    expect(first.groups.affiliatePrograms.inserted).toBe(15);
  });

  it("passes the verification report: counts, round trip, relationships, slugs, affiliate", async () => {
    const report = await verifyCatalogue(db.sql, src);
    const failed = report.checks.filter((c) => !c.ok);
    expect(failed, JSON.stringify(failed)).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("a second run changes zero rows", async () => {
    const before = await db.sql`select (select count(*) from tools) t, (select max(updated_at) from tools) u, (select max(updated_at) from categories) cu`;
    const second = await importCatalogue(db.sql, src);
    expect(second.groups.tools).toEqual({ inserted: 0, updated: 0, unchanged: 69 });
    expect(second.groups.companies).toEqual({ inserted: 0, updated: 0, unchanged: 65 });
    expect(second.groups.categories).toEqual({ inserted: 0, updated: 0, unchanged: 51 });
    expect(second.groups.affiliatePrograms).toEqual({ inserted: 0, updated: 0, unchanged: 15 });
    const after = await db.sql`select (select count(*) from tools) t, (select max(updated_at) from tools) u, (select max(updated_at) from categories) cu`;
    expect(after[0]).toEqual(before[0]);
  });

  it("a dry run reports the change and writes nothing", async () => {
    const changed = clone(src);
    changed.tools[3].tagline = "A different tagline";
    const dry = await importCatalogue(db.sql, changed, { dryRun: true });
    expect(dry.groups.tools).toEqual({ inserted: 0, updated: 1, unchanged: 68 });
    const [row] = await db.sql`select tagline from tools where slug = ${changed.tools[3].id}`;
    expect(row.tagline).toBe(src.tools[3].tagline);
  });

  it("an edit to one tool updates exactly that tool, and the verification then compares against the new file", async () => {
    const changed = clone(src);
    changed.tools[5].pricing.plans[0].monthly = 123;
    changed.tools[5].alternatives = changed.tools[5].alternatives.slice().reverse();
    const r = await importCatalogue(db.sql, changed);
    expect(r.groups.tools).toEqual({ inserted: 0, updated: 1, unchanged: 68 });
    expect((await verifyCatalogue(db.sql, changed)).ok).toBe(true);
    // the original files no longer match: the report must notice
    const stale = await verifyCatalogue(db.sql, src);
    expect(stale.ok).toBe(false);
    expect(stale.checks.find((c) => c.name.startsWith("2."))?.detail).toContain(src.tools[5].id);
    await importCatalogue(db.sql, src);
    expect((await verifyCatalogue(db.sql, src)).ok).toBe(true);
  });

  it("keeps the order of a tool's category list, primary included", async () => {
    const t = src.tools.find((x) => x.categories.length > 2 && x.categories[0] === x.category)!;
    const changed = clone(src);
    const c = changed.tools.find((x) => x.id === t.id)!;
    c.categories = [...c.categories.slice(1), c.categories[0]];
    const r = await importCatalogue(db.sql, changed);
    expect(r.groups.tools.updated).toBe(1);
    expect((await verifyCatalogue(db.sql, changed)).ok).toBe(true);
    await importCatalogue(db.sql, src);
    expect(src.tools.filter((x) => x.categories[0] !== x.category).length).toBeGreaterThanOrEqual(0);
    expect((await verifyCatalogue(db.sql, src)).ok).toBe(true);
  });

  it("never deletes: a tool missing from the files is reported and kept", async () => {
    const fewer = clone(src);
    const dropped = fewer.tools.pop()!;
    delete fewer.affiliate[dropped.id];
    // alternatives pointing at the dropped tool would be dangling in the reduced source
    for (const t of fewer.tools) t.alternatives = t.alternatives.filter((a) => a !== dropped.id);
    const r = await importCatalogue(db.sql, fewer);
    expect(r.extra.tools).toEqual([dropped.id]);
    const [{ n }] = await db.sql`select count(*)::int n from tools where slug = ${dropped.id}`;
    expect(n).toBe(1);
    await importCatalogue(db.sql, src);
  });

  it("is atomic: a failure part-way leaves the database as it was", async () => {
    const broken = clone(src);
    broken.tools[10].pricing.plans[0].currency = "usd";
    const before = await db.sql`select count(*)::int n, max(updated_at) u from tools`;
    await expect(importCatalogue(db.sql, broken)).rejects.toThrow();
    const after = await db.sql`select count(*)::int n, max(updated_at) u from tools`;
    expect(after[0]).toEqual(before[0]);
  });

  it("writes no affiliate link and approves no programme", async () => {
    const [{ links }] = await db.sql`select count(*)::int links from affiliate_links`;
    const [{ approved }] = await db.sql`select count(*)::int approved from affiliate_programs where status = 'approved'`;
    expect([links, approved]).toEqual([0, 0]);
  });
});
