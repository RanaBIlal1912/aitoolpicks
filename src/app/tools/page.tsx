import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { CATEGORIES, TOOLS, toolsInCategory } from "@/data/tools";
import PageHeader from "@/components/PageHeader";
import Directory from "@/components/Directory";
import JsonLd from "@/components/JsonLd";
import Cover from "@/components/Cover";
import { absUrl } from "@/lib/site";

export const metadata = pageMeta({
  title: "AI tools directory: search, filter and compare pricing",
  description:
    "Search AI assistants, coding tools, video, image, audio, writing, research, marketing and automation tools. Filter by category and pricing model, sort and compare plans.",
  path: "/tools/",
});

export default function ToolsPage() {
  const verified = TOOLS.filter((t) => t.pricingStatus === "verified").length;
  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title={
          <>
            Find the right AI tool, <span className="gradient-text">and what it really costs</span>
          </>
        }
        lead={`${TOOLS.length} tools across ${CATEGORIES.length} categories. Each page shows the vendor's own plan names, official prices and limits, the date we checked them and a link to the source. Pricing is fully verified for ${verified} of them; the rest are labelled.`}
        crumbs={[{ name: "Tools", href: "/tools/" }]}
      />

      <div className="mx-auto max-w-6xl px-5">
        <ul className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Browse by category">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/tools/category/${c.slug}/`} className="group relative block aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 no-underline">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.05]">
                  <Cover id={c.cover} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-[#05070d]/60 to-[#05070d]/10" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-bold text-white">{c.short}</p>
                  <p className="text-xs text-soft">{toolsInCategory(c.slug).length} tools</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Directory />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "AI Tool Picks directory",
          itemListElement: TOOLS.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: absUrl(`/tools/${t.id}/`) })),
        }}
      />
    </>
  );
}
