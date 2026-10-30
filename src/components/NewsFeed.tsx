"use client";

import { useEffect, useMemo, useState } from "react";
import { monthOf, type NewsItem, type NewsKind, type NewsTag } from "@/data/news";
import NewsCard from "./NewsCard";

const PAGE = 8;

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

/** The chronological feed: filters by topic, type, source and month work together, 8 stories at a time. */
export default function NewsFeed({ items, tags, kinds }: { items: NewsItem[]; tags: NewsTag[]; kinds: NewsKind[] }) {
  const [tag, setTag] = useState<NewsTag | "All">("All");
  const [kind, setKind] = useState<NewsKind | "All">("All");
  const [month, setMonth] = useState("All");
  const [source, setSource] = useState("All");
  const [pages, setPages] = useState(1);

  // Links such as /news/?topic=Models or /news/?type=Research preselect a filter.
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const t = q.get("topic");
      const k = q.get("type");
      if (t && tags.includes(t as NewsTag)) setTag(t as NewsTag);
      if (k && kinds.includes(k as NewsKind)) setKind(k as NewsKind);
    } catch {
      /* ignore malformed query strings */
    }
  }, [tags, kinds]);

  const sources = useMemo(() => Array.from(new Set(items.map((i) => i.source))).sort(), [items]);
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
  const active = tag !== "All" || kind !== "All" || month !== "All" || source !== "All";
  const change = (fn: () => void) => () => {
    fn();
    setPages(1);
  };
  const reset = change(() => {
    setTag("All");
    setKind("All");
    setMonth("All");
    setSource("All");
  });

  return (
    <section aria-labelledby="feed-title">
      <h2 id="feed-title" className="section-title text-white">
        Latest news
      </h2>

      <div className="glass mt-6 rounded-[22px] p-4 md:p-5">
        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Topic</legend>
          <div className="flex flex-wrap gap-2">
            <Chip pressed={tag === "All"} onClick={change(() => setTag("All"))}>
              All topics
            </Chip>
            {tags
              .filter((t) => presentTags.has(t))
              .map((t) => (
                <Chip key={t} pressed={tag === t} onClick={change(() => setTag(t))}>
                  {t}
                </Chip>
              ))}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Type of news</legend>
          <div className="flex flex-wrap gap-2">
            <Chip pressed={kind === "All"} onClick={change(() => setKind("All"))}>
              All types
            </Chip>
            {kinds
              .filter((k) => presentKinds.has(k))
              .map((k) => (
                <Chip key={k} pressed={kind === k} onClick={change(() => setKind(k))}>
                  {k}
                </Chip>
              ))}
          </div>
        </fieldset>
        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          <label className="text-sm text-muted">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em]">Month</span>
            <select className="cur" value={month} onChange={(e) => change(() => setMonth(e.target.value))()}>
              <option value="All">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted">
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em]">Source</span>
            <select className="cur" value={source} onChange={(e) => change(() => setSource(e.target.value))()}>
              <option value="All">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {active && (
            <button type="button" className="btn-ghost btn-sm" onClick={reset}>
              Reset filters
            </button>
          )}
        </div>
      </div>

      <p className="mt-5 text-sm text-muted" role="status" aria-live="polite">
        Showing {shown.length} of {list.length} {list.length === 1 ? "story" : "stories"}, newest first
      </p>

      <ul className="mt-4 space-y-5">
        {shown.map((n) => (
          <li key={n.slug} className="cv-auto">
            <NewsCard n={n} variant="row" />
          </li>
        ))}
      </ul>

      {list.length > shown.length && (
        <div className="mt-8 text-center">
          <button type="button" className="btn-ghost" onClick={() => setPages((p) => p + 1)}>
            Load more ({list.length - shown.length} remaining)
          </button>
        </div>
      )}

      {list.length === 0 && (
        <div className="glass mt-6 rounded-[22px] p-10 text-center">
          <p className="text-lg font-semibold text-white">No stories match those filters.</p>
          <p className="mt-2 text-muted">Try a different topic or month, or reset the filters to see everything.</p>
          <button type="button" className="btn-primary btn-sm mt-4" onClick={reset}>
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}
