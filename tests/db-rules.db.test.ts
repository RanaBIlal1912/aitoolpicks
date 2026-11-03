// The rules the database itself enforces (constraints and triggers), tested on a real PostgreSQL. Every rule has a test that must be REFUSED.
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { asRole, failure, freshDatabase } from "./helpers/db.ts";
import type { Sql } from "../src/server/db/client.ts";

const info = inject("pg");
const d = describe.skipIf(!info.available);

const UNIQUE = "23505";
const CHECK = "23514";
const FK = "23503";
const RESTRICT = "23001";
const DENIED = "42501";

d("catalogue rules", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  let sql: Sql;
  let company: number;
  let top: number, top2: number, child: number, childOfOther: number;

  beforeAll(async () => {
    db = await freshDatabase();
    sql = db.sql;
    [{ id: company }] = await sql`insert into companies (slug, name) values ('acme', 'Acme Inc') returning id`;
    [{ id: top }] = await sql`insert into categories (slug, label, cover) values ('assistants', 'Assistants', 'neural') returning id`;
    [{ id: top2 }] = await sql`insert into categories (slug, label, cover) values ('coding', 'Coding', 'chip') returning id`;
    [{ id: child }] = await sql`insert into categories (slug, label, parent_id) values ('chatbots', 'Chatbots', ${top}) returning id`;
    [{ id: childOfOther }] = await sql`insert into categories (slug, label, parent_id) values ('editors', 'Editors', ${top2}) returning id`;
  });
  afterAll(async () => {
    await db?.drop();
  });

  const insertTool = async (s: Sql, slug: string, extra: Record<string, unknown> = {}, categories: number[] = [top], primary = top, sub: number | null = child) => {
    const [t] = await s`insert into tools (slug, name, company_id, primary_category_id, subcategory_id, tagline, description, website_url)
      values (${slug}, ${slug.toUpperCase()}, ${company}, ${primary}, ${sub}, 'tag', 'description', ${`https://${slug}.example.com`}) returning id`;
    for (const c of categories) await s`insert into tool_categories (tool_id, category_id) values (${t.id}, ${c})`;
    if (extra.status) await s`update tools set status = ${extra.status as string} where id = ${t.id}`;
    return t.id as number;
  };

  it("accepts a valid tool, sets published_at itself, and bumps updated_at on change", async () => {
    const id = await sql.begin((s) => insertTool(s as unknown as Sql, "valid-tool"));
    const [a] = await sql`select status, published_at, created_at, updated_at from tools where id = ${id}`;
    expect(a.status).toBe("draft");
    expect(a.published_at).toBeNull();
    await new Promise((r) => setTimeout(r, 15));
    await sql`update tools set status = 'published' where id = ${id}`;
    const [b] = await sql`select status, published_at, updated_at from tools where id = ${id}`;
    expect(b.published_at).not.toBeNull();
    expect(new Date(b.updated_at).getTime()).toBeGreaterThan(new Date(a.updated_at).getTime());
  });

  it("refuses a tool whose primary category is not listed in tool_categories (checked at commit)", async () => {
    const e = await failure(() => sql.begin((s) => insertTool(s as unknown as Sql, "no-link", {}, [])));
    expect(e?.code).toBe(CHECK);
    expect(e?.message).toMatch(/also be listed in tool_categories/);
  });

  it("refuses a primary category that is a subcategory, and a subcategory of another category", async () => {
    const a = await failure(() => sql.begin((s) => insertTool(s as unknown as Sql, "sub-primary", {}, [child], child, null)));
    expect(a?.message).toMatch(/top-level/);
    const b = await failure(() => sql.begin((s) => insertTool(s as unknown as Sql, "wrong-sub", {}, [top], top, childOfOther)));
    expect(b?.message).toMatch(/child of the primary category/);
  });

  it("allows extra categories, and refuses removing the primary one afterwards", async () => {
    const id = await sql.begin((s) => insertTool(s as unknown as Sql, "multi", {}, [top, top2]));
    await sql`delete from tool_categories where tool_id = ${id} and category_id = ${top2}`;
    const e = await failure(() => sql`delete from tool_categories where tool_id = ${id} and category_id = ${top}`);
    expect(e?.code).toBe(CHECK);
  });

  it("limits categories to two levels and never lets one be its own parent", async () => {
    const deep = await failure(() => sql`insert into categories (slug, label, parent_id) values ('deeper', 'Deeper', ${child})`);
    expect(deep?.code).toBe(CHECK);
    const self = await failure(() => sql`update categories set parent_id = id where id = ${top}`);
    expect(self?.code).toBe(CHECK);
    const adopt = await failure(() => sql`update categories set parent_id = ${top2} where id = ${top}`);
    expect(adopt?.message).toMatch(/has subcategories/);
  });

  it("keeps slugs unique per level: top-level globally, subcategories per parent", async () => {
    expect((await failure(() => sql`insert into categories (slug, label, cover) values ('assistants', 'Again', 'chip')`))?.code).toBe(UNIQUE);
    // The real data reuses "generation" under two parents, and a subcategory may share its parent's slug.
    await sql`insert into categories (slug, label, parent_id) values ('generation', 'Generation', ${top})`;
    await sql`insert into categories (slug, label, parent_id) values ('generation', 'Generation', ${top2})`;
    await sql`insert into categories (slug, label, parent_id) values ('assistants', 'Assistants sub', ${top})`;
    expect((await failure(() => sql`insert into categories (slug, label, parent_id) values ('generation', 'Dup', ${top})`))?.code).toBe(UNIQUE);
  });

  it("requires a cover on a top-level category", async () => {
    expect((await failure(() => sql`insert into categories (slug, label) values ('nocover', 'No cover')`))?.code).toBe(CHECK);
  });

  it("refuses bad or duplicate slugs and non-https addresses", async () => {
    for (const bad of ["Upper", "under_score", "-lead", "trail-", "dou--ble", "has space", ""]) {
      expect((await failure(() => sql`insert into companies (slug, name) values (${bad}, ${`n-${bad}`})`))?.code, `slug "${bad}"`).toBe(CHECK);
    }
    expect((await failure(() => sql`insert into companies (slug, name) values ('acme', 'Other')`))?.code).toBe(UNIQUE);
    expect((await failure(() => sql`insert into companies (slug, name) values ('acme-2', 'ACME INC')`))?.code, "names are unique ignoring case").toBe(UNIQUE);
    expect((await failure(() => sql`insert into companies (slug, name, website) values ('c3', 'C3', 'http://c3.example.com')`))?.code).toBe(CHECK);
    expect((await failure(() => sql.begin((s) => insertTool(s as unknown as Sql, "http-tool").then(() => s`update tools set official_url = 'http://x.example.com' where slug = 'http-tool'`))))?.code).toBe(CHECK);
  });

  it("refuses a published row that has no publication date", async () => {
    // The trigger sets it, so the only way to break the rule is to clear it again.
    const e = await failure(() => sql`update tools set status = 'published', published_at = null where slug = 'valid-tool'`);
    expect(e).toBeNull(); // the trigger fills it in
    const [r] = await sql`select published_at from tools where slug = 'valid-tool'`;
    expect(r.published_at).not.toBeNull();
  });

  it("refuses a tool listed as its own alternative, and a verified price with no date", async () => {
    const [{ id }] = await sql`select id from tools where slug = 'valid-tool'`;
    expect((await failure(() => sql`insert into tool_alternatives (tool_id, alternative_tool_id) values (${id}, ${id})`))?.code).toBe(CHECK);
    expect((await failure(() => sql`update tools set pricing_status = 'verified', pricing_checked_at = null where id = ${id}`))?.code).toBe(CHECK);
    await sql`update tools set pricing_status = 'verified', pricing_checked_at = '2026-10-30' where id = ${id}`;
  });

  it("guards pricing plans: three-letter capital currency, no negative amounts, one plan per position", async () => {
    const [{ id }] = await sql`select id from tools where slug = 'valid-tool'`;
    const plan = (over: Record<string, unknown> = {}) => sql`insert into pricing_plans (tool_id, position, name, audience, currency, unit, monthly)
      values (${id}, ${(over.position as number) ?? 1}, 'Pro', 'individual', ${(over.currency as string) ?? "USD"}, 'per month', ${(over.monthly as number) ?? 20})`;
    await plan();
    expect((await failure(() => plan()))?.code).toBe(UNIQUE);
    expect((await failure(() => plan({ position: 2, currency: "usd" })))?.code).toBe(CHECK);
    expect((await failure(() => plan({ position: 3, monthly: -1 })))?.code).toBe(CHECK);
    expect((await failure(() => plan({ position: 0 })))?.code).toBe(CHECK);
  });

  it("keeps an automated check from naming a person, and a source URL https", async () => {
    const [{ id }] = await sql`select id from tools where slug = 'valid-tool'`;
    const [{ id: m }] = await sql`insert into roles (key, label, is_system) values ('owner', 'Owner', true) on conflict (key) do update set label = 'Owner' returning id`;
    const [{ id: member }] = await sql`insert into team_members (email, role_id, status) values ('a@example.com', ${m}, 'active') returning id`;
    expect((await failure(() => sql`insert into verification_checks (tool_id, status, automated, checked_by) values (${id}, 'verified', true, ${member})`))?.code).toBe(CHECK);
    await sql`insert into verification_checks (tool_id, status, automated) values (${id}, 'partial', true)`;
    await sql`insert into verification_checks (tool_id, status, automated, checked_by) values (${id}, 'verified', false, ${member})`;
    expect((await failure(() => sql`insert into tool_sources (tool_id, label, url) values (${id}, 'x', 'ftp://x.example.com')`))?.code).toBe(CHECK);
  });

  it("refuses to delete a company or category that a tool still uses", async () => {
    // ON DELETE RESTRICT raises 23001; a plain foreign key raises 23503. Either way the delete is refused.
    expect([RESTRICT, FK]).toContain((await failure(() => sql`delete from companies where id = ${company}`))?.code);
    expect([RESTRICT, FK]).toContain((await failure(() => sql`delete from categories where id = ${top}`))?.code);
  });
});

