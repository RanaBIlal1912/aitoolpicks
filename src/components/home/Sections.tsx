import Link from "next/link";
import type { ReactNode } from "react";
import { COMPANIES, MODELS } from "@/data/companies";
import { COMPARISONS } from "@/data/compare";
import { ARTICLES } from "@/data/articles";
import type { Article } from "@/data/articles";
import type { NewsItem } from "@/data/news";
import { CATEGORIES, PRICING_MODEL_LABEL, TOOLS, getCategory, getTool, toolsInCategory } from "@/data/tools";
import type { Tool } from "@/data/catalog-types";
import { catColors } from "@/data/palette";
import ArticleCard from "../ArticleCard";
import { formatDate } from "../NewsCard";
import NewsVisual from "../NewsVisual";
import Photo from "../Photo";
import type { PhotoId } from "@/data/photos";
import ToolLogo from "../ToolLogo";

/** Section heading with a large index number, used instead of one repeated eyebrow + title pattern. */
export function Head({ n, eyebrow, title, lead, href, cta, tone = "dark" }: { n: string; eyebrow: string; title: ReactNode; lead?: string; href?: string; cta?: string; tone?: "dark" | "light" }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="flex items-start gap-5">
        <span aria-hidden="true" data-n={n} className={`idx font-display text-5xl font-extrabold leading-none tracking-tighter md:text-6xl ${tone === "light" ? "text-black/15" : "text-white/10"}`} />
        <div>
          <span className={tone === "light" ? "text-xs font-bold uppercase tracking-[0.16em] text-violet-700" : "eyebrow"}>{eyebrow}</span>
          <h2 className={`section-title mt-2 ${tone === "light" ? "!text-[#0b0d1c]" : "text-white"}`}>{title}</h2>
          {lead && <p className={`mt-3 max-w-2xl ${tone === "light" ? "text-[#3b3f58]" : "text-soft"}`}>{lead}</p>}
        </div>
      </div>
      {href && cta && (
        <Link prefetch={false} href={href} className={tone === "light" ? "rounded-full border border-black/20 px-4 py-2 text-sm font-bold text-[#0b0d1c] no-underline hover:bg-black/5" : "btn-ghost btn-sm"}>
          {cta} →
        </Link>
      )}
    </div>
  );
}

/** A slow ribbon of the real product logos in the catalog. Pure CSS animation; paused for reduced motion. */
export function LogoRibbon() {
  const list = TOOLS.filter((t) => t.openSource !== "open-source").slice(0, 20);
  const row = (suffix: string) =>
    list.map((t) => (
      <li key={t.id + suffix} className="shrink-0">
        <Link prefetch={false} href={`/tools/${t.id}/`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] py-2 pl-2 pr-5 no-underline transition-colors hover:border-white/30 hover:bg-white/[0.08]">
          <ToolLogo id={t.id} name={t.name} hue={t.hue} size={36} />
          <span className="text-sm font-semibold text-soft">{t.name}</span>
        </Link>
      </li>
    ));
  return (
    <section aria-label="Tools in the directory" className="relative border-y border-white/10 bg-black/20 py-5">
      <div className="marquee">
        <ul className="marquee-track">
          {row("a")}
          {row("b")}
        </ul>
      </div>
    </section>
  );
}

function PlanChips({ tool, max = 3 }: { tool: Tool; max?: number }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tool.plans.slice(0, max).map((p) => (
        <li key={p.name} className="rounded-xl border border-white/12 bg-black/25 px-3 py-1.5 text-xs">
          <span className="text-muted">{p.name}</span> <b className="text-white">{p.price}</b>
        </li>
      ))}
    </ul>
  );
}

