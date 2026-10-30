import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ROUNDUPS, getRoundup } from "@/data/roundups";
import { PRICING_MODEL_LABEL, getCategory, getTool } from "@/data/tools";
import { pageMeta } from "@/lib/meta";
import { SITE, absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import AffLink from "@/components/AffLink";
import BestCover from "@/components/BestCover";
import Reveal from "@/components/Reveal";
import ToolLogo from "@/components/ToolLogo";
import { formatChecked } from "@/lib/dates";
import JsonLd from "@/components/JsonLd";

export const dynamicParams = false;
export function generateStaticParams() {
  return ROUNDUPS.map((r) => ({ slug: r.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = getRoundup(slug);
  if (!r) return {};
  const m = pageMeta({ title: r.title, description: r.description, path: `/best/${slug}/`, type: "article", publishedTime: SITE.updated });
  const cover = getCategory(r.category)?.cover ?? "chip";
  return m;
}

export default async function RoundupPage({ params }: Props) {
  const { slug } = await params;
  const r = getRoundup(slug);
  if (!r) notFound();
  const cat = getCategory(r.category);
  const picks = r.picks.map((p) => ({ ...p, tool: getTool(p.id)! })).filter((p) => p.tool);

  return (
    <>
      <PageHeader
        eyebrow="Best-of guide"
        title={r.title}
        lead={r.description}
        crumbs={[
          { name: "Best-of guides", href: "/best/" },
          { name: r.title, href: `/best/${slug}/` },
        ]}
      >
        <p className="byline mt-4">
          By {SITE.name} editors · Prices checked {formatChecked(picks[0]?.tool.checked ?? SITE.updated)} · Grouped by fit, not ranked
        </p>
      </PageHeader>

      <div className="mx-auto max-w-5xl px-5">
        <div className="mb-8 aspect-[16/6] overflow-hidden rounded-[22px] border border-white/10">
          <BestCover picks={picks.map((p) => p.tool.id)} hue={cat?.slug ?? "assistants"} />
        </div>

        <p className="glass rounded-2xl border-l-4 border-l-amber px-5 py-3 text-sm text-muted">
          Some links may be affiliate links, and we may earn a commission at no cost to you. Buttons go to official sites unless an affiliate link is
          configured. Commissions never decide what we write.{" "}
          <Link href="/affiliate-disclosure/" className="text-soft underline">
            Disclosure
          </Link>
        </p>

        <div className="prose-article mt-8">
          {r.intro.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <h2 id="how-we-compared">How we compared</h2>
          <ul>
            {r.criteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p>
            Read how we verify prices on our <Link href="/methodology/">methodology page</Link>.
          </p>
        </div>

        <h2 className="section-title mb-6 mt-14 text-white" id="picks">
          The picks
        </h2>
        <ol className="space-y-6">
          {picks.map(({ tool, badge, why }, i) => (
            <Reveal as="li" key={tool.id} delay={0.03 * i}>
              <article className="glass rounded-[24px] p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-4">
                  <ToolLogo id={tool.id} name={tool.name} hue={tool.hue} size={52} />
                  <div className="min-w-0 flex-1">
                    <p className="kicker">{badge}</p>
                    <h3 className="text-2xl font-bold tracking-tight text-white">
                      <Link href={`/tools/${tool.id}/`} className="no-underline hover:underline">
                        {tool.name}
                      </Link>
                    </h3>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-soft">
                    {tool.pricingStatus === "verified" ? "Pricing verified" : tool.pricingStatus === "partial" ? "Pricing partly verified" : "Pricing not verified"}
                  </span>
                </div>
                <p className="mt-4 text-soft">{why}</p>
                {tool.plans.length > 0 && (
                  <dl className="mt-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                    {tool.plans.slice(0, 4).map((p) => (
                      <div key={p.name} className="flex justify-between gap-3 border-b border-white/5 py-1">
                        <dt className="text-muted">{p.name}</dt>
                        <dd className="text-right text-soft">{p.price}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p className="mt-3 text-xs text-muted">
                  {PRICING_MODEL_LABEL[tool.pricingModel]} · plan prices in the merchant&rsquo;s currency · checked {formatChecked(tool.checked)}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/tools/${tool.id}/`} className="btn-primary btn-sm">
                    Full pricing and details
                  </Link>
                  <AffLink id={tool.id} className="btn-ghost btn-sm">
                    Visit site
                  </AffLink>
                </div>
              </article>
            </Reveal>
          ))}
        </ol>
        {r.note && <p className="mt-8 text-sm text-muted">{r.note}</p>}

        <div className="glass mt-12 rounded-[24px] p-6">
          <p className="font-bold text-white">Want to compare two or three of these side by side?</p>
          <Link href={`/compare/?ids=${picks.slice(0, 3).map((p) => p.tool.id).join(",")}`} className="btn-primary btn-sm mt-3">
            Compare {picks.slice(0, 3).map((p) => p.tool.name).join(", ")}
          </Link>
        </div>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: r.title,
          itemListElement: picks.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.tool.name, url: absUrl(`/tools/${p.tool.id}/`) })),
        }}
      />
    </>
  );
}