d("review rules (mirror src/lib/review-trust.ts)", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  let sql: Sql;
  let toolId: number;

  beforeAll(async () => {
    db = await freshDatabase();
    sql = db.sql;
    const [{ id: co }] = await sql`insert into companies (slug, name) values ('acme', 'Acme') returning id`;
    const [{ id: cat }] = await sql`insert into categories (slug, label, cover) values ('assistants', 'Assistants', 'neural') returning id`;
    await sql.begin(async (s) => {
      const [t] = await s`insert into tools (slug, name, company_id, primary_category_id, tagline, description, website_url) values ('t1', 'T1', ${co}, ${cat}, 'a', 'b', 'https://t1.example.com') returning id`;
      await s`insert into tool_categories (tool_id, category_id) values (${t.id}, ${cat})`;
      toolId = t.id;
    });
  });
  afterAll(async () => {
    await db?.drop();
  });

  const review = (s: Sql, slug: string, method: string, status = "draft") =>
    s`insert into reviews (slug, tool_id, title, summary, method, status) values (${slug}, ${toolId}, 'T', 'S', ${method}, ${status}) returning id`;
  const testing = (s: Sql, id: number, over: Record<string, unknown> = {}) => s`insert into review_testing (review_id, tested_by, role, plan, region, tested_from, tested_to, hours, tasks, worked, failed, conflicts)
    values (${id}, ${(over.by as string) ?? "A. Tester"}, 'writer', 'Pro, paid', 'Pakistan', ${(over.from as string) ?? "2026-10-20"}, ${(over.to as string) ?? "2026-10-27"}, ${(over.hours as number | null) ?? 6},
      ${s.json((over.tasks as never) ?? [{ task: "Draft", result: "ok" }])}, ${(over.worked as string[]) ?? ["Tone"]}, ${(over.failed as string[]) ?? ["Invented a figure"]}, ${(over.conflicts as string) ?? "None."})`;

  it("accepts a documentation review with no testing record, and names its reviewer by default", async () => {
    const [{ id }] = await review(sql, "doc-review", "documentation");
    const [r] = await sql`select method, reviewer_name from reviews where id = ${id}`;
    expect(r.method).toBe("documentation");
    expect(r.reviewer_name).toBe("AI Tool Picks editors");
  });

  it("requires a method on every review", async () => {
    expect((await failure(() => sql`insert into reviews (slug, tool_id, title, summary) values ('no-method', ${toolId}, 'T', 'S')`))?.code).toBe("23502");
  });

  it("refuses a hands-on review with no testing record (checked at commit)", async () => {
    const e = await failure(() => review(sql, "fake-hands-on", "hands-on"));
    expect(e?.code).toBe(CHECK);
    expect(e?.message).toMatch(/needs a testing record/);
  });

  it("refuses a documentation review that carries a testing record", async () => {
    const e = await failure(() =>
      sql.begin(async (s) => {
        const [{ id }] = await review(s as unknown as Sql, "doc-with-test", "documentation");
        await testing(s as unknown as Sql, id);
      }),
    );
    expect(e?.code).toBe(CHECK);
    expect(e?.message).toMatch(/must not carry a testing record/);
  });

  it("accepts a complete hands-on review, published with an https evidence link", async () => {
    await sql.begin(async (s) => {
      const [{ id }] = await review(s as unknown as Sql, "real-hands-on", "hands-on", "published");
      await testing(s as unknown as Sql, id);
      await s`insert into review_evidence (review_id, label, url) values (${id}, 'Prompt log', 'https://example.com/log')`;
    });
    const [r] = await sql`select status, published_at from reviews where slug = 'real-hands-on'`;
    expect(r.status).toBe("published");
    expect(r.published_at).not.toBeNull();
  });

  it("refuses to publish a hands-on review that has no evidence with an https address", async () => {
    const e = await failure(() =>
      sql.begin(async (s) => {
        const [{ id }] = await review(s as unknown as Sql, "no-evidence", "hands-on", "published");
        await testing(s as unknown as Sql, id);
        await s`insert into review_evidence (review_id, label, caption) values (${id}, 'Notes only', 'no link')`.catch(() => null);
      }),
    );
    expect(e?.code).toBe(CHECK);
  });

  it("refuses evidence that is not https, has no label, or points at nothing", async () => {
    const [{ id }] = await sql`select id from reviews where slug = 'real-hands-on'`;
    expect((await failure(() => sql`insert into review_evidence (review_id, label, url) values (${id}, 'x', 'http://example.com/x')`))?.code).toBe(CHECK);
    expect((await failure(() => sql`insert into review_evidence (review_id, label, url) values (${id}, '  ', 'https://example.com/x')`))?.code).toBe(CHECK);
    expect((await failure(() => sql`insert into review_evidence (review_id, label) values (${id}, 'nothing')`))?.code).toBe(CHECK);
  });

  const handsOn = async (slug: string, over: Record<string, unknown>) =>
    failure(() =>
      sql.begin(async (s) => {
        const [{ id }] = await review(s as unknown as Sql, slug, "hands-on");
        await testing(s as unknown as Sql, id, over);
      }),
    );

  it("refuses bad testing records: reversed or future dates, blank people, no tasks, nothing worked or failed, no conflicts statement", async () => {
    expect((await handsOn("r1", { from: "2026-10-28", to: "2026-10-27" }))?.code, "reversed dates").toBe(CHECK);
    expect((await handsOn("r2", { to: "2999-01-01" }))?.message, "future date").toMatch(/in the future/);
    expect((await handsOn("r3", { from: "2999-01-01", to: "2999-01-02" }))?.message, "future start").toMatch(/in the future/);
    expect((await handsOn("r4", { by: "   " }))?.code, "blank tester").toBe(CHECK);
    expect((await handsOn("r5", { tasks: [] }))?.code, "no tasks").toBe(CHECK);
    expect((await handsOn("r6", { worked: [] }))?.code, "nothing worked").toBe(CHECK);
    expect((await handsOn("r7", { failed: [] }))?.code, "nothing failed").toBe(CHECK);
    expect((await handsOn("r8", { conflicts: "" }))?.code, "no conflicts statement").toBe(CHECK);
    expect((await handsOn("r9", { hours: 0 }))?.code, "zero hours").toBe(CHECK);
  });

  it("refuses an impossible calendar date outright (the database cannot even store 2026-02-31)", async () => {
    const e = await handsOn("r10", { from: "2026-02-31", to: "2026-03-02" });
    expect(e?.code).toBe("22008");
  });

  it("has no column that could hold a score or rating", async () => {
    const cols = await sql`select column_name from information_schema.columns where table_name in ('reviews', 'review_testing', 'review_evidence')`;
    for (const c of cols) expect(c.column_name).not.toMatch(/rating|score|star/);
  });
});

