import Link from "next/link";
import { PRICING_MODEL_LABEL, TOOLS, getCategory, getTool, type Tool } from "@/data/tools";
import { catColors } from "@/data/palette";
import type { TrendingRow } from "@/lib/home-tools";
import ToolLogo from "../ToolLogo";
import { Head } from "./Sections";
import PriceText from "../PriceText";

function PriceChips({ tool }: { tool: Tool }) {
  // Prices are shown only when the pricing record is fully verified against the vendor's page.
  if (tool.pricingStatus !== "verified") return <span className="text-xs text-muted">Pricing not fully verified yet</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tool.plans.slice(0, 2).map((p) => (
        <li key={p.name} className="rounded-lg border border-white/12 bg-black/25 px-2.5 py-1 text-xs">
          {p.price === p.name ? <b className="text-white">{p.name}</b> : (<><span className="text-muted">{p.name}</span> <b className="text-white"><PriceText text={p.price} /></b></>)}
        </li>
      ))}
    </ul>
  );
}

/**
 * Trending tools. The page decides the rows (see allocateHomeTools): measured page views when content/trending.json exists, otherwise the
 * number of news stories on this site that mention the tool. `lead` states the basis, and each badge says which one it is.
 */
export function TrendingTools({ rows, lead }: { rows: TrendingRow[]; lead: string }) {
  if (rows.length === 0) return null;
  return (
    <section aria-label="Trending AI tools">
      <Head n="01" eyebrow="Trending" title="Trending AI tools" lead={lead} href="/tools/" cta="Browse all tools" />
      <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r, i) => {
          const t = getTool(r.id);
          if (!t) return null;
          const [a, b] = catColors(t.category);
          const cat = getCategory(t.category);
          return (
            <li key={t.id}>
              <article className="tile group relative flex h-full flex-col gap-4 p-6 transition-transform duration-300 hover:-translate-y-1">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${a}, ${b})` }} />
                <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-60" style={{ background: a }} />
                <span aria-hidden="true" className="absolute right-5 top-4 font-display text-5xl font-extrabold leading-none text-white/10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="relative flex items-center gap-3">
                  <ToolLogo id={t.id} name={t.name} hue={t.hue} size={52} />
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold leading-tight text-white">
                      <Link prefetch={false} href={`/tools/${t.id}/`} className="tile-link no-underline">
                        {t.name}
                        <span className="sr-only">: details and pricing</span>
                      </Link>
                    </h3>
                    <p className="truncate text-sm text-muted">{t.vendor}</p>
                  </div>
                </div>
                <span className="relative inline-flex w-fit items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1 text-xs font-bold text-[#a8ecff]">
                  <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-cyan" />
                  {r.badge}
                </span>
                <p className="relative line-clamp-2 text-[0.95rem] text-soft">{t.tagline}</p>
                <div className="relative mt-auto space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    {cat && (
                      <span className="rounded-full border px-2.5 py-1 text-white" style={{ background: `${a}26`, borderColor: `${a}80` }}>
                        {cat.short}
                      </span>
                    )}
                    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-soft">{PRICING_MODEL_LABEL[t.pricingModel]}</span>
                  </div>
                  <PriceChips tool={t} />
                  <p className="text-sm font-bold text-white">
                    Explore <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Closing panel: the whole directory, one click away. The number is the real catalog size. */
export function FinalCta() {
  return (
    <section aria-label="Explore the directory" className="relative isolate overflow-hidden rounded-[32px] border border-white/15 p-8 text-center md:p-14" style={{ background: "linear-gradient(135deg, rgba(88,56,235,0.9), rgba(24,36,150,0.92) 55%, rgba(190,40,170,0.75))" }}>
      <span aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-cyan/30 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="relative mx-auto max-w-2xl">
        <span className="eyebrow">The full directory</span>
        <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">Find the right AI tool, at the right price</h2>
        <p className="mt-4 text-lg text-white/85">
          Search all {TOOLS.length} tools, compare plans read from the vendors&apos; own pages, and see the date we checked each one.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link prefetch={false} href="/tools/" className="btn-primary">
            Explore all AI tools <span aria-hidden="true">→</span>
          </Link>
          <Link prefetch={false} href="/compare/" className="btn-ghost">
            Compare prices
          </Link>
        </div>
      </div>
    </section>
  );
}
