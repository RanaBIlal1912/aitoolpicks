import Link from "next/link";
import type { NewsItem } from "@/data/news";
import type { Article } from "@/data/articles";
import NewsVisual from "../NewsVisual";
import ArticleCover from "../ArticleCover";
import { formatDate } from "../ArticleCard";
import { PanelHead } from "./Neon";

const card = "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/25 no-underline transition-colors hover:border-cyan/60";

function Empty({ what, href, cta }: { what: string; href: string; cta: string }) {
  return (
    <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-muted">
      No {what} yet.{" "}
      <Link href={href} prefetch={false} className="text-soft underline">
        {cta}
      </Link>
    </p>
  );
}

/** The newest blog posts, taken from the same list the Blog page shows. Dated, so "latest" is never a hand-picked set. */
export function LatestBlog({ items }: { items: Article[] }) {
  return (
    <section className="panel p-5" aria-label="Latest blog posts">
      <PanelHead icon={<path d="M5 19l3.5-1 10-10a2 2 0 00-3-3l-10 10zM14 7l3 3" />} title="Latest Blog" href="/blog/" cta="View All Blogs" />
      {items.length === 0 ? (
        <Empty what="blog posts" href="/blog/" cta="Visit the blog" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <li key={a.slug}>
              <Link href={a.href} prefetch={false} className={card}>
                <div className="relative h-32 w-full shrink-0 overflow-hidden">
                  <ArticleCover topic={a.topic} tools={[]} small seed={a.slug} />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base font-bold leading-snug text-white group-hover:underline">{a.title}</h3>
                  <p className="mt-1.5 text-xs text-muted">
                    <time dateTime={a.date}>{formatDate(a.date)}</time> · {a.minutes} min read
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The newest news items, sorted by their own publication date. */
export function LatestNews({ items }: { items: NewsItem[] }) {
  return (
    <section className="panel p-5" aria-label="Latest AI news">
      <PanelHead icon={<path d="M4 5h13v14H6a2 2 0 01-2-2zM17 9h3v8a2 2 0 01-2 2M8 9h6M8 13h6" />} title="Latest AI News" href="/news/" cta="View All News" />
      {items.length === 0 ? (
        <Empty what="news" href="/news/" cta="Visit the news page" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <li key={n.slug}>
              <Link href={`/news/${n.slug}/`} prefetch={false} className={card}>
                <div className="relative h-32 w-full shrink-0 overflow-hidden">
                  <NewsVisual n={n} small sizes="(min-width: 1024px) 400px, 100vw" logos={1} />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base font-bold leading-snug text-white group-hover:underline">{n.title}</h3>
                  <p className="mt-1.5 text-xs text-muted">
                    <time dateTime={n.date}>{formatDate(n.date)}</time> · {n.source}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
