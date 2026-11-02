import { pageMeta } from "@/lib/meta";
import { TOOLS } from "@/data/tools";
import Directory from "@/components/Directory";
import JsonLd from "@/components/JsonLd";
import { absUrl } from "@/lib/site";

export const metadata = pageMeta({
  title: "AI tools directory: search, filter and compare pricing",
  description:
    "Search AI assistants, coding, video, image, audio, writing, research, marketing and automation tools. Filter by category and pricing model, then compare plans.",
  path: "/tools/",
});

export default function ToolsPage() {
  return (
    <>
      {/* The directory is just the search and the results. The page keeps its heading for search engines and screen readers, and its breadcrumb data. */}
      <h1 className="sr-only">AI tools directory: find the right AI tool, and what it really costs</h1>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absUrl("/") },
            { "@type": "ListItem", position: 2, name: "Tools", item: absUrl("/tools/") },
          ],
        }}
      />
      <div className="pt-10 md:pt-14" />
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
