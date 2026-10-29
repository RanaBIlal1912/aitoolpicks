import type { NewsItem } from "@/data/news";

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function NewsCard({ n, compact = false }: { n: NewsItem; compact?: boolean }) {
  return (
    <article className="glass flex h-full flex-col gap-3 rounded-[22px] p-6">
      <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.12em]">
        <time dateTime={n.date} className="text-cyan">
          {formatDate(n.date)}
        </time>
        <span className="font-medium normal-case tracking-normal text-muted">via {n.source}</span>
      </div>
      <h3 className="font-serif text-xl font-bold leading-snug tracking-tight text-white">
        <a href={n.url} target="_blank" rel="noopener noreferrer" className="no-underline hover:underline">
          {n.title}
          <span className="sr-only"> (opens the original source in a new tab)</span>
        </a>
      </h3>
      {!compact && <p className="text-[0.97rem] text-soft">{n.summary}</p>}
      <a
        href={n.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto pt-2 text-sm font-bold text-[#8fd3ff] no-underline hover:underline"
        aria-label={`Read the original: ${n.title}`}
      >
        Read the original at {n.source} ↗
      </a>
    </article>
  );
}
