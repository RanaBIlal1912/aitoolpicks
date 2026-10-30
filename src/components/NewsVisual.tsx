import type { ReactNode } from "react";
import type { NewsItem, NewsKind } from "@/data/news";
import { newsImage } from "@/data/newsImages";
import { getTool } from "@/data/tools";
import { withBase } from "@/lib/site";
import ToolLogo from "./ToolLogo";

// Every story gets its own visual. When the vendor published an announcement image we use it (with credit). Otherwise the visual is an
// illustration made for this site: a colour world per type of news, with the logos of the products involved. It is decoration, never a
// product screenshot, and the page says so in the alt text.
const WORLD: Record<NewsKind, { a: string; b: string; glyph: ReactNode }> = {
  "New product": { a: "#f59e0b", b: "#9a3412", glyph: <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" /> },
  "Feature update": { a: "#2563eb", b: "#0e7490", glyph: <path d="M12 4v16M4 12h16M6.5 6.5l11 11M17.5 6.5l-11 11" /> },
  "Model release": { a: "#7c3aed", b: "#be185d", glyph: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" /> },
  Research: { a: "#0d9488", b: "#166534", glyph: <path d="M9 3h6M10 3v6l-5.5 9.5A1.5 1.5 0 005.8 21h12.4a1.5 1.5 0 001.3-2.5L14 9V3M7.5 15h9" /> },
  "Policy update": { a: "#e11d48", b: "#7f1d1d", glyph: <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6zM9 12l2.2 2.2L15.5 10" /> },
  "Company announcement": { a: "#475569", b: "#312e81", glyph: <path d="M4 21V8l8-4 8 4v13M9 21v-6h6v6M8 10h2M14 10h2" /> },
  "Open standard": { a: "#65a30d", b: "#047857", glyph: <path d="M9.5 14.5l5-5M8 11l-2.2 2.2a3.2 3.2 0 004.5 4.5L12.5 15.5M16 13l2.2-2.2a3.2 3.2 0 00-4.5-4.5L11.5 8.5" /> },
};

export default function NewsVisual({ n, className = "", priority = false, sizes = "(min-width: 1024px) 40vw, 100vw", logos = 3, small = false }: { n: NewsItem; className?: string; priority?: boolean; sizes?: string; logos?: number; small?: boolean }) {
  const img = newsImage(n.slug);
  if (img) {
    return (
      <div className={`relative h-full w-full overflow-hidden bg-[#11152A] ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBase(img.src)}
          srcSet={`${withBase(img.srcSm)} 640w, ${withBase(img.src)} 1200w`}
          sizes={sizes}
          width={img.width}
          height={img.height}
          alt={img.alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
        {!small && <span className="absolute bottom-2 right-2 rounded bg-black/55 px-1.5 py-0.5 text-[0.65rem] font-medium text-white/85 backdrop-blur-sm">Image: {img.credit}</span>}
      </div>
    );
  }
  const w = WORLD[n.kind];
  const tools = (n.tools ?? []).map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => !!t).slice(0, logos);
  return (
    <div
      role="img"
      aria-label={`Illustration for ${n.kind.toLowerCase()} news, not an image from the source`}
      className={`relative grid h-full w-full place-items-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${w.a}, ${w.b})` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 15%, rgba(255,255,255,.45), transparent 38%), repeating-linear-gradient(135deg, rgba(255,255,255,.07) 0 2px, transparent 2px 22px)",
        }}
      />
      <div className="relative flex items-center gap-3">
        {tools.length > 0 ? (
          tools.map((t) => (
            <span key={t.id} className="rounded-2xl shadow-lg shadow-black/30">
              <ToolLogo id={t.id} name={t.name} hue={t.hue} size={small ? 40 : 64} />
            </span>
          ))
        ) : (
          <svg width={small ? 40 : 64} height={small ? 40 : 64} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.88)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {w.glyph}
          </svg>
        )}
      </div>
      {!small && <span className="absolute bottom-2 left-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/80">{n.kind}</span>}
    </div>
  );
}
