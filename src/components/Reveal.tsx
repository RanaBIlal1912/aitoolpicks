"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades and lifts content in as it scrolls into view, using a CSS transition and one IntersectionObserver. Content is visible without
 * JavaScript and when the visitor prefers reduced motion (see .reveal in globals.css).
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      el.dataset.shown = "true";
      return;
    }
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        fired = true;
        for (const e of entries) {
          // Also reveal anything already scrolled past (a reload mid-page or an anchor jump), so nothing stays hidden.
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            (e.target as HTMLElement).dataset.shown = "true";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    // An observer always reports once on observe(). If it stays silent (a page that is not being rendered), show the content rather than leave it hidden.
    const safety = setTimeout(() => {
      if (!fired) el.dataset.shown = "true";
    }, 1500);
    return () => {
      clearTimeout(safety);
      io.disconnect();
    };
  }, []);
  const Tag = as as "div";
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} data-reveal className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}s` } : undefined}>
      {children}
    </Tag>
  );
}
