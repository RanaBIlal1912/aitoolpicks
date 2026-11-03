import { listCategories } from "../../../../src/server/admin/queries.ts";
import { Badge, Flash, pick, Table } from "../../../components/ui.tsx";
import { getDeps } from "../../../lib/deps.ts";
import { requirePage } from "../../../lib/session.ts";
import { categoryVisibilityAction } from "../actions.ts";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const member = await requirePage("/categories", "categories:read");
  const rows = await listCategories(getDeps().sql, member);
  const canToggle = member.permissions.has("categories:visibility");
  return (
    <>
      <h1>Categories</h1>
      <Flash ok={pick(sp.ok)} err={pick(sp.err)} />
      <Table head={["Category", "Parent", "Tools", "Status", "Visible", ...(canToggle ? [""] : [])]}>
        {rows.map((c) => (
          <tr key={c.id}>
            <td style={{ paddingLeft: c.parent_id ? 28 : 12 }}>{c.label} <span className="muted">{c.slug}</span></td>
            <td className="muted">{c.parent_label ?? ""}</td>
            <td>{c.tools}</td>
            <td><Badge value={c.status} /></td>
            <td>{c.is_visible ? "Yes" : "Hidden"}</td>
            {canToggle && (
              <td>
                <form action={categoryVisibilityAction}>
                  <input type="hidden" name="id" value={String(c.id)} />
                  <input type="hidden" name="visible" value={String(!c.is_visible)} />
                  <input type="hidden" name="back" value="/categories" />
                  <button className="secondary" type="submit">{c.is_visible ? "Hide" : "Show"}</button>
                </form>
              </td>
            )}
          </tr>
        ))}
      </Table>
      <p className="muted">Creating and renaming categories arrives with the revision workflow.</p>
    </>
  );
}
