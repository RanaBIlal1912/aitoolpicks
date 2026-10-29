"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CATEGORIES, TOOLS, type Category } from "@/data/tools";
import ToolCard from "./ToolCard";

export default function Directory() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [free, setFree] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (cat !== "All" && t.category !== cat) return false;
      if (free && !t.freePlan) return false;
      if (reviewed && !t.review) return false;
      if (!needle) return true;
      return [t.name, t.tagline, t.description, t.bestFor, t.category].join(" ").toLowerCase().includes(needle);
    });
  }, [q, cat, free, reviewed]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { All: TOOLS.length };
    for (const t of TOOLS) m[t.category] = (m[t.category] ?? 0) + 1;
    return m;
  }, []);

  return (
    <section aria-labelledby="dir-title" className="mx-auto max-w-6xl px-5">
      <h2 id="dir-title" className="sr-only">
        Browse tools
      </h2>

      <div className="glass rounded-[24px] p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <label htmlFor="tool-search" className="sr-only">
              Search tools
            </label>
            <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              id="tool-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, use or category"
              autoComplete="off"
              className="h-12 w-full rounded-2xl border border-white/12 bg-black/30 pl-11 pr-4 text-base text-white placeholder:text-muted focus:border-violet focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip" aria-pressed={free} onClick={() => setFree((v) => !v)}>
              Has a free plan
            </button>
            <button type="button" className="chip" aria-pressed={reviewed} onClick={() => setReviewed((v) => !v)}>
              Has our overview
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {(["All", ...CATEGORIES] as const).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c}
              <span className="text-xs text-muted">{counts[c] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted" role="status" aria-live="polite">
        Showing {results.length} of {TOOLS.length} tools
        {(q || cat !== "All" || free || reviewed) && (
          <>
            {" "}
            ·{" "}
            <button
              type="button"
              className="underline hover:text-white"
              onClick={() => {
                setQ("");
                setCat("All");
                setFree(false);
                setReviewed(false);
              }}
            >
              Clear filters
            </button>
          </>
        )}
      </p>

      <ul className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.map((t) => (
          <motion.li
            key={t.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="[perspective:1000px]"
          >
            <ToolCard tool={t} />
          </motion.li>
        ))}
      </ul>

      {results.length === 0 && (
        <div className="glass mt-6 rounded-[22px] p-10 text-center">
          <p className="text-lg font-semibold text-white">No tools match those filters.</p>
          <p className="mt-2 text-muted">Try a different word, or clear the filters to see everything.</p>
        </div>
      )}
    </section>
  );
}
