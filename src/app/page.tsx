import Link from "next/link";
import type { Metadata } from "next";
import { ARTICLES, GUIDES, TOPICS, articlesInTopic, COVER_BY_TOPIC } from "@/data/articles";
import { COMPARISONS } from "@/data/compare";
import { NEWS } from "@/data/news";
import { CATEGORIES, TOOLS, getTool, toolsInCategory } from "@/data/tools";
import { ROUNDUPS } from "@/data/roundups";
import { SITE, absUrl } from "@/lib/site";
import { coverPath } from "@/data/covers";
import ArticleCard from "@/components/ArticleCard";
import Cover from "@/components/Cover";
import NewsCard, { formatDate } from "@/components/NewsCard";
import ParallaxFrame from "@/components/ParallaxFrame";
import Reveal from "@/components/Reveal";
import ToolCard from "@/components/ToolCard";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name}: honest AI tool reviews, comparisons and guides` },
  description: SITE.description,
  alternates: { canonical: absUrl("/") },
  openGraph: {
    title: `${SITE.name}: honest AI tool reviews, comparisons and guides`,
    description: SITE.description,
    url: absUrl("/"),
    siteName: SITE.name,
    type: "website",
    images: [{ url: absUrl(coverPath("chip", "og")), width: 1200, height: 630, alt: "AI processor package render" }],
  },
};

function SectionHead({ eyebrow, title, lead, href, cta }: { eyebrow: string; title: string; lead?: string; href?: string; cta?: string }) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
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
  const featured = ["claude", "github-copilot", "runway", "elevenlabs", "notion", "zapier"].map((id) => getTool(id)!);
  const verifiedCount = TOOLS.filter((t) => t.pricingStatus === "verified").length;
  const lead = GUIDES.find((g) => g.slug === "best-ai-writing-tools") ?? GUIDES[0];
  const latest = GUIDES.filter((g) => g.slug !== lead.slug).slice(0, 6);
  const news = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <section id="hero" className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,15,0.82),rgba(5,6,15,0.35)_52%,transparent)] max-sm:bg-[rgba(5,6,15,0.58)]"
        />
        <div className="relative mx-auto flex min-h-[min(92vh,840px)] max-w-6xl flex-col justify-center px-5 pb-16 pt-14">
          <div className="max-w-2xl">
            <span className="eyebrow">AI magazine · Independent · Free plans first</span>
            <h1 className="mt-6 text-[clamp(2.6rem,7.2vw,5.2rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-white">
              Pick the AI tools that <span className="gradient-text">earn their place</span> in your work
            </h1>
            <p className="mt-6 max-w-xl text-lg text-soft md:text-xl">
              A growing catalogue of AI tools with official plan prices and the date we checked them, dated AI news with original
              sources, and practical guides for creators, developers and small businesses worldwide.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/news/" className="btn-primary">
                Latest AI news
              </Link>
              <Link href="/blog/" className="btn-ghost">
                Read the guides
              </Link>
              <Link href="/tools/" className="btn-ghost">
                Browse tools
              </Link>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-4">
              {[
                [String(TOOLS.length), "tools in " + CATEGORIES.length + " categories"],
                [String(verifiedCount), "with verified pricing"],
                [String(NEWS.length), "sourced news items"],
              ].map(([n, l]) => (
                <div key={l} className="glass rounded-2xl px-4 py-3">
                  <dt className="sr-only">{l}</dt>
                  <dd className="text-2xl font-extrabold text-white">
                    {n}
                    <span className="mt-0.5 block text-xs font-medium text-muted">{l}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5">
        <p className="glass rounded-2xl border-l-4 border-l-amber px-5 py-3 text-sm text-muted">
          Some links on this site are affiliate links. If you buy through them we may earn a commission at no extra cost to you. It
          never changes what we write.{" "}
          <Link href="/affiliate-disclosure/" className="text-soft underline">
            Read the disclosure
          </Link>
          .
        </p>

        <Reveal as="section" className="pt-16">
          <SectionHead eyebrow="Top stories" title="Start here" href="/blog/" cta="All guides" />
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
                {news.slice(0, 5).map((n) => (
                  <li key={n.url} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold uppercase tracking-[0.1em] text-cyan">{n.tag}</span>
                      <time dateTime={n.date} className="text-muted">
                        {formatDate(n.date)}
                      </time>
                    </div>
                    <a href={n.url} target="_blank" rel="noopener noreferrer" className="mt-1 block font-serif text-[1.05rem] font-bold leading-snug text-white no-underline hover:underline">
                      {n.title}
                      <span className="sr-only"> (opens the original source in a new tab)</span>
                    </a>
                    <p className="mt-0.5 text-xs text-muted">via {n.source}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead
            eyebrow="Explore"
            title="Browse AI tools by category"
            lead="From assistants and coding tools to video, audio, research and automation. Every category page lists plans and prices in the vendor's own currency."
            href="/tools/"
            cta="Search all tools"
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/tools/category/${c.slug}/`} className="group relative block aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 no-underline">
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.05]">
                    <Cover id={c.cover} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-[#05070d]/60 to-[#05070d]/10" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-bold text-white">{c.short}</p>
                    <p className="text-xs text-soft">{toolsInCategory(c.slug).length} tools</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead
            eyebrow="Featured tools"
            title="Tools with verified pricing"
            lead="Plan names and prices are read from each vendor's own pricing page, with the date we checked."
            href="/pricing/"
            cta="Compare all pricing"
          />
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <li key={t.id} className="[perspective:1000px]">
                <ToolCard tool={t} />
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Best-of guides" title="Which tool for which job" lead="Groups of tools matched to who they suit, with real prices." href="/best/" cta="All best-of guides" />
          <ul className="grid gap-4 md:grid-cols-3">
            {ROUNDUPS.slice(0, 3).map((r) => (
              <li key={r.slug}>
                <Link href={`/best/${r.slug}/`} className="glass card-glow flex h-full flex-col gap-2 p-6 no-underline transition-transform hover:-translate-y-0.5" style={{ ["--hue" as string]: 220 }}>
                  <span className="kicker">{r.picks.length} picks</span>
                  <h3 className="font-serif text-xl font-bold leading-snug text-white">{r.title}</h3>
                  <p className="text-sm text-muted">{r.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead
            eyebrow="Popular comparisons"
            title="Which one do you actually need?"
            lead="Side-by-side tables, plus a tool that lets you compare any two."
            href="/compare/"
            cta="All comparisons"
          />
          <div className="grid gap-6 md:grid-cols-2">
            {COMPARISONS.map((c) => {
              const a = ARTICLES.find((x) => x.slug === c.article)!;
              return (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}/`}
                  className="glass card-glow group relative flex flex-col overflow-hidden no-underline transition-transform hover:-translate-y-1"
                  style={{ ["--hue" as string]: 265 }}
                >
                  <div className="cover-frame aspect-[16/7] !rounded-none !border-0">
                    <div className="h-full transition-transform duration-700 group-hover:scale-[1.05]">
                      <Cover id={a.cover} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 p-7">
                    <div className="flex items-center gap-3 text-sm font-bold">
                      <span className="rounded-full bg-electric/20 px-3 py-1 text-[#a9bfe6]">{c.leftLabel}</span>
                      <span className="text-muted">vs</span>
                      <span className="rounded-full bg-violet/20 px-3 py-1 text-[#c1bce2]">{c.rightLabel}</span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold leading-snug tracking-tight text-white">{a.title}</h3>
                    <p className="text-muted">{a.blurb}</p>
                    <span className="mt-1 text-sm font-bold text-soft group-hover:text-white">See the comparison →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Topics" title="Start with what you need" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/blog/topic/${t.id}/`}
                  className="group relative block aspect-[16/8] overflow-hidden rounded-[22px] border border-white/10 no-underline"
                >
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.06]">
                    <Cover id={COVER_BY_TOPIC[t.id]} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-[#05060f]/55 to-[#05060f]/10" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-xl font-bold text-white">{t.label}</p>
                    <p className="text-sm text-soft">
                      {articlesInTopic(t.id).length} guides · {t.blurb}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Latest guides" title="Practical, plain-English reading" href="/blog/" cta="All guides" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((a) => (
              <ArticleCard key={a.slug} a={a} />
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead
            eyebrow="Featured news"
            title="What just happened in AI"
            lead="Short summaries with the publication date and a link to the original source."
            href="/news/"
            cta="More news"
          />
          <NewsCard n={news[0]} featured />
        </Reveal>

        <Reveal as="section" className="pt-24">
          <div className="relative overflow-hidden rounded-[30px] border border-white/10">
            <ParallaxFrame className="absolute inset-0" strength={50}>
              <Cover id="fibre" sizes="100vw" />
            </ParallaxFrame>
            <div className="absolute inset-0 bg-gradient-to-r from-[#05060f]/92 via-[#05060f]/70 to-[#05060f]/30" />
            <div className="relative grid gap-10 p-8 md:grid-cols-[1.1fr_1fr] md:p-14">
              <div>
                <span className="eyebrow">How we work</span>
                <h2 className="section-title mt-3 text-white">No made-up numbers, ever</h2>
                <p className="mt-4 text-soft">
                  We do not invent prices, reviews, ratings, news or affiliate links. If we could not verify a price on the official
                  page, we say so instead of guessing. The images on this site are 3D renders, not photos of real products.
                </p>
                <Link href="/about/" className="btn-ghost btn-sm mt-6">
                  Read our approach
                </Link>
              </div>
              <ul className="grid gap-4">
                {[
                  ["Free first", "We prefer tools with a free plan so you can try before you pay."],
                  ["Honest pros and cons", "Every pick says who it suits and who should skip it."],
                  ["Real prices, clearly labelled", "Merchant prices stay in USD. Other currencies are marked as estimates."],
                ].map(([t, d]) => (
                  <li key={t} className="scrim-panel rounded-2xl border border-white/10 p-5">
                    <p className="font-bold text-white">{t}</p>
                    <p className="mt-1 text-sm text-muted">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Featured AI tools",
          itemListElement: featured.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: absUrl(`/tools/${t.id}/`) })),
        }}
      />
    </>
  );
}