d("affiliate rules (mirror src/lib/affiliate.ts)", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  let sql: Sql;
  let programId: number;

  beforeAll(async () => {
    db = await freshDatabase();
    sql = db.sql;
    const [{ id: co }] = await sql`insert into companies (slug, name) values ('acme', 'Acme') returning id`;
    const [{ id: cat }] = await sql`insert into categories (slug, label, cover) values ('assistants', 'Assistants', 'neural') returning id`;
    const [t] = await sql.begin(async (s) => {
      const [x] = await s`insert into tools (slug, name, company_id, primary_category_id, tagline, description, website_url) values ('t1', 'T1', ${co}, ${cat}, 'a', 'b', 'https://t1.example.com') returning id`;
      await s`insert into tool_categories (tool_id, category_id) values (${x.id}, ${cat})`;
      return [x];
    });
    [{ id: programId }] = await sql`insert into affiliate_programs (tool_id) values (${t.id}) returning id`;
  });
  afterAll(async () => {
    await db?.drop();
  });

  it("starts as ordinary, so nothing earns a commission by default", async () => {
    const [p] = await sql`select status from affiliate_programs where id = ${programId}`;
    expect(p.status).toBe("ordinary");
  });

  it("refuses a link for a programme that is not approved", async () => {
    for (const status of ["ordinary", "pending"]) {
      await sql`update affiliate_programs set status = ${status} where id = ${programId}`;
      const e = await failure(() => sql`insert into affiliate_links (program_id, url) values (${programId}, 'https://go.example.com/x')`);
      expect(e?.code, status).toBe(CHECK);
      expect(e?.message).toMatch(/approved programme/);
    }
  });

  it("accepts https links for an approved programme, one per country, never http", async () => {
    await sql`update affiliate_programs set status = 'approved' where id = ${programId}`;
    await sql`insert into affiliate_links (program_id, url) values (${programId}, 'https://go.example.com/x')`;
    await sql`insert into affiliate_links (program_id, country_code, url) values (${programId}, 'PK', 'https://go.example.com/pk')`;
    expect((await failure(() => sql`insert into affiliate_links (program_id, url) values (${programId}, 'https://go.example.com/y')`))?.code, "default twice").toBe(UNIQUE);
    expect((await failure(() => sql`insert into affiliate_links (program_id, country_code, url) values (${programId}, 'GB', 'http://go.example.com/gb')`))?.code, "http").toBe(CHECK);
    expect((await failure(() => sql`insert into affiliate_links (program_id, country_code, url) values (${programId}, 'gb', 'https://go.example.com/gb')`))?.code, "country format").toBe(CHECK);
  });

  it("refuses to take an approved programme back to another state while links exist", async () => {
    const e = await failure(() => sql`update affiliate_programs set status = 'pending' where id = ${programId}`);
    expect(e?.code).toBe(CHECK);
    await sql`delete from affiliate_links where program_id = ${programId}`;
    await sql`update affiliate_programs set status = 'pending' where id = ${programId}`;
  });

  it("makes an unavailable programme cite its source and say why", async () => {
    expect((await failure(() => sql`update affiliate_programs set status = 'unavailable' where id = ${programId}`))?.code).toBe(CHECK);
    expect((await failure(() => sql`update affiliate_programs set status = 'unavailable', source_url = 'https://x.example.com/p', note = 'too short' where id = ${programId}`))?.code).toBe(CHECK);
    await sql`update affiliate_programs set status = 'unavailable', source_url = 'https://x.example.com/p', note = 'The programme page says it is not accepting new affiliates.' where id = ${programId}`;
  });

  it("keeps application history consistent with its dates", async () => {
    expect((await failure(() => sql`insert into affiliate_applications (program_id, status) values (${programId}, 'submitted')`))?.code).toBe(CHECK);
    expect((await failure(() => sql`insert into affiliate_applications (program_id, status, submitted_at) values (${programId}, 'approved', now())`))?.code).toBe(CHECK);
    await sql`insert into affiliate_applications (program_id, status, submitted_at, decided_at) values (${programId}, 'approved', now(), now())`;
  });
});

