import Link from "next/link";
import { Suspense } from "react";
import { pageMeta } from "@/lib/meta";
import { ARTICLES, GUIDES, TOPICS } from "@/data/articles";
import { absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import BlogList from "@/components/BlogList";
import ArticleCard from "@/components/ArticleCard";

const meta = pageMeta({
  title: "Blog: practical guides to AI tools, work and getting started",
  description:
    "Practical, plain-English guides on AI writing, design, productivity, websites and hosting, plus how to choose and pay for AI tools.",
  path: "/blog/",
});
export const metadata = meta;

export default function BlogPage() {
  const lead = GUIDES.find((g) => g.slug === "best-ai-writing-tools") ?? GUIDES[0];
  return (
    <>
      <PageHeader variant="magazine"
        eyebrow="Blog"
        title={
          <>
            Guides that get you to <span className="gradient-text">the next step</span>
          </>
        }
        lead="Start with the topic you care about. Every guide says what to do first and what to skip."
        crumbs={[{ name: "Blog", href: "/blog/" }]}
      />
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="kicker mb-4">Featured guide</h2>
        <ArticleCard a={lead} featured />
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-muted">Browse by topic:</span>
          {TOPICS.map((t) => (
            <Link key={t.id} href={`/blog/topic/${t.id}/`} className="chip">
              {t.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-12">
        <Suspense>
        <BlogList topics={TOPICS.map((t) => ({ id: t.id, label: t.label }))} total={ARTICLES.length}>
          {ARTICLES.map((a) => (
            <li key={a.slug} className="cv-auto" data-topic={a.topic} data-text={`${a.title} ${a.blurb} ${a.cat}`.toLowerCase()}>
              <ArticleCard a={a} />
            </li>
          ))}
        </BlogList>
        </Suspense>
      </div>
    </>
  );
}
