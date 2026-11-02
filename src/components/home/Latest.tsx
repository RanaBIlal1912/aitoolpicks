import Link from "next/link";
import type { NewsItem } from "@/data/news";
import type { Article } from "@/data/articles";
import ArticleCard, { ArticleSide } from "../ArticleCard";
import NewsVisual from "../NewsVisual";
import { formatDate } from "../NewsCard";
import { Head } from "./Sections";

function Empty({ what, href, cta }: { what: string; href: string; cta: string }) {
  return (
    <p className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-muted">
      No {what} yet.{" "}
      <Link href={href} prefetch={false} className="text-soft underline">
        {cta}
      </Link>
    </p>
  );
}

/**
 * Latest blog posts as an editorial spread: the newest article is a large image card, the next ones sit beside it in a column.
 * The list is the same one the Blog page shows (newest first), so "latest" is never hand-picked.
 */
export function LatestBlog({ items }: { items: Article[] }) {
  const [lead, ...rest] = items;
  return (
    <section aria-label="Latest blog posts">
      <Head n="01" eyebrow="From the blog" title="Latest guides" lead="Practical, plain-English reading on choosing and using AI tools." href="/blog/" cta="Explore All Articles" />
      {!lead ? (
        <Empty what="blog posts" href="/blog/" cta="Visit the blog" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <ArticleCard a={lead} />
          <div className="flex flex-col gap-5">
            {rest.map((a) => (
              <ArticleSide key={a.slug} a={a} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Latest news as a front page on a deeper band: one lead story with its image and summary, then a ruled feed of the next stories,
 * each with a thumbnail, type, date and the original source. Sorted by each story's own publication date.
 */
export function LatestNews({ items }: { items: NewsItem[] }) {
  const [lead, ...rest] = items;
  return (
    <section aria-label="Latest AI news" className="paper relative left-1/2 w-screen -translate-x-1/2 py-16 text-white md:py-20">
      <div className="mx-auto max-w-7xl px-5">
        <Head n="02" eyebrow="AI news" title="What happened, and why it matters" lead="Edited by hand, each story with its original source." href="/news/" cta="View All News" />
        {!lead ? (
          <Empty what="news" href="/news/" cta="Visit the news page" />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
            <article className="group">
              <Link href={`/news/${lead.slug}/`} prefetch={false} className="block no-underline">
                <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-white/10">
                  <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]">
                    <NewsVisual n={lead} sizes="(min-width: 1024px) 700px, 100vw" logos={3} />
                  </div>
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-cyan">
                  Top story · {lead.kind} · <time dateTime={lead.date}>{formatDate(lead.date)}</time>
                </p>
                <h3 className="mt-2 font-serif text-2xl font-bold leading-tight tracking-tight text-white group-hover:underline md:text-4xl">{lead.title}</h3>
                <p className="mt-3 max-w-2xl text-soft">{lead.summary}</p>
                <p className="mt-3 text-sm text-muted">Source: {lead.source}</p>
              </Link>
            </article>
            <ol className="divide-y divide-white/10 self-start rounded-2xl border border-white/10 bg-black/20 px-5">
              {rest.map((n) => (
                <li key={n.slug}>
                  <Link href={`/news/${n.slug}/`} prefetch={false} className="group flex gap-4 py-5 no-underline">
                    <div className="aspect-square w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 sm:w-24">
                      <NewsVisual n={n} small sizes="96px" logos={1} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-cyan">
                        {n.kind} · <time dateTime={n.date}>{formatDate(n.date)}</time>
                      </p>
                      <h3 className="mt-1 font-serif text-lg font-bold leading-snug text-white group-hover:underline">{n.title}</h3>
                      <p className="mt-1 text-xs text-muted">{n.source}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
