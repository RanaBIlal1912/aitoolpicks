// What the admin Analytics page shows. Reads analytics_daily only, never raw events, and only for members who may see analytics.
import type { Sql } from "../db/client.ts";
import { AuthError, can, type Member } from "../auth/authorize.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export type AnalyticsSummary = {
  from: string;
  to: string;
  totals: Record<string, number>;
  topTools: { slug: string; name: string; views: number; official: number; affiliate: number }[];
  topCategories: { slug: string; label: string; visits: number }[];
  pathGroups: { group: string; views: number }[];
  submissionsPerWeek: { week: string; count: number }[];
  daily: { day: string; pageViews: number }[];
};

export async function analyticsSummary(sql: Sql, member: Member, options: { days?: number; today?: string } = {}): Promise<AnalyticsSummary> {
  if (!can(member, "analytics:read")) throw new AuthError(403, "forbidden", "missing permission analytics:read");
  const days = Math.min(365, Math.max(1, Math.floor(options.days ?? 30)));
  const to = options.today ?? new Date().toISOString().slice(0, 10);
  const from = new Date(Date.parse(to) - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  const totals = Object.fromEntries((await sql<Row[]>`select event::text as event, sum(count)::int as n from analytics_daily where day between ${from}::date and ${to}::date group by event`).map((r) => [r.event, Number(r.n)]));
  const topTools = await sql<Row[]>`
    select t.slug, t.name,
      coalesce(sum(d.count) filter (where d.event = 'tool_view'), 0)::int as views,
      coalesce(sum(d.count) filter (where d.event = 'outbound_official'), 0)::int as official,
      coalesce(sum(d.count) filter (where d.event = 'outbound_affiliate'), 0)::int as affiliate
    from analytics_daily d join tools t on t.id = d.tool_id where d.tool_id > 0 and d.day between ${from}::date and ${to}::date
    group by t.slug, t.name order by views desc, official desc, t.name limit 15`;
  const topCategories = await sql<Row[]>`
    select c.slug, c.label, sum(d.count)::int as visits from analytics_daily d join categories c on c.id = d.category_id
    where d.category_id > 0 and d.event = 'category_visit' and d.day between ${from}::date and ${to}::date group by c.slug, c.label order by visits desc, c.label limit 15`;
  const pathGroups = await sql<Row[]>`
    select path_group as grp, sum(count)::int as views from analytics_daily where event = 'page_view' and path_group <> '' and day between ${from}::date and ${to}::date group by path_group order by views desc`;
  const weeks = await sql<Row[]>`
    select date_trunc('week', day)::date::text as week, sum(count)::int as n from analytics_daily where event = 'submission_created' and day between ${from}::date and ${to}::date group by 1 order by 1`;
  const daily = await sql<Row[]>`select day::text as day, sum(count)::int as n from analytics_daily where event = 'page_view' and day between ${from}::date and ${to}::date group by day order by day`;
  return {
    from,
    to,
    totals,
    topTools: topTools.map((r) => ({ slug: r.slug, name: r.name, views: Number(r.views), official: Number(r.official), affiliate: Number(r.affiliate) })),
    topCategories: topCategories.map((r) => ({ slug: r.slug, label: r.label, visits: Number(r.visits) })),
    pathGroups: pathGroups.map((r) => ({ group: r.grp, views: Number(r.views) })),
    submissionsPerWeek: weeks.map((r) => ({ week: r.week, count: Number(r.n) })),
    daily: daily.map((r) => ({ day: r.day, pageViews: Number(r.n) })),
  };
}
