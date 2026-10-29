import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GUIDES, getArticle, getArticleHtml, articlesInTopic, TOPICS } from "@/data/articles";
import { pageMeta } from "@/lib/meta";
import { SITE, absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import ProseHtml from "@/components/ProseHtml";
import ArticleCard from "@/components/ArticleCard";
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
  return pageMeta({ title: a.title, description: a.description, path: `/blog/${slug}/`, type: "article", publishedTime: a.date });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a || a.kind !== "guide") notFound();
  const topic = TOPICS.find((t) => t.id === a.topic);
  const related = articlesInTopic(a.topic)
    .filter((x) => x.slug !== a.slug)
    .concat(GUIDES.filter((x) => x.topic !== a.topic))
    .slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={a.cat}
        title={a.title}
        lead={a.description}
        crumbs={[
          { name: "Blog", href: "/blog/" },
          { name: a.title, href: `/blog/${slug}/` },
        ]}
      >
        <p className="mt-5 text-sm text-muted">
          Updated {a.date} · {a.minutes} min read{topic ? ` · ${topic.label}` : ""}
        </p>
      </PageHeader>

      <div className="mx-auto max-w-3xl px-5">
        <p className="glass rounded-2xl border-l-4 border-l-amber px-5 py-3 text-sm text-muted">
          This page contains affiliate links. We may earn a commission if you sign up, at no extra cost to you. Features and prices
          change, so check each tool&rsquo;s own site before paying.{" "}
          <Link href="/affiliate-disclosure/" className="text-soft underline">
            Disclosure
          </Link>
        </p>
        <div className="mt-8">
          <ProseHtml html={getArticleHtml(a.slug)} />
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-6xl px-5">
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
          mainEntityOfPage: absUrl(`/blog/${slug}/`),
          wordCount: a.words,
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
    </>
  );
}
