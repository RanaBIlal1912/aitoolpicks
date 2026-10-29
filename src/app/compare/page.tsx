import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { COMPARISONS } from "@/data/compare";
import { ARTICLES } from "@/data/articles";
import PageHeader from "@/components/PageHeader";
import CompareMatrix from "@/components/CompareMatrix";
import Reveal from "@/components/Reveal";

export const metadata = pageMeta({
  title: "AI Tool Comparisons: ChatGPT vs Grammarly and more",
  description:
    "Side-by-side comparisons of AI and design tools, plus an interactive table to compare any two tools in our directory.",
  path: "/compare/",
});

export default function ComparePage() {
  return (
    <>
      <PageHeader
        eyebrow="Compare"
        title={
          <>
            Two tools, <span className="gradient-text">one clear answer</span>
          </>
        }
        lead="Read a full comparison, or pick any two tools below and see them side by side."
        crumbs={[{ name: "Compare", href: "/compare/" }]}
      />
      <div className="mx-auto max-w-6xl px-5">
        <Reveal as="section">
          <h2 className="section-title mb-6 text-white">Compare any two tools</h2>
          <CompareMatrix />
        </Reveal>

        <Reveal as="section" className="pt-20">
          <h2 className="section-title mb-6 text-white">In-depth comparisons</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {COMPARISONS.map((c) => {
              const a = ARTICLES.find((x) => x.slug === c.article)!;
              return (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}/`}
                  className="glass card-glow group flex flex-col gap-3 p-7 no-underline transition-transform hover:-translate-y-1"
                  style={{ ["--hue" as string]: 265 }}
                >
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <span className="rounded-full bg-electric/20 px-3 py-1 text-[#9cc2ff]">{c.leftLabel}</span>
                    <span className="text-muted">vs</span>
                    <span className="rounded-full bg-violet/20 px-3 py-1 text-[#cbb8ff]">{c.rightLabel}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold leading-snug text-white">{a.title}</h3>
                  <p className="text-muted">{a.blurb}</p>
                  <span className="mt-2 text-sm font-bold text-soft group-hover:text-white">Read the comparison →</span>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </div>
    </>
  );
}
