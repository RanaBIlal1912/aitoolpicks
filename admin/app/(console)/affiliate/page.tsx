import Link from "next/link";
import { listAffiliate } from "../../../../src/server/admin/queries.ts";
import { Badge, Table } from "../../../components/ui.tsx";
import { getDeps } from "../../../lib/deps.ts";
import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "Affiliate" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const member = await requirePage("/affiliate", "affiliate:read");
  const rows = await listAffiliate(getDeps().sql, member);
  const approved = rows.filter((r) => r.status === "approved").length;
  return (
    <>
      <h1>Affiliate programmes</h1>
      <p className="muted">
        A tracked link is used only while a programme is approved. {approved === 0 ? "No programme is approved today, so every button goes to the official website." : `${approved} programme(s) approved.`} Statuses are read-only here: moving a programme to approved needs a recorded application and a second approver.
      </p>
      <Table head={["Tool", "Status", "Network", "Links stored", "Checked", "Note"]}>
        {rows.map((r) => (
          <tr key={r.slug}>
            <td><Link href={`/tools/${r.slug}`}>{r.name}</Link></td>
            <td><Badge value={r.status} /></td>
            <td>{r.network ?? "-"}</td>
            <td>{r.links}</td>
            <td className="muted">{r.checked_at ?? "-"}</td>
            <td className="muted">{r.note ?? ""}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
