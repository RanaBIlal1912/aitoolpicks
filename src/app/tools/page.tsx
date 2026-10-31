import { pageMeta } from "@/lib/meta";
import { CATEGORIES, TOOLS } from "@/data/tools";
import PageHeader from "@/components/PageHeader";
import Directory from "@/components/Directory";
import { CategoryRail } from "@/components/home/Sections";
import JsonLd from "@/components/JsonLd";
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
        variant="directory"
        stats={[[String(TOOLS.length), "tools"], [String(CATEGORIES.length), "categories"], [String(verified), "fully verified prices"]]}
        eyebrow="Directory"
        title={
          <>
            Find the right AI tool, <span className="gradient-text">and what it really costs</span>
          </>
        }
        lead={`${TOOLS.length} tools across ${CATEGORIES.length} categories. Each page shows the vendor's own plan names, official prices and limits, the date we checked them and a link to the source. Pricing is fully verified for ${verified} of them; the rest are labelled.`}
        crumbs={[{ name: "Tools", href: "/tools/" }]}
      />

      <div className="mx-auto mb-10 max-w-7xl px-5">
        <CategoryRail />
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
