// The statistics service: the only code that reads the v_stats_* views. Admin pages, reports and the build snapshot call these functions; nobody types a number.
// To add a statistic, add a column to a view (a new migration) and to the type below. The consistency tests compare every figure with a recount.
import type { Sql } from "../db/client.ts";

export type CatalogStats = { tools: number; categories: number; verified: number; partial: number; unverified: number; free: number; freemium: number; paid: number; other: number; withFreePlan: number };
export type ContentStats = { reviewsDocumentation: number; reviewsHandsOn: number; guides: number; comparisonArticles: number; newsListed: number; newsTotal: number; roundups: number; models: number };
export type AffiliateStats = { approved: number; pending: number; unavailable: number; ordinary: number; links: number };
export type SubmissionStats = { total: number; new: number; inReview: number; approved: number; rejected: number; duplicate: number; spam: number };
export type AllStats = { catalog: CatalogStats; content: ContentStats; affiliate: AffiliateStats; submissions: SubmissionStats };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const n = (v: unknown) => Number(v ?? 0);

export async function getAllStats(sql: Sql): Promise<AllStats> {
  const [[c], [ct], [a], [s]] = await Promise.all([
    sql<Row[]>`select * from v_stats_catalog`,
    sql<Row[]>`select * from v_stats_content`,
    sql<Row[]>`select * from v_stats_affiliate`,
    sql<Row[]>`select * from v_stats_submissions`,
  ]);
  return {
    catalog: { tools: n(c.tools), categories: n(c.categories), verified: n(c.verified), partial: n(c.partial), unverified: n(c.unverified), free: n(c.free), freemium: n(c.freemium), paid: n(c.paid), other: n(c.other), withFreePlan: n(c.with_free_plan) },
    content: { reviewsDocumentation: n(ct.reviews_documentation), reviewsHandsOn: n(ct.reviews_hands_on), guides: n(ct.guides), comparisonArticles: n(ct.comparison_articles), newsListed: n(ct.news_listed), newsTotal: n(ct.news_total), roundups: n(ct.roundups), models: n(ct.models) },
    affiliate: { approved: n(a.approved), pending: n(a.pending), unavailable: n(a.unavailable), ordinary: n(a.ordinary), links: n(a.links) },
    submissions: { total: n(s.total), new: n(s.new), inReview: n(s.in_review), approved: n(s.approved), rejected: n(s.rejected), duplicate: n(s.duplicate), spam: n(s.spam) },
  };
}

export const getCatalogStats = async (sql: Sql) => (await getAllStats(sql)).catalog;

/** Counts for one category (tools listed in it, primary or secondary), computed with the same rules as the catalogue view. */
export async function getCategoryStats(sql: Sql, categorySlug: string): Promise<Omit<CatalogStats, "categories">> {
  const [r] = await sql<Row[]>`
    select count(*)::int as tools,
      count(*) filter (where t.pricing_status = 'verified')::int as verified, count(*) filter (where t.pricing_status = 'partial')::int as partial,
      count(*) filter (where t.pricing_status = 'unverified')::int as unverified, count(*) filter (where t.pricing_model = 'free')::int as free,
      count(*) filter (where t.pricing_model = 'freemium')::int as freemium, count(*) filter (where t.pricing_model = 'paid')::int as paid,
      count(*) filter (where t.pricing_model not in ('free', 'freemium', 'paid'))::int as other,
      count(*) filter (where (t.pricing_free ->> 'available') = 'true')::int as with_free_plan
    from tools t join tool_categories tc on tc.tool_id = t.id join categories c on c.id = tc.category_id and c.parent_id is null
    where c.slug = ${categorySlug} and t.status = 'published' and t.deleted_at is null`;
  return { tools: n(r.tools), verified: n(r.verified), partial: n(r.partial), unverified: n(r.unverified), free: n(r.free), freemium: n(r.freemium), paid: n(r.paid), other: n(r.other), withFreePlan: n(r.with_free_plan) };
}
