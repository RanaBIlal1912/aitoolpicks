import { getTool } from "@/data/tools";
import ToolLogo from "./ToolLogo";

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
    <div role="img" aria-label="Cover showing the logos of the tools in this guide (illustration)" className="relative grid h-full w-full place-items-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "radial-gradient(circle at 15% 10%, rgba(255,255,255,.5), transparent 40%), repeating-linear-gradient(135deg, rgba(255,255,255,.07) 0 2px, transparent 2px 24px)" }}
      />
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
