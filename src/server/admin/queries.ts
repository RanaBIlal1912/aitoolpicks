// Read side of the admin area. Every function takes the signed-in member and refuses (403) without the permission, so a page cannot forget the check.
// Nothing here writes. Rows are plain objects; dates are returned as ISO strings.
import type { Sql } from "../db/client.ts";
import { AuthError, can, type Member } from "../auth/authorize.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export type Page<T> = { rows: T[]; total: number; page: number; pageSize: number };

export const PAGE_SIZE = 30;
const STATUSES = ["draft", "in_review", "published", "archived"] as const;

function need(member: Member, permission: string) {
  if (!can(member, permission)) throw new AuthError(403, "forbidden", `missing permission ${permission}`);
}
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v === null || v === undefined ? null : String(v));
const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/** The content types that share the same list screen. */
export const CONTENT = {
  tools: { table: "tools", titleCol: "name", read: "tools:read", label: "Tools" },
  reviews: { table: "reviews", titleCol: "title", read: "reviews:read", label: "Reviews" },
  blog: { table: "blog_posts", titleCol: "title", read: "blog:read", label: "Blog" },
  news: { table: "news_items", titleCol: "title", read: "news:read", label: "AI News" },
} as const;
export type ContentKind = keyof typeof CONTENT;

export async function listContent(sql: Sql, member: Member, kind: ContentKind, opts: { q?: string; status?: string; page?: number } = {}): Promise<Page<Row>> {
  const c = CONTENT[kind];
  need(member, c.read);
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const q = opts.q?.trim() ? like(opts.q.trim().slice(0, 100)) : null;
  const status = STATUSES.includes(opts.status as (typeof STATUSES)[number]) ? opts.status! : null;
  const where = sql`deleted_at is null and (${q}::text is null or ${sql.unsafe(c.titleCol)} ilike ${q} or slug ilike ${q}) and (${status}::text is null or status::text = ${status})`;
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from ${sql.unsafe(c.table)} where ${where}`;
  const rows = await sql<Row[]>`
    select id, slug, ${sql.unsafe(c.titleCol)} as title, status::text as status, created_by, updated_at, published_at
    from ${sql.unsafe(c.table)} where ${where} order by updated_at desc, id desc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`;
  return { rows: rows.map((r): Row => ({ ...r, updated_at: iso(r.updated_at), published_at: iso(r.published_at) })), total: n, page, pageSize: PAGE_SIZE };
}

export async function getTool(sql: Sql, member: Member, slug: string) {
  need(member, "tools:read");
  const [tool] = await sql<Row[]>`
    select t.*, t.pricing_checked_at::text as pricing_checked_at, c.name as company_name, pc.label as primary_category, sc.label as subcategory_label
    from tools t join companies c on c.id = t.company_id join categories pc on pc.id = t.primary_category_id left join categories sc on sc.id = t.subcategory_id
    where t.slug = ${slug} and t.deleted_at is null`;
  if (!tool) return null;
  const [plans, sources, categories, review] = await Promise.all([
    sql<Row[]>`select position, name, audience::text as audience, currency, unit, monthly::text as monthly, annual::text as annual, is_custom from pricing_plans where tool_id = ${tool.id} order by position`,
    sql<Row[]>`select position, label, url, type::text as type, checked_at::text as checked_at from tool_sources where tool_id = ${tool.id} order by position`,
    sql<Row[]>`select c.label from tool_categories tc join categories c on c.id = tc.category_id where tc.tool_id = ${tool.id} order by tc.position`,
    sql<Row[]>`select slug, status::text as status from reviews where tool_id = ${tool.id} order by sort_order`,
  ]);
  const affiliate = can(member, "affiliate:read") ? (await sql<Row[]>`select status::text as status, network, note from affiliate_programs where tool_id = ${tool.id}`)[0] ?? null : undefined;
  return { tool: { ...tool, updated_at: iso(tool.updated_at), published_at: iso(tool.published_at) } as Row, plans, sources, categories: categories.map((r) => r.label as string), reviews: review, affiliate };
}

export async function getContentItem(sql: Sql, member: Member, kind: Exclude<ContentKind, "tools">, slug: string): Promise<Row | null> {
  const c = CONTENT[kind];
  need(member, c.read);
  const [row] = await sql<Row[]>`select * from ${sql.unsafe(c.table)} where slug = ${slug} and deleted_at is null`;
  return row ? ({ ...row, updated_at: iso(row.updated_at), published_at: iso(row.published_at) } as Row) : null;
}

export async function listCategories(sql: Sql, member: Member) {
  need(member, "categories:read");
  return sql<Row[]>`
    select c.id, c.slug, c.label, c.is_visible, c.sort_order, c.parent_id, p.label as parent_label, c.status::text as status,
      (select count(*)::int from tool_categories tc where tc.category_id = c.id) as tools
    from categories c left join categories p on p.id = c.parent_id where c.deleted_at is null order by coalesce(p.sort_order, c.sort_order), p.id nulls first, c.sort_order`;
}

export async function listAffiliate(sql: Sql, member: Member) {
  need(member, "affiliate:read");
  const rows = await sql<Row[]>`
    select t.slug, t.name, p.status::text as status, p.network, p.apply_url, p.note, p.checked_at::text as checked_at,
      (select count(*)::int from affiliate_links l where l.program_id = p.id) as links
    from affiliate_programs p join tools t on t.id = p.tool_id order by p.status, t.name`;
  return rows;
}

export async function listSubmissions(sql: Sql, member: Member, page = 1): Promise<Page<Row>> {
  need(member, "submissions:read");
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from tool_submissions`;
  const rows = await sql<Row[]>`select public_id, name, website_host, status::text as status, source::text as source, created_at from tool_submissions order by created_at desc limit ${PAGE_SIZE} offset ${(Math.max(1, page) - 1) * PAGE_SIZE}`;
  return { rows: rows.map((r): Row => ({ ...r, created_at: iso(r.created_at) })), total: n, page, pageSize: PAGE_SIZE };
}

