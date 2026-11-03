import { analyticsSummary } from "../../../../src/server/analytics/summary.ts";
import { getEnv } from "../../../../src/server/env.ts";
import { pick, Table } from "../../../components/ui.tsx";
import { getDeps } from "../../../lib/deps.ts";
import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = { page_view: "Page views", tool_view: "Tool pages viewed", category_visit: "Category visits", directory_search: "Directory searches", outbound_official: "Clicks to official sites", outbound_affiliate: "Clicks to affiliate links", submission_created: "Submissions" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const member = await requirePage("/analytics", "analytics:read");
  const enabled = getEnv(["runtime"]).ANALYTICS_ENABLED;
  const days = [7, 30, 90].includes(Number(pick(sp.days))) ? Number(pick(sp.days)) : 30;
  const s = await analyticsSummary(getDeps().sql, member, { days });
  const empty = Object.keys(s.totals).length === 0;
  return (
    <>
      <h1>Analytics</h1>
      <p className={enabled ? "flash ok" : "notice"} role="status">
        {enabled ? "Collection is switched on." : "Collection is switched off. The public site collects nothing, and no cookies, IP addresses, user-agent strings or search text are ever stored."}
      </p>
      <form className="toolbar" method="get">
        <label>Period<select name="days" defaultValue={String(days)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label>
        <button type="submit">Show</button>
      </form>
      <p className="muted">{s.from} to {s.to}. Figures come from the nightly rollup, so today is not included until tonight&apos;s job has run.</p>
      {empty ? (
        <div className="card"><p>No data in this period.</p></div>
      ) : (
        <>
          <div className="grid">
            {Object.entries(s.totals).map(([k, v]) => <div key={k} className="stat"><b>{v.toLocaleString("en")}</b>{LABEL[k] ?? k}</div>)}
          </div>
          <h2>Most viewed tools</h2>
          <Table head={["Tool", "Views", "Official clicks", "Affiliate clicks"]} empty={s.topTools.length === 0 ? "No tool activity." : undefined}>
            {s.topTools.map((t) => <tr key={t.slug}><td>{t.name}</td><td>{t.views}</td><td>{t.official}</td><td>{t.affiliate}</td></tr>)}
          </Table>
          <h2>Categories</h2>
          <Table head={["Category", "Visits"]} empty={s.topCategories.length === 0 ? "No category visits." : undefined}>
            {s.topCategories.map((c) => <tr key={c.slug}><td>{c.label}</td><td>{c.visits}</td></tr>)}
          </Table>
          <h2>Sections</h2>
          <Table head={["Section", "Page views"]} empty={s.pathGroups.length === 0 ? "No page views." : undefined}>
            {s.pathGroups.map((g) => <tr key={g.group}><td>{g.group}</td><td>{g.views}</td></tr>)}
          </Table>
          <h2>Submissions per week</h2>
          <Table head={["Week starting", "Submissions"]} empty={s.submissionsPerWeek.length === 0 ? "None." : undefined}>
            {s.submissionsPerWeek.map((w) => <tr key={w.week}><td>{w.week}</td><td>{w.count}</td></tr>)}
          </Table>
        </>
      )}
    </>
  );
}
