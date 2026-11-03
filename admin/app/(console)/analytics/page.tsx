import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function Page() {
  await requirePage("/analytics", "analytics:read");
  return (
    <>
      <h1>Analytics</h1>
      <div className="card">
        <p><b>Analytics are switched off.</b></p>
        <p className="muted">The public site collects nothing yet. The privacy-conscious event collection and the statistics service arrive in a later phase and stay disabled until you configure them. No cookies, IP addresses or search text will be stored.</p>
      </div>
    </>
  );
}
