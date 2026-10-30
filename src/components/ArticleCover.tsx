import type { ReactNode } from "react";
import { TOPICS, type TopicId } from "@/data/topics";
import { getTool } from "@/data/tools";
import ToolLogo from "./ToolLogo";

// Each topic has its own colour world, so a blog full of guides does not look like one repeated image. A cover shows the logos of the
// products the guide is about when there are any, otherwise a simple symbol for the topic. It is decoration, labelled as such to
// screen readers, and never presented as a screenshot.
const WORLD: Record<TopicId, { a: string; b: string; glyph: ReactNode }> = {
  freelancing: { a: "#d97706", b: "#7c2d12", glyph: <path d="M4 8h16v11H4zM9 8V5h6v3M4 13h16" /> },
  writing: { a: "#7c3aed", b: "#4338ca", glyph: <path d="M5 19l3.5-1 10-10a2 2 0 00-3-3l-10 10zM14 7l3 3" /> },
  design: { a: "#db2777", b: "#6d28d9", glyph: <path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2-.6-1.2.3-2.5 1.6-2.5H17a4 4 0 004-4A9 9 0 0012 3zM7.5 11h.01M10 7.5h.01M14 7.5h.01" /> },
  business: { a: "#0f766e", b: "#1e3a8a", glyph: <path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6" /> },
  websites: { a: "#2563eb", b: "#0e7490", glyph: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /> },
  students: { a: "#16a34a", b: "#365314", glyph: <path d="M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" /> },
  developers: { a: "#0ea5e9", b: "#1e293b", glyph: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /> },
  productivity: { a: "#ea580c", b: "#9f1239", glyph: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2" /> },
  imagevideo: { a: "#c026d3", b: "#ea580c", glyph: <path d="M3 5h18v14H3zM3 15l5-4 4 3 3-2 6 4M16 9h.01" /> },
  beginners: { a: "#0891b2", b: "#4f46e5", glyph: <path d="M3 11l18-8-8 18-2-8z" /> },
  research: { a: "#0d9488", b: "#1d4ed8", glyph: <path d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM16 16l5 5" /> },
  automation: { a: "#16a34a", b: "#0e7490", glyph: <path d="M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /> },
  marketing: { a: "#e11d48", b: "#c2410c", glyph: <path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM15 9a4 4 0 010 6M18 6a8 8 0 010 12" /> },
  security: { a: "#475569", b: "#4338ca", glyph: <path d="M12 3l8 3v6c0 4.500-3.200 7.800-8 9-4.800-1.200-8-4.500-8-9V6zM9 12l2.200 2.200L15.500 10" /> },
  comparisons: { a: "#7c3aed", b: "#db2777", glyph: <path d="M8 3L4 7l4 4M4 7h12M16 21l4-4-4-4M20 17H8" /> },
};

export default function ArticleCover({ topic, tools = [], small = false }: { topic: TopicId; tools?: string[]; small?: boolean }) {
  const w = WORLD[topic];
  const label = TOPICS.find((t) => t.id === topic)?.label ?? "Guide";
  const list = tools.map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => !!t).slice(0, 4);
  const size = small ? 40 : 60;
  return (
    <div
      role="img"
      aria-label={`${label} guide cover (illustration)`}
      className="relative grid h-full w-full place-items-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${w.a}, ${w.b})` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle at 85% 10%, rgba(255,255,255,.5), transparent 40%), repeating-linear-gradient(135deg, rgba(255,255,255,.07) 0 2px, transparent 2px 24px)",
        }}
      />
      <div className="relative flex items-center gap-2.5 px-4">
        {list.length > 0 ? (
          list.map((t) => (
            <span key={t.id} className="rounded-2xl shadow-lg shadow-black/30">
              <ToolLogo id={t.id} name={t.name} hue={t.hue} size={size} />
            </span>
          ))
        ) : (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {w.glyph}
          </svg>
        )}
      </div>
      {!small && <span className="absolute bottom-2 left-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/80">{label}</span>}
    </div>
  );
}
