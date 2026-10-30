"use client";

import { useEffect, useRef } from "react";

/** Thin reading-progress line under the header. One passive scroll listener, no animation library. */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.current?.style.setProperty("transform", `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div
      ref={bar}
      aria-hidden="true"
      style={{ transformOrigin: "0 50%", transform: "scaleX(0)" }}
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px] bg-gradient-to-r from-electric via-violet to-cyan"
    />
  );
}