d("audit log, team and submissions", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  let sql: Sql;
  let ownerRole: number, editorRole: number;

  beforeAll(async () => {
    db = await freshDatabase();
    sql = db.sql;
    [{ id: ownerRole }] = await sql`insert into roles (key, label, is_system) values ('owner', 'Owner', true) returning id`;
    [{ id: editorRole }] = await sql`insert into roles (key, label, is_system) values ('editor', 'Editor', true) returning id`;
  });
  afterAll(async () => {
    await db?.drop();
  });

  it("appends to the audit log but never changes or deletes it, even for a superuser", async () => {
    await asRole(sql, "app", (s) => s`insert into audit_logs (action, entity_type, entity_id, after) values ('tool.publish', 'tool', '1', '{"status":"published"}'::jsonb)`);
    const [row] = await sql`select id from audit_logs limit 1`;
    expect((await failure(() => sql`update audit_logs set action = 'tool.edit' where id = ${row.id}`))?.code).toBe(DENIED);
    expect((await failure(() => sql`delete from audit_logs where id = ${row.id}`))?.code).toBe(DENIED);
    expect((await failure(() => sql`truncate audit_logs`))?.code).toBe(DENIED);
    expect((await failure(() => asRole(sql, "app", (s) => s`update audit_logs set action = 'x.y' where id = ${row.id}`)))?.code).toBe(DENIED);
    expect((await failure(() => asRole(sql, "app", (s) => s`delete from audit_logs`)))?.code).toBe(DENIED);
    const [{ n }] = await sql`select count(*)::int as n from audit_logs`;
    expect(n).toBe(1);
  });

  it("requires action names in the form entity.verb", async () => {
    for (const bad of ["publish", "Tool.Publish", "tool.", ""]) expect((await failure(() => sql`insert into audit_logs (action) values (${bad})`))?.code, bad).toBe(CHECK);
  });

  it("refuses a bad email, a duplicate email in any case, and an inconsistent disabled state", async () => {
    expect((await failure(() => sql`insert into team_members (email, role_id) values ('not-an-email', ${editorRole})`))?.code).toBe(CHECK);
    await sql`insert into team_members (email, role_id, status) values ('Ed@Example.com', ${editorRole}, 'active')`;
    expect((await failure(() => sql`insert into team_members (email, role_id) values ('ed@example.com', ${editorRole})`))?.code).toBe(UNIQUE);
    expect((await failure(() => sql`insert into team_members (email, role_id, status) values ('d@example.com', ${editorRole}, 'disabled')`))?.code, "disabled without a date").toBe(CHECK);
  });

  it("never lets the last active owner be demoted, disabled or deleted", async () => {
    const [{ id: only }] = await sql`insert into team_members (email, role_id, status) values ('owner@example.com', ${ownerRole}, 'active') returning id`;
    const demote = await failure(() => sql`update team_members set role_id = ${editorRole} where id = ${only}`);
    expect(demote?.message).toMatch(/last active owner/);
    expect((await failure(() => sql`update team_members set status = 'disabled', disabled_at = now() where id = ${only}`))?.message).toMatch(/last active owner/);
    expect((await failure(() => sql`delete from team_members where id = ${only}`))?.message).toMatch(/last active owner/);
    // With a second active owner the first can be demoted; the second then becomes the last.
    const [{ id: second }] = await sql`insert into team_members (email, role_id, status) values ('owner2@example.com', ${ownerRole}, 'active') returning id`;
    await sql`update team_members set role_id = ${editorRole} where id = ${only}`;
    expect((await failure(() => sql`update team_members set role_id = ${editorRole} where id = ${second}`))?.message).toMatch(/last active owner/);
    // Inviting or disabling people who are not owners is unaffected.
    await sql`update team_members set status = 'active' where id = ${only}`;
  });

  it("requires a different person to approve a change that needs a second person", async () => {
    const [{ id: a }] = await sql`select id from team_members where email = 'owner2@example.com'`;
    const [{ id: b }] = await sql`select id from team_members where email = 'owner@example.com'`;
    const rev = (extra: string) => sql.unsafe(`insert into content_revisions (entity_type, entity_id, revision, data, state, requires_second_person, created_by, approved_by) values ${extra}`);
    expect((await failure(() => rev(`('tool', 1, 1, '{}'::jsonb, 'approved', true, ${a}, ${a})`)))?.code, "self approval").toBe(CHECK);
    expect((await failure(() => rev(`('tool', 1, 2, '{}'::jsonb, 'approved', false, ${a}, null)`)))?.code, "approved by nobody").toBe(CHECK);
    await rev(`('tool', 1, 3, '{}'::jsonb, 'approved', true, ${a}, ${b})`);
    await rev(`('tool', 1, 4, '{}'::jsonb, 'approved', false, ${a}, ${a})`); // allowed when only one person can publish
    expect((await failure(() => rev(`('tool', 1, 3, '{}'::jsonb, 'draft', false, ${a}, null)`)))?.code, "duplicate revision number").toBe(UNIQUE);
  });

  const submission = (over: Record<string, unknown> = {}) => sql`insert into tool_submissions (name, website_url, website_host, company, description, features, pricing_url, status)
    values (${(over.name as string) ?? "New Tool"}, 'https://new.example.com', ${(over.host as string) ?? "new.example.com"}, 'Maker', ${(over.description as string) ?? "A tool that does something useful for people."}, 'Feature one, two', 'https://new.example.com/pricing', ${(over.status as string) ?? "new"})`;

  it("accepts a submission, blocks a second open one for the same website, and allows it again after a rejection", async () => {
    await submission();
    expect((await failure(() => submission({ name: "Same Site" })))?.code).toBe(UNIQUE);
    await sql`update tool_submissions set status = 'rejected' where website_host = 'new.example.com'`;
    await submission({ name: "Resubmitted" });
  });

  it("refuses badly formed submissions: short text, www or upper-case host, no host dot, duplicate without a target", async () => {
    expect((await failure(() => submission({ host: "other.example.com", description: "too short" })))?.code).toBe(CHECK);
    expect((await failure(() => submission({ host: "www.other.example.com" })))?.code).toBe(CHECK);
    expect((await failure(() => submission({ host: "Other.Example.com" })))?.code).toBe(CHECK);
    expect((await failure(() => submission({ host: "localhost" })))?.code).toBe(CHECK);
    expect((await failure(() => submission({ host: "dup.example.com", status: "duplicate" })))?.code).toBe(CHECK);
  });

  it("hands the submitter a public id that is not the row number", async () => {
    const [r] = await sql`select id, public_id from tool_submissions limit 1`;
    expect(String(r.public_id)).toMatch(/^[0-9a-f-]{36}$/);
    expect(String(r.public_id)).not.toBe(String(r.id));
  });

  it("prunes old rate-limit counters", async () => {
    await sql`insert into rate_limit_hits (key_hash, route, window_start, count) values ('k', 'login', now() - interval '3 hours', 3), ('k', 'login', now(), 1)`;
    const [{ prune_rate_limit_hits: n }] = await sql`select public.prune_rate_limit_hits() as prune_rate_limit_hits`;
    expect(Number(n)).toBe(1);
    expect((await failure(() => sql`insert into rate_limit_hits (key_hash, route, window_start, count) values ('k2', 'x', now(), 0)`))?.code).toBe(CHECK);
  });
});

