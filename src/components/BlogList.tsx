"use client";

import { useEffect, useMemo, useState } from "react";
import ArticleCard from "./ArticleCard";
import type { Article, TopicId } from "@/data/articles";

type Topic = { id: TopicId; label: string };

export default function BlogList({ articles, topics }: { articles: Article[]; topics: Topic[] }) {
  const [topic, setTopic] = useState<TopicId | "all">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("topic");
    if (t && topics.some((x) => x.id === t)) setTopic(t as TopicId);
  }, [topics]);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return articles.filter(
      (a) => (topic === "all" || a.topic === topic) && (!n || `${a.title} ${a.blurb} ${a.cat}`.toLowerCase().includes(n)),
    );
  }, [articles, topic, q]);

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
        {list.length} {list.length === 1 ? "guide" : "guides"}
      </p>

      <ul className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <li key={a.slug}>
            <ArticleCard a={a} />
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <div className="glass mt-6 rounded-[22px] p-10 text-center">
          <p className="text-lg font-semibold text-white">No guides match.</p>
          <p className="mt-2 text-muted">Try another word or choose &ldquo;All&rdquo;.</p>
        </div>
      )}
    </section>
  );
}