/** One large feature panel and four supporting cards, so the first tools you see are not all the same size. */
export function FeaturedBento({ ids }: { ids: string[] }) {
  const tools = ids.map(getTool).filter((t): t is Tool => !!t);
  const [lead, ...rest] = tools;
  if (!lead) return null;
  const [a, b] = catColors(lead.category);
  return (
    <div className="grid gap-5 lg:grid-cols-4 lg:grid-rows-2">
      <article className="tile relative flex flex-col justify-between gap-8 p-8 md:p-10 lg:col-span-2 lg:row-span-2" style={{ minHeight: 420 }}>
        <span aria-hidden="true" className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(520px 360px at 85% 0%, ${a}55, transparent 70%), radial-gradient(420px 300px at 0% 100%, ${b}33, transparent 70%)` }} />
        <div className="relative">
          <ToolLogo id={lead.id} name={lead.name} hue={lead.hue} size={84} />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-cyan">{getCategory(lead.category)?.short} · {lead.vendor}</p>
          <h3 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            <Link prefetch={false} href={`/tools/${lead.id}/`} className="tile-link no-underline">
              {lead.name}
              <span className="sr-only">: details and pricing</span>
            </Link>
          </h3>
          <p className="mt-4 max-w-md text-lg text-soft">{lead.tagline}</p>
          <p className="mt-2 max-w-md text-sm text-muted">{lead.keyFeature}</p>
        </div>
        <div className="relative space-y-4">
          <PlanChips tool={lead} max={4} />
          <p className="text-sm font-bold text-white">
            Plans, limits and sources <span aria-hidden="true">→</span>
          </p>
        </div>
      </article>
      {rest.slice(0, 4).map((t) => {
        const [c] = catColors(t.category);
        return (
          <article key={t.id} className="tile flex flex-col gap-3 p-5">
            <span aria-hidden="true" className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-30 blur-2xl" style={{ background: c }} />
            <ToolLogo id={t.id} name={t.name} hue={t.hue} size={44} />
            <h3 className="font-display text-xl font-bold text-white">
              <Link prefetch={false} href={`/tools/${t.id}/`} className="tile-link no-underline">
                {t.name}
                <span className="sr-only">: details and pricing</span>
              </Link>
            </h3>
            <p className="line-clamp-2 text-sm text-soft">{t.tagline}</p>
            <p className="mt-auto text-xs font-semibold text-muted">
              {getCategory(t.category)?.short} · {PRICING_MODEL_LABEL[t.pricingModel]}
            </p>
          </article>
        );
      })}
    </div>
  );
}

/** A full-width editorial panel over a real photograph of a data centre: states how the directory is checked and links to the evidence. */
export function PhotoBand({ checked, total }: { checked: number; total: number }) {
  return (
    <section aria-label="How the directory is checked" className="relative isolate overflow-hidden rounded-[32px] border border-white/10">
      <div className="absolute inset-0 -z-10">
        <Photo id="server-aisle" decorative sizes="(min-width: 1152px) 1152px, 100vw" className="object-[50%_60%]" />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#090B18] via-[#090B18]/85 to-[#090B18]/20" />
      <div className="max-w-xl px-7 py-14 md:px-14 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan">Read from the source</p>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white md:text-5xl">Prices come from the official page, not from a press release.</h2>
        <p className="mt-4 text-soft">
          We opened the official site of {checked === total ? "all " + total : checked + " of " + total} tools in a real browser, recorded the plans shown and the date we looked, and marked anything we could not confirm as partial.
        </p>
        <Link prefetch={false} href="/verification/" className="btn-primary mt-7 inline-flex">
          See the verification report
        </Link>
      </div>
      <span className="absolute bottom-2 right-3 rounded bg-black/55 px-1.5 py-0.5 text-[0.65rem] text-white/80 backdrop-blur-sm">Photo: İsmail Enes Ayhan / Unsplash</span>
    </section>
  );
}

/** Horizontal, snap-scrolling category cards with the real logos of the tools inside. */
const CAT_PHOTOS: PhotoId[] = ["circuit-blue", "light-dark-room", "server-aisle", "silicon-wafer", "fibre-switch", "circuit-macro", "processor-tweezers", "cable-network"];

export function CategoryRail() {
  return (
    <ul className="rail -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4" aria-label="Categories">
      {CATEGORIES.map((c, ci) => {
        const [a, b] = catColors(c.slug);
        const tools = toolsInCategory(c.slug);
        return (
          <li key={c.slug} className="snap-start">
            <Link prefetch={false}
              href={`/tools/category/${c.slug}/`}
              className="group relative flex h-[210px] w-[250px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 p-5 no-underline transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
              style={{ background: `linear-gradient(150deg, ${a}40, #0f1226 55%, ${b}26)` }}
            >
              <span aria-hidden="true" className="absolute inset-0 opacity-35 mix-blend-luminosity transition-opacity duration-300 group-hover:opacity-55">
                <Photo id={CAT_PHOTOS[ci % CAT_PHOTOS.length]} decorative sizes="250px" />
              </span>
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0f1226] via-[#0f1226]/55 to-transparent" />
              <span aria-hidden="true" className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70" style={{ background: a }} />
              <span className="relative flex -space-x-2">
                {tools.slice(0, 4).map((t) => (
                  <span key={t.id} className="rounded-xl ring-2 ring-[#0f1226]">
                    <ToolLogo id={t.id} name={t.name} hue={t.hue} size={38} />
                  </span>
                ))}
              </span>
              <span className="relative">
                <span className="block font-display text-xl font-bold leading-tight text-white">{c.label}</span>
                <span className="mt-1 block text-sm text-soft">
                  {tools.length} tools <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Free-plan tools as a ledger: one line each, logo, name, what it is. */
export function FreeLedger({ tools }: { tools: Tool[] }) {
  return (
    <ul className="grid gap-x-10 md:grid-cols-2">
      {tools.map((t, i) => (
        <li key={t.id} className="border-b border-white/10">
          <Link prefetch={false} href={`/tools/${t.id}/`} className="group flex items-center gap-4 py-4 no-underline">
            <span className="w-6 font-display text-sm font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
            <ToolLogo id={t.id} name={t.name} hue={t.hue} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-bold text-white">{t.name}</span>
              <span className="block truncate text-sm text-muted">{t.tagline}</span>
            </span>
            <span className="hidden rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200 sm:inline">Free plan</span>
            <span aria-hidden="true" className="text-soft transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Newest records as a dated timeline. */
export function AddedTimeline({ tools }: { tools: Tool[] }) {
  return (
    <ol className="relative grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {tools.map((t) => (
        <li key={t.id} className="relative">
          <time dateTime={t.added} className="mb-3 block text-xs font-bold uppercase tracking-[0.14em] text-cyan">{formatDate(t.added)}</time>
          <Link prefetch={false} href={`/tools/${t.id}/`} className="tile flex h-full flex-col gap-3 p-4 no-underline">
            <ToolLogo id={t.id} name={t.name} hue={t.hue} size={40} />
            <span className="font-display font-bold leading-tight text-white">{t.name}</span>
            <span className="text-xs text-muted">{getCategory(t.category)?.short}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** News laid out like a front page, on a deeper neon band. */
export function NewsPaper({ news }: { news: NewsItem[] }) {
  const [lead, ...rest] = news;
  return (
    <section className="paper relative left-1/2 w-screen -translate-x-1/2 px-5 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <Head n="04" eyebrow="AI news" title="What happened, and why it matters" lead="Edited by hand, each story with its original source." href="/news/" cta="All news" />
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
          <article>
            <div className="aspect-[16/10] overflow-hidden rounded-2xl">
              <NewsVisual n={lead} priority={false} sizes="(min-width: 1024px) 700px, 100vw" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-cyan">
              {lead.kind} · {formatDate(lead.date)}
            </p>
            <h3 className="mt-2 font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              <Link prefetch={false} href={`/news/${lead.slug}/`} className="no-underline hover:underline">
                {lead.title}
              </Link>
            </h3>
            <p className="mt-3 max-w-2xl text-soft">{lead.summary}</p>
          </article>
          <ul className="divide-y divide-white/10 self-start">
            {rest.slice(0, 4).map((n) => (
              <li key={n.slug} className="py-5 first:pt-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan">
                  {n.kind} · {formatDate(n.date)}
                </p>
                <h3 className="mt-1.5 font-serif text-xl font-bold leading-snug">
                  <Link prefetch={false} href={`/news/${n.slug}/`} className="no-underline hover:underline">
                    {n.title}
                  </Link>
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{n.source}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function GuidesRail({ guides }: { guides: Article[] }) {
  return (
    <ul className="rail -mx-5 flex snap-x gap-5 overflow-x-auto px-5 pb-4">
      {guides.map((a) => (
        <li key={a.slug} className="w-[300px] shrink-0 snap-start md:w-[340px]">
          <ArticleCard a={a} />
        </li>
      ))}
    </ul>
  );
}

/** Each comparison as a split "versus" tile. */
export function VersusTiles() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {COMPARISONS.map((c) => {
        const art = ARTICLES.find((x) => x.slug === c.article);
        const left = c.leftTool ? getTool(c.leftTool) : undefined;
        const right = c.rightTool ? getTool(c.rightTool) : undefined;
        const [la] = left ? catColors(left.category) : ["#754BFF"];
        const [ra] = right ? catColors(right.category) : ["#25C6E8"];
        return (
          <Link prefetch={false} key={c.slug} href={`/compare/${c.slug}/`} className="group relative overflow-hidden rounded-3xl border border-white/10 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">
            <span aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${la}44 0%, #0d1024 48%, #0d1024 52%, ${ra}44 100%)` }} />
            <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 pb-4 pt-8">
              <div className="flex flex-col items-center gap-3 text-center">
                {left && <ToolLogo id={left.id} name={left.name} hue={left.hue} size={64} />}
                <span className="font-display font-bold text-white">{c.leftLabel}</span>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/40 font-display text-sm font-extrabold text-white transition-transform group-hover:scale-110">VS</span>
              <div className="flex flex-col items-center gap-3 text-center">
                {right && <ToolLogo id={right.id} name={right.name} hue={right.hue} size={64} />}
                <span className="font-display font-bold text-white">{c.rightLabel}</span>
              </div>
            </div>
            <div className="relative px-6 pb-7 pt-3 text-center">
              <h3 className="font-serif text-xl font-bold leading-snug text-white">{art?.title}</h3>
              <span className="mt-3 inline-block text-sm font-bold text-soft group-hover:text-white">See the comparison →</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/** Real counts from the data, with a link into the ecosystem map. */
export function EcosystemBand() {
  const stats: [number, string][] = [
    [COMPANIES.length, "companies"],
    [TOOLS.length, "products"],
    [MODELS.length, "verified models"],
    [CATEGORIES.length, "categories"],
  ];
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 p-8 md:p-14" style={{ background: "radial-gradient(700px 400px at 90% 0%, rgba(117,75,255,.35), transparent 70%), radial-gradient(600px 400px at 0% 100%, rgba(37,198,232,.22), transparent 70%), #0d1024" }}>
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <span className="eyebrow">AI ecosystem</span>
          <h2 className="section-title mt-3 text-white">Who makes what in AI</h2>
          <p className="mt-4 max-w-xl text-soft">
            Companies, products and models linked only where a record states the relationship. Open the 3D network and follow the connections.
          </p>
          <Link prefetch={false} href="/ecosystem/" className="btn-primary mt-7 inline-block">
            Open the ecosystem map
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          {stats.map(([n, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block font-display text-5xl font-extrabold tracking-tight text-white">{n}</span>
                <span className="text-sm text-muted">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
