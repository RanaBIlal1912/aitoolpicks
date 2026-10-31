"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TopicId } from "@/data/articles";

type Topic = { id: TopicId; label: string };

/**
 * Search and topic filter for the guide grid. The cards themselves are rendered on the server and passed in as children (each <li> carries
 * data-topic and data-text), so the browser does not have to build 30 cards again in JavaScript: filtering only toggles the `hidden` attribute.
 */
export default function BlogList({ topics, total, children }: { topics: Topic[]; total: number; children: ReactNode }) {
  const [topic, setTopic] = useState<TopicId | "all">("all");
  const [q, setQ] = useState("");
  const [count, setCount] = useState(total);
  const grid = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("topic");
    if (t && topics.some((x) => x.id === t)) setTopic(t as TopicId);
  }, [topics]);

  useEffect(() => {
    const n = q.trim().toLowerCase();
    let shown = 0;
    for (const li of Array.from(grid.current?.children ?? []) as HTMLElement[]) {
      const ok = (topic === "all" || li.dataset.topic === topic) && (!n || (li.dataset.text ?? "").includes(n));
      li.hidden = !ok;
      if (ok) shown++;
    }
    setCount(shown);
  }, [topic, q]);

  return (
    <section aria-label="Guides" className="mx-auto max-w-6xl px-5">
      <h2 className="sr-only">All guides</h2>
      <div className="glass rounded-[24px] p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <label htmlFor="blog-search" className="sr-only">
              Search guides
            </label>
            <input
              id="blog-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search guides"
              autoComplete="off"
              className="h-12 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-base text-white placeholder:text-muted focus:border-violet focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
            <button type="button" className="chip" aria-pressed={topic === "all"} onClick={() => setTopic("all")}>
              All
            </button>
            {topics.map((t) => (
              <button key={t.id} type="button" className="chip" aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted" role="status" aria-live="polite">
        {count} {count === 1 ? "guide" : "guides"}
      </p>

      <ul ref={grid} className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </ul>
      {count === 0 && (
        <div className="glass mt-6 rounded-[22px] p-10 text-center">
          <p className="text-lg font-semibold text-white">No guides match.</p>
          <p className="mt-2 text-muted">Try another word or choose &ldquo;All&rdquo;.</p>
        </div>
      )}
    </section>
  );
}