d("news, media and redirects", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  let sql: Sql;
  beforeAll(async () => {
    db = await freshDatabase();
    sql = db.sql;
  });
  afterAll(async () => {
    await db?.drop();
  });

  const news = (s: Sql, over: Record<string, unknown> = {}) => s`insert into news_items (slug, kind, tag, importance, title, published_on, source_id, source_url, summary)
    values (${(over.slug as string) ?? "n1"}, 'Feature update', 'Products', ${(over.importance as number) ?? 2}, 'T', '2026-10-29', ${over.source as number}, ${(over.url as string) ?? "https://news.example.com/a"}, 'S') returning id`;

  it("guards news: importance 1 to 3, https source, unique source URL, one source name in any case, no story that duplicates itself", async () => {
    const [{ id: src }] = await sql`insert into news_sources (name, website) values ('Google (The Keyword)', 'https://blog.google') returning id`;
    expect((await failure(() => sql`insert into news_sources (name) values ('google (the keyword)')`))?.code).toBe(UNIQUE);
    const [{ id }] = await news(sql, { source: src });
    expect((await failure(() => news(sql, { source: src, slug: "n2", importance: 4 })))?.code).toBe(CHECK);
    expect((await failure(() => news(sql, { source: src, slug: "n3", url: "http://news.example.com/b" })))?.code).toBe(CHECK);
    expect((await failure(() => news(sql, { source: src, slug: "n4" })))?.code, "same source URL").toBe(UNIQUE);
    expect((await failure(() => sql`update news_items set same_story_as_id = id where id = ${id}`))?.code).toBe(CHECK);
  });

  it("guards media: relative paths only, no climbing out of the folder, a real mime type and a 64-character hash", async () => {
    const m = (path: string, mime = "image/png", sha: string | null = null) => sql`insert into media_assets (path, kind, mime, sha256) values (${path}, 'logo', ${mime}, ${sha})`;
    await m("logos/a.png");
    expect((await failure(() => m("logos/a.png")))?.code, "same path twice").toBe(UNIQUE);
    expect((await failure(() => m("https://evil.example.com/a.png")))?.code).toBe(CHECK);
    expect((await failure(() => m("logos/../../etc/passwd")))?.code).toBe(CHECK);
    expect((await failure(() => m("logos/b.png", "not a mime")))?.code).toBe(CHECK);
    expect((await failure(() => m("logos/c.png", "image/png", "xyz")))?.code).toBe(CHECK);
    await m("logos/d.png", "image/svg+xml", "a".repeat(64));
  });

  it("guards redirects: relative targets, not to themselves, a real status code", async () => {
    const r = (from: string, to: string, code = 308) => sql`insert into redirects (from_path, to_path, status_code) values (${from}, ${to}, ${code})`;
    await r("/best-ai-writing-tools.html", "/best/writing/");
    expect((await failure(() => r("/best-ai-writing-tools.html", "/x/")))?.code).toBe(UNIQUE);
    expect((await failure(() => r("/a/", "/a/")))?.code).toBe(CHECK);
    expect((await failure(() => r("a", "/b/")))?.code).toBe(CHECK);
    expect((await failure(() => r("/c/", "/d/", 200)))?.code).toBe(CHECK);
  });

  it("guards analytics: no event can carry a long search text or a malformed country, and daily counts are never negative", async () => {
    expect((await failure(() => sql`insert into analytics_events (event, country) values ('page_view', 'pk')`))?.code).toBe(CHECK);
    expect((await failure(() => sql`insert into analytics_events (event, query_length) values ('directory_search', 9999)`))?.code).toBe(CHECK);
    await sql`insert into analytics_events (event, path_group, device_class, country, query_length) values ('directory_search', 'tools', 'mobile', 'PK', 12)`;
    expect((await failure(() => sql`insert into analytics_daily (day, event, count) values ('2026-11-03', 'page_view', -1)`))?.code).toBe(CHECK);
  });
});
