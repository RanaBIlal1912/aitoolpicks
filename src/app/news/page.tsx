import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { NEWS, NEWS_CHECKED, NEWS_KINDS, NEWS_TAGS, topStories } from "@/data/news";
import { getTool } from "@/data/tools";
import { SITE, absUrl, withBase } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import NewsCard, { formatDate } from "@/components/NewsCard";
import NewsFeed from "@/components/NewsFeed";
import ToolLogo from "@/components/ToolLogo";
import JsonLd from "@/components/JsonLd";

const meta = pageMeta({
  title: "AI News: top stories, model releases, research and policy",
  description: "Hand-checked AI news with the date, the original source, a short summary and why it matters. Product updates, model releases, research, policy and company news.",
  path: "/news/",
});
meta.alternates = { ...meta.alternates, types: { "application/rss+xml": absUrl("/news/feed.xml") } };
export const metadata = meta;

export default function NewsPage() {
  const all = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
  const top = topStories(4);
  const [lead, ...side] = top;
  const popular = all.filter((n) => n.importance >= 2).slice(0, 4);

  const toolCounts = new Map<string, number>();
  for (const n of NEWS) for (const t of n.tools ?? []) toolCounts.set(t, (toolCounts.get(t) ?? 0) + 1);
  const toolsInNews = [...toolCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => getTool(id))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .slice(0, 8);
  const topicCounts = NEWS_TAGS.map((t) => [t, NEWS.filter((n) => n.tag === t).length] as const).filter(([, c]) => c > 0);

  return (
    <>
      <PageHeader variant="magazine"
        eyebrow="AI news"
        title={
          <>
            What happened in AI, <span className="gradient-text">and why it matters</span>
          </>
        }
        lead="Product launches, model releases, research and policy, each with its original source, a short summary and a note on what it means for people choosing tools."
        crumbs={[{ name: "AI News", href: "/news/" }]}
      >
        <p className="byline mt-4">
          Edited by hand · last checked {formatDate(NEWS_CHECKED)} · latest story {formatDate(all[0].date)} ·{" "}
          <Link href="/methodology/" className="underline">
            how we publish
          </Link>
        </p>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-5">
        <section aria-labelledby="top-title">
          <h2 id="top-title" className="kicker mb-4">
            Top stories
          </h2>
          <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
            <NewsCard n={lead} variant="lead" />
            <div className="flex flex-col gap-4">
              {side.map((n) => (
                <NewsCard key={n.slug} n={n} variant="side" />
              ))}
            </div>
          </div>
        </section>

        <div className="mt-16">
          <NewsFeed items={all} tags={NEWS_TAGS} kinds={NEWS_KINDS} />
        </div>

        <section className="mt-20 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-3" aria-label="More ways into the news">
          <div className="glass min-w-0 rounded-[22px] p-6">
            <h2 className="text-lg font-bold text-white">Browse by topic</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {topicCounts.map(([t, c]) => (
                <li key={t}>
                  <a href={withBase(`/news/?topic=${encodeURIComponent(t)}`)} className="chip">
                    {t} <span className="text-xs text-muted">{c}</span>
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-muted">By type</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {NEWS_KINDS.filter((k) => NEWS.some((n) => n.kind === k)).map((k) => (
                <li key={k}>
                  <a href={withBase(`/news/?type=${encodeURIComponent(k)}`)} className="chip">
                    {k}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass min-w-0 rounded-[22px] p-6">
            <h2 className="text-lg font-bold text-white">Important recent coverage</h2>
            <ul className="mt-4 divide-y divide-white/10">
              {popular.map((n) => (
                <li key={n.slug} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/news/${n.slug}/`} className="font-serif font-bold leading-snug text-white no-underline hover:underline">
                    {n.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {n.source} · {formatDate(n.date)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass min-w-0 rounded-[22px] p-6">
            <h2 className="text-lg font-bold text-white">Tools in the news</h2>
            <ul className="mt-4 grid gap-3">
              {toolsInNews.map((t) => (
                <li key={t.id}>
                  <Link href={`/tools/${t.id}/`} className="flex min-w-0 items-center gap-3 text-soft no-underline hover:text-white">
                    <ToolLogo id={t.id} name={t.name} hue={t.hue} size={32} />
                    <span className="shrink-0 font-semibold">{t.name}</span>
                    <span className="min-w-0 truncate text-xs text-muted">{t.tagline}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="glass mt-8 rounded-[22px] p-6 md:p-8" aria-labelledby="follow-title">
          <h2 id="follow-title" className="text-lg font-bold text-white">
            Follow the news
          </h2>
          <p className="mt-2 max-w-2xl text-soft">
            There is no email newsletter, so there is no sign-up form. You can follow new stories with the RSS feed in any feed reader, or watch the project on
            GitHub.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={withBase("/news/feed.xml")} className="btn-primary btn-sm">
              RSS feed
            </a>
            <a href={SITE.repo} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
              Watch on GitHub ↗
            </a>
          </div>
        </section>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "AI news",
          itemListElement: all.map((n, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: { "@type": "NewsArticle", headline: n.title, datePublished: n.date, url: absUrl(`/news/${n.slug}/`), isBasedOn: n.url, publisher: { "@type": "Organization", name: SITE.name } },
          })),
        }}
      />
    </>
  );
}
