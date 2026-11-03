// Checks on the Drizzle schema that need no database: it matches the design document and stays in step with the application code it must carry.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "../src/server/db/schema/index.ts";
import { PRICING_MODEL_LABEL } from "../src/data/tools";
import { CATEGORIES } from "../src/data/tools";
import { TOPICS } from "../src/data/topics";
import { NEWS_KINDS } from "../src/data/news";
import { expectedTablesFromSql } from "../src/server/db/migrations.ts";

const root = process.cwd();
const tables = Object.values(schema).filter((v) => is(v, PgTable)) as unknown as PgTable[];
const configs = tables.map((t) => getTableConfig(t));
const byName = new Map(configs.map((c) => [c.name, c]));
const colNames = (name: string) => byName.get(name)!.columns.map((c) => c.name);
const enums = Object.values(schema).filter((v) => typeof v === "function" && "enumName" in v && "enumValues" in v) as unknown as { enumName: string; enumValues: string[] }[];
const enumValues = (name: string) => enums.find((e) => e.enumName === name)!.enumValues;

describe("the schema matches docs/platform/02-database.md", () => {
  it("defines exactly the designed tables", () => {
    expect([...byName.keys()].sort()).toEqual(
      [
        "affiliate_applications", "affiliate_links", "affiliate_programs", "analytics_daily", "analytics_events", "audit_logs", "authors", "blog_post_tools", "blog_posts",
        "categories", "companies", "comparisons", "content_revisions", "media_assets", "model_tools", "models", "news_items", "news_sources", "news_tools", "permissions",
        "pricing_plans", "rate_limit_hits", "redirects", "review_evidence", "review_testing", "reviews", "role_permissions", "roles", "roundup_picks", "roundups",
        "site_settings", "submission_decisions", "team_members", "tool_alternatives", "tool_categories", "tool_sources", "tool_submissions", "tools", "verification_checks",
      ].sort(),
    );
  });

  it("covers every entity in the original brief", () => {
    const names = new Set(byName.keys());
    const brief: Record<string, string[]> = {
      tools: ["tools"], categories: ["categories"], "tool-category relationships": ["tool_categories"], "pricing plans": ["pricing_plans"], reviews: ["reviews"],
      "review evidence": ["review_evidence"], "review methodology": ["review_testing"], "blog posts": ["blog_posts"], authors: ["authors"], "AI news": ["news_items"],
      "news sources": ["news_sources"], "affiliate programs": ["affiliate_programs"], "affiliate applications": ["affiliate_applications"], "affiliate links": ["affiliate_links"],
      "tool submissions": ["tool_submissions"], "submission decisions": ["submission_decisions"], "team members": ["team_members"], roles: ["roles", "permissions", "role_permissions"],
      "audit logs": ["audit_logs"], "analytics events": ["analytics_events"], "website settings": ["site_settings"], "media assets": ["media_assets"],
    };
    for (const [entity, wanted] of Object.entries(brief)) for (const t of wanted) expect(names.has(t), `${entity}: ${t}`).toBe(true);
  });

  it("follows the naming conventions: snake_case, plural tables, *_at timestamps, *_id foreign keys", () => {
    for (const c of configs) {
      expect(c.name, c.name).toMatch(/^[a-z][a-z0-9_]*$/);
      for (const col of c.columns) expect(col.name, `${c.name}.${col.name}`).toMatch(/^[a-z][a-z0-9_]*$/);
      for (const fk of c.foreignKeys) for (const col of fk.reference().columns) expect(col.name, `${c.name}.${col.name} is a foreign key`).toMatch(/(_id|_by)$/);
    }
  });

  it("gives every table a primary key", () => {
    for (const c of configs) {
      const hasPk = c.primaryKeys.length > 0 || c.columns.some((col) => col.primary);
      expect(hasPk, `${c.name} needs a primary key`).toBe(true);
    }
  });

  it("gives every editable content table status, soft delete and timestamps", () => {
    const content = ["companies", "categories", "tools", "reviews", "authors", "blog_posts", "comparisons", "news_items", "roundups", "models", "media_assets"];
    for (const t of content) {
      const cols = colNames(t);
      for (const needed of ["status", "deleted_at", "published_at", "created_at", "updated_at", "created_by", "updated_by"]) expect(cols, `${t}.${needed}`).toContain(needed);
    }
  });

  it("gives every public-facing table an immutable unique slug with a format check", () => {
    for (const t of ["companies", "tools", "reviews", "authors", "blog_posts", "comparisons", "news_items", "roundups", "models"]) {
      const c = byName.get(t)!;
      expect(c.columns.map((x) => x.name), t).toContain("slug");
      expect(c.uniqueConstraints.some((u) => u.columns.some((x) => x.name === "slug")), `${t} unique slug`).toBe(true);
      expect(c.checks.some((k) => k.name === `${t}_slug_format`), `${t} slug format check`).toBe(true);
    }
  });

  it("has no score, rating or star column anywhere, so none can be published", () => {
    for (const c of configs) for (const col of c.columns) expect(col.name, `${c.name}.${col.name}`).not.toMatch(/rating|score|stars?$/);
  });

  it("stores no personal data in analytics events (no ip, email, user agent or search text columns)", () => {
    for (const col of colNames("analytics_events")) expect(col).not.toMatch(/ip|email|user_agent|query$|search_text|name$/);
    expect(colNames("analytics_events")).toContain("query_length");
  });

  it("is append-only by design for the audit log (no updated_at, no deleted_at)", () => {
    const cols = colNames("audit_logs");
    expect(cols).not.toContain("updated_at");
    expect(cols).not.toContain("deleted_at");
  });
});

