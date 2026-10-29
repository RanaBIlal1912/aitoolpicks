"use client";

import Link from "next/link";
import { PRICING_MODEL_LABEL, getCategory, type Tool } from "@/data/tools";
import AffLink from "./AffLink";

const STATUS = {
  verified: { label: "Pricing verified", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" },
  partial: { label: "Pricing partly verified", cls: "border-amber/30 bg-amber/10 text-amber" },
  unverified: { label: "Pricing not verified", cls: "border-white/20 bg-white/5 text-muted" },
} as const;

const OPEN_LABEL = { "open-source": "Open source", "source-available": "Source-available", "open-weights": "Open weights", proprietary: "Proprietary" } as const;

export function Monogram({ name, hue, size = 48 }: { name: string; hue: number; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-2xl font-extrabold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(145deg, hsl(${hue} 38% 40%), hsl(${(hue + 30) % 360} 34% 26%))`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)" }}
    >
      {name.charAt(0)}
    </span>
  );
}

export default function ToolCard({
  tool,
  selected,
  onToggleCompare,
  disableCompare = false,
}: {
  tool: Tool;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
  disableCompare?: boolean;
}) {
  const cat = getCategory(tool.category);
  const sub = cat?.subs.find((s) => s.slug === tool.subcategory);
  const st = STATUS[tool.pricingStatus];
  const free = tool.freePlan === true ? "Free plan" : tool.freePlan === false ? "No free plan" : "Not stated";
  return (
    <article className="glass card-glow flex h-full flex-col p-6 transition-transform duration-300 hover:-translate-y-0.5" style={{ ["--hue" as string]: tool.hue }}>
      <div className="flex items-start gap-4">
        <Monogram name={tool.name} hue={tool.hue} />
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-tight tracking-tight text-white">
            <Link href={`/tools/${tool.id}/`} className="no-underline hover:underline">
              {tool.name}
            </Link>
          </h3>
          <p className="text-sm text-muted">{tool.vendor}</p>
        </div>
      </div>

      <p className="mt-4 text-[0.97rem] text-soft">{tool.tagline}</p>
      {tool.keyFeature && <p className="mt-2 text-sm text-muted">Key capability: {tool.keyFeature}</p>}

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        {cat && <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-soft">{sub ? `${cat.short} · ${sub.label}` : cat.short}</span>}
        <span className={`rounded-full border px-2.5 py-1 ${st.cls}`}>{st.label}</span>
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-soft">{PRICING_MODEL_LABEL[tool.pricingModel]}</span>
        {tool.trial && <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-soft">Free trial</span>}
        {tool.openSource && tool.openSource !== "proprietary" && (
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-soft">{OPEN_LABEL[tool.openSource]}</span>
        )}
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

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
        <Link href={`/tools/${tool.id}/`} className="btn-primary btn-sm">
          Details &amp; pricing
          <span className="sr-only"> for {tool.name}</span>
        </Link>
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
    </article>
  );
}
