import Link from "next/link";
import type { Alternative } from "@/lib/alternatives";
import ToolLogo from "./ToolLogo";

/** Alternatives with the reasons they were picked and the differences we can state from the records. */
export default function AlternativeList({ baseId, baseName, items }: { baseId: string; baseName: string; items: Alternative[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {items.map((a) => (
        <li key={a.tool.id} className="glass flex min-w-0 flex-col gap-3 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <ToolLogo id={a.tool.id} name={a.tool.name} hue={a.tool.hue} size={44} />
            <div className="min-w-0">
              <Link href={`/tools/${a.tool.id}/`} className="font-bold text-white no-underline hover:underline">
                {a.tool.name}
              </Link>
              <p className="truncate text-sm text-muted">{a.tool.tagline}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Why it is relevant</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-soft">
              {a.reasons.slice(0, 3).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          {a.differences.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Differences from {baseName}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted">
                {a.differences.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Link href={`/compare/?ids=${baseId},${a.tool.id}`} className="chip">
              Compare with {baseName}
            </Link>
            <Link href={`/tools/${a.tool.id}/`} className="chip">
              Details
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
