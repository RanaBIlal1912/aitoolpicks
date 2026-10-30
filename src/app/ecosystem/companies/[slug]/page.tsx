import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { COMPANIES, getCompany } from "@/data/companies";
import { pageMeta } from "@/lib/meta";
import PageHeader from "@/components/PageHeader";
import ToolLogo from "@/components/ToolLogo";
import NewsCard from "@/components/NewsCard";

export const dynamicParams = false;
export function generateStaticParams() {
  return COMPANIES.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCompany(slug);
  if (!c) return {};
  return pageMeta({ title: `${c.name}: products, models and news`, description: `${c.name} products in our catalog (${c.tools.map((t) => t.name).join(", ")}), with pricing status, licences and related news.`, path: `/ecosystem/companies/${slug}/` });
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const c = getCompany(slug);
  if (!c) notFound();
  return (
    <>
      <PageHeader
        eyebrow="Company"
        title={c.name}
        lead={`Products from ${c.name} that appear in our catalog, with the relationships our records state. Names are as each product's official page gives them.`}
        crumbs={[
          { name: "Ecosystem", href: "/ecosystem/" },
          { name: c.name, href: `/ecosystem/companies/${slug}/` },
        ]}
      />
      <div className="mx-auto max-w-6xl px-5">
        <section aria-labelledby="prod-title">
          <h2 id="prod-title" className="section-title text-white">
            Products
          </h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {c.tools.map((t) => (
              <li key={t.id} className="glass flex items-center gap-4 rounded-2xl p-5">
                <ToolLogo id={t.id} name={t.name} hue={t.hue} size={52} />
                <div className="min-w-0">
                  <Link href={`/tools/${t.id}/`} className="font-bold text-white no-underline hover:underline">
                    {t.name}
                  </Link>
                  <p className="truncate text-sm text-muted">{t.tagline}</p>
                  <p className="mt-1 text-xs text-soft">
                    Pricing {t.pricingStatus === "verified" ? "verified" : t.pricingStatus === "partial" ? "partly verified" : "not verified"}
                    {t.openSource && t.openSource !== "proprietary" ? ` · ${t.openSource}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {c.models.length > 0 && (
          <section className="mt-12" aria-labelledby="mod-title">
            <h2 id="mod-title" className="section-title text-white">
              Verified models
            </h2>
            <ul className="mt-5 space-y-4">
              {c.models.map((m) => (
                <li key={m.id} className="glass rounded-2xl p-5">
                  <p className="font-bold text-white">{m.name}</p>
                  <p className="mt-1 text-soft">{m.summary}</p>
                  <p className="mt-2 text-sm text-muted">Licence: {m.licence}</p>
                  <p className="mt-2 text-sm">
                    {m.sources.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                        {s.label} ↗
                      </a>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {c.news.length > 0 && (
          <section className="mt-12" aria-labelledby="news-title">
            <h2 id="news-title" className="section-title text-white">
              Related news
            </h2>
            <ul className="mt-5 grid gap-5 md:grid-cols-2">
              {c.news.slice(0, 4).map((n) => (
                <li key={n.slug}>
                  <NewsCard n={n} variant="compact" />
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-12 text-sm text-muted">
          <Link href="/ecosystem/" className="underline">
            Back to the ecosystem
          </Link>
        </p>
      </div>
    </>
  );
}
