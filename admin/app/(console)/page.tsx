import Link from "next/link";
import { CONTENT, overview, type ContentKind } from "../../../src/server/admin/queries.ts";
import { attentionCounts } from "../../../src/server/admin/verification.ts";
import { runHealth } from "../../../src/server/db/health.ts";
import { expectedTablesFromSql, readJournalWhen } from "../../../src/server/db/migrations.ts";
import { Badge, Flash, fmt, pick, Table } from "../../components/ui.tsx";
import { getDeps } from "../../lib/deps.ts";
import { requirePage } from "../../lib/session.ts";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function Overview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const member = await requirePage("/");
  const deps = getDeps();
  const data = await overview(deps.sql, member);
  const attention = await attentionCounts(deps.sql, member);
  const health = member.permissions.has("system:health") ? await runHealth(deps.sql, { expectedMigrations: readJournalWhen(), expectedTables: expectedTablesFromSql() }) : null;
  return (
    <>
      <h1>Overview</h1>
      <Flash ok={pick(sp.ok)} err={pick(sp.err)} />
      <p className="muted">Signed in as {member.email} ({member.role}). The sections you can open are on the left.</p>

      {Object.keys(data.counts).length > 0 && (
        <div className="grid">
          {(Object.keys(data.counts) as ContentKind[]).map((k) => {
            const c = data.counts[k];
            return (
              <Link key={k} href={`/${k}`} className="stat" style={{ textDecoration: "none", color: "inherit" }}>
                <b>{Object.values(c).reduce((a, b) => a + b, 0)}</b>
                {CONTENT[k].label}
                <div className="muted">{c.published ?? 0} published, {(c.draft ?? 0) + (c.in_review ?? 0)} in progress, {c.archived ?? 0} archived</div>
              </Link>
            );
          })}
          {data.newSubmissions !== null && <Link href="/submissions" className="stat" style={{ textDecoration: "none", color: "inherit" }}><b>{data.newSubmissions}</b>New submissions</Link>}
          {attention && <Link href="/verification" className="stat" style={{ textDecoration: "none", color: "inherit" }}><b>{attention.error + attention.warning}</b>Data checks need attention<div className="muted">{attention.error} error(s), {attention.warning} warning(s), {attention.queue} waiting for a person</div></Link>}
          {data.pricingUnverified !== null && <div className="stat"><b>{data.pricingUnverified}</b>Tools without fully verified pricing</div>}
        </div>
      )}

      {health && (
        <>
          <h2>Database health</h2>
          <Table head={["Check", "Result", "Detail"]}>
            {health.checks.map((c) => <tr key={c.name}><td>{c.name.replaceAll("_", " ")}</td><td><Badge value={c.ok ? "active" : "disabled"} /></td><td className="muted">{c.detail}</td></tr>)}
          </Table>
        </>
      )}

      {data.recent && (
        <>
          <h2>Recent activity</h2>
          <Table head={["When", "Who", "What", "Item"]} empty={data.recent.length === 0 ? "No activity yet." : undefined}>
            {data.recent.map((r) => <tr key={r.id}><td className="muted">{fmt(r.occurred_at)}</td><td>{r.actor ?? "system"}</td><td>{r.action}</td><td className="muted">{r.entity_type} {r.entity_id}</td></tr>)}
          </Table>
          <p><Link href="/audit">Open the full audit log</Link></p>
        </>
      )}
    </>
  );
}
