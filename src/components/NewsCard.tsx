import type { NewsItem } from "@/data/news";
import Cover from "./Cover";

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Standard news card, or a featured story with a cover render when `featured` is set. */
export default function NewsCard({ n, compact = false, featured = false }: { n: NewsItem; compact?: boolean; featured?: boolean }) {
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="kicker">{n.tag}</span>
        <time dateTime={n.date} className="byline">
          {formatDate(n.date)}
        </time>
        <span className="byline">via {n.source}</span>
      </div>
      <h3
        className={`font-serif font-bold leading-snug tracking-tight text-white ${featured ? "text-2xl md:text-[2rem] md:leading-[1.15]" : "text-xl"}`}
      >
        <a href={n.url} target="_blank" rel="noopener noreferrer" className="no-underline hover:underline">
          {n.title}
          <span className="sr-only"> (opens the original source in a new tab)</span>
        </a>
      </h3>
      {!compact && <p className={`text-soft ${featured ? "text-base md:text-lg" : "text-[0.97rem]"}`}>{n.summary}</p>}
      {!compact && n.matters && (
        <p className="rounded-xl border border-cyan/20 bg-cyan/5 px-4 py-2.5 text-sm text-[#bdf3fb]">
          <strong className="text-white">Why it may matter:</strong> {n.matters}
        </p>
      )}
      <a
        href={n.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto pt-2 text-sm font-bold text-[#8fd3ff] no-underline hover:underline"
        aria-label={`Read the original: ${n.title}`}
      >
        Read the original at {n.source} ↗
      </a>
    </>
  );

  if (featured) {
    return (
      <article className="glass card-glow grid overflow-hidden md:grid-cols-[1fr_1.1fr]" style={{ ["--hue" as string]: 265 }}>
        <div className="cover-frame !rounded-none !border-0 aspect-[16/9] md:aspect-auto md:min-h-[300px]">
          <Cover id="signal" sizes="(min-width: 768px) 45vw, 100vw" priority />
        </div>
        <div className="flex flex-col gap-3 p-7 md:p-10">{body}</div>
      </article>
    );
  }
  return <article className="glass flex h-full flex-col gap-3 rounded-[22px] p-6">{body}</article>;
}
