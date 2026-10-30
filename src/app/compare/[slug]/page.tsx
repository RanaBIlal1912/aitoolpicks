import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { COMPARISONS, getComparison } from "@/data/compare";
import { getArticle, getArticleHtml } from "@/data/articles";
import ArticleCover from "@/components/ArticleCover";
import { pageMeta } from "@/lib/meta";
import { SITE, absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import ComparisonTable from "@/components/ComparisonTable";
import ProseHtml from "@/components/ProseHtml";
import JsonLd from "@/components/JsonLd";

export const dynamicParams = false;
export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  const a = c && getArticle(c.article);
  if (!a) return {};
  const m = pageMeta({ title: a.title, description: a.description, path: `/compare/${slug}/`, type: "article", publishedTime: a.date });
  return m;
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const c = getComparison(slug);
  const a = c && getArticle(c.article);
  if (!c || !a) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Comparison"
        title={a.title}
        lead={a.description}
        crumbs={[
          { name: "Compare", href: "/compare/" },
          { name: `${c.leftLabel} vs ${c.rightLabel}`, href: `/compare/${slug}/` },
        ]}
      >
        <p className="mt-5 text-sm text-muted">
          Updated {a.date} · {a.minutes} min read
        </p>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-8 aspect-[16/6] overflow-hidden rounded-[22px] border border-white/10">
          <ArticleCover topic={a.topic} tools={a.tools} seed={a.slug} />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-5">
        <p className="glass rounded-2xl border-l-4 border-l-amber px-5 py-3 text-sm text-muted">
          This page contains affiliate links. We may earn a commission if you sign up, at no extra cost to you. Features and prices
          change, so check each tool&rsquo;s own site before paying.{" "}
          <Link href="/affiliate-disclosure/" className="text-soft underline">
            Disclosure
          </Link>
        </p>
        <ComparisonTable c={c} />
        <ProseHtml html={getArticleHtml(a.slug)} />
        <div className="glass mt-14 rounded-[24px] p-7">
          <p className="font-bold text-white">Want to compare other tools?</p>
          <p className="mt-1 text-muted">Pick any two tools from our directory and see them side by side.</p>
          <Link href="/compare/" className="btn-primary btn-sm mt-4">
            Open the comparison tool
          </Link>
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.description,
          datePublished: a.date,
          dateModified: SITE.updated,
          image: absUrl("/brand/og.png"),
          mainEntityOfPage: absUrl(`/compare/${slug}/`),
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
    </>
  );
}
