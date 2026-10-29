import { pageMeta } from "@/lib/meta";
import { NEWS, NEWS_CHECKED, NEWS_TAGS } from "@/data/news";
import { coverPath } from "@/data/covers";
import { absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import NewsCard, { formatDate } from "@/components/NewsCard";
import NewsFeed from "@/components/NewsFeed";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";

const meta = pageMeta({
  title: "AI News: dated updates with original source links",
  description:
    "Short AI news summaries from official company announcements, each with its publication date and a link to the original source.",
  path: "/news/",
});
meta.openGraph = { ...meta.openGraph, images: [{ url: absUrl(coverPath("signal", "og")), width: 1200, height: 630 }] };
export const metadata = meta;

export default function NewsPage() {
  const items = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
  const [top, ...rest] = items;
  return (
    <>
      <PageHeader
        eyebrow="AI news"
        title={
          <>
            What&rsquo;s new in AI, <span className="gradient-text">with receipts</span>
          </>
        }
        lead="Every item below links to the original announcement and shows the date it was published. Summaries stay close to what the source says."
        crumbs={[{ name: "AI News", href: "/news/" }]}
      />
      <div className="mx-auto max-w-6xl px-5">
        <p className="glass rounded-2xl border-l-4 border-l-cyan px-5 py-3 text-sm text-muted">
          Items are added by hand after reading the original source. Last checked {formatDate(NEWS_CHECKED)}. This is a short
          list, not a complete feed, and we do not repeat rumours or unsourced reports.
        </p>
        <Reveal as="section" className="mt-8">
          <p className="kicker mb-4">Top story</p>
          <NewsCard n={top} featured />
        </Reveal>
        <Reveal as="section" className="mt-14">
          <h2 className="section-title mb-6 text-white">More from the last few weeks</h2>
          <NewsFeed items={rest} tags={NEWS_TAGS} />
        </Reveal>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "AI news",
          itemListElement: items.map((n, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: { "@type": "NewsArticle", headline: n.title, datePublished: n.date, url: n.url, publisher: { "@type": "Organization", name: n.source } },
          })),
        }}
      />
    </>
  );
}
