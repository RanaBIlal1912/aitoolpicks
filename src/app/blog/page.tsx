import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { ARTICLES, GUIDES, TOPICS } from "@/data/articles";
import { coverPath } from "@/data/covers";
import { absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import BlogList from "@/components/BlogList";
import ArticleCard from "@/components/ArticleCard";

const meta = pageMeta({
  title: "Blog: guides for freelancers, creators and small businesses",
  description:
    "Practical guides on freelancing, AI writing, design, websites and hosting, written in plain English for freelancers, students and small businesses.",
  path: "/blog/",
});
meta.openGraph = { ...meta.openGraph, images: [{ url: absUrl(coverPath("board", "og")), width: 1200, height: 630 }] };
export const metadata = meta;

export default function BlogPage() {
  const lead = GUIDES.find((g) => g.slug === "best-ai-writing-tools") ?? GUIDES[0];
  return (
    <>
      <PageHeader
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
        <BlogList articles={ARTICLES} topics={TOPICS.map((t) => ({ id: t.id, label: t.label }))} />
      </div>
    </>
  );
}
