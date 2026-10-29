import { pageMeta } from "@/lib/meta";
import { TOOLS } from "@/data/tools";
import PageHeader from "@/components/PageHeader";
import Directory from "@/components/Directory";
import JsonLd from "@/components/JsonLd";
import { absUrl } from "@/lib/site";

export const metadata = pageMeta({
  title: "AI Tools Directory: search and filter by category",
  description:
    "Search and filter AI and online tools for freelancers and small businesses by category, free plan and whether we have written an overview.",
  path: "/tools/",
});

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title={
          <>
            Find a tool, <span className="gradient-text">fast</span>
          </>
        }
        lead="Search by name or use, then filter by category. Prices appear only where we checked the official page; everywhere else the card sends you to the official site."
        crumbs={[{ name: "Tools", href: "/tools/" }]}
      />
      <Directory />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "AI Tool Picks directory",
          itemListElement: TOOLS.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: t.officialUrl })),
        }}
      />
      <p className="mx-auto mt-10 max-w-6xl px-5 text-sm text-muted">
        Directory last reviewed {new Date("2026-10-29").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.
        Listing a tool is not an endorsement. See <a className="underline" href={absUrl("/about/")}>how we choose</a>.
      </p>
    </>
  );
}
