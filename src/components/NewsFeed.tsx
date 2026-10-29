"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { NewsItem, NewsTag } from "@/data/news";
import NewsCard from "./NewsCard";

export default function NewsFeed({ items, tags }: { items: NewsItem[]; tags: NewsTag[] }) {
  const [tag, setTag] = useState<NewsTag | "All">("All");
  const [source, setSource] = useState("All");
  const sources = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.source)))], [items]);
  const list = useMemo(
    () => items.filter((i) => (tag === "All" || i.tag === tag) && (source === "All" || i.source === source)),
    [items, tag, source],
  );
  const present = useMemo(() => new Set(items.map((i) => i.tag)), [items]);

  return (
    <section aria-label="All AI news">
      <div className="glass rounded-[24px] p-4 md:p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
          <button type="button" className="chip" aria-pressed={tag === "All"} onClick={() => setTag("All")}>
            All topics
          </button>
          {tags
            .filter((t) => present.has(t))
            .map((t) => (
              <button key={t} type="button" className="chip" aria-pressed={tag === t} onClick={() => setTag(t)}>
                {t}
              </button>
            ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by source">
          {sources.map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={source === s} onClick={() => setSource(s)}>
              {s === "All" ? "All sources" : s}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-5 text-sm text-muted" role="status" aria-live="polite">
        {list.length} {list.length === 1 ? "item" : "items"}, newest first
      </p>
      <ul className="mt-4 grid gap-6 md:grid-cols-2">
        {list.map((n) => (
          <motion.li key={n.url} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <NewsCard n={n} />
          </motion.li>
        ))}
      </ul>
      {list.length === 0 && (
        <div className="glass mt-6 rounded-[22px] p-10 text-center">
          <p className="text-lg font-semibold text-white">Nothing matches those filters.</p>
          <p className="mt-2 text-muted">Choose &ldquo;All topics&rdquo; or &ldquo;All sources&rdquo; to see everything.</p>
        </div>
      )}
    </section>
  );
}
