"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTool } from "@/data/tools";
import { useFavorites, useRecent } from "@/lib/saved";
import ToolCard from "./ToolCard";

/** The visitor's saved tools or recently viewed tools, read from this browser only. */
export default function SavedList({ mode }: { mode: "favorites" | "recent" }) {
  const fav = useFavorites();
  const recent = useRecent();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const ids = mode === "favorites" ? fav.list : recent.list;
  const tools = ids.map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => !!t);
  const clear = mode === "favorites" ? fav.clear : recent.clear;
  const noun = mode === "favorites" ? "saved tools" : "recently viewed tools";

  if (!mounted) return <p className="text-muted">Loading from this browser&hellip;</p>;

  return (
    <div>
      <p className="glass rounded-2xl border-l-4 border-l-cyan px-5 py-3 text-sm text-muted">
        These {noun} are stored only in this browser on this device. There are no accounts, so they do not follow you to other devices or browsers, and clearing your
        browser data removes them.
      </p>
      {tools.length === 0 ? (
        <div className="glass mt-6 rounded-[22px] p-10 text-center">
          <p className="text-lg font-semibold text-white">{mode === "favorites" ? "You have not saved any tools yet." : "You have not viewed any tool pages yet."}</p>
          <p className="mt-2 text-muted">
            {mode === "favorites" ? "Use the heart on any tool card or tool page to save it here." : "Tools you open will appear here, newest first."}
          </p>
          <Link prefetch={false} href="/tools/" className="btn-primary btn-sm mt-5">
            Browse the directory
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" role="status" aria-live="polite">
              {tools.length} {tools.length === 1 ? "tool" : "tools"}
              {mode === "recent" ? ", most recent first" : ""}
            </p>
            <div className="flex gap-2">
              {tools.length >= 2 && (
                <Link prefetch={false} href={`/compare/?ids=${tools.slice(0, 3).map((t) => t.id).join(",")}`} className="btn-ghost btn-sm">
                  Compare the first {Math.min(3, tools.length)}
                </Link>
              )}
              <button type="button" className="btn-ghost btn-sm" onClick={clear}>
                {mode === "favorites" ? "Clear saved tools" : "Clear history"}
              </button>
            </div>
          </div>
          <ul className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((t) => (
              <li key={t.id}>
                <ToolCard tool={t} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** A small strip for the home page; renders nothing until there is history. */
export function RecentStrip() {
  const recent = useRecent();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tools = recent.list.map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => !!t).slice(0, 4);
  if (!mounted || tools.length === 0) return null;
  return (
    <section className="pt-16" aria-labelledby="recent-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 id="recent-title" className="section-title text-white">
          Pick up where you left off
        </h2>
        <Link prefetch={false} href="/recent/" className="btn-ghost btn-sm">
          All recently viewed →
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((t) => (
          <li key={t.id}>
            <Link prefetch={false} href={`/tools/${t.id}/`} className="glass block rounded-2xl p-4 text-soft no-underline transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">
              <span className="block font-bold text-white">{t.name}</span>
              <span className="mt-1 line-clamp-2 block text-sm text-muted">{t.tagline}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Stored only in this browser.</p>
    </section>
  );
}