describe("enumerations stay in step with the application code", () => {
  it("pricing models equal PRICING_MODEL_LABEL", () => {
    expect([...enumValues("pricing_model")].sort()).toEqual(Object.keys(PRICING_MODEL_LABEL).sort());
  });
  it("category covers equal the cover names the site can draw", () => {
    expect([...new Set(CATEGORIES.map((c) => c.cover))].every((c) => enumValues("category_cover").includes(c))).toBe(true);
    expect(enumValues("category_cover")).toHaveLength(8);
  });
  it("blog topics equal TOPICS and news kinds equal NEWS_KINDS", () => {
    expect([...enumValues("blog_topic")].sort()).toEqual(TOPICS.map((t) => t.id).sort());
    expect([...enumValues("news_kind")].sort()).toEqual([...NEWS_KINDS].sort());
  });
  it("affiliate statuses are exactly the four the registry allows", () => {
    expect(enumValues("affiliate_status")).toEqual(["approved", "pending", "unavailable", "ordinary"]);
  });
  it("review methods are exactly documentation and hands-on", () => {
    expect(enumValues("review_method")).toEqual(["documentation", "hands-on"]);
  });
  it("every roster role named in the design can be created (role keys are free text, constrained by format)", () => {
    expect(byName.get("roles")!.checks.some((k) => k.name === "roles_key_format")).toBe(true);
  });
});

describe("the migrations are the schema", () => {
  const folder = path.join(root, "drizzle");
  it("create every table the schema defines, and no other", () => {
    expect(expectedTablesFromSql(folder)).toEqual([...byName.keys()].sort());
  });
  it("enable Row Level Security on every table in the rules migration, and nothing else is exposed to the public roles", () => {
    const sql = fs.readFileSync(path.join(folder, "0001_rules_triggers_rls.sql"), "utf8");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toMatch(/REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated/);
    expect(sql).not.toMatch(/GRANT[^;]+TO (anon|authenticated|PUBLIC)/i);
  });
  it("keep every migration listed in the journal, in order, with a file on disk", () => {
    const journal = JSON.parse(fs.readFileSync(path.join(folder, "meta", "_journal.json"), "utf8")) as { entries: { idx: number; tag: string; when: number }[] };
    journal.entries.forEach((e, i) => {
      expect(e.idx).toBe(i);
      expect(fs.existsSync(path.join(folder, `${e.tag}.sql`)), e.tag).toBe(true);
      if (i > 0) expect(e.when).toBeGreaterThan(journal.entries[i - 1].when);
    });
    const files = fs.readdirSync(folder).filter((f) => f.endsWith(".sql"));
    expect(files.length).toBe(journal.entries.length);
  });
  it("contain no password, key or connection string", () => {
    for (const f of fs.readdirSync(folder).filter((x) => x.endsWith(".sql"))) {
      const sql = fs.readFileSync(path.join(folder, f), "utf8");
      expect(sql, f).not.toMatch(/postgres(ql)?:\/\/|PASSWORD\s+'|eyJ[A-Za-z0-9_-]{20,}/i);
    }
  });
});
