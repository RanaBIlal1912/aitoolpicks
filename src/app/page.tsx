import Link from "next/link";
import type { Metadata } from "next";
import { GUIDES, TOPICS } from "@/data/articles";
import { NEWS } from "@/data/news";
import { CATEGORIES, TOOLS, getTool } from "@/data/tools";
import { ROUNDUPS } from "@/data/roundups";
import { SITE, absUrl } from "@/lib/site";
import { getTrending } from "@/lib/trending";
import ArticleCard from "@/components/ArticleCard";
import HeroSearch from "@/components/HeroSearch";
import Reveal from "@/components/Reveal";
import ToolTile from "@/components/ToolTile";
import HeroVisual from "@/components/hero/HeroVisual";
import UniverseSection from "@/components/universe/UniverseSection";
import ToolLogo from "@/components/ToolLogo";
import { RecentStrip } from "@/components/SavedList";
import JsonLd from "@/components/JsonLd";
import { BlogPanel, CategoryGrid, CtaPanel, FeaturedTools, HeroOrbit, NewsPanel, PanelHead, StatStrip } from "@/components/home/Neon";
import { AddedTimeline, CategoryRail, EcosystemBand, FeaturedBento, FreeLedger, GuidesRail, Head, LogoRibbon, NewsPaper, PhotoBand, VersusTiles } from "@/components/home/Sections";

const TITLE = `${SITE.name}: find AI tools and their real prices`;

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

function Word({ children, i }: { children: string; i: number }) {
  return (
    <>
      <span className="word" style={{ ["--i" as string]: i }}>
        {children}
      </span>{" "}
    </>
  );
}

