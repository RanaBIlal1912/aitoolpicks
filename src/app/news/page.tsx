import { pageMeta } from "@/lib/meta";
import { NEWS, NEWS_CHECKED } from "@/data/news";
import PageHeader from "@/components/PageHeader";
import NewsCard, { formatDate } from "@/components/NewsCard";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";

export const metadata = pageMeta({
  title: "AI News: dated updates with original source links",
  description:
    "Short AI news summaries from official company announcements, each with its publication date and a link to the original source.",
  path: "/news/",
});

export default function NewsPage() {
  const items = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
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
          list, not a complete feed, and we do not repeat rumours.
        </p>
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {items.map((n, i) => (
            <Reveal as="li" key={n.url} delay={(i % 2) * 0.06}>
              <NewsCard n={n} />
            </Reveal>
          ))}
        </ul>
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
