import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RECORDS, getRecord } from "@/lib/catalog";
import { CATEGORIES, PRICING_MODEL_LABEL, getCategory, getTool } from "@/data/tools";
import { articlesMentioning, getArticle } from "@/data/articles";
import { newsForTool } from "@/data/news";
import NewsCard, { formatDate } from "@/components/NewsCard";
import { COMPARISONS } from "@/data/compare";
import { REVIEWS } from "@/data/reviews";
import { pageMeta } from "@/lib/meta";
import { SITE, absUrl } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import AffLink from "@/components/AffLink";
import PricingTable from "@/components/PricingTable";
import { formatChecked } from "@/lib/dates";
import { logoFor } from "@/data/logos";
import ArticleCard from "@/components/ArticleCard";
import ToolLogo from "@/components/ToolLogo";
import ToolShot from "@/components/ToolShot";
import { catColors } from "@/data/palette";
import { slugify } from "@/data/companies";
import AlternativeList from "@/components/AlternativeList";
import { alternativesFor } from "@/lib/alternatives";
import FavoriteButton, { RecentTracker } from "@/components/FavoriteButton";
import Reveal from "@/components/Reveal";
import { AudienceGrid, Capabilities, FeatureCards, ProfileNotice, ProfileSection, ProfileSources, RelatedGrid, Scenarios, Steps } from "@/components/tool/Profile";
import { relatedFor } from "@/lib/related";
import PriceText from "@/components/PriceText";
import { format } from "@/lib/currency";
import JsonLd from "@/components/JsonLd";
import { VERIFICATION_CLASS, VERIFICATION_LABEL } from "@/lib/verification";

