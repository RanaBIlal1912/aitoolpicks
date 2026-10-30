import Link from "next/link";
import type { NewsItem } from "@/data/news";
import NewsVisual from "./NewsVisual";

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export type NewsVariant = "lead" | "side" | "row" | "compact";

function Meta({ n }: { n: NewsItem }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="kicker">{n.kind}</span>
      <span className="byline">{n.tag}</span>
      <time dateTime={n.date} className="byline">
        {formatDate(n.date)}
      </time>
      <span className="byline">{n.source}</span>
    </div>
  );
}

/**
 * One story, in four layouts: "lead" (large, for the top story), "side" (supporting story beside it), "row" (the feed) and "compact"
 * (small list). Every layout has the same parts so the hierarchy reads the same way: visual, type, date and source, headline, summary.
 */
export default function NewsCard({ n, variant = "row" }: { n: NewsItem; variant?: NewsVariant }) {
  const href = `/news/${n.slug}/`;
  const title = (cls: string) => (
    <h3 className={`font-serif font-bold leading-snug tracking-tight text-white ${cls}`}>
      <Link href={href} className="news-link no-underline">
        {n.title}
      </Link>
    </h3>
  );

  if (variant === "lead") {
    return (
      <article className="news-card group relative flex h-full flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#0a0e18]/80">
        <div className="aspect-[16/9] w-full overflow-hidden">
          <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]">
            <NewsVisual n={n} priority sizes="(min-width: 1024px) 60vw, 100vw" logos={3} />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6 md:p-8">
          <Meta n={n} />
          {title("text-2xl md:text-[2.1rem] md:leading-[1.15]")}
          <p className="text-soft md:text-lg">{n.summary}</p>
          <p className="rounded-xl border border-cyan/20 bg-cyan/5 px-4 py-2.5 text-sm text-[#c3e3ea]">
            <strong className="text-white">Why it may matter:</strong> {n.matters}
          </p>
        </div>
      </article>
    );
  }

  if (variant === "side") {
    return (
      <article className="news-card group relative flex gap-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e18]/80 p-3 sm:p-4">
        <div className="aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl sm:w-36">
          <NewsVisual n={n} sizes="150px" logos={1} small />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 text-xs">
            <span className="kicker !text-[0.68rem]">{n.kind}</span>
            <time dateTime={n.date} className="byline">
              {formatDate(n.date)}
            </time>
          </div>
          {title("text-[1.05rem] line-clamp-3")}
          <p className="text-xs text-muted">{n.source}</p>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="news-card group relative rounded-2xl border border-white/10 bg-[#0a0e18]/80 p-5">
        <Meta n={n} />
        <div className="mt-2">{title("text-lg")}</div>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{n.summary}</p>
      </article>
    );
  }

  return (
    <article className="news-card group relative grid gap-4 overflow-hidden rounded-[22px] border border-white/10 bg-[#0a0e18]/80 p-4 sm:grid-cols-[15rem_1fr] sm:gap-6 sm:p-5">
      <div className="aspect-[16/10] w-full overflow-hidden rounded-xl sm:aspect-[4/3]">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
          <NewsVisual n={n} sizes="(min-width: 640px) 240px, 100vw" logos={2} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2.5">
        <Meta n={n} />
        {title("text-xl md:text-[1.4rem]")}
        <p className="text-[0.97rem] text-soft">{n.summary}</p>
        <p className="text-sm text-muted">
          <strong className="text-soft">Why it matters:</strong> {n.matters}
        </p>
        <a
          href={n.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 mt-auto w-fit pt-1 text-sm font-bold text-[#9db4d6] no-underline hover:underline"
          aria-label={`Read the original: ${n.title} (opens in a new tab)`}
        >
          Original at {n.source} ↗
        </a>
      </div>
    </article>
  );
}
