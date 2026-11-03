import Link from "next/link";
import { notFound } from "next/navigation";
import { getTool } from "../../../../../src/server/admin/queries.ts";
import { StatusControl } from "../../../../components/content.tsx";
import { Badge, Flash, fmt, pick, Table } from "../../../../components/ui.tsx";
import { getDeps } from "../../../../lib/deps.ts";
import { requirePage } from "../../../../lib/session.ts";
import { saveToolAction } from "../../actions.ts";

export const dynamic = "force-dynamic";

export default async function ToolPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const path = `/tools/${slug}`;
  const member = await requirePage(path, "tools:read");
  const data = await getTool(getDeps().sql, member, slug);
  if (!data) notFound();
  const { tool: t } = data;
  const canEdit = member.permissions.has("tools:update");
  return (
    <>
      <p><Link href="/tools">All tools</Link></p>
      <h1>{t.name}</h1>
      <Flash ok={pick(sp.ok)} err={pick(sp.err)} />
      <div className="card stack">
        <div className="row">
          <Badge value={t.status} />
          <span className="muted">Updated {fmt(t.updated_at)}{t.published_at ? `, published ${fmt(t.published_at)}` : ""}</span>
        </div>
        <StatusControl kind="tools" slug={slug} status={t.status} path={path} member={member} />
        <dl className="facts">
          <dt>Company</dt><dd>{t.company_name}</dd>
          <dt>Category</dt><dd>{t.primary_category}{t.subcategory_label ? ` / ${t.subcategory_label}` : ""}</dd>
          <dt>All categories</dt><dd>{data.categories.join(", ")}</dd>
          <dt>Website</dt><dd>{t.website_url}</dd>
          <dt>Pricing</dt><dd><Badge value={t.pricing_status} /> {t.pricing_model}, checked {t.pricing_checked_at ? String(t.pricing_checked_at).slice(0, 10) : "never"}</dd>
          <dt>Verification</dt><dd><Badge value={t.verification_status} /> {t.verification_method}</dd>
          {data.affiliate !== undefined && <><dt>Affiliate</dt><dd>{data.affiliate ? <><Badge value={data.affiliate.status} /> {data.affiliate.network ?? ""}</> : "no record"}</dd></>}
          <dt>Reviews</dt><dd>{data.reviews.length ? data.reviews.map((r) => <Link key={r.slug} href={`/reviews/${r.slug}`}>{r.slug} </Link>) : "none"}</dd>
        </dl>
      </div>

      <h2>Description</h2>
      {canEdit ? (
        <form action={saveToolAction} className="card stack">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="back" value={path} />
          <label>One-line description<input name="tagline" defaultValue={t.tagline} required minLength={5} maxLength={160} /></label>
          <label>Description<textarea name="description" defaultValue={t.description} required minLength={20} maxLength={1200} /></label>
          <label>Key feature (optional)<input name="key_feature" defaultValue={t.key_feature ?? ""} maxLength={200} /></label>
          <div><button type="submit">Save description</button></div>
          <p className="muted">Pricing, verification and affiliate details cannot be edited here. They need a recorded check and, when two people can publish, a second approver.</p>
        </form>
      ) : (
        <div className="card"><p><b>{t.tagline}</b></p><p>{t.description}</p></div>
      )}

      <h2>Plans ({data.plans.length})</h2>
      <Table head={["Plan", "For", "Currency", "Monthly", "Annual", "Unit"]} empty={data.plans.length === 0 ? "No plans recorded." : undefined}>
        {data.plans.map((p) => <tr key={p.position}><td>{p.name}{p.is_custom ? " (custom)" : ""}</td><td>{p.audience}</td><td>{p.currency}</td><td>{p.monthly ?? "-"}</td><td>{p.annual ?? "-"}</td><td className="muted">{p.unit}</td></tr>)}
      </Table>

      <h2>Sources ({data.sources.length})</h2>
      <Table head={["Label", "Type", "Checked", "Address"]}>
        {data.sources.map((s) => <tr key={s.position}><td>{s.label}</td><td>{s.type}</td><td className="muted">{s.checked_at ?? "-"}</td><td className="muted"><a href={s.url} rel="noopener noreferrer nofollow" target="_blank">{s.url}</a></td></tr>)}
      </Table>
    </>
  );
}
