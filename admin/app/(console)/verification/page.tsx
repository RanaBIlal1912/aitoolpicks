import Link from "next/link";
import { dataVerification } from "../../../../src/server/admin/verification.ts";
import type { Finding } from "../../../../src/server/verify/findings.ts";
import { Badge, pick, Table } from "../../../components/ui.tsx";
import { getDeps } from "../../../lib/deps.ts";
import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "Verification" };
export const dynamic = "force-dynamic";

const href = (f: Finding) => (f.entityType === "tool" ? `/tools/${f.entityId}` : f.entityType === "review" ? `/reviews/${f.entityId}` : f.entityType === "news" ? `/news/${f.entityId}` : null);

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const member = await requirePage("/verification", "verification:read");
  const report = await dataVerification(getDeps().sql, member);
  const severity = pick(sp.severity) ?? "";
  const list = report.findings.filter((f) => !severity || f.severity === severity);
  return (
    <>
      <h1>Data verification</h1>
      <p className="muted">
        These checks only point at records that break a rule. Nothing here marks anything verified or changes a price: that is a person&apos;s decision, recorded with a name, date and method. Address checks (do the pages still load?) run on a schedule from the command line and are not shown here.
      </p>
      <div className="grid">
        <Link href="/verification?severity=error" className="stat" style={{ textDecoration: "none", color: "inherit" }}><b>{report.counts.error}</b>Errors to fix</Link>
        <Link href="/verification?severity=warning" className="stat" style={{ textDecoration: "none", color: "inherit" }}><b>{report.counts.warning}</b>Warnings</Link>
        <Link href="/verification?severity=info" className="stat" style={{ textDecoration: "none", color: "inherit" }}><b>{report.counts.info}</b>Notes</Link>
        <div className="stat"><b>{report.humanReviewQueue.length}</b>Waiting for a person</div>
      </div>

      <h2>{severity ? `${severity[0].toUpperCase()}${severity.slice(1)}s` : "All findings"} ({list.length}) {severity && <Link href="/verification" style={{ fontSize: ".85rem" }}>show all</Link>}</h2>
      <Table head={["Severity", "Check", "Record", "Problem"]} empty={list.length === 0 ? "Nothing to show." : undefined}>
        {list.map((f) => (
          <tr key={f.id}>
            <td><Badge value={f.severity === "error" ? "disabled" : f.severity === "warning" ? "draft" : "active"} /> {f.severity}</td>
            <td>{f.check}{f.field ? <span className="muted"> ({f.field})</span> : null}</td>
            <td>{href(f) ? <Link href={href(f)!}>{f.entityType} {f.entityId}</Link> : `${f.entityType} ${f.entityId}`}</td>
            <td>{f.message}{f.suggestion ? <span className="muted"> {f.suggestion}</span> : null}</td>
          </tr>
        ))}
      </Table>

      <h2>Waiting for a person ({report.humanReviewQueue.length})</h2>
      <Table head={["Record", "Why"]} empty={report.humanReviewQueue.length === 0 ? "Nothing waiting." : undefined}>
        {report.humanReviewQueue.slice(0, 100).map((q) => <tr key={`${q.entityType}${q.entityId}`}><td><Link href={`/tools/${q.entityId}`}>{q.entityId}</Link></td><td className="muted">{q.reason}</td></tr>)}
      </Table>
    </>
  );
}
