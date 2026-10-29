import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, getCategory, toolsInCategory } from "@/data/tools";
import { ROUNDUPS } from "@/data/roundups";
import { coverPath } from "@/data/covers";
import { pageMeta } from "@/lib/meta";
import { absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import ToolCard from "@/components/ToolCard";
import Cover from "@/components/Cover";
import ParallaxFrame from "@/components/ParallaxFrame";
import JsonLd from "@/components/JsonLd";

export const dynamicParams = false;
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return {};
  const m = pageMeta({
    title: `${c.label}: tools, pricing and free plans`,
    description: c.blurb.slice(0, 180),
    path: `/tools/category/${category}/`,
  });
  m.openGraph = { ...m.openGraph, images: [{ url: absUrl(coverPath(c.cover, "og")), width: 1200, height: 630 }] };
  return m;
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  const tools = toolsInCategory(c.slug);
  const verified = tools.filter((t) => t.pricingStatus === "verified").length;
  const roundup = ROUNDUPS.find((r) => r.category === c.slug);
  return (
    <>
      <PageHeader
        eyebrow="Tool category"
        title={c.label}
        lead={c.blurb}
        crumbs={[
          { name: "Tools", href: "/tools/" },
          { name: c.label, href: `/tools/category/${category}/` },
        ]}
      >
        <p className="byline mt-4">
          {tools.length} {tools.length === 1 ? "tool" : "tools"} listed · pricing verified for {verified}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {roundup && (
            <Link href={`/best/${roundup.slug}/`} className="btn-primary btn-sm">
              Read: {roundup.title}
            </Link>
          )}
          <Link href={`/tools/?category=${c.slug}`} className="btn-ghost btn-sm">
            Search and filter this category
          </Link>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-5">
        <ParallaxFrame className="cover-frame mb-10 aspect-[16/6]" strength={24}>
          <Cover id={c.cover} sizes="100vw" priority />
        </ParallaxFrame>
        <h2 className="sr-only">Tools in {c.label}</h2>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <li key={t.id}>
              <ToolCard tool={t} />
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-wrap gap-2" aria-label="Other categories">
          {CATEGORIES.filter((x) => x.slug !== c.slug).map((x) => (
            <Link key={x.slug} href={`/tools/category/${x.slug}/`} className="chip">
              {x.short}
            </Link>
          ))}
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: c.label,
          url: absUrl(`/tools/category/${category}/`),
          mainEntity: { "@type": "ItemList", itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: absUrl(`/tools/${t.id}/`) })) },
        }}
      />
    </>
  );
}
