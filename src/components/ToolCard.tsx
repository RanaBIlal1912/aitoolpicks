"use client";

import Link from "next/link";
import { PRICING_MODEL_LABEL, getCategory, type Tool } from "@/data/tools";
import { catColors } from "@/data/palette";
import AffLink from "./AffLink";
import TiltCard from "./TiltCard";
import ToolLogo from "./ToolLogo";
import FavoriteButton from "./FavoriteButton";

const STATUS = {
  verified: { label: "Pricing verified", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" },
  partial: { label: "Pricing partly verified", cls: "border-amber/30 bg-amber/10 text-amber" },
  unverified: { label: "Pricing not verified", cls: "border-white/20 bg-white/5 text-muted" },
} as const;

const OPEN_LABEL = { "open-source": "Open source", "source-available": "Source-available", "open-weights": "Open weights", proprietary: "Proprietary" } as const;

const PILL = "rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-soft";

/**
 * One tool in a list. The card tilts gently toward the mouse and a soft light follows it (the original behaviour, kept subtle and
 * switched off for reduced-motion and touch). The whole card opens the tool page through the stretched title link; the
 * "Visit site" and compare controls sit above it so they keep working.
 */
export default function ToolCard({
  tool,
  selected,
  onToggleCompare,
  disableCompare = false,
  reasons,
}: {
  tool: Tool;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
  disableCompare?: boolean;
  /** Why this tool matched a search, shown under the description. */
  reasons?: string[];
}) {
  const cat = getCategory(tool.category);
  const sub = cat?.subs.find((s) => s.slug === tool.subcategory);
  const st = STATUS[tool.pricingStatus];
  const [ca, cb] = catColors(tool.category);
  const free = tool.freePlan === true ? "Free plan" : tool.freePlan === false ? "No free plan" : "Not stated";
  return (
    <TiltCard hue={tool.hue} max={6} className="tool-card group flex h-full flex-col p-6">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${ca}, ${cb})` }} />
      <div className="flex items-start gap-4">
        <ToolLogo id={tool.id} name={tool.name} hue={tool.hue} size={48} />
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-tight tracking-tight text-white">
            <Link href={`/tools/${tool.id}/`} className="tool-card-link no-underline">
              {tool.name}
              <span className="sr-only">: details and pricing</span>
            </Link>
          </h3>
          <p className="truncate text-sm text-muted">{tool.vendor}</p>
        </div>
        <span className="relative z-10 ml-auto shrink-0">
          <FavoriteButton id={tool.id} name={tool.name} />
        </span>
      </div>

      <p className="mt-4 line-clamp-2 min-h-[3.2em] text-[0.97rem] text-soft">{tool.tagline}</p>
      {tool.keyFeature && <p className="mt-2 line-clamp-2 min-h-[2.8em] text-sm text-muted">{tool.keyFeature}</p>}
      {reasons && reasons.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl border border-cyan/20 bg-cyan/5 px-3 py-2 text-xs text-[#c3e3ea]" aria-label="Why this matched your search">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        {cat && (
          <span className="rounded-full border px-2.5 py-1 text-white" style={{ background: `${ca}26`, borderColor: `${ca}80` }}>
            {sub ? `${cat.short} · ${sub.label}` : cat.short}
          </span>
        )}
        <span className={`rounded-full border px-2.5 py-1 ${st.cls}`}>{st.label}</span>
        <span className={PILL}>{PRICING_MODEL_LABEL[tool.pricingModel]}</span>
        {tool.trial && <span className={PILL}>Free trial</span>}
        {tool.openSource && tool.openSource !== "proprietary" && <span className={PILL}>{OPEN_LABEL[tool.openSource]}</span>}
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Free access</dt>
          <dd className="text-right text-soft">{free}</dd>
        </div>
        {tool.plans.slice(0, 3).map((p) => (
          <div key={p.name} className="flex justify-between gap-3">
            <dt className="truncate text-muted">{p.name}</dt>
            <dd className="text-right text-soft">{p.price}</dd>
          </div>
        ))}
      </dl>
      {tool.plans.length > 3 && <p className="mt-1 text-xs text-muted">+ {tool.plans.length - 3} more plans on the tool page</p>}
      {tool.plans.length === 0 && <p className="mt-3 text-xs text-muted">Plans not captured. See the official pricing page.</p>}

      <div className="relative z-10 mt-auto flex flex-wrap items-center gap-3 pt-6">
        <span className="btn-primary btn-sm pointer-events-none" aria-hidden="true">
          Explore
        </span>
        <AffLink id={tool.id} className="btn-ghost btn-sm">
          Visit site
        </AffLink>
        {onToggleCompare && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-soft">
            <input
              type="checkbox"
              checked={!!selected}
              disabled={disableCompare && !selected}
              onChange={() => onToggleCompare(tool.id)}
              className="h-4 w-4 accent-[#7f95c9]"
            />
            Compare
            <span className="sr-only"> {tool.name}</span>
          </label>
        )}
      </div>
    </TiltCard>
  );
}
