"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { monthOf, type NewsItem, type NewsKind, type NewsTag } from "@/data/news";
import NewsCard from "./NewsCard";

const PAGE = 12;

function monthLabel(m: string): string {
  return new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}

export default function NewsFeed({ items, tags, kinds }: { items: NewsItem[]; tags: NewsTag[]; kinds: NewsKind[] }) {
  const [tag, setTag] = useState<NewsTag | "All">("All");
  const [kind, setKind] = useState<NewsKind | "All">("All");
  const [month, setMonth] = useState("All");
  const [source, setSource] = useState("All");
  const [pages, setPages] = useState(1);

  const sources = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.source)))], [items]);
  const months = useMemo(() => Array.from(new Set(items.map(monthOf))).sort().reverse(), [items]);
  const presentTags = useMemo(() => new Set(items.map((i) => i.tag)), [items]);
  const presentKinds = useMemo(() => new Set(items.map((i) => i.kind)), [items]);

  const list = useMemo(
    () =>
      items.filter(
        (i) => (tag === "All" || i.tag === tag) && (kind === "All" || i.kind === kind) && (month === "All" || monthOf(i) === month) && (source === "All" || i.source === source),
      ),
    [items, tag, kind, month, source],
  );
  const shown = list.slice(0, pages * PAGE);
  const reset = (fn: () => void) => () => {
    fn();
    setPages(1);
  };

  return (
    <section aria-label="All AI news">
      <h2 className="sr-only">All AI news items</h2>
      <div className="glass rounded-[24px] p-4 md:p-5">
        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Topic</legend>
          <div className="flex flex-wrap gap-2">
            <Chip pressed={tag === "All"} onClick={reset(() => setTag("All"))}>
              All topics
            </Chip>
            {tags
              .filter((t) => presentTags.has(t))
              .map((t) => (
                <Chip key={t} pressed={tag === t} onClick={reset(() => setTag(t))}>
                  {t}
                </Chip>
              ))}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Type of news</legend>
          <div className="flex flex-wrap gap-2">
            <Chip pressed={kind === "All"} onClick={reset(() => setKind("All"))}>
              All types
            </Chip>
            {kinds
              .filter((k) => presentKinds.has(k))
              .map((k) => (
                <Chip key={k} pressed={kind === k} onClick={reset(() => setKind(k))}>
                  {k}
                </Chip>
              ))}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Archive by month</legend>
          <div className="flex flex-wrap gap-2">
            <Chip pressed={month === "All"} onClick={reset(() => setMonth("All"))}>
              All months
            </Chip>
            {months.map((m) => (
              <Chip key={m} pressed={month === m} onClick={reset(() => setMonth(m))}>
                {monthLabel(m)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Source</legend>
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => (
              <Chip key={s} pressed={source === s} onClick={reset(() => setSource(s))}>
                {s === "All" ? "All sources" : s}
              </Chip>
            ))}
          </div>
        </fieldset>
      </div>
      <p className="mt-5 text-sm text-muted" role="status" aria-live="polite">
        {list.length} {list.length === 1 ? "item" : "items"}, newest first
      </p>
      <ul className="mt-4 grid gap-6 md:grid-cols-2">
        {shown.map((n) => (
          <motion.li key={n.slug} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <NewsCard n={n} />
          </motion.li>
        ))}
      </ul>
      {list.length > shown.length && (
        <div className="mt-8 text-center">
          <button type="button" className="btn-ghost" onClick={() => setPages((n) => n + 1)}>
            Show more ({list.length - shown.length} remaining)
          </button>
        </div>
      )}
      {list.length === 0 && (
        <div className="glass mt-6 rounded-[22px] p-10 text-center">
          <p className="text-lg font-semibold text-white">Nothing matches those filters.</p>
          <p className="mt-2 text-muted">Choose an &ldquo;All&rdquo; option above to see everything.</p>
        </div>
      )}
    </section>
  );
}
