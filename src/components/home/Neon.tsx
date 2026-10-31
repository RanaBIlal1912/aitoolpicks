import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORIES, PRICING_MODEL_LABEL, TOOLS, getTool, toolsInCategory } from "@/data/tools";
import { NEWS } from "@/data/news";
import type { Article } from "@/data/articles";
import ToolLogo from "../ToolLogo";
import NewsVisual from "../NewsVisual";
import ArticleCover from "../ArticleCover";
import { formatDate } from "../ArticleCard";
import RobotHero from "./RobotHero";
import { logoFor } from "@/data/logos";
import { withBase } from "@/lib/site";

/** Hero artwork: the 3D robot with real product logos floating around it and a card with the catalog counts. */
export function HeroOrbit({ total, verified }: { total: number; verified: number }) {
  const tiles: { id: string; pos: string; size: number; delay: string }[] = [
    { id: "chatgpt", pos: "left-[4%] top-[8%]", size: 62, delay: "0s" },
    { id: "midjourney", pos: "right-[18%] top-[0%]", size: 64, delay: "-1.5s" },
    { id: "gemini", pos: "right-[0%] top-[18%]", size: 58, delay: "-3s" },
    { id: "notion", pos: "left-[0%] top-[44%]", size: 56, delay: "-2s" },
    { id: "canva", pos: "right-[4%] top-[48%]", size: 58, delay: "-4s" },
    { id: "figma", pos: "left-[12%] bottom-[8%]", size: 54, delay: "-2.5s" },
  ];
  return (
    <RobotHero
      logos={tiles.flatMap((t) => {
        const l = logoFor(t.id);
        return l ? [{ id: t.id, src: withBase(l.src), tile: l.tile }] : [];
      })}
      tiles={tiles.map((t) => {
        const tool = getTool(t.id);
        return tool ? (
          <span key={t.id} className={`float-y absolute ${t.pos} rounded-[20px] shadow-[0_0_30px_-4px_rgba(110,90,255,0.9)] ring-1 ring-white/30`} style={{ animationDelay: t.delay }}>
            <ToolLogo id={tool.id} name={tool.name} hue={tool.hue} size={t.size} />
          </span>
        ) : null;
      })}
      stat={
        <div className="panel !absolute bottom-[-9%] left-1/2 w-[46%] max-w-[230px] -translate-x-1/2 rotate-[-2deg] p-4 max-md:bottom-[-19%] max-md:w-[64%] max-md:p-3">
          <p className="font-display text-4xl font-extrabold leading-none text-white sm:text-5xl">{total}</p>
          <p className="mt-1 text-sm font-semibold text-soft">AI tools indexed</p>
          <p className="mt-0.5 text-xs text-muted">{verified} with fully verified prices</p>
        </div>
      }
    />
  );
}

