import { listSubmissions } from "../../../../src/server/admin/queries.ts";
import { Badge, fmt, Pager, pick, Table } from "../../../components/ui.tsx";
import { getDeps } from "../../../lib/deps.ts";
import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "Submissions" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const member = await requirePage("/submissions", "submissions:read");
  const data = await listSubmissions(getDeps().sql, member, Number(pick(sp.page)) || 1);
  return (
    <>
      <h1>Tool submissions</h1>
      <Table head={["Received", "Name", "Website", "Status", "Via"]} empty={data.rows.length === 0 ? "No submissions yet. The public form still sends them to GitHub; storing them here comes with the hosting change." : undefined}>
        {data.rows.map((r) => <tr key={r.public_id}><td className="muted">{fmt(r.created_at)}</td><td>{r.name}</td><td>{r.website_host}</td><td><Badge value={r.status} /></td><td>{r.source}</td></tr>)}
      </Table>
      <Pager path="/submissions" page={data.page} pageSize={data.pageSize} total={data.total} />
    </>
  );
}
