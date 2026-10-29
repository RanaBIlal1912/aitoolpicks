import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORY_INFO, TOOLS, categorySlug, getTool, toolsInCategory } from "@/data/tools";
import { TOOL_DETAILS } from "@/data/tool-details";
import { articlesMentioning, getArticle } from "@/data/articles";
import { COMPARISONS } from "@/data/compare";
import { REVIEWS } from "@/data/reviews";
import { PRICES } from "@/lib/prices";
import { coverPath } from "@/data/covers";
import { pageMeta } from "@/lib/meta";
import { SITE, absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import AffLink from "@/components/AffLink";
import PriceTag from "@/components/PriceTag";
import Cover from "@/components/Cover";
import ParallaxFrame from "@/components/ParallaxFrame";
import ArticleCard from "@/components/ArticleCard";
import ToolCard from "@/components/ToolCard";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";

export const dynamicParams = false;
export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.id }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getTool(slug);
  if (!t) return {};
  const m = pageMeta({
    title: `${t.name}: what it is, who it suits and what to check`,
    description: `${t.tagline}. ${t.description} Best for: ${t.bestFor}.`.slice(0, 190),
    path: `/tools/${slug}/`,
  });
  const cover = CATEGORY_INFO[t.category].cover;
  m.openGraph = { ...m.openGraph, images: [{ url: absUrl(coverPath(cover, "og")), width: 1200, height: 630 }] };
  return m;
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const t = getTool(slug);
  const d = t && TOOL_DETAILS[t.id];
  if (!t || !d) notFound();
  const info = CATEGORY_INFO[t.category];
  const review = REVIEWS.find((r) => r.toolId === t.id);
  const guides = articlesMentioning(t.id);
  const comparisons = COMPARISONS.filter((c) => c.leftTool === t.id || c.rightTool === t.id);
  const alternatives = toolsInCategory(t.category).filter((x) => x.id !== t.id);

  return (
    <>
      <PageHeader
        eyebrow={t.category}
        title={t.name}
        lead={`${t.tagline}. ${t.description}`}
        crumbs={[
          { name: "Tools", href: "/tools/" },
          { name: t.category, href: `/tools/category/${categorySlug(t.category)}/` },
          { name: t.name, href: `/tools/${slug}/` },
        ]}
      >
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <AffLink id={t.id} className="btn-primary" />
          {review && (
            <Link href={`/reviews/${review.slug}/`} className="btn-ghost">
              Read our overview
            </Link>
          )}
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-10">
            <ParallaxFrame className="cover-frame aspect-[16/8]" strength={28}>
              <Cover id={info.cover} sizes="(min-width: 1024px) 60vw, 100vw" priority />
            </ParallaxFrame>
            <p className="-mt-6 text-xs text-muted">Illustration: a 3D render made for this site, not a screenshot of {t.name}.</p>

            <Reveal as="section">
              <h2 className="section-title text-white">What it is</h2>
              <p className="mt-3 text-lg text-soft">{d.overview}</p>
            </Reveal>

            <Reveal as="section">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="glass rounded-[22px] p-6">
                  <h2 className="text-lg font-bold text-emerald-300">Good for</h2>
                  <ul className="mt-3 space-y-2.5">
                    {d.goodFor.map((g) => (
                      <li key={g} className="flex gap-3 text-soft">
                        <span aria-hidden="true" className="mt-0.5 text-emerald-300">
                          ✓
                        </span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass rounded-[22px] p-6">
                  <h2 className="text-lg font-bold text-amber">Things to check</h2>
                  <ul className="mt-3 space-y-2.5">
                    {d.consider.map((g) => (
                      <li key={g} className="flex gap-3 text-soft">
                        <span aria-hidden="true" className="mt-0.5 text-amber">
                          !
                        </span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>

            {(guides.length > 0 || comparisons.length > 0) && (
              <Reveal as="section">
                <h2 className="section-title text-white">Guides that mention {t.name}</h2>
                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  {[...comparisons.map((c) => c.article), ...guides.map((g) => g.slug)]
                    .filter((s, i, arr) => arr.indexOf(s) === i)
                    .slice(0, 4)
                    .map((s) => {
                      const a = guides.find((g) => g.slug === s) ?? getArticle(s);
                      return a ? <ArticleCard key={a.slug} a={a} /> : null;
                    })}
                </div>
              </Reveal>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label={`${t.name} quick facts`}>
            <div className="glass rounded-[22px] p-6">
              <h2 className="kicker">Quick facts</h2>
              <dl className="mt-4 space-y-4 text-[0.97rem]">
                <div>
                  <dt className="text-muted">Category</dt>
                  <dd className="font-semibold text-white">
                    <Link href={`/tools/category/${categorySlug(t.category)}/`} className="no-underline hover:underline">
                      {t.category}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Best for</dt>
                  <dd className="font-semibold text-white">{t.bestFor}</dd>
                </div>
                <div>
                  <dt className="text-muted">Free plan</dt>
                  <dd className="font-semibold text-white">{t.freePlan ? "Yes, a free plan or tier is available" : "Check the official site"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Paid plan (USD)</dt>
                  <dd className="font-semibold text-white">{PRICES[t.id] ? <PriceTag id={t.id} /> : "See the official site for current pricing"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Official site</dt>
                  <dd>
                    <a href={t.officialUrl} target="_blank" rel="noopener noreferrer" className="text-[#8fd3ff] underline">
                      {t.officialUrl.replace("https://", "")}
                    </a>
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-xs text-muted">
                Some links may be affiliate links, and we may earn a commission at no cost to you.{" "}
                <Link href="/affiliate-disclosure/" className="underline">
                  Disclosure
                </Link>
              </p>
            </div>
          </aside>
        </div>

        {alternatives.length > 0 && (
          <Reveal as="section" className="pt-20">
            <h2 className="section-title mb-6 text-white">Other {t.category.toLowerCase()} tools</h2>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {alternatives.slice(0, 3).map((x) => (
                <li key={x.id} className="[perspective:1000px]">
                  <ToolCard tool={x} />
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: t.name,
          url: t.officialUrl,
          applicationCategory: t.category,
          description: d.overview,
          mainEntityOfPage: absUrl(`/tools/${slug}/`),
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
    </>
  );
}
