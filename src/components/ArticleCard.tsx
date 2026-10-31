import Link from "next/link";
import type { Article } from "@/data/articles";
import { TOPICS } from "@/data/topics";
import ArticleCover from "./ArticleCover";

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function ArticleCard({ a, featured = false }: { a: Article; featured?: boolean }) {
  const topic = TOPICS.find((t) => t.id === a.topic)?.label ?? a.cat;
  return (
    <Link prefetch={false}
      href={a.href}
      className={`glass card-glow group flex h-full overflow-hidden no-underline transition-transform duration-300 hover:-translate-y-1 ${
        featured ? "flex-col md:grid md:grid-cols-[1.15fr_1fr]" : "flex-col"
      }`}
      style={{ ["--hue" as string]: featured ? 255 : 220 }}
    >
      <div className={`cover-frame !rounded-none !border-0 ${featured ? "aspect-[16/9] md:aspect-auto md:min-h-[320px]" : "aspect-[16/9]"}`}>
        <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <ArticleCover topic={a.topic} tools={a.tools} seed={a.slug} priority={featured} />
        </div>
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-3 ${featured ? "p-7 md:p-10" : "p-6"}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="kicker">{a.kind === "comparison" ? "Comparison" : topic}</span>
          <span className="byline">{a.minutes} min read</span>
          {a.region && <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-muted">Regional guide: {a.region}</span>}
        </div>
        <h3 className={`font-serif font-bold leading-snug tracking-tight text-white ${featured ? "text-2xl md:text-[2rem] md:leading-[1.15]" : "text-xl"}`}>
          {a.title}
        </h3>
        <p className={`text-muted ${featured ? "text-base md:text-lg" : "text-[0.97rem]"}`}>{a.blurb}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-sm">
          <time dateTime={a.date} className="byline">
            {formatDate(a.date)}
          </time>
          <span className="font-bold text-soft transition-colors group-hover:text-white">Read →</span>
        </div>
      </div>
    </Link>
  );
}
