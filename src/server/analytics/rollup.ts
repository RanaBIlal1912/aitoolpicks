// The nightly job: roll raw events into analytics_daily, then delete raw rows that are old AND already rolled up. Reports read analytics_daily only.
import type { Sql } from "../db/client.ts";

export const RETENTION_DAYS = 90;

/** Rebuild the daily counts for every day that still has raw events, up to yesterday (or today with includeToday). Idempotent. */
export async function rollupDaily(sql: Sql, options: { today?: string; includeToday?: boolean } = {}): Promise<{ days: number; rows: number }> {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const limit = options.includeToday ? `${today}T23:59:59.999Z` : `${today}T00:00:00Z`;
  let days = 0;
  let rows = 0;
  await sql.begin(async (raw) => {
    const tx = raw as unknown as Sql;
    const list = await tx<{ d: string }[]>`select distinct (occurred_at at time zone 'UTC')::date::text as d from analytics_events where occurred_at < ${limit}::timestamptz order by d`;
    for (const { d } of list) {
      await tx`delete from analytics_daily where day = ${d}::date`;
      const ins = await tx`
        insert into analytics_daily (day, event, tool_id, category_id, path_group, count)
        select ${d}::date, event, coalesce(tool_id, 0), coalesce(category_id, 0), path_group, count(*)::int
        from analytics_events where (occurred_at at time zone 'UTC')::date = ${d}::date group by event, coalesce(tool_id, 0), coalesce(category_id, 0), path_group`;
      days++;
      rows += ins.count;
    }
  });
  return { days, rows };
}

/** Delete raw events from days that are older than the retention period and already have daily rows. Whole days only. */
export async function purgeRaw(sql: Sql, options: { today?: string; keepDays?: number } = {}): Promise<number> {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const cutoff = new Date(Date.parse(today) - (options.keepDays ?? RETENTION_DAYS) * 86_400_000).toISOString().slice(0, 10);
  const r = await sql`
    delete from analytics_events e where (e.occurred_at at time zone 'UTC')::date < ${cutoff}::date
      and exists (select 1 from analytics_daily d where d.day = (e.occurred_at at time zone 'UTC')::date)`;
  return r.count;
}

export async function runNightly(sql: Sql, options: { today?: string } = {}) {
  const rolled = await rollupDaily(sql, options);
  const purged = await purgeRaw(sql, options);
  return { ...rolled, purged };
}
