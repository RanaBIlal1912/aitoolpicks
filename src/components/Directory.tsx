"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, PRICING_MODEL_LABEL, TOOLS, type Tool } from "@/data/tools";
import ToolCard from "./ToolCard";

type Sort = "name" | "verified" | "price" | "recent";
const MODELS = ["freemium", "free", "free-trial", "paid", "usage-based"] as const;
const MAX_COMPARE = 3;

const SORTS: { id: Sort; label: string }[] = [
  { id: "name", label: "Name (A to Z)" },
  { id: "verified", label: "Pricing verified first" },
  { id: "price", label: "Lowest starting price (USD per month)" },
  { id: "recent", label: "Recently checked" },
];

const STATUS_RANK = { verified: 0, partial: 1, unverified: 2 } as const;

export function sortTools(list: Tool[], sort: Sort): Tool[] {
  const out = [...list];
  out.sort((a, b) => {
    if (sort === "verified") return STATUS_RANK[a.pricingStatus] - STATUS_RANK[b.pricingStatus] || a.name.localeCompare(b.name);
    if (sort === "recent") return b.checked.localeCompare(a.checked) || a.name.localeCompare(b.name);
    if (sort === "price") {
      const pa = a.fromUsd ?? Number.POSITIVE_INFINITY;
      const pb = b.fromUsd ?? Number.POSITIVE_INFINITY;
      return pa - pb || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
  return out;
}

export function filterTools(
  list: Tool[],
  f: { q: string; category: string; models: string[]; freeOnly: boolean; verifiedOnly: boolean },
): Tool[] {
  const needle = f.q.trim().toLowerCase();
  return list.filter((t) => {
    if (f.category !== "all" && !t.categories.includes(f.category)) return false;
    if (f.models.length && !f.models.includes(t.pricingModel)) return false;
    if (f.freeOnly && t.freePlan !== true) return false;
    if (f.verifiedOnly && t.pricingStatus !== "verified") return false;
    if (!needle) return true;
    return [t.name, t.vendor, t.tagline, t.description, t.bestFor].join(" ").toLowerCase().includes(needle);
  });
}

export default function Directory({ initialCategory = "all" }: { initialCategory?: string }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [models, setModels] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("name");
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get("category");
    if (c && CATEGORIES.some((x) => x.slug === c)) setCategory(c);
    const query = p.get("q");
    if (query) setQ(query);
  }, []);

  const results = useMemo(
    () => sortTools(filterTools(TOOLS, { q, category, models, freeOnly, verifiedOnly }), sort),
    [q, category, models, freeOnly, verifiedOnly, sort],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: TOOLS.length };
    for (const t of TOOLS) for (const c of t.categories) m[c] = (m[c] ?? 0) + 1;
    return m;
  }, []);

  const toggleModel = (m: string) => setModels((v) => (v.includes(m) ? v.filter((x) => x !== m) : [...v, m]));
  const togglePick = (id: string) => setPicked((v) => (v.includes(id) ? v.filter((x) => x !== id) : v.length < MAX_COMPARE ? [...v, id] : v));
  const active = q || category !== "all" || models.length || freeOnly || verifiedOnly;
  const clear = () => {
    setQ("");
    setCategory("all");
    setModels([]);
    setFreeOnly(false);
    setVerifiedOnly(false);
  };

  return (
    <section aria-labelledby="dir-title" className="mx-auto max-w-6xl px-5">
      <h2 id="dir-title" className="sr-only">
        Browse tools
      </h2>

      <div className="glass rounded-[24px] p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
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
              placeholder="Search by name, vendor or use"
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

        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Category</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
              All <span className="text-xs text-muted">{counts.all}</span>
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.slug} type="button" className="chip" aria-pressed={category === c.slug} onClick={() => setCategory(c.slug)}>
                {c.short} <span className="text-xs text-muted">{counts[c.slug] ?? 0}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Pricing</legend>
          <div className="flex flex-wrap gap-2">
            {MODELS.map((m) => (
              <button key={m} type="button" className="chip" aria-pressed={models.includes(m)} onClick={() => toggleModel(m)}>
                {PRICING_MODEL_LABEL[m]}
              </button>
            ))}
            <button type="button" className="chip" aria-pressed={freeOnly} onClick={() => setFreeOnly((v) => !v)}>
              Free plan documented
            </button>
            <button type="button" className="chip" aria-pressed={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
              Pricing verified only
            </button>
          </div>
        </fieldset>
      </div>

      <p className="mt-6 text-sm text-muted" role="status" aria-live="polite">
        Showing {results.length} of {TOOLS.length} tools
        {active ? (
          <>
            {" "}
            ·{" "}
            <button type="button" className="underline hover:text-white" onClick={clear}>
              Clear filters
            </button>
          </>
        ) : null}
      </p>

      <ul className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.map((t) => (
          <li key={t.id}>
            <ToolCard tool={t} selected={picked.includes(t.id)} onToggleCompare={togglePick} disableCompare={picked.length >= MAX_COMPARE} />
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <div className="glass mt-6 rounded-[22px] p-10 text-center">
          <p className="text-lg font-semibold text-white">No tools match those filters.</p>
          <p className="mt-2 text-muted">Try a different word, or clear the filters to see everything.</p>
        </div>
      )}

      {picked.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(94vw,640px)] items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#0b0f1c]/95 px-5 py-3 shadow-2xl backdrop-blur" role="region" aria-label="Compare selection">
          <p className="text-sm text-soft">
            {picked.length} selected{picked.length >= MAX_COMPARE ? " (maximum)" : ""}: {picked.map((id) => TOOLS.find((t) => t.id === id)?.name).join(", ")}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setPicked([])}>
              Clear
            </button>
            <Link href={`/compare/?ids=${picked.join(",")}`} className="btn-primary btn-sm" aria-disabled={picked.length < 2}>
              Compare {picked.length < 2 ? "(pick 2+)" : "now"}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
