import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { REVIEWS, getReview } from "@/data/reviews";
import { getTool } from "@/data/tools";
import { PRICES } from "@/lib/prices";
import { pageMeta } from "@/lib/meta";
import { SITE, absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import AffLink from "@/components/AffLink";
import PriceTag from "@/components/PriceTag";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import { getCategory } from "@/data/tools";

export const dynamicParams = false;
export function generateStaticParams() {
  return REVIEWS.map((r) => ({ slug: r.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = getReview(slug);
  if (!r) return {};
  const m = pageMeta({ title: r.title, description: r.summary.slice(0, 158), path: `/reviews/${slug}/`, type: "article", publishedTime: SITE.updated });
  return m;
}

function List({ title, items, tone }: { title: string; items: string[]; tone: "good" | "bad" }) {
  const color = tone === "good" ? "text-emerald-300" : "text-rose-300";
  return (
    <div className="glass rounded-[22px] p-6">
      <h2 className={`text-lg font-bold ${color}`}>{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {items.map((i) => (
          <li key={i} className="flex gap-3 text-soft">
            <span aria-hidden="true" className={`mt-0.5 ${color}`}>
              {tone === "good" ? "✓" : "–"}
            </span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ReviewPage({ params }: Props) {
  const { slug } = await params;
  const r = getReview(slug);
  const tool = r && getTool(r.toolId);
  if (!r || !tool) notFound();
  const hasPrice = !!PRICES[tool.id];

  return (
    <>
      <PageHeader
        eyebrow={`${getCategory(tool.category)?.label ?? tool.category} · Overview`}
        title={r.title}
        lead={r.summary}
        crumbs={[
          { name: "Reviews", href: "/reviews/" },
          { name: tool.name, href: `/reviews/${slug}/` },
        ]}
      >
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <AffLink id={tool.id} className="btn-primary" />
          <span className="text-sm text-muted">Updated {SITE.updated}</span>
        </div>
      </PageHeader>

      <div className="mx-auto max-w-5xl px-5">
        <p className="glass rounded-2xl border-l-4 border-l-amber px-5 py-3 text-sm text-muted">
          This page contains affiliate links. We may earn a commission if you sign up, at no extra cost to you. This is an editorial
          overview, not lab testing.{" "}
          <Link href="/affiliate-disclosure/" className="text-soft underline">
            Disclosure
          </Link>
        </p>

        <Reveal as="section" className="mt-8">
          <div className="glass rounded-[22px] p-6">
            <h2 className="text-lg font-bold text-white">How this overview was prepared</h2>
            <p className="mt-2 text-soft">
              This is a documentation-based overview. We read the vendor&rsquo;s official pages and compare them with other public sources. We
              have not run lab benchmarks, and statements about quality or speed are not test results. Prices come from the{" "}
              <Link href={`/tools/${tool.id}/`} className="underline">
                {tool.name} tool page
              </Link>
              , which lists each source and the date it was checked
              {tool.verified ? ` (record verified ${tool.verified})` : ""}. See the{" "}
              <Link href="/methodology/" className="underline">
                methodology
              </Link>
              .
            </p>
          </div>
        </Reveal>

        <Reveal as="section" className="mt-10">
          <h2 className="section-title text-white">What people use it for</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {r.useCases.map((u) => (
              <li key={u} className="glass rounded-2xl px-5 py-4 text-soft">
                {u}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="mt-12">
          <div className="grid gap-6 md:grid-cols-2">
            <List title="Pros" items={r.pros} tone="good" />
            <List title="Cons" items={r.cons} tone="bad" />
          </div>
        </Reveal>

        <Reveal as="section" className="mt-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass rounded-[22px] p-6">
              <h2 className="text-lg font-bold text-white">Best for</h2>
              <p className="mt-2 text-soft">{r.bestFor}</p>
            </div>
            <div className="glass rounded-[22px] p-6">
              <h2 className="text-lg font-bold text-white">Skip it if</h2>
              <p className="mt-2 text-soft">{r.skipIf}</p>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="mt-12">
          <h2 className="section-title text-white">Pricing</h2>
          <div className="glass mt-4 rounded-[22px] p-6">
            {hasPrice && (
              <div className="mb-3">
                <PriceTag id={tool.id} />
              </div>
            )}
            <p className="text-soft">{r.pricingNote}</p>
            <p className="mt-3 text-sm text-muted">
              Plans and prices change. Always confirm the current price on the{" "}
              <a href={tool.officialUrl} target="_blank" rel="noopener noreferrer" className="underline">
                official site
              </a>{" "}
              before you pay.
            </p>
          </div>
        </Reveal>

        <Reveal as="section" className="mt-12">
          <p className="mb-4 text-sm text-muted">
            More: <Link href={`/tools/${tool.id}/`} className="underline">{tool.name} tool page</Link>
          </p>
          <div className="glass relative overflow-hidden rounded-[26px] p-8">
            <div className="orb -right-8 -top-8 h-40 w-40 bg-electric" />
            <h2 className="relative text-xl font-bold text-white">Our verdict</h2>
            <p className="relative mt-2 text-lg text-soft">{r.verdict}</p>
            <div className="relative mt-6 flex flex-wrap gap-3">
              <AffLink id={tool.id} className="btn-primary" />
              <Link href="/compare/" className="btn-ghost">
                Compare with another tool
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: r.title,
          description: r.summary,
          datePublished: SITE.updated,
          dateModified: SITE.updated,
          image: absUrl("/brand/og.png"),
          mainEntityOfPage: absUrl(`/reviews/${slug}/`),
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
          about: { "@type": "SoftwareApplication", name: tool.name, url: tool.officialUrl },
        }}
      />
    </>
  );
}
