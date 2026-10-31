"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { SceneLogo } from "../hero/RobotScene";

const RobotScene = dynamic(() => import("../hero/RobotScene"), { ssr: false });

/** Flat version of the robot, drawn as SVG so the hero is complete at first paint and stays if WebGL is unavailable. */
function RobotSvg() {
  return (
    <svg viewBox="0 0 400 420" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="rb-shell" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#b9c4f2" />
        </radialGradient>
        <linearGradient id="rb-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1250" />
          <stop offset="1" stopColor="#03051a" />
        </linearGradient>
        <linearGradient id="rb-purple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cff" />
          <stop offset="1" stopColor="#4b2fe0" />
        </linearGradient>
        <filter id="rb-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="200" cy="350" rx="170" ry="34" fill="none" stroke="#35e0ff" strokeWidth="3" filter="url(#rb-glow)" opacity=".9" />
      <rect x="150" y="230" width="100" height="108" rx="46" fill="url(#rb-shell)" />
      <rect x="172" y="258" width="56" height="52" rx="14" fill="url(#rb-purple)" stroke="#7ff0ff" strokeWidth="3" />
      <text x="200" y="293" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff" fontFamily="ui-sans-serif,system-ui,sans-serif">
        AI
      </text>
      <rect x="86" y="248" width="40" height="86" rx="20" fill="url(#rb-shell)" transform="rotate(14 106 248)" />
      <rect x="262" y="232" width="40" height="78" rx="20" fill="url(#rb-shell)" transform="rotate(-48 282 240)" />
      <circle cx="320" cy="190" r="17" fill="url(#rb-shell)" />
      <circle cx="334" cy="166" r="7" fill="#35e0ff" filter="url(#rb-glow)" />
      <ellipse cx="200" cy="140" rx="104" ry="92" fill="url(#rb-shell)" />
      <ellipse cx="200" cy="146" rx="82" ry="62" fill="url(#rb-visor)" />
      <path d="M154 140 q14 -22 28 0" fill="none" stroke="#35e0ff" strokeWidth="9" strokeLinecap="round" filter="url(#rb-glow)" />
      <path d="M218 140 q14 -22 28 0" fill="none" stroke="#35e0ff" strokeWidth="9" strokeLinecap="round" filter="url(#rb-glow)" />
      <path d="M184 168 q16 16 32 0" fill="none" stroke="#35e0ff" strokeWidth="7" strokeLinecap="round" filter="url(#rb-glow)" />
      <rect x="82" y="116" width="26" height="56" rx="13" fill="url(#rb-purple)" />
      <rect x="292" y="116" width="26" height="56" rx="13" fill="url(#rb-purple)" />
      <path d="M96 116 q104 -120 208 0" fill="none" stroke="#6b4bff" strokeWidth="8" strokeLinecap="round" />
      <circle cx="200" cy="40" r="8" fill="#ff5bd8" filter="url(#rb-glow)" />
      <path d="M200 48 v14" stroke="#aab4ff" strokeWidth="4" />
    </svg>
  );
}

/**
 * The hero artwork. The SVG robot is there at once; a real 3D robot (WebGL, built from geometry) fades in over it when the browser is idle,
 * only while the hero is on screen, and not for reduced motion or data saving.
 */
export default function RobotHero({ tiles, stat, logos }: { tiles: ReactNode; stat: ReactNode; logos: SceneLogo[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [gl, setGl] = useState(false);
  const [lite, setLite] = useState(false);
  const [inView, setInView] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let ok = false;
    let software = false;
    try {
      const c = document.createElement("canvas");
      const ctx = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
      ok = !!ctx;
      const info = ctx?.getExtension("WEBGL_debug_renderer_info");
      const name = info && ctx ? String(ctx.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
      software = /swiftshader|llvmpipe|software|basic render/i.test(name);
    } catch {
      ok = false;
    }
    // A machine that renders WebGL on the CPU cannot animate the robot smoothly (it would block the page for seconds), so it keeps the flat robot.
    // Adding ?robot=3d to the address forces the 3D version, which is how it is previewed in headless test browsers.
    const forced = /[?&]robot=3d/.test(location.search);
    if (calm || saver || !ok || (software && !forced)) return;
    setLite(!matchMedia("(min-width: 768px)").matches);
    // Start as soon as the page has loaded and the browser is idle, so the first paint is never delayed.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    let t = 0;
    const go = () => {
      t = window.setTimeout(() => (idle ? idle(() => setGl(true), { timeout: 1500 }) : setGl(true)), 300);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("load", go);
    };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="relative mx-auto aspect-[1/1.02] w-full max-w-[560px]">
      <span aria-hidden="true" className="orb absolute left-1/2 top-[52%] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60" />
      <div className={`absolute inset-[4%] transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>
        <RobotSvg />
      </div>
      {gl && inView !== undefined && (
        <div className="pointer-events-none absolute -inset-x-[30%] -inset-y-[16%] max-md:-inset-x-[8%]" aria-hidden="true">
          <RobotScene lite={lite} active={inView} logos={logos} onReady={() => setReady(true)} />
        </div>
      )}
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>{tiles}</div>
      {stat}
    </div>
  );
}