export async function listTeam(sql: Sql, member: Member) {
  need(member, "team:read");
  const rows = await sql<Row[]>`
    select m.id, m.email, m.display_name, m.status::text as status, r.key as role, m.last_seen_at, m.invited_at
    from team_members m join roles r on r.id = m.role_id order by m.status, m.email`;
  return rows.map((r): Row => ({ ...r, id: Number(r.id), last_seen_at: iso(r.last_seen_at), invited_at: iso(r.invited_at) }));
}

export async function listAudit(sql: Sql, member: Member, opts: { action?: string; page?: number } = {}): Promise<Page<Row>> {
  need(member, "audit:read");
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const action = opts.action?.trim() ? like(opts.action.trim().slice(0, 60)) : null;
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from audit_logs where (${action}::text is null or action ilike ${action})`;
  const rows = await sql<Row[]>`
    select a.id, a.occurred_at, a.action, a.entity_type, a.entity_id, m.email as actor, a.before, a.after
    from audit_logs a left join team_members m on m.id = a.actor_member_id where (${action}::text is null or a.action ilike ${action})
    order by a.id desc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`;
  return { rows: rows.map((r): Row => ({ ...r, occurred_at: iso(r.occurred_at) })), total: n, page, pageSize: PAGE_SIZE };
}

export async function listSettings(sql: Sql, member: Member) {
  need(member, "settings:read");
  const rows = await sql<Row[]>`select key, value, updated_at from site_settings order by key`;
  return rows.map((r): Row => ({ ...r, updated_at: iso(r.updated_at) }));
}

/** Counts and recent activity for the front page. Each block appears only if the member may see it. */
export async function overview(sql: Sql, member: Member) {
  const counts: Record<string, Record<string, number>> = {};
  for (const [kind, c] of Object.entries(CONTENT)) {
    if (!can(member, c.read)) continue;
    const rows = await sql<{ status: string; n: number }[]>`select status::text as status, count(*)::int as n from ${sql.unsafe(c.table)} where deleted_at is null group by status`;
    counts[kind] = Object.fromEntries(rows.map((r) => [r.status, r.n]));
  }
  const newSubmissions = can(member, "submissions:read") ? (await sql<{ n: number }[]>`select count(*)::int as n from tool_submissions where status = 'new'`)[0].n : null;
  const recent = can(member, "audit:read") ? (await listAudit(sql, member)).rows.slice(0, 8) : null;
  const pricingUnverified = can(member, "tools:read") ? (await sql<{ n: number }[]>`select count(*)::int as n from tools where deleted_at is null and pricing_status <> 'verified'`)[0].n : null;
  return { counts, newSubmissions, recent, pricingUnverified };
}
