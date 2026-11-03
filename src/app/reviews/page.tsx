import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { REVIEWS } from "@/data/reviews";
import { getCategory, getTool } from "@/data/tools";
import { METHOD_LABEL } from "@/lib/review-trust";
import ToolLogo from "@/components/ToolLogo";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export const metadata = pageMeta({
  title: "AI Tool Reviews: pros, cons and who each tool suits",
  description:
    "Documentation-based AI tool overviews with strengths, limitations, use cases, alternatives and prices checked against official pages. Not scored or tested hands-on.",
  path: "/reviews/",
});

export default function ReviewsPage() {
  return (
    <>
      <PageHeader variant="magazine"
        eyebrow="Reviews"
        title="Overviews that include the downsides"
        lead="Each page covers what the tool does, who it suits, who should skip it and what it costs. Prices come from official pages."
        crumbs={[{ name: "Reviews", href: "/reviews/" }]}
      />
      <div className="mx-auto max-w-7xl px-5">
        <p className="glass rounded-2xl border-l-4 border-l-cyan px-5 py-3 text-sm text-muted">
          <strong className="text-soft">How we review:</strong> {REVIEWS.filter((r) => r.method === "documentation").length} of {REVIEWS.length} pages are editorial research, written from each product&rsquo;s own public
          documentation. {REVIEWS.some((r) => r.method === "hands-on") ? `${REVIEWS.filter((r) => r.method === "hands-on").length} are hands-on tests, each with the tester, dates and evidence on its page.` : "None is a hands-on test yet."} We only use the hands-on label when a named person tested the product and the page shows who, when and how.
        </p>
        {(() => {
          const [first, ...others] = REVIEWS;
          const ft = getTool(first.toolId)!;
          return (
            <>
              <Reveal as="div" className="mt-8">
                <Link
                  href={`/reviews/${first.slug}/`}
                  className="group relative grid overflow-hidden rounded-[28px] border border-white/10 no-underline md:grid-cols-[1fr_1.2fr]"
                  style={{ background: `linear-gradient(135deg, hsl(${ft.hue} 60% 22% / .9), #0d1024 70%)` }}
                >
                  <div className="grid place-items-center p-10 md:p-14">
                    <div className="scale-[1.9]">
                      <ToolLogo id={ft.id} name={ft.name} hue={ft.hue} size={72} />
                    </div>
                  </div>
                  <div className="p-8 md:p-12">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan">{first.method === "hands-on" ? "Featured hands-on review" : "Featured overview"} · {getCategory(ft.category)?.short} · {METHOD_LABEL[first.method]}</p>
                    <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-white md:text-4xl">{first.title}</h2>
                    <p className="mt-4 text-soft">{first.summary}</p>
                    <span className="mt-6 inline-block text-sm font-bold text-soft group-hover:text-white">Read the overview →</span>
                  </div>
                </Link>
              </Reveal>
              <ol className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {others.map((r, i) => {
                  const t = getTool(r.toolId)!;
                  return (
                    <li key={r.slug} className="cv-auto">
                      <Link href={`/reviews/${r.slug}/`} className="group grid items-center gap-x-6 gap-y-2 py-6 no-underline md:grid-cols-[auto_auto_1fr_auto]">
                        <span aria-hidden="true" data-n={String(i + 2).padStart(2, "0")} className="idx font-display text-3xl font-extrabold text-white/15 md:w-14" />
                        <ToolLogo id={t.id} name={t.name} hue={t.hue} size={48} />
                        <span className="min-w-0">
                          <span className="block text-xs font-bold uppercase tracking-[0.14em] text-cyan">{getCategory(t.category)?.short} · {METHOD_LABEL[r.method]}</span>
                          <span className="mt-1 block font-serif text-xl font-bold leading-snug text-white md:text-2xl">{r.title}</span>
                          <span className="mt-1 line-clamp-2 block text-sm text-muted">{r.summary}</span>
                        </span>
                        <span aria-hidden="true" className="hidden text-2xl text-soft transition-transform group-hover:translate-x-1 md:block">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </>
          );
        })()}
      </div>
    </>
  );
}
