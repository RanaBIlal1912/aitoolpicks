import { listTeam } from "../../../../src/server/admin/queries.ts";
import { ROLES } from "../../../../src/server/auth/permissions.ts";
import { Badge, Flash, fmt, pick, Table } from "../../../components/ui.tsx";
import { getDeps } from "../../../lib/deps.ts";
import { requirePage } from "../../../lib/session.ts";
import { inviteAction, memberAction } from "../actions.ts";

export const metadata = { title: "Team" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const member = await requirePage("/team", "team:read");
  const rows = await listTeam(getDeps().sql, member);
  const manage = member.permissions.has("team:role");
  return (
    <>
      <h1>Team</h1>
      <Flash ok={pick(sp.ok)} err={pick(sp.err)} />
      <Table head={["Member", "Role", "Status", "Last seen", ...(manage ? ["Actions"] : [])]}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.email}{r.id === member.id ? " (you)" : ""}</td>
            <td>{r.role}</td>
            <td><Badge value={r.status} /></td>
            <td className="muted">{fmt(r.last_seen_at)}</td>
            {manage && (
              <td>
                {r.id === member.id ? <span className="muted">-</span> : (
                  <div className="row">
                    <form action={memberAction} className="row">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="op" value="role" />
                      <select name="role" defaultValue={r.role} aria-label={`Role for ${r.email}`}>{ROLES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
                      <button className="secondary" type="submit">Set role</button>
                    </form>
                    <form action={memberAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="op" value={r.status === "disabled" ? "enable" : "disable"} />
                      <button className={r.status === "disabled" ? "secondary" : "danger"} type="submit">{r.status === "disabled" ? "Enable" : "Disable"}</button>
                    </form>
                  </div>
                )}
              </td>
            )}
          </tr>
        ))}
      </Table>
      {member.permissions.has("team:invite") && (
        <>
          <h2>Invite someone</h2>
          <form action={inviteAction} className="card stack narrow" style={{ width: "min(420px, 100%)" }}>
            <label>E-mail address<input name="email" type="email" required maxLength={254} /></label>
            <label>Role<select name="role" defaultValue="editor">{ROLES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select></label>
            <div><button type="submit">Send invitation</button></div>
            <p className="muted">They can sign in only after accepting the invitation with this address. Changes are written to the audit log.</p>
          </form>
        </>
      )}
    </>
  );
}
