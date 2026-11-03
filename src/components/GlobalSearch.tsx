"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { ContentDoc, SiteResult } from "@/lib/site-search";
import { withBase } from "@/lib/site";

type Search = (query: string, docs: ContentDoc[]) => SiteResult[];

const BADGE: Record<SiteResult["type"], string> = {
  tool: "border-cyan/50 bg-cyan/10 text-[#a8ecff]",
  article: "border-violet/50 bg-violet/15 text-[#d9ccff]",
  news: "border-fuchsia-400/50 bg-fuchsia-400/10 text-[#ffc9f2]",
};
const LABEL: Record<SiteResult["type"], string> = { tool: "Tool", article: "Blog", news: "AI News" };

/**
 * Search across tools, blog articles and AI news. Typing shows results with a type label; choosing one (click, tap, or Enter on the
 * highlighted one) opens that exact page. It never sends a visitor to a listing page. The search code loads on first use, so the home
 * page is not weighed down by the catalog until someone searches. Without JavaScript the form still opens the directory search.
 */
export default function GlobalSearch({ docs }: { docs: ContentDoc[] }) {
  const router = useRouter();
  const uid = useId();
  const box = useRef<HTMLDivElement>(null);
  const search = useRef<Search | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SiteResult[]>([]);
  const [open, setOpen] = useState(false);
  // The long hint is cut off on a phone, so small screens get a shorter one. The server renders the long one; this only runs in the browser.
  const [hint, setHint] = useState(0);
  useEffect(() => {
    const narrow = matchMedia("(max-width: 520px)");
    const tiny = matchMedia("(max-width: 360px)");
    const set = () => setHint(tiny.matches ? 2 : narrow.matches ? 1 : 0);
    set();
    narrow.addEventListener("change", set);
    tiny.addEventListener("change", set);
    return () => {
      narrow.removeEventListener("change", set);
      tiny.removeEventListener("change", set);
    };
  }, []);
  const [active, setActive] = useState(0);

  const run = async (value: string) => {
    if (!search.current) search.current = (await import("@/lib/site-search")).searchSite;
    const r = search.current(value, docs);
    setResults(r);
    setActive(0);
  };

  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);

  const ready = q.trim().length >= 2;
  const showList = open && ready;
  const go = (r: SiteResult) => {
    setOpen(false);
    router.push(r.href);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return setOpen(false);
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ready && results[active]) go(results[active]);
    else setOpen(true);
  };

  return (
    <div ref={box} className="relative">
      <form action={withBase("/tools/")} method="get" role="search" className="relative" onSubmit={submit}>
        <label htmlFor="hero-q" className="sr-only">
          Search AI tools, blog articles and AI news
        </label>
        <svg className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          id="hero-q"
          name="q"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${uid}-opt-${active}` : undefined}
          placeholder={["Search tools, guides and news: ChatGPT, video editor, transcription", "Search tools or guides", "Search AI tools"][hint]}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            void run(e.target.value);
          }}
          onFocus={() => {
            setOpen(true);
            void run(q);
          }}
          onKeyDown={onKey}
          className="h-12 w-full rounded-2xl border border-white/15 bg-[#11152A]/80 pl-13 pr-28 text-base md:h-14 md:pr-32 text-white placeholder:text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
          style={{ paddingLeft: "3.25rem" }}
        />
        <button type="submit" className="btn-primary btn-sm absolute right-2 top-1/2 -translate-y-1/2">
          Search
        </button>
      </form>

      {showList && (
        <div id={`${uid}-list`} role="listbox" aria-label="Search results" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0d1124] p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {results.length === 0 ? (
            <div role="status" className="p-4 text-sm text-soft">
              <p className="font-semibold text-white">Nothing matches &ldquo;{q.trim()}&rdquo;.</p>
              <p className="mt-1 text-muted">Try a tool name, a topic like &ldquo;transcription&rdquo;, or fewer words. Or browse:</p>
              <p className="mt-3 flex flex-wrap gap-2">
                <Link href="/tools/" prefetch={false} className="chip">
                  All tools
                </Link>
                <Link href="/blog/" prefetch={false} className="chip">
                  Blog
                </Link>
                <Link href="/news/" prefetch={false} className="chip">
                  AI News
                </Link>
              </p>
            </div>
          ) : (
            results.map((r, i) => (
              <Link
                key={`${r.type}-${r.id}`}
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                href={r.href}
                prefetch={false}
                onMouseEnter={() => setActive(i)}
                onClick={() => setOpen(false)}
                className={`flex items-start gap-3 rounded-xl px-3 py-2.5 no-underline transition-colors ${i === active ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <span className={`mt-0.5 shrink-0 rounded-md border px-2 py-0.5 text-[0.72rem] font-bold uppercase tracking-wide ${BADGE[r.type]}`}>{LABEL[r.type]}</span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug text-white">{r.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{r.description}</span>
                  <span className="mt-0.5 block text-xs text-muted/80">{r.meta}</span>
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
