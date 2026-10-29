import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { REVIEWS } from "@/data/reviews";
import { getTool } from "@/data/tools";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export const metadata = pageMeta({
  title: "AI Tool Reviews: pros, cons and who each tool suits",
  description:
    "Plain-English overviews of ChatGPT, Grammarly, Notion, Canva and Hostinger with pros, cons, use cases and prices checked against official pages.",
  path: "/reviews/",
});

export default function ReviewsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reviews"
        title="Honest overviews, with the downsides included"
        lead="Each page covers what the tool does, who it suits, who should skip it and what it costs. Prices come from official pages."
        crumbs={[{ name: "Reviews", href: "/reviews/" }]}
      />
      <div className="mx-auto max-w-6xl px-5">
        <p className="glass rounded-2xl border-l-4 border-l-cyan px-5 py-3 text-sm text-muted">
          <strong className="text-soft">How we review:</strong> these are editorial overviews based on each product&rsquo;s own public
          documentation and widely known behaviour. We have not run lab tests, and we never present an overview as hands-on testing.
        </p>
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {REVIEWS.map((r, i) => {
            const t = getTool(r.toolId)!;
            return (
              <Reveal as="li" key={r.slug} delay={i * 0.05}>
                <Link
                  href={`/reviews/${r.slug}/`}
                  className="glass card-glow group flex h-full flex-col gap-3 p-7 no-underline transition-transform hover:-translate-y-1"
                  style={{ ["--hue" as string]: t.hue }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 place-items-center rounded-2xl font-extrabold text-white"
                      style={{ background: `linear-gradient(135deg, hsl(${t.hue} 85% 55%), hsl(${(t.hue + 50) % 360} 80% 45%))` }}
                    >
                      {t.name.charAt(0)}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-[0.12em] text-cyan">{t.category}</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold leading-snug tracking-tight text-white">{r.title}</h2>
                  <p className="text-muted">{r.summary}</p>
                  <span className="mt-auto pt-2 text-sm font-bold text-soft group-hover:text-white">Read the overview →</span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </>
  );
}
