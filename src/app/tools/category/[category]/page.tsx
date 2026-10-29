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
  // Group by subcategory in the order the category defines; tools in a secondary category (no matching sub) go last.
  const groups = c.subs
    .map((s) => ({ slug: s.slug, label: s.label, tools: tools.filter((t) => t.category === c.slug && t.subcategory === s.slug) }))
    .filter((g) => g.tools.length > 0);
  const grouped = new Set(groups.flatMap((g) => g.tools.map((t) => t.id)));
  const rest = tools.filter((t) => !grouped.has(t.id));
  if (rest.length) groups.push({ slug: "related", label: "Also relevant here", tools: rest });
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
          <Link href="/news/" className="btn-ghost btn-sm">
            Latest AI news
          </Link>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="sr-only">Tools in {c.label}</h2>
        {groups.map((g) => (
          <section key={g.slug} className="mb-12" aria-labelledby={`sub-${g.slug}`}>
            <h3 id={`sub-${g.slug}`} className="mb-5 text-xl font-bold tracking-tight text-white">
              {g.label} <span className="text-base font-medium text-muted">({g.tools.length})</span>
            </h3>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {g.tools.map((t) => (
                <li key={t.id}>
                  <ToolCard tool={t} />
                </li>
              ))}
            </ul>
          </section>
        ))}
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
