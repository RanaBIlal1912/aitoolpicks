import Link from "next/link";
import type { Metadata } from "next";
import { ARTICLES, GUIDES, TOPICS } from "@/data/articles";
import { COMPARISONS } from "@/data/compare";
import { NEWS } from "@/data/news";
import { CATEGORIES, TOOLS, getTool } from "@/data/tools";
import type { Tool } from "@/data/catalog-types";
import { ROUNDUPS } from "@/data/roundups";
import { SITE, absUrl } from "@/lib/site";
import { getTrending } from "@/lib/trending";
import ArticleCard from "@/components/ArticleCard";
import HeroSearch from "@/components/HeroSearch";
import { formatDate } from "@/components/NewsCard";
import NewsVisual from "@/components/NewsVisual";
import Reveal from "@/components/Reveal";
import ToolTile from "@/components/ToolTile";
import HeroVisual from "@/components/hero/HeroVisual";
import { catColors } from "@/data/palette";
import ToolLogo from "@/components/ToolLogo";
import { RecentStrip } from "@/components/SavedList";
import JsonLd from "@/components/JsonLd";

const TITLE = `${SITE.name}: discover AI tools, real prices and honest comparisons`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: SITE.description,
  alternates: { canonical: absUrl("/") },
  openGraph: {
    title: TITLE,
    description: SITE.description,
    url: absUrl("/"),
    siteName: SITE.name,
    type: "website",
    images: [{ url: absUrl("/brand/og.png"), width: 1200, height: 630, alt: "AI Tool Picks: find the AI tool that fits, and what it really costs" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: SITE.description, images: [absUrl("/brand/og.png")] },
};

// Popular tasks: plain phrases that the local search understands (see src/lib/search.ts).
const SUGGESTIONS = [
  { label: "Create videos", q: "create professional videos" },
  { label: "Code with AI", q: "AI coding assistant" },
  { label: "Transcribe meetings", q: "transcribe meetings" },
  { label: "Product images", q: "generate product images" },
  { label: "Research papers", q: "research academic papers" },
  { label: "Build a website", q: "build a website" },
  { label: "Voiceovers", q: "create AI voiceovers" },
];

function SectionHead({ eyebrow, title, lead, href, cta }: { eyebrow: string; title: string; lead?: string; href?: string; cta?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="section-title mt-3 text-white">{title}</h2>
        {lead && <p className="mt-3 max-w-2xl text-soft">{lead}</p>}
      </div>
      {href && cta && (
        <Link href={href} className="btn-ghost btn-sm">
          {cta} →
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const featured = ["claude", "github-copilot", "runway", "elevenlabs", "notion", "perplexity"].map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => !!t);
  const lead = GUIDES.find((g) => g.slug === "best-ai-writing-tools") ?? GUIDES[0];
  const latest = GUIDES.filter((g) => g.slug !== lead.slug && !g.region).slice(0, 3); // regional guides stay on the blog
  const trending = getTrending();
  const news = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
  // Free tools: a free plan is documented on the official page and the pricing record is fully verified.
  const free = TOOLS.filter((t) => t.freePlan === true && t.pricingStatus === "verified").slice(0, 6);
  // Recently added: newest records first. This is "added to our directory", not "released by the vendor".
  const recent = [...TOOLS].sort((a, b) => b.added.localeCompare(a.added) || a.name.localeCompare(b.name)).slice(0, 6);

  return (
    <>
      <section id="hero" className="relative isolate overflow-hidden">
        <div className="relative mx-auto grid min-h-[min(84vh,760px)] max-w-6xl items-center gap-10 px-5 pb-14 pt-12 md:grid-cols-[1.15fr_1fr]">
          <div>
            <span className="eyebrow">AI tool directory and magazine</span>
            <h1 className="mt-6 text-[clamp(2.6rem,6.8vw,5rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-white">
              Find the AI tool that fits, and <span className="gradient-text">what it really costs</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-soft md:text-xl">
              Compare AI tools by what they do, who they suit and what the vendor actually charges. Every price comes from the official page, with the
              date we checked it.
            </p>
            <HeroSearch suggestions={SUGGESTIONS} />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tools/" className="btn-primary">
                Explore all tools
              </Link>
              <Link href="/news/" className="btn-ghost">
                Latest AI news
              </Link>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5">
        <Reveal as="section" className="pt-6">
          <SectionHead eyebrow="Editor's picks" title="Good places to start" lead="Well-documented tools across the main jobs people use AI for." href="/tools/" cta="Browse every tool" />
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <li key={t.id}>
                <ToolTile tool={t} note={t.keyFeature ? undefined : undefined} />
              </li>
            ))}
          </ul>
        </Reveal>

        <RecentStrip />

        {trending && (
          <Reveal as="section" className="pt-24">
            <SectionHead
              eyebrow="Trending"
              title="Most viewed tool pages"
              lead={`Measured page views from ${trending.period.from} to ${trending.period.to} (${trending.source}; ${trending.method}).`}
            />
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {trending.items.map((i) => {
                const t = getTool(i.id);
                return t ? (
                  <li key={i.id}>
                    <ToolTile tool={t} note={`${i.views} views`} />
                  </li>
                ) : null;
              })}
            </ul>
          </Reveal>
        )}

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Free to start" title="AI tools with a free plan" lead="A free plan is documented on the vendor's official page and its pricing record is fully verified." href="/tools/?free=1" cta="All free tools" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {free.map((t) => (
              <li key={t.id}>
                <ToolTile tool={t} note="Free plan documented" />
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="New in the directory" title="Recently added" lead="Newest records first. This shows when we added a tool, not when the vendor released it." href="/tools/" cta="Browse all" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((t) => (
              <li key={t.id}>
                <ToolTile tool={t} note={`Added ${t.added}`} />
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Explore" title="Browse by what you need to do" href="/tools/" cta="Search all tools" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => {
              const [ca, cb] = catColors(c.slug);
              return (
                <li key={c.slug}>
                  <Link
                    href={`/tools/category/${c.slug}/`}
                    className="tile group flex h-full flex-col p-5 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
                  >
                    <span aria-hidden="true" className="absolute inset-0 opacity-[0.16] transition-opacity duration-300 group-hover:opacity-30" style={{ background: `linear-gradient(135deg, ${ca}, ${cb})` }} />
                    <span className="relative flex items-center justify-between font-bold text-white">
                      {c.label}
                      <span aria-hidden="true" className="text-soft transition-transform duration-200 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                    <span className="relative mt-2 text-sm text-soft">{c.subs.map((x) => x.label).join(" · ")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Read" title="Start here" href="/blog/" cta="All guides" />
          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <ArticleCard a={lead} featured />
            <div className="glass flex flex-col rounded-[22px] p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="kicker">Latest AI news</span>
                <Link href="/news/" className="text-sm font-bold text-[#9db4d6] no-underline hover:underline">
                  All news →
                </Link>
              </div>
              <ul className="divide-y divide-white/10">
                {news.slice(0, 4).map((n) => (
                  <li key={n.slug} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                    <div className="aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg">
                      <NewsVisual n={n} sizes="90px" logos={1} small />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold uppercase tracking-[0.1em] text-cyan">{n.kind}</span>
                        <time dateTime={n.date} className="text-muted">
                          {formatDate(n.date)}
                        </time>
                      </div>
                      <Link href={`/news/${n.slug}/`} className="mt-1 block font-serif text-[1.02rem] font-bold leading-snug text-white no-underline hover:underline">
                        {n.title}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/news/" className="btn-ghost btn-sm mt-5 self-start">
                Explore all AI news →
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Best-of guides" title="Which tool for which job" lead="Groups of tools matched to who they suit, with real prices." href="/best/" cta="All best-of guides" />
          <ul className="grid gap-4 md:grid-cols-3">
            {ROUNDUPS.slice(0, 3).map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/best/${r.slug}/`}
                  className="glass card-glow flex h-full flex-col gap-3 p-6 no-underline transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
                  style={{ ["--hue" as string]: 220 }}
                >
                  <span className="flex -space-x-2" aria-hidden="true">
                    {r.picks.slice(0, 4).map((p) => {
                      const t = getTool(p.id);
                      return t ? (
                        <span key={p.id} className="rounded-xl ring-2 ring-[#11152A]">
                          <ToolLogo id={t.id} name={t.name} hue={t.hue} size={36} />
                        </span>
                      ) : null;
                    })}
                  </span>
                  <h3 className="font-serif text-xl font-bold leading-snug text-white">{r.title}</h3>
                  <p className="text-sm text-muted">{r.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Comparisons" title="Which one do you actually need?" lead="Side-by-side tables, plus a tool that lets you compare any two." href="/compare/" cta="All comparisons" />
          <div className="grid gap-6 md:grid-cols-2">
            {COMPARISONS.map((c) => {
              const a = ARTICLES.find((x) => x.slug === c.article)!;
              const left = c.leftTool ? getTool(c.leftTool) : undefined;
              const right = c.rightTool ? getTool(c.rightTool) : undefined;
              return (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}/`}
                  className="glass card-glow group flex flex-col gap-4 p-7 no-underline transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
                  style={{ ["--hue" as string]: 265 }}
                >
                  <div className="flex items-center gap-3 text-sm font-bold text-soft">
                    {left && <ToolLogo id={left.id} name={left.name} hue={left.hue} size={44} />}
                    <span>{c.leftLabel}</span>
                    <span className="text-muted">vs</span>
                    {right && <ToolLogo id={right.id} name={right.name} hue={right.hue} size={44} />}
                    <span>{c.rightLabel}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold leading-snug tracking-tight text-white">{a.title}</h3>
                  <p className="text-muted">{a.blurb}</p>
                  <span className="mt-1 text-sm font-bold text-soft group-hover:text-white">See the comparison →</span>
                </Link>
              );
            })}
          </div>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Latest guides" title="Practical, plain-English reading" href="/blog/" cta="All guides" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((a) => (
              <ArticleCard key={a.slug} a={a} />
            ))}
          </div>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Guide topics">
            {TOPICS.map((t) => (
              <li key={t.id}>
                <Link href={`/blog/topic/${t.id}/`} className="chip">
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-8 md:p-12">
            <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
              <div>
                <span className="eyebrow">How we work</span>
                <h2 className="section-title mt-3 text-white">Sourced, dated and labelled</h2>
                <p className="mt-4 text-soft">
                  We do not invent prices, ratings, news or affiliate links. When a price could not be confirmed on the official page, the page says so.
                </p>
                <Link href="/methodology/" className="btn-ghost btn-sm mt-6">
                  Read the methodology
                </Link>
              </div>
              <ul className="grid gap-4 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
                {[
                  ["Official sources", "Prices and plans are read from each vendor's own pages."],
                  ["Dated checks", "Every record shows when it was last verified."],
                  ["Plain labels", "Documentation-based overviews are never presented as lab tests."],
                ].map(([t, d]) => (
                  <li key={t} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="font-bold text-white">{t}</p>
                    <p className="mt-1 text-sm text-muted">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted">
            Is a tool missing? <Link href="/submit/" className="text-soft underline">Suggest it</Link>. A person reviews every suggestion.
          </p>
          <p className="mt-3 text-sm text-muted">
            Some links on this site are affiliate links. If you buy through them we may earn a commission at no extra cost to you, and it never changes what we
            write.{" "}
            <Link href="/affiliate-disclosure/" className="text-soft underline">
              Read the disclosure
            </Link>
            .
          </p>
        </Reveal>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          url: absUrl("/"),
          description: SITE.description,
          potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: absUrl("/tools/?q={search_term_string}") }, "query-input": "required name=search_term_string" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Editor's picks",
          itemListElement: featured.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: absUrl(`/tools/${t.id}/`) })),
        }}
      />
    </>
  );
}
