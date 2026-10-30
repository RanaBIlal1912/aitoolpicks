"use client";

import Link from "next/link";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CATEGORIES, PRICING_MODEL_LABEL, TOOLS } from "@/data/tools";
import { NO_FILTERS, filterTools, page, sortTools, type Filters, type Sort } from "@/lib/directory";
import { TASK_SUGGESTIONS, searchTools } from "@/lib/search";
import ToolCard from "./ToolCard";

const MODELS = ["freemium", "free", "free-trial", "paid", "usage-based"] as const;
const MAX_COMPARE = 3;
const PRICE_STEPS = [10, 20, 50];

const SORTS: { id: Sort; label: string }[] = [
  { id: "relevance", label: "Best match (when searching)" },
  { id: "name", label: "Name (A to Z)" },
  { id: "added", label: "Recently added" },
  { id: "updated", label: "Recently verified" },
  { id: "verified", label: "Pricing verified first" },
  { id: "price", label: "Lowest starting price (USD per month)" },
];

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="glass mx-auto mt-6 max-w-6xl rounded-[22px] p-8 text-center">
        <p className="text-lg font-semibold text-white">The directory could not load.</p>
        <p className="mt-2 text-muted">Reload the page, or browse by category from the home page.</p>
        <button type="button" className="btn-primary btn-sm mt-4" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}

function Toggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}

