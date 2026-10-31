import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { COMPARISONS } from "@/data/compare";
import { ARTICLES } from "@/data/articles";
import PageHeader from "@/components/PageHeader";
import CompareMatrix from "@/components/CompareMatrix";
import Reveal from "@/components/Reveal";
import { VersusTiles } from "@/components/home/Sections";

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
        variant="lab"
        stats={[[String(COMPARISONS.length), "full comparisons"], ["2", "tools side by side"], ["0", "invented scores"]]}
        eyebrow="Compare"
        title={
          <>
            Two tools, <span className="gradient-text">one clear answer</span>
          </>
        }
        lead="Read a full comparison, or pick any two tools below and see them side by side."
        crumbs={[{ name: "Compare", href: "/compare/" }]}
      />
      <div className="mx-auto max-w-7xl px-5">
        <Reveal as="section">
          <h2 className="section-title mb-6 text-white">Compare any two tools</h2>
          <CompareMatrix />
        </Reveal>

        <Reveal as="section" className="pt-20">
          <h2 className="section-title mb-6 text-white">In-depth comparisons</h2>
          <VersusTiles />
        </Reveal>
      </div>
    </>
  );
}
