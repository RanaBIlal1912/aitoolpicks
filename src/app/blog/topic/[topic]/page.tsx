import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { COVER_BY_TOPIC, TOPICS, articlesInTopic } from "@/data/articles";
import { coverPath } from "@/data/covers";
import { pageMeta } from "@/lib/meta";
import { absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import ArticleCard from "@/components/ArticleCard";
import Cover from "@/components/Cover";
import ParallaxFrame from "@/components/ParallaxFrame";
import JsonLd from "@/components/JsonLd";

export const dynamicParams = false;
export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.id }));
}

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const t = TOPICS.find((x) => x.id === topic);
  if (!t) return {};
  const m = pageMeta({
    title: `${t.label}: guides and how-tos`,
    description: `${t.blurb} Practical guides on ${t.label.toLowerCase()} for people choosing and using AI tools.`.slice(0, 180),
    path: `/blog/topic/${topic}/`,
  });
  m.openGraph = { ...m.openGraph, images: [{ url: absUrl(coverPath(COVER_BY_TOPIC[t.id], "og")), width: 1200, height: 630 }] };
  return m;
}

export default async function TopicPage({ params }: Props) {
  const { topic } = await params;
  const t = TOPICS.find((x) => x.id === topic);
  if (!t) notFound();
  const list = articlesInTopic(t.id);
  const [first, ...rest] = list;
  return (
    <>
      <PageHeader
        eyebrow="Topic"
        title={t.label}
        lead={t.blurb}
        crumbs={[
          { name: "Blog", href: "/blog/" },
          { name: t.label, href: `/blog/topic/${topic}/` },
        ]}
      />
      <div className="mx-auto max-w-6xl px-5">
        <ParallaxFrame className="cover-frame mb-10 aspect-[16/6]" strength={24}>
          <Cover id={COVER_BY_TOPIC[t.id]} sizes="100vw" priority />
        </ParallaxFrame>
        <h2 className="sr-only">Guides on {t.label.toLowerCase()}</h2>
        {first && (
          <div className="mb-6">
            <ArticleCard a={first} featured />
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <ArticleCard key={a.slug} a={a} />
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-2" aria-label="Other topics">
          {TOPICS.filter((x) => x.id !== t.id).map((x) => (
            <Link key={x.id} href={`/blog/topic/${x.id}/`} className="chip">
              {x.label}
            </Link>
          ))}
          <Link href="/blog/" className="chip">
            All guides
          </Link>
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${t.label} guides`,
          url: absUrl(`/blog/topic/${topic}/`),
          mainEntity: { "@type": "ItemList", itemListElement: list.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.title, url: absUrl(a.href) })) },
        }}
      />
    </>
  );
}