export const dynamicParams = false;
export function generateStaticParams() {
  return RECORDS.map((t) => ({ slug: t.id }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getRecord(slug);
  if (!t) return {};
  const m = pageMeta({
    title: `${t.name} pricing, plans and features`,
    // Some records open their description with the tagline; do not say it twice.
    description: t.description.startsWith(t.tagline) ? t.description : `${t.tagline}. ${t.description}`,
    path: `/tools/${slug}/`,
  });
  const cover = getCategory(t.category)?.cover ?? "chip";
  return m;
}

const OPEN_LABEL = { "open-source": "Open source", "source-available": "Source-available (not open source)", "open-weights": "Open weights", proprietary: "Proprietary" } as const;

function List({ title, items, tone }: { title: string; items: string[]; tone: "good" | "warn" | "plain" }) {
  const mark = tone === "good" ? "✓" : tone === "warn" ? "!" : "•";
  const color = tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber" : "text-muted";
  return (
    <div className="panel p-6">
      <h3 className={`text-lg font-bold ${tone === "plain" ? "text-white" : color}`}>{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((g) => (
          <li key={g} className="flex gap-3 text-soft">
            <span aria-hidden="true" className={`mt-0.5 ${color}`}>
              {mark}
            </span>
            {g}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const t = getRecord(slug);
  if (!t) notFound();
  const cat = getCategory(t.category);
  const review = REVIEWS.find((r) => r.toolId === t.id);
  const guides = articlesMentioning(t.id);
  const comparisons = COMPARISONS.filter((c) => c.leftTool === t.id || c.rightTool === t.id);
  const alts = alternativesFor(t.id, 4);
  // Related tools never repeat the tool itself or one of the alternatives shown above them.
  const relatedTools = relatedFor(t.id, alts.map((a) => a.tool.id), 4);
  const profile = t.profile;
  const accent = catColors(t.category);
  const logo = logoFor(t.id);
  const lowest = t.pricing.plans.filter((p) => typeof p.monthly === "number" && p.monthly > 0).sort((a, b) => (a.monthly as number) - (b.monthly as number))[0];
  const logoNote = logo ? (logo.status === "ok" ? undefined : `Logo: ${t.name}’s own site icon, shown at a small size.`) : "No verified logo yet, so a letter mark is shown.";
  const news = newsForTool(t.id).slice(0, 3);
  const sub = cat?.subs.find((s) => s.slug === t.subcategory);
  const related = [...comparisons.map((c) => c.article), ...guides.map((g) => g.slug)].filter((s, i, a) => a.indexOf(s) === i).slice(0, 4);

  return (
    <>
      <PageHeader
        accent={catColors(t.category)[0]}
        tint={catColors(t.category)}
        aside={
          <div className="relative grid h-[260px] w-[260px] place-items-center">
            <span className="absolute inset-0 rounded-full opacity-60 blur-3xl" style={{ background: catColors(t.category)[0] }} />
            <span className="absolute inset-6 rounded-full border border-white/15" />
            <span className="absolute inset-0 rounded-full border border-dashed border-white/10 spin-slow" />
            <span className="relative drop-shadow-2xl">
              <ToolLogo id={t.id} name={t.name} hue={t.hue} size={128} />
            </span>
          </div>
        }
        eyebrow={cat?.label ?? "Tool"}
        title={
          <span className="flex items-center gap-4">
            <ToolLogo id={t.id} name={t.name} hue={t.hue} size={56} alt={`${t.name} logo`} />
            {t.name}
          </span>
        }
        lead={
          <>
            <span className="block font-semibold text-white">{profile?.headline ?? t.tagline}</span>
            <span className="mt-2 block">{t.description}</span>
          </>
        }
        crumbs={[
          { name: "Tools", href: "/tools/" },
          { name: cat?.label ?? t.category, href: `/tools/category/${t.category}/` },
          { name: t.name, href: `/tools/${slug}/` },
        ]}
      >
        <RecentTracker id={t.id} />
        <ul className="mt-6 flex flex-wrap gap-2" aria-label={`${t.name} tags`}>
          <li>
            <Link href={`/tools/category/${t.category}/`} className="chip no-underline">
              {cat?.label}
            </Link>
          </li>
          {sub && <li className="chip">{sub.label}</li>}
          <li className="chip">{PRICING_MODEL_LABEL[t.pricing.model] ?? t.pricing.model}</li>
          {t.openSource && <li className="chip">{OPEN_LABEL[t.openSource.status]}</li>}
          {t.platforms?.slice(0, 3).map((p) => (
            <li key={p} className="chip">
              {p}
            </li>
          ))}
          <li className={`rounded-full border px-3 py-1.5 text-xs font-bold ${t.pricing.status === "verified" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-amber-400/40 bg-amber-400/10 text-amber-200"}`}>
            {t.pricing.status === "verified" ? "Pricing verified" : t.pricing.status === "partial" ? "Pricing partly verified" : "Pricing not verified"}
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <AffLink id={t.id} className="btn-primary" />
          <FavoriteButton id={t.id} name={t.name} label className="!py-2.5" />
          <a href={t.pricing.source} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            Official pricing page ↗
          </a>
          {review && (
            <Link href={`/reviews/${review.slug}/`} className="btn-ghost">
              Read our overview
            </Link>
          )}
        </div>
        <p className="byline mt-4">
          By {t.vendor} · Record verified {formatChecked(t.verified)} · Pricing checked {formatChecked(t.pricing.checked)}
        </p>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-5">
        <ul className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label={`${t.name} at a glance`}>
          {[
            ["Pricing model", PRICING_MODEL_LABEL[t.pricing.model] ?? t.pricing.model],
            ["Free plan", t.pricing.free ? (t.pricing.free.available ? "Available" : "None") : "Not stated"],
            ["Lowest listed paid plan", lowest ? <PriceText key="lowest" text={`${format(lowest.monthly as number, lowest.currency)}/mo`} /> : "No monthly price listed"],
            ["Pricing checked", formatChecked(t.pricing.checked)],
          ].map(([k, v]) => (
            <li key={k as string} className="panel card-lift p-5">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">{k}</p>
              <p className="mt-2 font-display text-xl font-extrabold leading-tight text-white">{v}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0 space-y-12">
            {!profile && <ProfileNotice name={t.name} />}

            <Reveal as="section">
              <ProfileSection id="what" eyebrow="What it does" title={`What can you do with ${t.name}?`}>
                {profile ? (
                  <Capabilities items={profile.capabilities} accent={accent[0]} />
                ) : (
                  <div className="glass rounded-[22px] p-6 text-soft">
                    <p>{t.description}</p>
                    <p className="mt-3 text-sm text-muted">Key feature: {t.features[0] ?? t.tagline}</p>
                  </div>
                )}
                <ToolShot id={t.id} name={t.name} className="mt-6 max-w-2xl" />
              </ProfileSection>
            </Reveal>

            <Reveal as="section">
              <ProfileSection id="features" eyebrow="Key features" title="What it includes">
                <FeatureCards cards={profile?.featureCards} plain={t.features} accent={accent} />
                {t.platforms && <p className="mt-4 text-sm text-muted">Platforms: {t.platforms.join(", ")}</p>}
                {t.integrations && <p className="mt-1 text-sm text-muted">Integrations: {t.integrations.join(", ")}</p>}
              </ProfileSection>
            </Reveal>

            <Reveal as="section">
              <ProfileSection id="audience" eyebrow="Who it is for" title={`Who is ${t.name} for?`}>
                <AudienceGrid items={profile?.audienceDetail} plain={t.audience} />
              </ProfileSection>
            </Reveal>

            <Reveal as="section">
              <ProfileSection id="use-cases" eyebrow="In practice" title="Real use cases">
                {profile ? <Scenarios items={profile.scenarios} /> : <List title="What people use it for" items={t.useCases} tone="plain" />}
              </ProfileSection>
            </Reveal>

            {profile && (
              <Reveal as="section">
                <ProfileSection id="how" eyebrow="How it works" title="Getting started">
                  <Steps items={profile.gettingStarted} />
                  <ProfileSources profile={profile} />
                </ProfileSection>
              </Reveal>
            )}

            <Reveal as="section">
              <h2 className="section-title mb-5 text-white" id="pricing">
                Plans and pricing
              </h2>
              <PricingTable pricing={t.pricing} name={t.name} />
            </Reveal>

            <Reveal as="section">
              <ProfileSection id="pros-cons" eyebrow="Honest view" title="Advantages and limitations" lead="From the vendor's own pages and our verification of them, not from user reviews.">
                <div className="grid gap-6 md:grid-cols-2">
                  <List title="Advantages" items={t.strengths} tone="good" />
                  <List title="Limitations and restrictions" items={t.limitations} tone="warn" />
                </div>
              </ProfileSection>
            </Reveal>

            {t.openSource && (
              <Reveal as="section">
                <h2 className="section-title text-white">Licence and openness</h2>
                <p className="glass mt-4 rounded-2xl p-5 text-soft">
                  <strong className="text-white">{OPEN_LABEL[t.openSource.status]}.</strong> {t.openSource.note}.{" "}
                  <a href={t.openSource.source} target="_blank" rel="noopener noreferrer" className="text-[#9db4d6] underline">
                    Source ↗
                  </a>
                </p>
              </Reveal>
            )}

            {alts.length > 0 && (
              <Reveal as="section">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="section-title text-white">Alternatives to {t.name}</h2>
                  <Link href={`/tools/${t.id}/alternatives/`} className="btn-ghost btn-sm">
                    All alternatives →
                  </Link>
                </div>
                <div className="mt-5">
                  <AlternativeList baseId={t.id} baseName={t.name} items={alts} />
                </div>
              </Reveal>
            )}

            {relatedTools.length > 0 && (
              <Reveal as="section">
                <ProfileSection id="related" eyebrow="Keep exploring" title="Related tools" lead={`Other tools from the same category or kind of work as ${t.name}, apart from the alternatives above.`}>
                  <RelatedGrid tools={relatedTools} />
                </ProfileSection>
              </Reveal>
            )}

            {news.length > 0 && (
              <Reveal as="section">
                <h2 className="section-title text-white">Recent news about {t.name}</h2>
                <ul className="mt-5 grid gap-6 md:grid-cols-2">
                  {news.map((n) => (
                    <li key={n.slug}>
                      <NewsCard n={n} variant="compact" />
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {related.length > 0 && (
              <Reveal as="section">
                <h2 className="section-title text-white">Guides that mention {t.name}</h2>
                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  {related.map((s) => {
                    const a = getArticle(s);
                    return a ? <ArticleCard key={a.slug} a={a} /> : null;
                  })}
                </div>
              </Reveal>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label={`${t.name} quick facts`}>
            <div className="panel flex items-center gap-4 p-5">
              <ToolLogo id={t.id} name={t.name} hue={t.hue} size={64} alt={`${t.name} logo`} />
              <div className="min-w-0">
                <p className="font-bold text-white">{t.name}</p>
                <a href={t.website} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-[#9db4d6] underline">
                  {t.website.replace(/^https:\/\//, "")} ↗
                </a>
              </div>
            </div>
            {logoNote && <p className="-mt-3 text-xs text-muted">{logoNote}</p>}
            <div className="panel p-6">
              <h2 className="kicker">Quick facts</h2>
              <dl className="mt-4 space-y-4 text-[0.97rem]">
                <div>
                  <dt className="text-muted">Vendor</dt>
                  <dd className="font-semibold text-white">
                    <Link href={`/ecosystem/companies/${slugify(t.vendor)}/`} className="no-underline hover:underline">
                      {t.vendor}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Category</dt>
                  <dd className="font-semibold text-white">
                    <Link href={`/tools/category/${t.category}/`} className="no-underline hover:underline">
                      {cat?.label}
                    </Link>
                  </dd>
                </div>
                {sub && (
                  <div>
                    <dt className="text-muted">Subcategory</dt>
                    <dd className="font-semibold text-white">{sub.label}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted">Pricing model</dt>
                  <dd className="font-semibold text-white">{PRICING_MODEL_LABEL[t.pricing.model]}</dd>
                </div>
                <div>
                  <dt className="text-muted">Free trial</dt>
                  <dd className="font-semibold text-white">{t.pricing.trial ? "Documented" : "Not stated"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Added to this directory</dt>
                  <dd className="font-semibold text-white">{formatDate(t.added)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Pricing status</dt>
                  <dd className="font-semibold text-white">
                    {t.pricing.status === "verified" ? "Verified" : t.pricing.status === "partial" ? "Partly verified" : "Not verified"}
                  </dd>
                </div>
              </dl>
              <h3 className="kicker mt-6">Browser verification</h3>
              <p className="mt-2 text-sm">
                <span className={`font-semibold ${VERIFICATION_CLASS[t.verification.status]}`}>{VERIFICATION_LABEL[t.verification.status]}</span>
                <span className="text-muted"> · checked {formatChecked(t.verification.checked)}</span>
              </p>
              <p className="mt-2 text-sm text-muted">{t.verification.notes}</p>
              <p className="mt-2 text-xs">
                <a href={t.verification.officialUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Official site ↗
                </a>
                {" · "}
                <a href={t.verification.pricingUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Pricing source ↗
                </a>
              </p>
              <h3 className="kicker mt-6">Sources</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {t.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#9db4d6] underline">
                      {s.label}
                    </a>
                    <span className="text-muted"> · checked {formatChecked(s.checked)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-muted">
                Some links may be affiliate links, and we may earn a commission at no cost to you. Buttons go to the official site unless an affiliate link
                is configured.{" "}
                <Link href="/affiliate-disclosure/" className="underline">
                  Disclosure
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: t.name,
          url: t.website,
          applicationCategory: cat?.label ?? t.category,
          description: t.description,
          dateModified: t.pricing.checked,
          mainEntityOfPage: absUrl(`/tools/${slug}/`),
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Tools", item: absUrl("/tools/") },
            { "@type": "ListItem", position: 2, name: cat?.label ?? "Category", item: absUrl(`/tools/category/${t.category}/`) },
            { "@type": "ListItem", position: 3, name: t.name, item: absUrl(`/tools/${slug}/`) },
          ],
        }}
      />
    </>
  );
}

// Referenced so category lookups stay type-checked when categories change.
void CATEGORIES;
