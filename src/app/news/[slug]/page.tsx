import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NEWS, getNews } from "@/data/news";
import { getTool } from "@/data/tools";
import { coverPath } from "@/data/covers";
import { pageMeta } from "@/lib/meta";
import { SITE, absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import NewsCard, { formatDate } from "@/components/NewsCard";
import { Monogram } from "@/components/ToolCard";
import JsonLd from "@/components/JsonLd";

export const dynamicParams = false;
export function generateStaticParams() {
  return NEWS.map((n) => ({ slug: n.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const n = getNews(slug);
  if (!n) return {};
  const m = pageMeta({ title: n.title, description: n.summary.slice(0, 180), path: `/news/${slug}/` });
  m.openGraph = { ...m.openGraph, images: [{ url: absUrl(coverPath("signal", "og")), width: 1200, height: 630 }] };
  return m;
}

export default async function NewsItemPage({ params }: Props) {
  const { slug } = await params;
  const n = getNews(slug);
  if (!n) notFound();
  const tools = (n.tools ?? []).map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => !!t);
  const more = NEWS.filter((x) => x.slug !== n.slug && (x.tag === n.tag || x.tools?.some((t) => n.tools?.includes(t))))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2);

  return (
    <>
      <PageHeader
        eyebrow={n.kind}
        title={n.title}
        crumbs={[
          { name: "AI News", href: "/news/" },
          { name: n.title, href: `/news/${n.slug}/` },
        ]}
      >
        <p className="byline mt-4">
          <time dateTime={n.date}>{formatDate(n.date)}</time> · Source: {n.source} · Topic: {n.tag}
          {n.dateFromUrl ? " · date read from the article address" : ""}
        </p>
      </PageHeader>

      <div className="mx-auto max-w-3xl px-5">
        <section aria-labelledby="summary" className="glass rounded-[22px] p-7">
          <h2 id="summary" className="kicker">
            What the source says
          </h2>
          <p className="mt-3 text-lg text-soft">{n.summary}</p>
          <p className="mt-5">
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
              Read the original at {n.source} ↗
            </a>
          </p>
        </section>

        <section aria-labelledby="matters" className="mt-6 rounded-[22px] border border-cyan/20 bg-cyan/5 p-7">
          <h2 id="matters" className="kicker">
            Why it may matter
          </h2>
          <p className="mt-3 text-soft">{n.matters}</p>
          <p className="mt-3 text-sm text-muted">This note is our interpretation, written for people choosing tools. It is not a claim made by the source.</p>
        </section>

        {tools.length > 0 && (
          <section aria-labelledby="tools" className="mt-10">
            <h2 id="tools" className="section-title text-white">
              Tools mentioned
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {tools.map((t) => (
                <li key={t.id} className="glass flex items-center gap-4 rounded-2xl p-4">
                  <Monogram name={t.name} hue={t.hue} size={44} />
                  <div className="min-w-0">
                    <Link href={`/tools/${t.id}/`} className="font-bold text-white no-underline hover:underline">
                      {t.name}
                    </Link>
                    <p className="truncate text-sm text-muted">{t.tagline}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {more.length > 0 && (
          <section aria-labelledby="more" className="mt-12">
            <h2 id="more" className="section-title text-white">
              Related news
            </h2>
            <ul className="mt-5 grid gap-6 md:grid-cols-2">
              {more.map((x) => (
                <li key={x.slug}>
                  <NewsCard n={x} compact />
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-12 text-sm text-muted">
          <Link href="/news/" className="underline">
            Back to all AI news
          </Link>
          . {SITE.name} summarises announcements in its own words and links to the original source. Methodology:{" "}
          <Link href="/methodology/" className="underline">
            how we work
          </Link>
          .
        </p>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: n.title,
          datePublished: n.date,
          description: n.summary,
          mainEntityOfPage: absUrl(`/news/${n.slug}/`),
          isBasedOn: n.url,
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
    </>
  );
}
