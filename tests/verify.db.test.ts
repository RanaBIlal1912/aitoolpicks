// The offline data checks, the built-site checks and the automated history, on the real imported content and on deliberately broken copies of it.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { importAll } from "../src/server/import/content.ts";
import { loadContent } from "../src/server/import/content-source.ts";
import { loadSource } from "../src/server/import/source.ts";
import { runDataChecks } from "../src/server/verify/checks.ts";
import { buildReport } from "../src/server/verify/findings.ts";
import { collectUrls } from "../src/server/verify/links.ts";
import { recordAutomated } from "../src/server/verify/record.ts";
import { checkBuiltSite, expectedPaths } from "../src/server/verify/site.ts";
import { freshDatabase, pg } from "./helpers/db.ts";

const TODAY = "2026-11-03";

describe.skipIf(!pg().available)("data verification", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  const cat = loadSource(process.cwd());
  const content = loadContent(process.cwd(), cat);
  const ids = async () => (await runDataChecks(db.sql, { today: TODAY })).findings.map((f) => f.id);

  /** Run SQL with the database's own rule triggers switched off, to plant a defect the rules would normally refuse. */
  const plant = async (statements: string[]) => {
    const c = await db.sql.reserve();
    try {
      await c.unsafe("set session_replication_role = replica");
      for (const s of statements) await c.unsafe(s);
    } finally {
      await c.unsafe("reset session_replication_role");
      c.release();
    }
  };

  beforeAll(async () => {
    db = await freshDatabase();
    await importAll(db.sql, cat, content);
  }, 60_000);
  afterAll(async () => db?.drop());

  it("finds no error in the real imported content", async () => {
    const { findings } = await runDataChecks(db.sql, { today: TODAY });
    const errors = findings.filter((f) => f.severity === "error");
    expect(errors, JSON.stringify(errors.slice(0, 5))).toEqual([]);
  });

  it("reports what a person should look at, without deciding anything", async () => {
    const { humanReviewQueue } = await runDataChecks(db.sql, { today: TODAY });
    expect(humanReviewQueue.length).toBeGreaterThan(0);
    expect(humanReviewQueue.every((q) => q.entityType === "tool" && q.reason.length > 5)).toBe(true);
  });

  it("is read-only and repeatable: same findings twice, and no row anywhere changed", async () => {
    const snap = async () => (await db.sql`select (select md5(string_agg(t::text, '') ) from (select * from tools order by id) t) as tools, (select count(*) from audit_logs) as audit, (select count(*) from verification_checks) as checks`)[0];
    const before = await snap();
    const a = await ids();
    const b = await ids();
    expect(a).toEqual(b);
    expect(await snap()).toEqual(before);
  });

  describe("each rule catches its defect", () => {
    it("missing text, invalid addresses and duplicates", async () => {
      await plant([
        `update tools set tagline = '   ' where slug = 'claude'`,
        `update tools set official_url = 'https://user:secret@example.com/' where slug = 'chatgpt'`,
        `update tool_sources set url = 'https://u:p@example.com/x' where id = (select min(id) from tool_sources where tool_id = (select id from tools where slug = 'canva'))`,
        `update tools set name = (select name from tools where slug = 'notion') where slug = 'grammarly'`,
        `update tools set website_url = (select website_url from tools where slug = 'notion') where slug = 'bolt'`,
      ]);
      const { findings } = await runDataChecks(db.sql, { today: TODAY });
      const has = (id: string, sev: string) => expect(findings.find((f) => f.id === id)?.severity, id).toBe(sev);
      has("missing-text:tool:claude:tagline", "error");
      has("invalid-url:tool:chatgpt:official_url", "error");
      has("invalid-url:tool:canva:tool_sources.url", "error");
      expect(findings.some((f) => f.check === "duplicate" && f.severity === "error" && f.field === "name")).toBe(true);
      expect(findings.some((f) => f.check === "duplicate" && f.severity === "warning" && f.field === "website_url")).toBe(true);
    });

    it("categories and pricing records", async () => {
      await plant([
        `delete from tool_categories where tool_id = (select id from tools where slug = 'gemini')`,
        `delete from tool_categories where tool_id = (select id from tools where slug = 'copilot') and category_id = (select primary_category_id from tools where slug = 'copilot')`,
        `delete from pricing_plans where tool_id = (select id from tools where slug = 'cursor')`,
        `update tools set pricing_status = 'verified', pricing_checked_at = '2026-11-01' where slug = 'cursor'`,
        `update tools set pricing_checked_at = '2026-01-01' where slug = 'perplexity'`,
        `update tools set pricing_status = 'verified', verification_status = 'partial', pricing_checked_at = '2026-11-01' where slug = 'mistral'`,
      ]);
      const found = await ids();
      expect(found).toContain("category:tool:gemini");
      expect(found).toContain("category:tool:copilot");
      expect(found).toContain("pricing:tool:cursor:pricing_status");
      expect(found).toContain("pricing:tool:perplexity:pricing_checked_at");
      expect(found).toContain("pricing:tool:mistral:verification_status");
      const { findings } = await runDataChecks(db.sql, { today: TODAY });
      expect(findings.find((f) => f.id === "pricing:tool:perplexity:pricing_checked_at")?.severity).toBe("warning");
      // the staleness limit moves with the option
      const lax = (await runDataChecks(db.sql, { today: TODAY, pricingMaxAgeDays: 400 })).findings.map((f) => f.id);
      expect(lax).not.toContain("pricing:tool:perplexity:pricing_checked_at");
    });

    it("reviews: hands-on without testing, documentation with testing, future testing dates, no evidence", async () => {
      await plant([
        `update reviews set method = 'hands-on' where slug = 'claude'`,
        `insert into review_testing (review_id, tested_by, role, plan, region, tested_from, tested_to, tasks, worked, failed, conflicts)
           select id, 'A', 'B', 'C', 'D', '2026-10-01', '2026-10-02', '[{"task":"t","result":"r"}]'::jsonb, '{x}', '{y}', 'None' from reviews where slug = 'grammarly'`,
        `update reviews set method = 'hands-on' where slug = 'notion'`,
        `insert into review_testing (review_id, tested_by, role, plan, region, tested_from, tested_to, tasks, worked, failed, conflicts)
           select id, 'A', 'B', 'C', 'D', '2026-12-01', '2026-12-02', '[{"task":"t","result":"r"}]'::jsonb, '{x}', '{y}', 'None' from reviews where slug = 'notion'`,
      ]);
      const found = await ids();
      expect(found).toContain("review-method:review:claude");
      expect(found).toContain("review-method:review:grammarly");
      expect(found).toContain("review-method:review:notion:tested_to");
      expect(found.filter((i) => i.startsWith("review-method:review:notion"))).toHaveLength(2); // future date, and no https evidence while published
    });

    it("affiliate: a link on a programme that is not approved, and an approved programme with no link", async () => {
      await plant([
        `insert into affiliate_links (program_id, url) select id, 'https://go.example.com/x' from affiliate_programs where tool_id = (select id from tools where slug = 'hostinger')`,
        `update affiliate_programs set status = 'approved' where tool_id = (select id from tools where slug = 'make')`,
      ]);
      const found = await ids();
      expect(found).toContain("affiliate:tool:hostinger");
      expect(found).toContain("affiliate:tool:make");
    });

    it("news: a source date in the future, and a source nobody has checked", async () => {
      await plant([`update news_items set published_on = '2026-12-25' where slug = (select slug from news_items order by id limit 1)`]);
      const { findings } = await runDataChecks(db.sql, { today: TODAY });
      expect(findings.some((f) => f.check === "news" && f.severity === "error" && f.field === "published_on")).toBe(true);
      expect(findings.filter((f) => f.check === "news" && f.severity === "info" && f.field === "source_verified_at").length).toBe(17);
    });
  });

  describe("automated history", () => {
    it("records rows that never change a status, name nobody, and refuses to name anybody", async () => {
      const before = await db.sql`select slug, verification_status::text s, pricing_status::text p, verified_at::text v from tools order by slug`;
      const { findings } = await runDataChecks(db.sql, { today: TODAY });
      const n = await recordAutomated(db.sql, findings, "automated: data check");
      expect(n).toBeGreaterThan(0);
      const rows = await db.sql`select automated, checked_by, method, status::text s, tool_id from verification_checks`;
      expect(rows).toHaveLength(n);
      expect(rows.every((r) => r.automated === true && r.checked_by === null && r.method === "automated: data check")).toBe(true);
      expect(await db.sql`select slug, verification_status::text s, pricing_status::text p, verified_at::text v from tools order by slug`).toEqual(before);
      // each row carries the tool's current human status, unchanged
      const [{ bad }] = await db.sql`select count(*)::int bad from verification_checks c join tools t on t.id = c.tool_id where c.status <> t.verification_status`;
      expect(bad).toBe(0);
      await expect(db.sql`insert into verification_checks (tool_id, status, method, automated, checked_by) values ((select id from tools limit 1), 'partial', 'x', true, 1)`).rejects.toThrow();
    });
  });

  describe("built site", () => {
    let dir: string;
    const write = (rel: string, body = "<html></html>") => {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), body);
    };
    const sitemap = (paths: string[]) => write("sitemap.xml", `<urlset>${paths.map((p) => `<url><loc>https://example.github.io/aitoolpicks${p}</loc></url>`).join("")}</urlset>`);
    const build = async (extra: Record<string, string> = {}) => {
      const expected = [...(await expectedPaths(db.sql))];
      write("index.html", `<html><a href="/aitoolpicks/tools/">Tools</a><img src="/aitoolpicks/brand/mark.svg"></html>`);
      write("tools/index.html");
      write("brand/mark.svg", "<svg/>");
      for (const p of expected) write(`${p.slice(1)}index.html`);
      sitemap(["/", "/tools/", ...expected]);
      for (const [rel, body] of Object.entries(extra)) write(rel, body);
      return expected;
    };

    beforeAll(async () => {
      // put the content back to its published state first: the earlier tests planted defects, not status changes
      dir = fs.mkdtempSync(path.join(os.tmpdir(), "aitp-site-"));
    });
    afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

    it("expects exactly the pages the site generates", async () => {
      const exp = await expectedPaths(db.sql);
      const guides = content.articles.length - content.comparisons.length;
      const listedNews = content.news.filter((n) => !n.sameStoryAs).length;
      expect(exp.size).toBe(cat.tools.length * 2 + content.reviews.length + content.comparisons.length + guides + listedNews + content.roundups.length + cat.categories.length);
    });

    it("passes when the sitemap, the pages, the links and the images agree", async () => {
      await build();
      expect(await checkBuiltSite(db.sql, { outDir: dir })).toEqual([]);
    });

    it("catches a published page missing from the sitemap, and a sitemap page that is not published", async () => {
      const exp = await build();
      sitemap(["/", "/tools/", ...exp.filter((p) => p !== "/tools/claude/"), "/tools/ghost-tool/"]);
      const ids = (await checkBuiltSite(db.sql, { outDir: dir })).map((f) => f.id);
      expect(ids).toContain("sitemap:page:/tools/claude/");
      expect(ids).toContain("sitemap:page:/tools/ghost-tool/");
    });

    it("an archived tool leaves the expected pages", async () => {
      await db.sql`update tools set status = 'archived' where slug = 'zapier'`;
      const exp = await expectedPaths(db.sql);
      expect(exp.has("/tools/zapier/")).toBe(false);
      await db.sql`update tools set status = 'published' where slug = 'zapier'`;
    });

    it("catches a broken internal link and a missing image, once each, and ignores outside links and _next files", async () => {
      await build({
        "about/index.html": `<a href="/aitoolpicks/nowhere/">x</a><a href="/aitoolpicks/nowhere/">again</a><img src="/aitoolpicks/images/missing.png"><a href="https://example.com/">out</a><script src="/aitoolpicks/_next/static/x.js"></script><a href="/aitoolpicks/tools/#top">ok</a>`,
      });
      const f = await checkBuiltSite(db.sql, { outDir: dir });
      expect(f.map((x) => `${x.check}:${x.entityId}`).sort()).toEqual(["image:/about/", "internal-link:/about/"]);
    });

    it("refuses to run on a folder that is not a build", async () => {
      await expect(checkBuiltSite(db.sql, { outDir: path.join(dir, "nothing-here") })).rejects.toThrow(/run the build/);
    });
  });

  describe("addresses to check", () => {
    it("lists every published tool and source address, with where each belongs", async () => {
      const refs = await collectUrls(db.sql);
      expect(refs.length).toBeGreaterThan(200);
      expect(refs.every((r) => /^https:\/\//.test(r.url) || r.url.includes("u:p@") || r.url.includes("secret@"))).toBe(true);
      expect(refs.some((r) => r.entityType === "news")).toBe(true);
    });
  });

  it("a report from the real run is well-formed", async () => {
    const { findings, humanReviewQueue } = await runDataChecks(db.sql, { today: TODAY });
    const r = buildReport("data", "test", findings, humanReviewQueue);
    expect(r.counts.error + r.counts.warning + r.counts.info).toBe(findings.length);
  });
});
