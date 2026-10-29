import Link from "next/link";
import type { Article } from "@/data/articles";

export default function ArticleCard({ a, featured = false }: { a: Article; featured?: boolean }) {
  return (
    <Link
      href={a.href}
      className={`glass card-glow group flex h-full flex-col gap-3 p-6 no-underline transition-transform duration-300 hover:-translate-y-1 ${
        featured ? "md:flex-row md:items-center md:gap-8 md:p-9" : ""
      }`}
      style={{ ["--hue" as string]: featured ? 255 : 215 }}
    >
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-electric/30 to-violet/30 ring-1 ring-white/15 ${
          featured ? "h-20 w-20 text-4xl" : "h-12 w-12 text-2xl"
        }`}
      >
        {a.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold uppercase tracking-[0.12em] text-cyan">
          <span>{a.kind === "comparison" ? "Comparison" : a.cat}</span>
          <span className="font-medium normal-case tracking-normal text-muted">{a.minutes} min read</span>
        </div>
        <h3 className={`font-serif font-bold leading-snug tracking-tight text-white ${featured ? "text-2xl md:text-3xl" : "text-xl"}`}>
          {a.title}
        </h3>
        <p className="text-[0.97rem] text-muted">{a.blurb}</p>
        <span className="mt-auto pt-3 text-sm font-bold text-soft transition-colors group-hover:text-white">Read the guide →</span>
      </div>
    </Link>
  );
}
