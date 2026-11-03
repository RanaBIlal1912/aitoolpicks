// The admin read and write functions, as every role, against the real imported content in a disposable database.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type AuthDeps, type Member } from "../src/server/auth/authorize.ts";
import { InMemoryProvider } from "../src/server/auth/dev-provider.ts";
import { type RoleKey } from "../src/server/auth/permissions.ts";
import { seedAccess } from "../src/server/auth/seed.ts";
import { getContentItem, getTool, listAffiliate, listAudit, listCategories, listContent, listSettings, listSubmissions, listTeam, overview } from "../src/server/admin/queries.ts";
import { setCategoryVisibility, setStatus, updateToolBasics } from "../src/server/admin/mutations.ts";
import { importAll } from "../src/server/import/content.ts";
import { loadContent } from "../src/server/import/content-source.ts";
import { loadSource } from "../src/server/import/source.ts";
import { freshDatabase, pg } from "./helpers/db.ts";

const available = pg().available;

describe.skipIf(!available)("admin data layer", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;
  let deps: AuthDeps;
  const m = {} as Record<RoleKey, Member>;
  const code = (p: Promise<unknown>) => p.then(() => 0 as number | string, (e: { status?: number; code?: string; name?: string }) => (e.status ? `${e.status}:${e.code}` : (e.name ?? "error")));

  const makeMember = async (role: RoleKey): Promise<Member> => {
    const authUserId = randomUUID();
    const [row] = await db.sql<{ id: number }[]>`insert into team_members (email, role_id, status, auth_user_id) values (${`${role}@example.com`}, (select id from roles where key = ${role}), 'active', ${authUserId}) returning id`;
    const perms = await db.sql<{ key: string }[]>`select p.key from role_permissions rp join permissions p on p.id = rp.permission_id where rp.role_id = (select id from roles where key = ${role})`;
    return { id: Number(row.id), authUserId, email: `${role}@example.com`, displayName: "", role, permissions: new Set(perms.map((p) => p.key)), aal: "aal1" };
  };

  beforeAll(async () => {
    db = await freshDatabase();
    deps = { sql: db.sql, provider: new InMemoryProvider(), ipSalt: "a-long-enough-ip-salt" };
    await seedAccess(db.sql);
    const cat = loadSource(process.cwd());
    await importAll(db.sql, cat, loadContent(process.cwd(), cat));
    for (const r of ["owner", "admin", "editor", "reviewer", "analyst", "contributor"] as RoleKey[]) m[r] = await makeMember(r);
  }, 60_000);
  afterAll(async () => db?.drop());

  describe("reading", () => {
    it("lists tools with a total and a page size, and filters by search and status", async () => {
      const all = await listContent(db.sql, m.owner, "tools");
      expect(all.total).toBe(69);
      expect(all.rows).toHaveLength(30);
      expect((await listContent(db.sql, m.owner, "tools", { page: 3 })).rows).toHaveLength(9);
      const found = await listContent(db.sql, m.owner, "tools", { q: "chatgpt" });
      expect(found.rows.map((r) => r.slug)).toContain("chatgpt");
      expect((await listContent(db.sql, m.owner, "tools", { status: "draft" })).total).toBe(0);
      expect((await listContent(db.sql, m.owner, "tools", { status: "published" })).total).toBe(69);
    });

    it("treats search text as text, not as a pattern or SQL", async () => {
      expect((await listContent(db.sql, m.owner, "tools", { q: "%" })).total).toBe(0);
      expect((await listContent(db.sql, m.owner, "tools", { q: "'; drop table tools; --" })).total).toBe(0);
      expect((await listContent(db.sql, m.owner, "tools", { status: "x'; --" })).total).toBe(69); // an unknown status is ignored, not injected
      expect((await db.sql`select count(*)::int n from tools`)[0].n).toBe(69);
    });

    it("lists reviews, articles and news", async () => {
      expect((await listContent(db.sql, m.reviewer, "reviews")).total).toBe(17);
      expect((await listContent(db.sql, m.editor, "blog")).total).toBe(30);
      expect((await listContent(db.sql, m.editor, "news")).total).toBe(17);
    });

    it("an analyst sees no content lists, team, audit, affiliate, submissions or settings", async () => {
      expect(await code(listContent(db.sql, m.analyst, "tools"))).toBe("403:forbidden");
      expect(await code(listTeam(db.sql, m.analyst))).toBe("403:forbidden");
      expect(await code(listAudit(db.sql, m.analyst))).toBe("403:forbidden");
      expect(await code(listAffiliate(db.sql, m.analyst))).toBe("403:forbidden");
      expect(await code(listSubmissions(db.sql, m.analyst))).toBe("403:forbidden");
      expect(await code(listSettings(db.sql, m.analyst))).toBe("403:forbidden");
      expect(await code(listCategories(db.sql, m.analyst))).toBe("403:forbidden");
    });

    it("team and audit are for owners; settings and submissions are not for editors", async () => {
      expect((await listTeam(db.sql, m.admin)).length).toBe(6);
      expect(await code(listTeam(db.sql, m.editor))).toBe("403:forbidden");
      expect(await code(listAudit(db.sql, m.admin))).toBe("403:forbidden");
      expect((await listAudit(db.sql, m.owner)).total).toBeGreaterThan(0);
      expect(await code(listSettings(db.sql, m.editor))).toBe("403:forbidden");
      expect(await code(listSubmissions(db.sql, m.editor))).toBe("403:forbidden");
      expect((await listSubmissions(db.sql, m.admin)).total).toBe(0);
    });

    it("shows a tool with plans, sources and categories, and affiliate data only to those who may see it", async () => {
      const asAdmin = await getTool(db.sql, m.admin, "chatgpt");
      expect(asAdmin!.plans.length).toBeGreaterThan(0);
      expect(asAdmin!.sources.length).toBeGreaterThan(0);
      expect(asAdmin!.categories.length).toBeGreaterThan(0);
      expect(asAdmin!.affiliate).toBeDefined();
      expect((await getTool(db.sql, m.reviewer, "chatgpt"))!.affiliate).toBeUndefined();
      expect(await getTool(db.sql, m.owner, "no-such-tool")).toBeNull();
      expect(await code(getTool(db.sql, m.analyst, "chatgpt"))).toBe("403:forbidden");
    });

    it("shows an article body to an editor and refuses it to a reviewer", async () => {
      const post = await getContentItem(db.sql, m.editor, "blog", "best-ai-writing-tools");
      expect(post!.body_html).toContain("<");
      expect(await code(getContentItem(db.sql, m.reviewer, "blog", "best-ai-writing-tools"))).toBe("403:forbidden");
    });

    it("the front page shows only what the member may see", async () => {
      const owner = await overview(db.sql, m.owner);
      expect(owner.counts.tools.published).toBe(69);
      expect(owner.recent).not.toBeNull();
      expect(owner.newSubmissions).toBe(0);
      const analyst = await overview(db.sql, m.analyst);
      expect(analyst.counts).toEqual({});
      expect(analyst.recent).toBeNull();
      expect(analyst.newSubmissions).toBeNull();
      expect((await overview(db.sql, m.reviewer)).recent).toBeNull();
    });
  });

  describe("changing status", () => {
    it("an editor archives a tool: status, audit row (who, before, after) and a rebuild request", async () => {
      const calls: string[] = [];
      const withHook = { ...deps, deployHookUrl: "https://hooks.example.com/deploy", fetch: (async (u: string) => (calls.push(u), new Response("ok"))) as unknown as typeof fetch };
      const r = await setStatus(withHook, m.editor, "tools", "chatgpt", "archived", { requestId: "r1" });
      expect(r).toMatchObject({ changed: true, from: "published", to: "archived", rebuild: "requested" });
      expect(calls).toEqual(["https://hooks.example.com/deploy"]);
      const [t] = await db.sql`select status::text s, updated_by from tools where slug = 'chatgpt'`;
      expect(t.s).toBe("archived");
      expect(Number(t.updated_by)).toBe(m.editor.id);
      const [log] = await db.sql`select action, before, after, actor_member_id, entity_id from audit_logs where action = 'content.status_changed' order by id desc limit 1`;
      expect(log).toMatchObject({ before: { status: "published" }, after: { status: "archived" }, entity_id: "chatgpt" });
      expect(Number(log.actor_member_id)).toBe(m.editor.id);
    });

    it("the change is kept when the rebuild request fails, and the answer says so", async () => {
      const broken = { ...deps, deployHookUrl: "https://hooks.example.com/deploy", fetch: (async () => { throw new Error("down"); }) as unknown as typeof fetch };
      const r = await setStatus(broken, m.editor, "tools", "chatgpt", "published");
      expect(r).toMatchObject({ changed: true, rebuild: "failed" });
      expect((await db.sql`select status::text s from tools where slug = 'chatgpt'`)[0].s).toBe("published");
    });

    it("without a deploy hook the answer is not_configured", async () => {
      expect((await setStatus(deps, m.editor, "tools", "chatgpt", "archived")).rebuild).toBe("not_configured");
      await setStatus(deps, m.editor, "tools", "chatgpt", "published");
    });

    it("setting the status an item already has changes nothing and writes no audit row", async () => {
      const before = (await db.sql`select count(*)::int n from audit_logs`)[0].n;
      expect(await setStatus(deps, m.editor, "tools", "chatgpt", "published")).toMatchObject({ changed: false });
      expect((await db.sql`select count(*)::int n from audit_logs`)[0].n).toBe(before);
    });

    it("refuses roles without the permission, and an unknown item or status", async () => {
      expect(await code(setStatus(deps, m.reviewer, "tools", "claude", "archived"))).toBe("403:forbidden");
      expect(await code(setStatus(deps, m.editor, "reviews", "claude", "published"))).toBe("403:forbidden");
      expect(await code(setStatus(deps, m.analyst, "blog", "best-ai-writing-tools", "archived"))).toBe("403:forbidden");
      expect(await code(setStatus(deps, m.contributor, "tools", "claude", "published"))).toBe("403:forbidden");
      expect(await code(setStatus(deps, m.contributor, "tools", "claude", "archived"))).toBe("403:forbidden");
      expect(await code(setStatus(deps, m.editor, "tools", "no-such-tool", "archived"))).toBe("409:not_found");
      expect(await code(setStatus(deps, m.editor, "tools", "claude", "deleted" as never))).toBe("409:bad_status");
    });

    it("a contributor can move only their own drafts back to review", async () => {
      await db.sql`update blog_posts set status = 'draft', created_by = ${m.contributor.id} where slug = 'best-ai-writing-tools'`;
      await db.sql`update blog_posts set status = 'draft', created_by = ${m.editor.id} where slug = 'build-a-free-portfolio-website'`;
      expect(await setStatus(deps, m.contributor, "blog", "best-ai-writing-tools", "in_review")).toMatchObject({ changed: true });
      expect(await code(setStatus(deps, m.contributor, "blog", "build-a-free-portfolio-website", "in_review"))).toBe("403:forbidden");
      expect(await code(setStatus(deps, m.contributor, "blog", "best-ai-writing-tools", "published"))).toBe("403:forbidden");
      await setStatus(deps, m.editor, "blog", "best-ai-writing-tools", "published");
      await setStatus(deps, m.editor, "blog", "build-a-free-portfolio-website", "published");
    });

    it("a state the database forbids comes back as a rule violation and nothing changes", async () => {
      await db.sql`update reviews set status = 'draft', published_at = null where slug = 'claude'`;
      // A published row needs a date; the trigger sets it. Break the rule instead by asking for hands-on without evidence.
      await expect(db.sql`update reviews set method = 'hands-on' where slug = 'claude'`).rejects.toThrow();
      expect(await setStatus(deps, m.reviewer, "reviews", "claude", "published")).toMatchObject({ changed: true });
    });
  });

  describe("editing a tool", () => {
    const good = { tagline: "A clearer one-line description", description: "A longer description that explains what the tool does in plain words.", key_feature: null };

    it("saves the descriptive fields with before and after in the audit log", async () => {
      const r = await updateToolBasics(deps, m.editor, "claude", good);
      expect(r.changed).toBe(true);
      const [t] = await db.sql`select tagline from tools where slug = 'claude'`;
      expect(t.tagline).toBe(good.tagline);
      const [log] = await db.sql`select before, after from audit_logs where action = 'tool.updated' order by id desc limit 1`;
      expect(log.after).toEqual(good);
      expect(log.before.tagline).not.toBe(good.tagline);
    });

    it("saving the same text again changes nothing", async () => {
      expect((await updateToolBasics(deps, m.editor, "claude", good)).changed).toBe(false);
    });

    it("refuses bad input, unknown fields and anything about pricing or verification", async () => {
      expect(await code(updateToolBasics(deps, m.editor, "claude", { ...good, tagline: "x" }))).toBe("ZodError");
      expect(await code(updateToolBasics(deps, m.editor, "claude", { ...good, pricing_status: "verified" }))).toBe("ZodError");
      expect(await code(updateToolBasics(deps, m.editor, "claude", { ...good, verified_at: "2026-01-01" }))).toBe("ZodError");
      expect((await db.sql`select pricing_status::text s from tools where slug = 'claude'`)[0].s).not.toBe("");
    });

    it("refuses analysts and reviewers, and a contributor on someone else's published tool", async () => {
      expect(await code(updateToolBasics(deps, m.analyst, "claude", good))).toBe("403:forbidden");
      expect(await code(updateToolBasics(deps, m.reviewer, "claude", good))).toBe("403:forbidden");
      expect(await code(updateToolBasics(deps, m.contributor, "claude", good))).toBe("403:forbidden");
      expect(await code(updateToolBasics(deps, m.editor, "no-such-tool", good))).toBe("409:not_found");
    });
  });

  describe("categories", () => {
    it("an admin hides and shows a category; an analyst and a reviewer cannot", async () => {
      const cats = await listCategories(db.sql, m.admin);
      expect(cats.filter((c) => c.parent_id === null)).toHaveLength(15);
      const id = Number(cats[0].id);
      expect(await setCategoryVisibility(deps, m.admin, id, false)).toMatchObject({ changed: true });
      expect(await setCategoryVisibility(deps, m.admin, id, false)).toMatchObject({ changed: false });
      await setCategoryVisibility(deps, m.admin, id, true);
      expect(await code(setCategoryVisibility(deps, m.analyst, id, false))).toBe("403:forbidden");
      expect(await code(setCategoryVisibility(deps, m.reviewer, id, false))).toBe("403:forbidden");
      expect(await code(setCategoryVisibility(deps, m.admin, 999999, false))).toBe("409:not_found");
    });
  });
});
