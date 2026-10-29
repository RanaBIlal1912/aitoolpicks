import { pageMeta } from "@/lib/meta";
import { ARTICLES, TOPICS } from "@/data/articles";
import PageHeader from "@/components/PageHeader";
import BlogList from "@/components/BlogList";

export const metadata = pageMeta({
  title: "Blog: guides for freelancers, creators and small businesses",
  description:
    "Practical guides on freelancing, AI writing, design, websites and hosting, written in plain English for freelancers, students and small businesses.",
  path: "/blog/",
});

export default function BlogPage() {
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
      <BlogList articles={ARTICLES} topics={TOPICS.map((t) => ({ id: t.id, label: t.label }))} />
    </>
  );
}
