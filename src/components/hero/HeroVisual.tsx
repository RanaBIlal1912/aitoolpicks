"use client";

import { useMemo } from "react";
import { getTool } from "@/data/tools";
import { constellation } from "@/lib/constellation";
import ToolLogo from "../ToolLogo";

// Real product logos that drift around the network. They link nothing and carry no claim; they only show the kind of products the directory covers.
const FLOATERS: { id: string; pos: string; delay: string }[] = [
  { id: "claude", pos: "right-[30%] top-[14%]", delay: "0s" },
  { id: "runway", pos: "right-[6%] top-[24%]", delay: "-2s" },
  { id: "elevenlabs", pos: "right-[40%] bottom-[18%]", delay: "-4s" },
  { id: "cursor", pos: "right-[10%] bottom-[14%]", delay: "-1s" },
  { id: "midjourney", pos: "right-[22%] top-[2%]", delay: "-3s" },
];

/** The same constellation as the WebGL scene, drawn once as plain SVG so the hero is already composed at first paint. It is injected as markup, so React does not have to hydrate its ~200 elements. */
function StaticNetwork() {
  const html = useMemo(() => {
    const { nodes, edges } = constellation(60);
    const px = (n: { x: number }) => (66 + n.x * 7.2).toFixed(2);
    const py = (n: { y: number }) => (50 + n.y * 8.4).toFixed(2);
    const lines = edges.map(([a, b]) => `<line x1="${px(nodes[a])}" y1="${py(nodes[a])}" x2="${px(nodes[b])}" y2="${py(nodes[b])}"/>`).join("");
    const dots = nodes.map((n) => `<circle cx="${px(n)}" cy="${py(n)}" r="${(n.size * 5.5).toFixed(2)}" fill="${n.color}" opacity=".9"/>`).join("");
    return `<g stroke="rgba(141,123,255,.28)" stroke-width=".12">${lines}</g>${dots}<circle cx="66" cy="50" r="7" fill="rgba(117,75,255,.55)"/><circle cx="66" cy="50" r="13" fill="rgba(117,75,255,.12)"/>`;
  }, []);
  return <svg className="hero-net absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Full-bleed layer behind the home hero. It is plain markup only (the SVG network and the floating logos), so it costs no JavaScript to draw.
 * The real 3D robot is separate: see RobotHero, which draws it in a web worker on top of the hero artwork.
 */
export default function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="hero-orb absolute right-[-6%] top-[8%] h-[80%] w-[62%] rounded-full" />
      <div className="absolute inset-0">
        <StaticNetwork />
      </div>
      <div className="absolute inset-0">
        {FLOATERS.map((f) => {
          const t = getTool(f.id);
          return t ? (
            <span key={f.id} className={`float-y absolute ${f.pos} hidden rounded-2xl shadow-xl shadow-black/40 ring-1 ring-white/20 sm:block lg:hidden`} style={{ animationDelay: f.delay }}>
              <ToolLogo id={t.id} name={t.name} hue={t.hue} size={52} />
            </span>
          ) : null;
        })}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#090B18] to-transparent" />
    </div>
  );
}