export default function Home() {
  const VERIFIED = TOOLS.filter((t) => t.pricingStatus === "verified").length;
  const picks = ["claude", "github-copilot", "runway", "elevenlabs", "perplexity"];
  const featured = ["claude", "github-copilot", "runway", "elevenlabs", "notion", "perplexity"].map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => !!t);
  const lead = GUIDES.find((g) => g.slug === "best-ai-writing-tools") ?? GUIDES[0];
  const latest = GUIDES.filter((g) => !g.region).slice(0, 6);
  const trending = getTrending();
  const news = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
  // Free tools: a free plan is documented on the official page and the pricing record is fully verified.
  const free = TOOLS.filter((t) => t.freePlan === true && t.pricingStatus === "verified").slice(0, 8);
  // Recently added: newest records first. This is "added to our directory", not "released by the vendor".
  const recent = [...TOOLS].sort((a, b) => b.added.localeCompare(a.added) || a.name.localeCompare(b.name)).slice(0, 6);

  return (
    <>
      <section id="hero" className="relative isolate">
        <HeroVisual webgl={false} />
        <div className="relative mx-auto grid min-h-[min(88vh,820px)] max-w-7xl items-center gap-8 px-5 pb-16 pt-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="eyebrow">The AI tool magazine and price directory</span>
            <h1 className="hero-title mt-6 text-[clamp(2.4rem,4.9vw,4.4rem)] font-extrabold leading-[1] tracking-[-0.035em] text-white">
              <Word i={0}>Discover</Word>
              <Word i={1}>the</Word>
              <Word i={2}>Best</Word>
              <br />
              <span className="word gradient-text" style={{ ["--i" as string]: 3 }}>
                AI Tools
              </span>{" "}
              <Word i={4}>in</Word>
              <Word i={5}>One</Word>
              <Word i={6}>Place</Word>
            </h1>
            <p className="mt-7 max-w-xl text-lg text-soft md:text-xl">
              {TOOLS.length} tools, every plan and price read from the official page, with the date we checked it. Search by the job you need done.
            </p>
            <div className="max-w-2xl">
              <HeroSearch suggestions={SUGGESTIONS} />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link prefetch={false} href="/tools/" className="btn-primary">
                Explore Tools <span aria-hidden="true">→</span>
              </Link>
              <Link prefetch={false} href="/compare/" className="btn-ghost">
                Compare Prices
              </Link>
            </div>
          </div>
          <HeroOrbit total={TOOLS.length} verified={VERIFIED} />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5">
        <StatStrip total={TOOLS.length} categories={CATEGORIES.length} verified={VERIFIED} />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <section className="panel p-5" aria-label="Popular categories">
            <PanelHead icon={<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />} title="Popular Categories" sub="Browse AI tools by category" href="/tools/" cta="View all tools" />
            <CategoryGrid />
          </section>
          <section className="panel p-5" aria-label="Featured tools">
            <PanelHead icon={<path d="M12 3c1 3 4 4 4 8a4 4 0 01-8 0c0-1 .5-2 1-3 .5 2 2 2 2 0 0-2-1-3 1-5zM6 15a6 6 0 0012 0" />} title="Featured AI Tools" sub="Editor's picks with documented pricing" href="/tools/" cta="View all tools" />
            <FeaturedTools ids={["chatgpt", "midjourney", "canva", "claude", "gemini", "notion"]} />
          </section>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <NewsPanel />
          <BlogPanel items={latest.slice(0, 2)} />
          <CtaPanel />
        </div>
      </div>

      <LogoRibbon />

      <div className="mx-auto max-w-7xl px-5">
        <div className="pt-20">
          <UniverseSection />
        </div>

        <Reveal as="section" className="pt-28 cv-section">
          <Head n="02" eyebrow="Editor's picks" title="Where to start" lead="Well-documented tools across the jobs people use AI for." href="/tools/" cta="Browse every tool" />
          <FeaturedBento ids={picks} />
          <div className="mt-16 cv-section">
            <PhotoBand checked={TOOLS.length} total={TOOLS.length} />
          </div>
        </Reveal>

        <Reveal as="section" className="pt-28 cv-section">
          <Head n="03" eyebrow="Discover" title="Browse by category" href="/tools/" cta="Search all tools" />
          <CategoryRail />
        </Reveal>

        <RecentStrip />

        {trending && (
          <Reveal as="section" className="pt-28 cv-section">
            <Head n="+" eyebrow="Trending" title="Most viewed tool pages" lead={`Measured page views from ${trending.period.from} to ${trending.period.to} (${trending.source}; ${trending.method}).`} />
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

        <Reveal as="section" className="pt-28 cv-section">
          <Head n="05" eyebrow="Free to start" title="Tools with a free plan" lead="Documented on the vendor's official page, with a fully verified pricing record." href="/tools/?free=1" cta="All free tools" />
          <FreeLedger tools={free} />
        </Reveal>

        <Reveal as="section" className="pt-28 cv-section">
          <Head n="06" eyebrow="New in the directory" title="Recently added" lead="Newest records first. This shows when we added a tool, not when the vendor released it." href="/tools/" cta="Browse all" />
          <AddedTimeline tools={recent} />
        </Reveal>
      </div>

      <div className="mt-28 overflow-x-clip">
        <div className="mx-auto max-w-7xl px-5">
          <NewsPaper news={news.slice(0, 5)} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5">
        <Reveal as="section" className="pt-28">
          <Head n="07" eyebrow="Guides" title="Practical, plain-English reading" lead="Tutorials, workflows and comparisons. Each says what to do first and what to skip." href="/blog/" cta="All guides" />
          <div className="mb-8">
            <ArticleCard a={lead} featured />
          </div>
          <GuidesRail guides={latest.filter((g) => g.slug !== lead.slug)} />
          <ul className="mt-8 flex flex-wrap gap-3" aria-label="Guide topics">
            {TOPICS.map((t) => (
              <li key={t.id}>
                <Link prefetch={false} href={`/blog/topic/${t.id}/`} className="chip">
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-28 cv-section">
          <Head n="08" eyebrow="Comparisons" title="Which one do you actually need?" lead="Side-by-side tables, plus a tool that lets you compare any two." href="/compare/" cta="All comparisons" />
          <VersusTiles />
        </Reveal>

        <Reveal as="section" className="pt-28 cv-section">
          <Head n="09" eyebrow="Best-of guides" title="Which tool for which job" href="/best/" cta="All best-of guides" />
          <ul className="grid gap-4 md:grid-cols-3">
            {ROUNDUPS.slice(0, 3).map((r) => (
              <li key={r.slug}>
                <Link prefetch={false}
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

        <Reveal as="section" className="pt-28 cv-section">
          <EcosystemBand />
        </Reveal>

        <Reveal as="section" className="pt-28 cv-section">
          <div className="panel p-8 md:p-12">
            <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
              <div>
                <span className="eyebrow">How we work</span>
                <h2 className="section-title mt-3 text-white">Sourced, dated and labelled</h2>
                <p className="mt-4 text-soft">We do not invent prices, ratings, news or affiliate links. When a price could not be confirmed on the official page, the page says so.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link prefetch={false} href="/methodology/" className="btn-ghost btn-sm">
                    Read the methodology
                  </Link>
                  <Link prefetch={false} href="/verification/" className="btn-ghost btn-sm">
                    See the verification log
                  </Link>
                </div>
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
            Is a tool missing? <Link prefetch={false} href="/submit/" className="text-soft underline">Suggest it</Link>. A person reviews every suggestion.
          </p>
          <p className="mt-3 text-sm text-muted">
            Some links on this site are affiliate links. If you buy through them we may earn a commission at no extra cost to you, and it never changes what we write.{" "}
            <Link prefetch={false} href="/affiliate-disclosure/" className="text-soft underline">
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
