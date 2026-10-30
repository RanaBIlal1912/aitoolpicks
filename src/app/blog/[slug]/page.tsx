import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GUIDES, getArticle, getArticleParts, articlesInTopic, TOPICS } from "@/data/articles";
import { pageMeta } from "@/lib/meta";
import { SITE, absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import ProseHtml from "@/components/ProseHtml";
import ArticleCard, { formatDate } from "@/components/ArticleCard";
import ArticleCover from "@/components/ArticleCover";
import Toc from "@/components/Toc";
import JsonLd from "@/components/JsonLd";

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  const m = pageMeta({ title: a.title, description: a.description, path: `/blog/${slug}/`, type: "article", publishedTime: a.date });
  return m;
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a || a.kind !== "guide") notFound();
  const topic = TOPICS.find((t) => t.id === a.topic);
  const { html, toc } = getArticleParts(a.slug);
  const related = articlesInTopic(a.topic)
    .filter((x) => x.slug !== a.slug)
    .concat(GUIDES.filter((x) => x.topic !== a.topic))
    .slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={topic?.label ?? a.cat}
        title={a.title}
        lead={a.description}
        crumbs={[
          { name: "Blog", href: "/blog/" },
          { name: topic?.label ?? a.cat, href: `/blog/topic/${a.topic}/` },
          { name: a.title, href: `/blog/${slug}/` },
        ]}
      >
        <p className="byline mt-5">
          By {SITE.name} editors · Updated <time dateTime={a.date}>{formatDate(a.date)}</time> · {a.minutes} min read ·{" "}
          <Link href={`/blog/topic/${a.topic}/`} className="underline">
            More on {topic?.label.toLowerCase()}
          </Link>
        </p>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-5">
        <figure>
          <div className="aspect-[16/6] overflow-hidden rounded-[22px] border border-white/10">
            <ArticleCover topic={a.topic} tools={a.tools} />
          </div>
          <figcaption className="mt-2 text-xs text-muted">Cover made for this site from the logos of the tools in this guide. It is an illustration, not a screenshot.</figcaption>
        </figure>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 max-w-3xl">
            <p className="glass rounded-2xl border-l-4 border-l-amber px-5 py-3 text-sm text-muted">
              This page contains affiliate links. We may earn a commission if you sign up, at no extra cost to you. Features and
              prices change, so check each tool&rsquo;s own site before paying.{" "}
              <Link href="/affiliate-disclosure/" className="text-soft underline">
                Disclosure
              </Link>
            </p>
            <div className="mt-8">
              <ProseHtml html={html} />
            </div>
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Toc items={toc} />
            </div>
          </aside>
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-6xl px-5">
        <h2 className="section-title mb-6 text-white">Keep reading</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {related.map((r) => (
            <ArticleCard key={r.slug} a={r} />
          ))}
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
          mainEntityOfPage: absUrl(`/blog/${slug}/`),
          wordCount: a.words,
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
    </>
  );
}
