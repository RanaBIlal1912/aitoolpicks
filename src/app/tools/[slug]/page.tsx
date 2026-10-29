import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RECORDS, getRecord } from "@/lib/catalog";
import { CATEGORIES, PRICING_MODEL_LABEL, getCategory, getTool } from "@/data/tools";
import { articlesMentioning, getArticle } from "@/data/articles";
import { newsForTool } from "@/data/news";
import NewsCard, { formatDate } from "@/components/NewsCard";
import { COMPARISONS } from "@/data/compare";
import { REVIEWS } from "@/data/reviews";
import { coverPath } from "@/data/covers";
import { pageMeta } from "@/lib/meta";
import { SITE, absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import AffLink from "@/components/AffLink";
import PricingTable from "@/components/PricingTable";
import { formatChecked } from "@/lib/dates";
import Cover from "@/components/Cover";
import ParallaxFrame from "@/components/ParallaxFrame";
import ArticleCard from "@/components/ArticleCard";
import { Monogram } from "@/components/ToolCard";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";

export const dynamicParams = false;
export function generateStaticParams() {
  return RECORDS.map((t) => ({ slug: t.id }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getRecord(slug);
  if (!t) return {};
  const m = pageMeta({
    title: `${t.name} pricing, plans and features`,
    description: `${t.tagline}. ${t.description}`.slice(0, 190),
    path: `/tools/${slug}/`,
  });
  const cover = getCategory(t.category)?.cover ?? "chip";
  m.openGraph = { ...m.openGraph, images: [{ url: absUrl(coverPath(cover, "og")), width: 1200, height: 630 }] };
  return m;
}

const OPEN_LABEL = { "open-source": "Open source", "source-available": "Source-available (not open source)", "open-weights": "Open weights", proprietary: "Proprietary" } as const;

function List({ title, items, tone }: { title: string; items: string[]; tone: "good" | "warn" | "plain" }) {
  const mark = tone === "good" ? "✓" : tone === "warn" ? "!" : "•";
  const color = tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber" : "text-muted";
  return (
    <div className="glass rounded-[22px] p-6">
      <h3 className={`text-lg font-bold ${tone === "plain" ? "text-white" : color}`}>{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((g) => (
          <li key={g} className="flex gap-3 text-soft">
            <span aria-hidden="true" className={`mt-0.5 ${color}`}>
              {mark}
            </span>
            {g}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const t = getRecord(slug);
  if (!t) notFound();
  const cat = getCategory(t.category);
  const review = REVIEWS.find((r) => r.toolId === t.id);
  const guides = articlesMentioning(t.id);
  const comparisons = COMPARISONS.filter((c) => c.leftTool === t.id || c.rightTool === t.id);
  const alternatives = t.alternatives.map((id) => getTool(id)).filter((x): x is NonNullable<typeof x> => !!x);
  const news = newsForTool(t.id).slice(0, 3);
  const sub = cat?.subs.find((s) => s.slug === t.subcategory);
  const related = [...comparisons.map((c) => c.article), ...guides.map((g) => g.slug)].filter((s, i, a) => a.indexOf(s) === i).slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow={cat?.label ?? "Tool"}
        title={
          <span className="flex items-center gap-4">
            <Monogram name={t.name} hue={t.hue} size={56} />
            {t.name}
          </span>
        }
        lead={`${t.tagline}. ${t.description}`}
        crumbs={[
          { name: "Tools", href: "/tools/" },
          { name: cat?.label ?? t.category, href: `/tools/category/${t.category}/` },
          { name: t.name, href: `/tools/${slug}/` },
        ]}
      >
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <AffLink id={t.id} className="btn-primary" />
          <a href={t.pricing.source} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            Official pricing page ↗
          </a>
          {review && (
            <Link href={`/reviews/${review.slug}/`} className="btn-ghost">
              Read our overview
            </Link>
          )}
        </div>
        <p className="byline mt-4">
          By {t.vendor} · Record verified {formatChecked(t.verified)} · Pricing checked {formatChecked(t.pricing.checked)}
        </p>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0 space-y-12">
            <Reveal as="section">
              <h2 className="section-title text-white">Features</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {t.features.map((f) => (
                  <li key={f} className="glass rounded-2xl px-5 py-4 text-soft">
                    {f}
                  </li>
                ))}
              </ul>
              {t.platforms && <p className="mt-4 text-sm text-muted">Platforms: {t.platforms.join(", ")}</p>}
              {t.integrations && <p className="mt-1 text-sm text-muted">Integrations: {t.integrations.join(", ")}</p>}
            </Reveal>

            <Reveal as="section">
              <div className="grid gap-6 md:grid-cols-2">
                <List title="Use cases" items={t.useCases} tone="plain" />
                <List title="Intended for" items={t.audience} tone="plain" />
                <List title="Strengths" items={t.strengths} tone="good" />
                <List title="Limitations and restrictions" items={t.limitations} tone="warn" />
              </div>
            </Reveal>

            <Reveal as="section">
              <h2 className="section-title mb-5 text-white" id="pricing">
                Plans and pricing
              </h2>
              <PricingTable pricing={t.pricing} name={t.name} />
            </Reveal>

            {t.openSource && (
              <Reveal as="section">
                <h2 className="section-title text-white">Licence and openness</h2>
                <p className="glass mt-4 rounded-2xl p-5 text-soft">
                  <strong className="text-white">{OPEN_LABEL[t.openSource.status]}.</strong> {t.openSource.note}.{" "}
                  <a href={t.openSource.source} target="_blank" rel="noopener noreferrer" className="text-[#9db4d6] underline">
                    Source ↗
                  </a>
                </p>
              </Reveal>
            )}

            {alternatives.length > 0 && (
              <Reveal as="section">
                <h2 className="section-title text-white">Alternatives</h2>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {alternatives.map((a) => (
                    <li key={a.id} className="glass flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl p-4">
                      <Monogram name={a.name} hue={a.hue} size={44} />
                      <div className="min-w-[10rem] min-w-0 flex-1">
                        <Link href={`/tools/${a.id}/`} className="font-bold text-white no-underline hover:underline">
                          {a.name}
                        </Link>
                        <p className="truncate text-sm text-muted">{a.tagline}</p>
                      </div>
                      <Link href={`/compare/?ids=${t.id},${a.id}`} className="chip">
                        Compare
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {news.length > 0 && (
              <Reveal as="section">
                <h2 className="section-title text-white">Recent news about {t.name}</h2>
                <ul className="mt-5 grid gap-6 md:grid-cols-2">
                  {news.map((n) => (
                    <li key={n.slug}>
                      <NewsCard n={n} compact />
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {related.length > 0 && (
              <Reveal as="section">
                <h2 className="section-title text-white">Guides that mention {t.name}</h2>
                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  {related.map((s) => {
                    const a = getArticle(s);
                    return a ? <ArticleCard key={a.slug} a={a} /> : null;
                  })}
                </div>
              </Reveal>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label={`${t.name} quick facts`}>
            <ParallaxFrame className="cover-frame aspect-[16/10]" strength={20}>
              <Cover id={cat?.cover ?? "chip"} sizes="(min-width: 1024px) 30vw, 100vw" priority />
            </ParallaxFrame>
            <p className="-mt-3 text-xs text-muted">Illustration: a 3D render made for this site, not a screenshot of {t.name}.</p>
            <div className="glass rounded-[22px] p-6">
              <h2 className="kicker">Quick facts</h2>
              <dl className="mt-4 space-y-4 text-[0.97rem]">
                <div>
                  <dt className="text-muted">Vendor</dt>
                  <dd className="font-semibold text-white">{t.vendor}</dd>
                </div>
                <div>
                  <dt className="text-muted">Category</dt>
                  <dd className="font-semibold text-white">
                    <Link href={`/tools/category/${t.category}/`} className="no-underline hover:underline">
                      {cat?.label}
                    </Link>
                  </dd>
                </div>
                {sub && (
                  <div>
                    <dt className="text-muted">Subcategory</dt>
                    <dd className="font-semibold text-white">{sub.label}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted">Pricing model</dt>
                  <dd className="font-semibold text-white">{PRICING_MODEL_LABEL[t.pricing.model]}</dd>
                </div>
                <div>
                  <dt className="text-muted">Free trial</dt>
                  <dd className="font-semibold text-white">{t.pricing.trial ? "Documented" : "Not stated"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Added to this directory</dt>
                  <dd className="font-semibold text-white">{formatDate(t.added)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Pricing status</dt>
                  <dd className="font-semibold text-white">
                    {t.pricing.status === "verified" ? "Verified" : t.pricing.status === "partial" ? "Partly verified" : "Not verified"}
                  </dd>
                </div>
              </dl>
              <h3 className="kicker mt-6">Sources</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {t.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#9db4d6] underline">
                      {s.label}
                    </a>
                    <span className="text-muted"> · checked {formatChecked(s.checked)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-muted">
                Some links may be affiliate links, and we may earn a commission at no cost to you. Buttons go to the official site unless an affiliate link
                is configured.{" "}
                <Link href="/affiliate-disclosure/" className="underline">
                  Disclosure
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: t.name,
          url: t.website,
          applicationCategory: cat?.label ?? t.category,
          description: t.description,
          dateModified: t.pricing.checked,
          mainEntityOfPage: absUrl(`/tools/${slug}/`),
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Tools", item: absUrl("/tools/") },
            { "@type": "ListItem", position: 2, name: cat?.label ?? "Category", item: absUrl(`/tools/category/${t.category}/`) },
            { "@type": "ListItem", position: 3, name: t.name, item: absUrl(`/tools/${slug}/`) },
          ],
        }}
      />
    </>
  );
}

// Referenced so category lookups stay type-checked when categories change.
void CATEGORIES;
