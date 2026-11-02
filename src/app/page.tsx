import type { Metadata } from "next";
import { ARTICLES } from "@/data/articles";
import { LISTED_NEWS } from "@/data/news";
import { TOOLS } from "@/data/tools";
import { allocateHomeTools } from "@/lib/home-tools";
import { SITE, absUrl } from "@/lib/site";
import { fitDescription } from "@/lib/meta";
import HeroSearch from "@/components/HeroSearch";
import HeroVisual from "@/components/hero/HeroVisual";
import JsonLd from "@/components/JsonLd";
import { HeroOrbit } from "@/components/home/Neon";
import { LatestBlog, LatestNews } from "@/components/home/Latest";
import { AddedTimeline, CategoryRail, FeaturedBento, Head, LogoRibbon } from "@/components/home/Sections";
import { FinalCta, TrendingTools } from "@/components/home/Discover";
import Reveal from "@/components/Reveal";

const TITLE = `${SITE.name}: find AI tools and their real prices`;
const DESC = fitDescription(SITE.description);

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: absUrl("/") },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: absUrl("/"),
    siteName: SITE.name,
    type: "website",
    images: [{ url: absUrl("/brand/og.png"), width: 1200, height: 630, alt: "AI Tool Picks: find the AI tool that fits, and what it really costs" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: [absUrl("/brand/og.png")] },
};

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
  // Newest first, from the same lists the Blog and News pages use.
  const blog = ARTICLES.slice(0, 3);
  const news = [...LISTED_NEWS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  // Each section gets its own tools: nothing shown in one section repeats in another (see src/lib/home-tools.ts).
  const home = allocateHomeTools();

  return (
    <>
      <section id="hero" className="relative isolate z-20">
        <HeroVisual webgl={false} />
        {/* On a phone the order is headline, robot, then search, so the robot is on the first screen; on desktop the text sits left and the robot right. */}
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 content-center px-5 pb-12 pt-8 md:pt-14 lg:min-h-[min(72vh,640px)] lg:grid-cols-[1.22fr_1fr] lg:gap-x-6 lg:pb-14">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <span className="eyebrow max-sm:!px-3 max-sm:!text-[0.68rem] max-sm:!tracking-[0.1em]">The AI tool magazine and price directory</span>
            <h1 className="hero-title mt-4 text-[clamp(2.05rem,4.1vw,3.9rem)] font-extrabold leading-[1] tracking-[-0.035em] text-white md:mt-6">
              <Word i={0}>Discover</Word>
              <Word i={1}>the</Word>
              <Word i={2}>Best</Word>
              <br />
              <span className="word gradient-text" style={{ ["--i" as string]: 3 }}>
                AI Tools
              </span>{" "}
              <Word i={4}>in</Word>
              <span className="whitespace-nowrap">
                <Word i={5}>One</Word>
                <Word i={6}>Place</Word>
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-soft md:mt-6 md:text-xl">{TOOLS.length} tools, with every plan and price read from the official page.</p>
          </div>
          <div className="max-lg:order-last lg:col-start-1 lg:row-start-2 lg:self-start">
            <div className="mt-1 max-w-2xl">
              <HeroSearch />
            </div>
          </div>
          <div className="mt-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <HeroOrbit ids={home.hero} />
          </div>
        </div>
      </section>

      <LogoRibbon tools={home.ribbon} />

      <div className="mx-auto max-w-7xl px-5">
        <Reveal as="section" className="pt-20 cv-section">
          {home.trending && <TrendingTools rows={home.trending.rows} lead={home.trending.lead} />}
        </Reveal>

        <Reveal as="section" className="pt-24 cv-section">
          <Head n="02" eyebrow="Editor's picks" title="Where to start" lead="Well-documented tools across the jobs people use AI for." href="/tools/" cta="Browse every tool" />
          <FeaturedBento ids={home.picks} />
        </Reveal>

        <Reveal as="section" className="pt-24 cv-section">
          <Head n="03" eyebrow="New in the directory" title="Recently added" lead="Newest records first. This shows when we added a tool, not when the vendor released it." href="/tools/" cta="Explore the full directory" />
          <AddedTimeline tools={home.recent} />
        </Reveal>

        <Reveal as="section" className="pt-24 cv-section">
          <LatestBlog items={blog} />
        </Reveal>
      </div>

      <Reveal className="mt-24 overflow-x-clip">
        <LatestNews items={news} />
      </Reveal>

      <div className="mx-auto max-w-7xl px-5">
        <Reveal as="section" className="pt-24 cv-section">
          <Head n="06" eyebrow="Discover" title="Explore categories" href="/tools/" cta="Search all tools" />
          <CategoryRail logos={false} />
        </Reveal>

        <Reveal as="section" className="pt-20 cv-section">
          <FinalCta />
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
    </>
  );
}