/** Only figures we can stand behind: counts from the catalog and how the records are made. */
export function StatStrip({ total, categories, verified }: { total: number; categories: number; verified: number }) {
  const items: [ReactNode, string, string][] = [
    [<path key="a" d="M14 6l4 4-9 9H5v-4zM13 7l4 4" />, `${total}`, "AI tools"],
    [<path key="b" d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />, `${categories}`, "Categories"],
    [<path key="c" d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6zM9 12l2.2 2.2L15.5 10" />, `${verified}`, "Verified prices"],
    [<path key="d" d="M13 3L5 14h6l-1 7 8-11h-6z" />, "Official", "Prices from vendor pages"],
    [<path key="e" d="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" />, "Dated", "Every record shows its check date"],
  ];
  return (
    <ul className="stat-strip grid grid-cols-2 gap-y-5 px-3 py-5 sm:px-6 md:grid-cols-5">
      {items.map(([icon, n, l], i) => (
        <li key={l} className={`flex items-center gap-3 px-3 ${i > 0 ? "md:border-l md:border-white/10" : ""}`}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#6fb7ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 drop-shadow-[0_0_8px_rgba(80,160,255,0.8)]">
            {icon}
          </svg>
          <span>
            <b className="block font-display text-xl font-extrabold leading-tight text-white">{n}</b>
            <span className="block text-xs text-soft">{l}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// One icon and colour pair per category slug. Colours are decoration only.
export const CAT: Record<string, { c1: string; c2: string; d: string }> = {
  assistants: { c1: "#2563eb", c2: "#1e3a8a", d: "M4 5h16v10H9l-4 4v-4H4zM8 10h.01M12 10h.01M16 10h.01" },
  coding: { c1: "#0ea5e9", c2: "#1e3a8a", d: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" },
  video: { c1: "#7c3aed", c2: "#4c1d95", d: "M3 5h18v14H3zM10 9l5 3-5 3z" },
  image: { c1: "#16a34a", c2: "#065f46", d: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 5M16 9h.01" },
  audio: { c1: "#d97706", c2: "#7c2d12", d: "M9 18V5l11-2v13M9 18a3 3 0 11-3-3 3 3 0 013 3zM20 16a3 3 0 11-3-3 3 3 0 013 3z" },
  writing: { c1: "#6366f1", c2: "#4338ca", d: "M5 19l3.5-1 10-10a2 2 0 00-3-3l-10 10zM14 7l3 3" },
  productivity: { c1: "#b45309", c2: "#78350f", d: "M3 8h18v11H3zM9 8V5h6v3M3 13h18" },
  research: { c1: "#0d9488", c2: "#134e4a", d: "M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM16 16l5 5" },
  marketing: { c1: "#c026d3", c2: "#701a75", d: "M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM15 9a4 4 0 010 6M18 6a8 8 0 010 12" },
  automation: { c1: "#059669", c2: "#064e3b", d: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" },
  models: { c1: "#4f46e5", c2: "#312e81", d: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" },
  web: { c1: "#2563eb", c2: "#164e63", d: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" },
  "open-source": { c1: "#475569", c2: "#1e293b", d: "M9 7L4 12l5 5M15 7l5 5-5 5" },
  support: { c1: "#db2777", c2: "#831843", d: "M4 14v-2a8 8 0 0116 0v2M4 14h3v5H4zM17 14h3v5h-3zM20 19c0 2-2 3-5 3" },
  analytics: { c1: "#10b981", c2: "#065f46", d: "M4 20V10M10 20V4M16 20v-8M22 20H2" },
};

export function CategoryGrid() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {CATEGORIES.map((c) => {
        const k = CAT[c.slug] ?? { c1: "#4f46e5", c2: "#312e81", d: "M12 3l8 4.5v9L12 21l-8-4.5v-9z" };
        return (
          <li key={c.slug}>
            <Link href={`/tools/category/${c.slug}/`} prefetch={false} className="cat-tile" style={{ ["--c1" as string]: k.c1, ["--c2" as string]: k.c2 }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={k.d} />
              </svg>
              <span>{c.short}</span>
              <span className="text-[0.72rem] font-medium text-white/80">{toolsInCategory(c.slug).length} tools</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function PanelHead({ icon, title, sub, href, cta }: { icon: ReactNode; title: string; sub?: string; href: string; cta: string }) {
  return (
    <div className="panel-head mb-4">
      <div className="flex items-center gap-3">
        <span className="ico-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icon}
          </svg>
        </span>
        <div>
          <h2 className="font-display text-xl font-bold leading-tight text-white">{title}</h2>
          {sub && <p className="text-sm text-muted">{sub}</p>}
        </div>
      </div>
      <Link href={href} prefetch={false} className="btn-ghost btn-sm shrink-0">
        {cta} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

/** Real tools from the catalog. The badge is the pricing model we recorded; there are no star ratings because we do not collect any. */
export function FeaturedTools({ ids }: { ids: string[] }) {
  const tools = ids.map(getTool).filter((t): t is NonNullable<typeof t> => !!t);
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {tools.map((t) => (
        <li key={t.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 transition-colors hover:border-cyan/60">
          <div className="flex items-center gap-3">
            <ToolLogo id={t.id} name={t.name} hue={t.hue} size={44} />
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold leading-tight text-white">{t.name}</h3>
              <p className="truncate text-xs text-muted">{t.vendor}</p>
            </div>
          </div>
          <p className="text-sm text-soft">{t.tagline}</p>
          <span className="mt-auto w-fit rounded-md bg-green/15 px-2 py-0.5 text-xs font-bold text-green">{PRICING_MODEL_LABEL[t.pricingModel] ?? "Not verified"}</span>
          <Link href={`/tools/${t.id}/`} prefetch={false} className="btn-primary btn-sm w-full">
            View details <span aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function NewsPanel() {
  const list = [...NEWS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
  return (
    <div className="panel p-5">
      <PanelHead icon={<path d="M4 5h13v14H6a2 2 0 01-2-2zM17 9h3v8a2 2 0 01-2 2M8 9h6M8 13h6" />} title="Latest AI News" sub="From the original sources" href="/news/" cta="View all news" />
      <ul className="space-y-4">
        {list.map((n) => (
          <li key={n.slug}>
      <Link href={`/news/${n.slug}/`} prefetch={false} className="group flex gap-4 no-underline">
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10">
                <NewsVisual n={n} small sizes="140px" logos={1} />
              </div>
              <div className="min-w-0">
                <span className="rounded-md bg-violet/30 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-[#d9ccff]">{n.kind}</span>
                <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-white group-hover:underline">{n.title}</h3>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(n.date)} · {n.source}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BlogPanel({ items }: { items: Article[] }) {
  return (
    <div className="panel p-5">
      <PanelHead icon={<path d="M5 19l3.5-1 10-10a2 2 0 00-3-3l-10 10zM14 7l3 3" />} title="From Our Blog" sub="Practical, plain-English guides" href="/blog/" cta="View all guides" />
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.slug}>
      <Link href={a.href} prefetch={false} className="group flex gap-4 no-underline">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10">
          <ArticleCover topic={a.topic} tools={[]} small seed={a.slug} />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-snug text-white group-hover:underline">{a.title}</h3>
          <p className="mt-1 text-xs text-muted">
            {formatDate(a.date)} · {a.minutes} min read
          </p>
        </div>
      </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CtaPanel() {
  return (
    <div className="panel relative overflow-hidden p-6" style={{ background: "linear-gradient(135deg, rgba(80,50,220,0.85), rgba(30,40,150,0.9))" }}>
      <h2 className="font-display text-2xl font-extrabold text-white">Find the right tool, at the right price</h2>
      <p className="mt-1 max-w-[16rem] text-sm text-white/80">Compare plans read from the vendors&apos; own pages. {TOOLS.length} tools, every record dated.</p>
      <Link href="/tools/" prefetch={false} className="btn-ghost mt-5 inline-flex">
        Start exploring now <span aria-hidden="true">→</span>
      </Link>
      <svg aria-hidden="true" viewBox="0 0 160 120" className="pointer-events-none absolute -bottom-2 -right-2 h-32 w-40 opacity-90">
        {[18, 38, 62, 90].map((h, i) => (
          <rect key={i} x={14 + i * 34} y={112 - h} width="22" height={h} rx="4" fill={["#3d7bff", "#5a6cff", "#8b5cff", "#22d3ee"][i]} />
        ))}
        <path d="M10 70l40-20 36 8 56-44M120 14h22v22" fill="none" stroke="#7de3ff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
