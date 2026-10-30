"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * A glass card that tilts a few degrees toward the mouse and shows a soft light that follows it. Mouse only; touch and pen devices and
 * visitors who prefer reduced motion get a static card. Plain CSS transforms, no animation library.
 */
export default function TiltCard({ children, hue = 250, className = "", max = 8 }: { children: ReactNode; hue?: number; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useRef<boolean | null>(null);

  function move(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    if (reduced.current === null) reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    el.style.transform = `perspective(1000px) rotateX(${((0.5 - y) * 2 * max).toFixed(2)}deg) rotateY(${((x - 0.5) * 2 * max * 1.2).toFixed(2)}deg)`;
  }
  function leave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} style={{ ["--hue" as string]: hue }} className={`glass card-glow tilt ${className}`}>
      {children}
    </div>
  );
}
