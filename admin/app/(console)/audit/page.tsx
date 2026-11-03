import { listAudit } from "../../../../src/server/admin/queries.ts";
import { fmt, Pager, pick, Table } from "../../../components/ui.tsx";
import { getDeps } from "../../../lib/deps.ts";
import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const member = await requirePage("/audit", "audit:read");
  const action = pick(sp.action) ?? "";
  const data = await listAudit(getDeps().sql, member, { action, page: Number(pick(sp.page)) || 1 });
  return (
    <>
      <h1>Audit log</h1>
      <form className="toolbar" method="get">
        <label>Action contains<input name="action" defaultValue={action} maxLength={60} placeholder="for example team or content" /></label>
        <button type="submit">Filter</button>
      </form>
      <Table head={["When", "Who", "Action", "Item", "Before", "After"]} empty={data.rows.length === 0 ? "Nothing matches." : undefined}>
        {data.rows.map((r) => (
          <tr key={r.id}>
            <td className="muted">{fmt(r.occurred_at)}</td>
            <td>{r.actor ?? "system"}</td>
            <td>{r.action}</td>
            <td className="muted">{r.entity_type} {r.entity_id}</td>
            <td><pre className="json">{r.before ? JSON.stringify(r.before) : ""}</pre></td>
            <td><pre className="json">{r.after ? JSON.stringify(r.after) : ""}</pre></td>
          </tr>
        ))}
      </Table>
      <Pager path="/audit" page={data.page} pageSize={data.pageSize} total={data.total} params={{ action }} />
      <p className="muted">The log cannot be edited or deleted, not even by the application.</p>
    </>
  );
}