function DirectoryInner({ initialCategory }: { initialCategory: string }) {
  const [f, setF] = useState<Filters>({ ...NO_FILTERS, cats: initialCategory === "all" ? [] : [initialCategory] });
  const [sort, setSort] = useState<Sort>("relevance");
  const [pages, setPages] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const patch: Partial<Filters> = {};
      const c = p.get("category");
      if (c && CATEGORIES.some((x) => x.slug === c)) patch.cats = [c];
      const many = p.get("cats");
      if (many) patch.cats = many.split(",").filter((x) => CATEGORIES.some((y) => y.slug === x));
      const q = p.get("q");
      if (q) patch.q = q.slice(0, 120);
      if (p.get("free") === "1") patch.freeOnly = true;
      if (Object.keys(patch).length) setF((v) => ({ ...v, ...patch }));
    } catch {
      /* ignore malformed URLs */
    }
    setReady(true);
    // Press "/" anywhere on the page to jump to the search box.
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key === "/" && t && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);

  // Keep the address bar shareable: search text, categories and the free-plan filter.
  useEffect(() => {
    if (!ready) return;
    try {
      const p = new URLSearchParams();
      if (f.q.trim()) p.set("q", f.q.trim());
      if (f.cats.length) p.set("cats", f.cats.join(","));
      if (f.freeOnly) p.set("free", "1");
      const qs = p.toString();
      history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}`);
    } catch {
      /* history may be unavailable */
    }
  }, [f.q, f.cats, f.freeOnly, ready]);

  const set = (patch: Partial<Filters>) => {
    setF((v) => ({ ...v, ...patch }));
    setPages(1);
  };

  const searching = f.q.trim().length > 0;
  const { results, reasonsById, noWords } = useMemo(() => {
    const filtered = filterTools(TOOLS, { ...f, q: "" });
    if (!searching) return { results: sortTools(filtered, sort === "relevance" ? "name" : sort), reasonsById: {} as Record<string, string[]>, noWords: false };
    const ranked = searchTools(f.q, filtered);
    const reasons: Record<string, string[]> = {};
    for (const m of ranked) reasons[m.tool.id] = m.reasons;
    const list = ranked.map((m) => m.tool);
    return { results: sort === "relevance" ? list : sortTools(list, sort), reasonsById: reasons, noWords: false };
  }, [f, sort, searching]);

  const { items, more } = page(results, pages);
  const oneCat = f.cats.length === 1 ? CATEGORIES.find((c) => c.slug === f.cats[0]) : undefined;
  const subs = oneCat?.subs ?? [];

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of TOOLS) for (const c of t.categories) m[c] = (m[c] ?? 0) + 1;
    return m;
  }, []);

  const toggleModel = (m: string) => {
    setF((v) => ({ ...v, models: v.models.includes(m) ? v.models.filter((x) => x !== m) : [...v.models, m] }));
    setPages(1);
  };
  const toggleCat = (slug: string) => {
    setF((v) => ({ ...v, cats: v.cats.includes(slug) ? v.cats.filter((x) => x !== slug) : [...v.cats, slug], sub: "all" }));
    setPages(1);
  };
  const togglePick = (id: string) => setPicked((v) => (v.includes(id) ? v.filter((x) => x !== id) : v.length < MAX_COMPARE ? [...v, id] : v));
  const active = JSON.stringify(f) !== JSON.stringify(NO_FILTERS);

  return (
    <section aria-labelledby="dir-title" aria-busy={!ready} className="mx-auto max-w-6xl px-5">
      <h2 id="dir-title" className="sr-only">
        Browse and search tools
      </h2>

      <div className="glass rounded-[24px] p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <label htmlFor="tool-search" className="sr-only">
              Search tools by name, company, task or feature
            </label>
            <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              ref={input}
              id="tool-search"
              type="search"
              enterKeyHint="search"
              value={f.q}
              onChange={(e) => set({ q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Escape") set({ q: "" });
              }}
              placeholder="Try “transcribe meetings” or “AI coding assistant”   ( / )"
              autoComplete="off"
              className="h-12 w-full rounded-2xl border border-white/12 bg-black/30 pl-11 pr-4 text-base text-white placeholder:text-muted focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <label htmlFor="tool-sort" className="text-sm text-muted">
              Sort by
            </label>
            <select id="tool-sort" className="cur max-w-full" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!searching && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>Try:</span>
            {TASK_SUGGESTIONS.slice(0, 6).map((s) => (
              <button key={s} type="button" className="chip !py-1 !text-[0.85rem]" onClick={() => set({ q: s })}>
                {s}
              </button>
            ))}
          </div>
        )}

        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Categories (choose any)</legend>
          <div className="flex flex-wrap gap-2">
            <Toggle pressed={f.cats.length === 0} onClick={() => set({ cats: [], sub: "all" })}>
              All <span className="text-xs text-muted">{TOOLS.length}</span>
            </Toggle>
            {CATEGORIES.map((c) => (
              <Toggle key={c.slug} pressed={f.cats.includes(c.slug)} onClick={() => toggleCat(c.slug)}>
                {c.short} <span className="text-xs text-muted">{counts[c.slug] ?? 0}</span>
              </Toggle>
            ))}
          </div>
        </fieldset>

        {subs.length > 0 && (
          <fieldset className="mt-4">
            <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Subcategory</legend>
            <div className="flex flex-wrap gap-2">
              <Toggle pressed={f.sub === "all"} onClick={() => set({ sub: "all" })}>
                All
              </Toggle>
              {subs.map((s) => (
                <Toggle key={s.slug} pressed={f.sub === s.slug} onClick={() => set({ sub: s.slug })}>
                  {s.label}
                </Toggle>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Pricing and access</legend>
          <div className="flex flex-wrap items-center gap-2">
            {MODELS.map((m) => (
              <Toggle key={m} pressed={f.models.includes(m)} onClick={() => toggleModel(m)}>
                {PRICING_MODEL_LABEL[m]}
              </Toggle>
            ))}
            <Toggle pressed={f.freeOnly} onClick={() => set({ freeOnly: !f.freeOnly })}>
              Free plan documented
            </Toggle>
            <Toggle pressed={f.paidOnly} onClick={() => set({ paidOnly: !f.paidOnly })}>
              Has a paid option
            </Toggle>
            <Toggle pressed={f.trialOnly} onClick={() => set({ trialOnly: !f.trialOnly })}>
              Free trial documented
            </Toggle>
            <Toggle pressed={f.openOnly} onClick={() => set({ openOnly: !f.openOnly })}>
              Open source or source-available (verified)
            </Toggle>
            <Toggle pressed={f.verifiedOnly} onClick={() => set({ verifiedOnly: !f.verifiedOnly })}>
              Pricing verified only
            </Toggle>
            <label className="ml-1 flex items-center gap-2 text-sm text-muted">
              Starts at
              <select className="cur" value={f.maxUsd ?? ""} onChange={(e) => set({ maxUsd: e.target.value ? Number(e.target.value) : null })}>
                <option value="">any price</option>
                {PRICE_STEPS.map((n) => (
                  <option key={n} value={n}>
                    ${n}/month or less
                  </option>
                ))}
              </select>
            </label>
          </div>
          {f.maxUsd !== null && <p className="mt-2 text-xs text-muted">The price filter uses each tool&rsquo;s lowest documented USD price; tools priced only in other currencies or by usage are not included.</p>}
        </fieldset>
      </div>

      <p className="mt-6 text-sm text-muted" role="status" aria-live="polite">
        Showing {items.length} of {results.length} {searching ? "matching" : "listed"} tools ({TOOLS.length} in the directory)
        {active ? (
          <>
            {" "}
            ·{" "}
            <button type="button" className="underline hover:text-white" onClick={() => set({ ...NO_FILTERS })}>
              Clear search and filters
            </button>
          </>
        ) : null}
      </p>

      <ul className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <li key={t.id} className="cv-auto">
            <ToolCard tool={t} reasons={reasonsById[t.id]} selected={picked.includes(t.id)} onToggleCompare={togglePick} disableCompare={picked.length >= MAX_COMPARE} />
          </li>
        ))}
      </ul>

      {more > 0 && (
        <div className="mt-8 text-center">
          <button type="button" className="btn-ghost" onClick={() => setPages((n) => n + 1)}>
            Show {Math.min(more, 24)} more ({more} remaining)
          </button>
        </div>
      )}

      {results.length === 0 && (
        <div className="glass mt-6 rounded-[22px] p-10 text-center">
          <p className="text-lg font-semibold text-white">{noWords ? "Type a word to search." : "No tools match that search and those filters."}</p>
          <p className="mt-2 text-muted">
            Search matches names, companies, categories, features and use cases in our catalog; it does not understand every phrasing. Try one or two plain words, or remove a filter.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TASK_SUGGESTIONS.slice(0, 5).map((s) => (
              <button key={s} type="button" className="chip" onClick={() => set({ ...NO_FILTERS, q: s })}>
                {s}
              </button>
            ))}
          </div>
          <button type="button" className="btn-primary btn-sm mt-5" onClick={() => set({ ...NO_FILTERS })}>
            Clear search and filters
          </button>
        </div>
      )}

      {picked.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(94vw,640px)] items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#11152A]/95 px-5 py-3 shadow-2xl backdrop-blur"
          role="region"
          aria-label="Compare selection"
        >
          <p className="text-sm text-soft">
            {picked.length} selected{picked.length >= MAX_COMPARE ? " (maximum)" : ""}: {picked.map((id) => TOOLS.find((t) => t.id === id)?.name).join(", ")}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setPicked([])}>
              Clear
            </button>
            {picked.length >= 2 ? (
              <Link href={`/compare/?ids=${picked.join(",")}`} className="btn-primary btn-sm">
                Compare now
              </Link>
            ) : (
              <span className="text-sm text-muted">Pick 2 or 3</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Directory({ initialCategory = "all" }: { initialCategory?: string }) {
  return (
    <Boundary>
      <DirectoryInner initialCategory={initialCategory} />
    </Boundary>
  );
}
