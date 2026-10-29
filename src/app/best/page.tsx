import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { ROUNDUPS } from "@/data/roundups";
import { getCategory } from "@/data/tools";
import PageHeader from "@/components/PageHeader";
import Cover from "@/components/Cover";
import Reveal from "@/components/Reveal";

export const metadata = pageMeta({
  title: "Best AI tools by category: guides with real pricing",
  description: "Best-of guides for AI assistants, coding tools, video, image, audio and automation platforms, built from official pricing pages with verification dates.",
  path: "/best/",
});

export default function BestIndex() {
  return (
    <>
      <PageHeader
        eyebrow="Best-of guides"
        title={
          <>
            Best AI tools, <span className="gradient-text">with the prices to match</span>
          </>
        }
        lead="Each guide groups tools by who they suit and quotes plan prices exactly as the vendor publishes them. Where we could not verify a price, we say so."
        crumbs={[{ name: "Best-of guides", href: "/best/" }]}
      />
      <div className="mx-auto max-w-6xl px-5">
        <ul className="grid gap-6 md:grid-cols-2">
          {ROUNDUPS.map((r, i) => {
            const cat = getCategory(r.category);
            return (
              <Reveal as="li" key={r.slug} delay={0.04 * i}>
                <Link href={`/best/${r.slug}/`} className="glass card-glow group flex h-full flex-col overflow-hidden no-underline transition-transform hover:-translate-y-0.5" style={{ ["--hue" as string]: 220 }}>
                  <div className="cover-frame aspect-[16/7] !rounded-none !border-0">
                    <div className="h-full transition-transform duration-700 group-hover:scale-[1.04]">
                      <Cover id={cat?.cover ?? "chip"} />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <span className="kicker">{cat?.label}</span>
                    <h2 className="font-serif text-2xl font-bold leading-snug tracking-tight text-white">{r.title}</h2>
                    <p className="text-muted">{r.description}</p>
                    <span className="mt-auto pt-2 text-sm font-bold text-soft group-hover:text-white">{r.picks.length} picks →</span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </>
  );
}
