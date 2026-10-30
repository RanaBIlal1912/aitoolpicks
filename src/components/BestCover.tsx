import { getTool } from "@/data/tools";
import ToolLogo from "./ToolLogo";
import Photo from "./Photo";
import type { PhotoId } from "@/data/photos";

const PHOTO: Record<string, PhotoId> = {
  assistants: "data-presentation", coding: "circuit-macro", video: "light-dark-room", image: "architecture-ribs", audio: "cable-network", writing: "laptop-desk",
  productivity: "office-glass", research: "silicon-wafer", marketing: "data-presentation", automation: "fibre-switch", models: "datacenter-white", web: "server-aisle",
};

const PALETTE: Record<string, [string, string]> = {
  assistants: ["#2563eb", "#4338ca"],
  coding: ["#0ea5e9", "#1e293b"],
  video: ["#c026d3", "#9a3412"],
  image: ["#db2777", "#6d28d9"],
  audio: ["#ea580c", "#9f1239"],
  writing: ["#7c3aed", "#312e81"],
  productivity: ["#d97706", "#7c2d12"],
  research: ["#0d9488", "#166534"],
  marketing: ["#e11d48", "#7f1d1d"],
  automation: ["#16a34a", "#365314"],
  models: ["#475569", "#0f172a"],
  web: ["#0891b2", "#1d4ed8"],
};

/** Cover for a best-of page: a colour per category with the logos of the tools it recommends. Illustration only. */
export default function BestCover({ picks, hue }: { picks: string[]; hue: string }) {
  const [a, b] = PALETTE[hue] ?? PALETTE.assistants;
  const tools = picks.map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => !!t).slice(0, 5);
  return (
    <div role="img" aria-label="Cover showing the logos of the tools in this guide (stock photograph)" className="relative grid h-full w-full place-items-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
      <div className="absolute inset-0 mix-blend-multiply opacity-60">
        <Photo id={PHOTO[hue] ?? "circuit-blue"} decorative sizes="(min-width: 768px) 400px, 100vw" />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div className="relative flex max-w-full flex-wrap items-center justify-center gap-2 px-3">
        {tools.map((t) => (
          <span key={t.id} className="rounded-2xl shadow-lg shadow-black/30">
            <ToolLogo id={t.id} name={t.name} hue={t.hue} size={48} />
          </span>
        ))}
      </div>
    </div>
  );
}
