"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type SceneLogo = { id: string; src: string; tile: "light" | "dark" };

/**
 * One product tile as a picture (rounded square with the logo on it), drawn here because the worker has no DOM to decode SVG or PNG files with.
 * The picture is drawn upside down on purpose: image bitmaps cannot be flipped by WebGL, so the flip is done once here.
 */
async function tileBitmap(l: SceneLogo) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  // A CPU-backed canvas: turning an accelerated canvas into a bitmap makes the main thread wait for the graphics process.
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.translate(0, 256);
  g.scale(1, -1);
  g.fillStyle = l.tile === "light" ? "#f4f6fc" : "#10131f";
  g.beginPath();
  g.roundRect(6, 6, 244, 244, 58);
  g.fill();
  try {
    const img = new Image();
    img.src = l.src;
    await img.decode();
    const pad = 54;
    const r = Math.min((256 - pad * 2) / img.width, (256 - pad * 2) / img.height);
    g.drawImage(img, (256 - img.width * r) / 2, (256 - img.height * r) / 2, img.width * r, img.height * r);
  } catch {
    /* a tile without its logo still looks fine */
  }
  return createImageBitmap(c);
}

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
 * The hero artwork. The SVG robot is there at once. A real 3D robot (WebGL, built from geometry) is drawn by a web worker, so none of the scene
 * building or drawing runs on the main thread of the page; it starts about 2.7 s after load or on the first interaction, and fades in over the SVG.
 * Reduced motion, data saving, no worker or OffscreenCanvas support, no WebGL, or a software-only renderer all keep the flat robot.
 */
export default function RobotHero({ tiles, stat, logos }: { tiles: ReactNode; stat: ReactNode; logos: SceneLogo[] }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [gl, setGl] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const can = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && "transferControlToOffscreen" in HTMLCanvasElement.prototype;
    if (calm || saver || !can) return;
    // The flat robot is already on screen. The 3D one starts about 2.7 s after the page has loaded (once the browser is idle), or on the first
    // interaction (move, touch, key, scroll), whichever comes first, so first paint and early input never compete with start-up.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const events = ["pointermove", "pointerdown", "touchstart", "keydown", "wheel", "scroll"] as const;
    let t = 0;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, onInput));
      window.removeEventListener("load", go);
      if (idle) idle(() => setGl(true), { timeout: 600 });
      else setGl(true);
    };
    const onInput = () => start();
    const go = () => {
      t = window.setTimeout(start, 2700);
    };
    events.forEach((e) => window.addEventListener(e, onInput, { passive: true, once: true }));
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      started = true;
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, onInput));
      window.removeEventListener("load", go);
    };
  }, []);

  // Hand the canvas to the worker and keep it told about size, pointer and visibility.
  useEffect(() => {
    const canvas = cv.current;
    if (!gl || !canvas) return;
    let dead = false;
    let worker: Worker | null = null;
    const cleanups: (() => void)[] = [];
    (async () => {
      const bitmaps = await Promise.all(logos.map(tileBitmap));
      if (dead) return;
      const off = canvas.transferControlToOffscreen();
      const wk = new Worker(new URL("../hero/robot.worker.ts", import.meta.url), { type: "module" });
      worker = wk;
      wk.onmessage = (e: MessageEvent<{ type: string }>) => {
        if (e.data.type === "ready") setReady(true);
        else if (e.data.type === "unsupported") {
          wk.terminate();
          setGl(false);
        }
      };
      wk.onerror = () => {
        wk.terminate();
        setGl(false);
      };
      const r = canvas.getBoundingClientRect();
      const lite = !matchMedia("(min-width: 768px)").matches;
      const forced = /[?&]robot=3d/.test(location.search);
      wk.postMessage({ type: "init", canvas: off, w: Math.round(r.width), h: Math.round(r.height), dpr: window.devicePixelRatio || 1, lite, forced, logos: logos.map((l, i) => ({ id: l.id, bitmap: bitmaps[i] })) }, [off, ...bitmaps]);

      const ro = new ResizeObserver(() => {
        const b = canvas.getBoundingClientRect();
        wk.postMessage({ type: "size", w: Math.round(b.width), h: Math.round(b.height), dpr: window.devicePixelRatio || 1 });
      });
      ro.observe(canvas);
      cleanups.push(() => ro.disconnect());

      let visible = true;
      const sendActive = () => wk.postMessage({ type: "active", on: visible && !document.hidden });
      const io = new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        sendActive();
      });
      io.observe(box.current ?? canvas);
      document.addEventListener("visibilitychange", sendActive);
      cleanups.push(() => {
        io.disconnect();
        document.removeEventListener("visibilitychange", sendActive);
      });

      let pending = false;
      let px = 0;
      let py = 0;
      const move = (ev: PointerEvent) => {
        px = (ev.clientX / window.innerWidth) * 2 - 1;
        py = -((ev.clientY / window.innerHeight) * 2 - 1);
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          wk.postMessage({ type: "pointer", x: px, y: py });
        });
      };
      window.addEventListener("pointermove", move, { passive: true });
      cleanups.push(() => window.removeEventListener("pointermove", move));
    })();
    return () => {
      dead = true;
      cleanups.forEach((f) => f());
      worker?.terminate();
    };
  }, [gl, logos]);

  return (
    <div ref={box} className="relative mx-auto aspect-[1/1.02] w-full max-w-[560px]">
      <span aria-hidden="true" className="orb absolute left-1/2 top-[52%] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60" />
      <div className={`absolute inset-[4%] transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>
        <RobotSvg />
      </div>
      {gl && (
        <div className="hero-canvas pointer-events-none absolute -bottom-[14%] -left-[26%] -top-[14%] right-0 max-md:-bottom-[8%] max-md:-left-[5%] max-md:-top-[8%]" aria-hidden="true">
          <canvas ref={cv} className="block h-full w-full" />
        </div>
      )}
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>{tiles}</div>
      {stat}
    </div>
  );
}
