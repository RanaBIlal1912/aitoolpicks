import Link from "next/link";
import type { Metadata } from "next";
import { ARTICLES, GUIDES, TOPICS, articlesInTopic } from "@/data/articles";
import { COMPARISONS } from "@/data/compare";
import { NEWS } from "@/data/news";
import { TOOLS, getTool } from "@/data/tools";
import { CODES } from "@/lib/currency";
import { SITE, absUrl } from "@/lib/site";
import ArticleCard from "@/components/ArticleCard";
import Hero3D from "@/components/hero/Hero3D";
import NewsCard from "@/components/NewsCard";
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
  const featured = TOOLS.filter((t) => t.review).slice(0, 5).map((t) => getTool(t.id)!);
  const latest = GUIDES.slice(0, 7);

  return (
    <>
      <section id="hero" className="relative isolate overflow-hidden">
        <Hero3D containerId="hero" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,15,0.78),rgba(5,6,15,0.3)_55%,transparent)] max-sm:bg-[rgba(5,6,15,0.55)]"
        />
        <div className="relative mx-auto flex min-h-[min(92vh,820px)] max-w-6xl flex-col justify-center px-5 pb-16 pt-14">
          <div className="max-w-2xl">
            <span className="eyebrow">Independent · Free plans first</span>
            <h1 className="mt-6 text-[clamp(2.6rem,7.2vw,5.2rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-white">
              Pick the AI tools that <span className="gradient-text">earn their place</span> in your work
            </h1>
            <p className="mt-6 max-w-xl text-lg text-soft md:text-xl">
              Clear reviews, honest comparisons and practical guides for freelancers, creators and small businesses. We tell you who
              each tool is for, and who should skip it.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/tools/" className="btn-primary">
                Explore the tools
              </Link>
              <Link href="/blog/" className="btn-ghost">
                Read the guides
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4">
              {[
                [String(TOOLS.length), "tools listed"],
                [String(ARTICLES.length), "guides & comparisons"],
                [String(CODES.length), "currencies"],
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
          Some links on this site are affiliate links. If you buy through them we may earn a commission at no extra cost to you.
          It never changes what we write.{" "}
          <Link href="/affiliate-disclosure/" className="text-soft underline">
            Read the disclosure
          </Link>
          .
        </p>

        <Reveal as="section" className="pt-20">
          <SectionHead
            eyebrow="Featured tools"
            title="Tools worth a closer look"
            lead="Each has a free plan or free tier we could confirm, plus an overview with pros, cons and who it suits."
            href="/tools/"
            cta="Browse all tools"
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
                  className="glass card-glow group relative flex flex-col gap-3 p-7 no-underline transition-transform hover:-translate-y-1"
                  style={{ ["--hue" as string]: 265 }}
                >
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <span className="rounded-full bg-electric/20 px-3 py-1 text-[#9cc2ff]">{c.leftLabel}</span>
                    <span className="text-muted">vs</span>
                    <span className="rounded-full bg-violet/20 px-3 py-1 text-[#cbb8ff]">{c.rightLabel}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold leading-snug tracking-tight text-white">{a.title}</h3>
                  <p className="text-muted">{a.blurb}</p>
                  <span className="mt-2 text-sm font-bold text-soft group-hover:text-white">See the comparison →</span>
                </Link>
              );
            })}
          </div>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Trending topics" title="Start with what you need" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((t) => (
              <li key={t.id}>
                <Link href={`/blog/?topic=${t.id}`} className="glass group flex h-full items-center justify-between gap-4 rounded-2xl p-5 no-underline transition-colors hover:bg-white/10">
                  <span>
                    <span className="block text-lg font-bold text-white">{t.label}</span>
                    <span className="block text-sm text-muted">{t.blurb}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-soft">{articlesInTopic(t.id).length} guides</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead eyebrow="Latest guides" title="Practical, plain-English reading" href="/blog/" cta="All guides" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-3">
              <ArticleCard a={latest[0]} featured />
            </div>
            {latest.slice(1).map((a) => (
              <ArticleCard key={a.slug} a={a} />
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <SectionHead
            eyebrow="AI news"
            title="What just happened in AI"
            lead="Short summaries with the publication date and a link to the original source."
            href="/news/"
            cta="More news"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {NEWS.slice(0, 3).map((n) => (
              <NewsCard key={n.url} n={n} compact />
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="pt-24">
          <div className="glass relative overflow-hidden rounded-[30px] p-8 md:p-12">
            <div className="orb -right-10 -top-10 h-56 w-56 bg-violet" />
            <div className="relative grid gap-10 md:grid-cols-[1.1fr_1fr]">
              <div>
                <span className="eyebrow">How we work</span>
                <h2 className="section-title mt-3 text-white">No made-up numbers, ever</h2>
                <p className="mt-4 text-soft">
                  We do not invent prices, reviews, ratings or affiliate links. If we could not verify a price on the official page,
                  we say so instead of guessing.
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
                  <li key={t} className="rounded-2xl border border-white/10 bg-black/20 p-5">
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
          itemListElement: featured.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: t.name,
            url: absUrl(`/reviews/${t.review}/`),
          })),
        }}
      />
    </>
  );
}
