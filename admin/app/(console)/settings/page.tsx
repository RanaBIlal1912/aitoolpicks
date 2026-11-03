import { listSettings } from "../../../../src/server/admin/queries.ts";
import { Table } from "../../../components/ui.tsx";
import { getDeps, isDevProvider } from "../../../lib/deps.ts";
import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const member = await requirePage("/settings", "settings:read");
  const deps = getDeps();
  const rows = await listSettings(deps.sql, member);
  return (
    <>
      <h1>Settings</h1>
      <h2>This deployment</h2>
      <Table head={["Setting", "Value"]}>
        <tr><td>Sign-in provider</td><td>{isDevProvider() ? "Development (local only)" : "Supabase Auth"}</td></tr>
        <tr><td>Second factor required for owners and admins</td><td>{deps.requireMfa ? "Yes" : "No"}</td></tr>
        <tr><td>Rebuild hook for the public site</td><td>{deps.deployHookUrl ? "Configured" : "Not configured (changes do not trigger a rebuild)"}</td></tr>
        <tr><td>Audit IP hashing</td><td>{deps.ipSalt ? "On" : "Off (no IP information is stored)"}</td></tr>
      </Table>
      <h2>Site settings</h2>
      <Table head={["Key", "Value"]} empty={rows.length === 0 ? "No site settings stored yet." : undefined}>
        {rows.map((r) => <tr key={r.key}><td>{r.key}</td><td><pre className="json">{JSON.stringify(r.value)}</pre></td></tr>)}
      </Table>
      <p className="muted">Secrets are never shown here. Editing settings arrives with the hosting change.</p>
    </>
  );
}
