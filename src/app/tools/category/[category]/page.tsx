import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, CATEGORY_INFO, categoryFromSlug, categorySlug, toolsInCategory } from "@/data/tools";
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
  return CATEGORIES.map((c) => ({ category: categorySlug(c) }));
}

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const c = categoryFromSlug(category);
  if (!c) return {};
  const m = pageMeta({
    title: `${c} tools: compare options and free plans`,
    description: CATEGORY_INFO[c].blurb.slice(0, 180),
    path: `/tools/category/${category}/`,
  });
  m.openGraph = { ...m.openGraph, images: [{ url: absUrl(coverPath(CATEGORY_INFO[c].cover, "og")), width: 1200, height: 630 }] };
  return m;
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const c = categoryFromSlug(category);
  if (!c) notFound();
  const tools = toolsInCategory(c);
  return (
    <>
      <PageHeader
        eyebrow="Tool category"
        title={c}
        lead={CATEGORY_INFO[c].blurb}
        crumbs={[
          { name: "Tools", href: "/tools/" },
          { name: c, href: `/tools/category/${category}/` },
        ]}
      />
      <div className="mx-auto max-w-6xl px-5">
        <ParallaxFrame className="cover-frame mb-10 aspect-[16/6]" strength={24}>
          <Cover id={CATEGORY_INFO[c].cover} sizes="100vw" priority />
        </ParallaxFrame>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <li key={t.id} className="[perspective:1000px]">
              <ToolCard tool={t} />
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-wrap gap-2" aria-label="Other categories">
          {CATEGORIES.filter((x) => x !== c).map((x) => (
            <Link key={x} href={`/tools/category/${categorySlug(x)}/`} className="chip">
              {x}
            </Link>
          ))}
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${c} tools`,
          url: absUrl(`/tools/category/${category}/`),
          mainEntity: { "@type": "ItemList", itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: absUrl(`/tools/${t.id}/`) })) },
        }}
      />
    </>
  );
}
