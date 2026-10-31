import Link from "next/link";
import { PRICING_MODEL_LABEL, getCategory, type Tool } from "@/data/tools";
import { catColors } from "@/data/palette";
import ToolLogo from "./ToolLogo";

const STATUS = { verified: "Pricing verified", partial: "Pricing partly verified", unverified: "Pricing not verified" } as const;

/** A tool as a static, colourful tile for the home page. No client JavaScript; the whole tile is one link. */
export default function ToolTile({ tool, note }: { tool: Tool; note?: string }) {
  const [a, b] = catColors(tool.category);
  const cat = getCategory(tool.category);
  return (
    <article className="tile flex h-full flex-col gap-3 p-5">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${a}, ${b})` }} />
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl" style={{ background: a }} />
      <div className="flex items-center gap-3">
        <ToolLogo id={tool.id} name={tool.name} hue={tool.hue} size={48} />
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight text-white">
            <Link prefetch={false} href={`/tools/${tool.id}/`} className="tile-link no-underline">
              {tool.name}
              <span className="sr-only">: details and pricing</span>
            </Link>
          </h3>
          <p className="truncate text-sm text-muted">{tool.vendor}</p>
        </div>
      </div>
      <p className="line-clamp-2 text-[0.95rem] text-soft">{tool.tagline}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs font-semibold">
        {cat && (
          <span className="rounded-full border px-2.5 py-1 text-white" style={{ background: `${a}26`, borderColor: `${a}80` }}>
            {cat.short}
          </span>
        )}
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-soft">{PRICING_MODEL_LABEL[tool.pricingModel]}</span>
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-soft">{STATUS[tool.pricingStatus]}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{note ?? ""}</span>
        <span aria-hidden="true" className="font-bold text-white">
          Explore →
        </span>
      </div>
    </article>
  );
}
