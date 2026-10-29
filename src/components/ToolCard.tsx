"use client";

import Link from "next/link";
import type { Tool } from "@/data/tools";
import { PRICES } from "@/lib/prices";
import TiltCard from "./TiltCard";
import AffLink from "./AffLink";
import PriceTag from "./PriceTag";

export default function ToolCard({ tool, showPrice = true }: { tool: Tool; showPrice?: boolean }) {
  const hasPrice = showPrice && !!PRICES[tool.id];
  return (
    <TiltCard hue={tool.hue} className="flex h-full flex-col p-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-extrabold text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, hsl(${tool.hue} 85% 55%), hsl(${(tool.hue + 50) % 360} 80% 45%))` }}
        >
          {tool.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-tight tracking-tight text-white">{tool.name}</h3>
          <p className="text-sm text-muted">{tool.tagline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-soft">{tool.category}</span>
        {tool.freePlan && (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">Free plan</span>
        )}
        {tool.review && (
          <span className="rounded-full border border-violet/40 bg-violet/15 px-2.5 py-1 text-violet-200">Reviewed</span>
        )}
      </div>

      <p className="mt-4 text-[0.97rem] text-soft">{tool.description}</p>
      <p className="mt-2 text-sm text-muted">
        <span className="font-semibold text-soft">Best for:</span> {tool.bestFor}
      </p>

      {hasPrice && (
        <div className="mt-4">
          <PriceTag id={tool.id} />
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
        <AffLink id={tool.id} />
        <Link href={`/tools/${tool.id}/`} className="btn-ghost btn-sm">
          Details
          <span className="sr-only"> about {tool.name}</span>
        </Link>
      </div>
    </TiltCard>
  );
}
