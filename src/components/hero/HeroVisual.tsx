"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getTool } from "@/data/tools";
import ToolLogo from "../ToolLogo";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

const FLOATERS: { id: string; pos: string; delay: string }[] = [
  { id: "claude", pos: "left-[6%] top-[10%]", delay: "0s" },
  { id: "runway", pos: "right-[4%] top-[18%]", delay: "-2s" },
  { id: "elevenlabs", pos: "left-[0%] bottom-[24%]", delay: "-4s" },
  { id: "cursor", pos: "right-[10%] bottom-[10%]", delay: "-1s" },
  { id: "midjourney", pos: "left-[40%] top-[0%]", delay: "-3s" },
];

/**
 * The visual on the right of the home hero. Everything here is decoration. The orb and floating logos are plain CSS and always shown; the WebGL
 * network loads only on screens at least 768px wide, when the visitor has not asked for reduced motion or data saving, after the page is idle.
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
    const phone = !matchMedia("(min-width: 768px)").matches;
    setLite(phone);
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setWebgl(true);
    };
    const cleanups: (() => void)[] = [];
    if (phone) {
      // On a phone the scene starts on the first touch or scroll, or after 6 seconds, so it never competes with the first paint.
      for (const ev of ["touchstart", "scroll", "pointerdown"] as const) {
        window.addEventListener(ev, start, { once: true, passive: true });
        cleanups.push(() => window.removeEventListener(ev, start));
      }
      const t = window.setTimeout(start, 6000);
      cleanups.push(() => clearTimeout(t));
    } else {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      const cic = (window as unknown as { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback;
      const id = ric ? ric(start, { timeout: 2500 }) : window.setTimeout(start, 1500);
      cleanups.push(() => (ric && cic ? cic(id) : clearTimeout(id)));
    }
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[640px] md:aspect-square md:max-w-[600px]" aria-hidden="true">
      <div className="hero-orb absolute inset-[16%] rounded-full" />
      {webgl && (
        <div className="absolute inset-0">
          <HeroScene lite={lite} />
        </div>
      )}
      {FLOATERS.slice(0, lite ? 3 : 5).map((f) => {
        const t = getTool(f.id);
        return t ? (
          <span key={f.id} className={`float-y absolute ${f.pos} rounded-2xl shadow-xl shadow-black/40 ring-1 ring-white/20`} style={{ animationDelay: f.delay }}>
            <ToolLogo id={t.id} name={t.name} hue={t.hue} size={lite ? 44 : 56} />
          </span>
        ) : null;
      })}
    </div>
  );
}
