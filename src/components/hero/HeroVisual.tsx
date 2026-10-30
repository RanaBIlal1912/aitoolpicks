"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { getTool } from "@/data/tools";
import { constellation } from "@/lib/constellation";
import ToolLogo from "../ToolLogo";
import { whenEngaged } from "@/lib/engage";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

// Real product logos that drift around the network. They link nothing and carry no claim; they only show the kind of products the directory covers.
const FLOATERS: { id: string; pos: string; delay: string }[] = [
  { id: "claude", pos: "right-[30%] top-[14%]", delay: "0s" },
  { id: "runway", pos: "right-[6%] top-[24%]", delay: "-2s" },
  { id: "elevenlabs", pos: "right-[40%] bottom-[18%]", delay: "-4s" },
  { id: "cursor", pos: "right-[10%] bottom-[14%]", delay: "-1s" },
  { id: "midjourney", pos: "right-[22%] top-[2%]", delay: "-3s" },
];

/** The same constellation as the WebGL scene, drawn once as plain SVG so the hero is already composed at first paint. */
function StaticNetwork() {
  const { nodes, edges } = useMemo(() => constellation(60), []);
  const px = (n: { x: number }) => 66 + n.x * 7.2;
  const py = (n: { y: number }) => 50 + n.y * 8.4;
  return (
    <svg className="hero-net absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g stroke="rgba(141,123,255,.28)" strokeWidth=".12">
        {edges.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={px(nodes[a])} y1={py(nodes[a])} x2={px(nodes[b])} y2={py(nodes[b])} />
        ))}
      </g>
      {nodes.map((n, i) => (
        <circle key={i} cx={px(n)} cy={py(n)} r={n.size * 5.5} fill={n.color} opacity={0.9} />
      ))}
      <circle cx="66" cy="50" r="7" fill="rgba(117,75,255,.55)" />
      <circle cx="66" cy="50" r="13" fill="rgba(117,75,255,.12)" />
    </svg>
  );
}

/**
 * Full-bleed layer behind the home hero. The SVG network and the floating logos are plain markup and always shown; the WebGL network loads on screens
 * where it is allowed (not for reduced motion or data saving, and only after the visitor first interacts or ten seconds pass) and fades in over it.
 */
export default function HeroVisual() {
  const [webgl, setWebgl] = useState(false);
  const [lite, setLite] = useState(false);
  useEffect(() => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (calm || saver) return;
    let canvas = false;
    try {
      const c = document.createElement("canvas");
      canvas = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      canvas = false;
    }
    if (!canvas) return;
    setLite(!matchMedia("(min-width: 768px)").matches);
    return whenEngaged(() => setWebgl(true), 10000);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="hero-orb absolute right-[-6%] top-[8%] h-[80%] w-[62%] rounded-full" />
      <div className={`absolute inset-0 transition-opacity duration-700 ${webgl ? "opacity-0" : "opacity-100"}`}>
        <StaticNetwork />
      </div>
      {webgl && (
        <div className="hero-canvas pointer-events-auto absolute inset-0 touch-pan-y">
          <HeroScene lite={lite} />
        </div>
      )}
      <div className="absolute inset-0">
        {FLOATERS.slice(0, lite ? 3 : 5).map((f) => {
          const t = getTool(f.id);
          return t ? (
            <span key={f.id} className={`float-y absolute ${f.pos} hidden rounded-2xl shadow-xl shadow-black/40 ring-1 ring-white/20 sm:block`} style={{ animationDelay: f.delay }}>
              <ToolLogo id={t.id} name={t.name} hue={t.hue} size={52} />
            </span>
          ) : null;
        })}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#090B18] to-transparent" />
    </div>
  );
}
