"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function webglOk(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Loads the 3D scene only after the page has finished loading, only when WebGL works and the visitor has not asked
 * for data saving. Pauses rendering while the hero is off screen or the tab is hidden. If anything fails, the
 * CSS glow behind it stays and the page is unaffected.
 */
export default function Hero3D({ containerId }: { containerId: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [source, setSource] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (nav.connection?.saveData || !webglOk()) return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setSource(document.getElementById(containerId));

    const go = () => {
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      if (idle) idle(() => setLoad(true));
      else setTimeout(() => setLoad(true), 200);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => window.removeEventListener("load", go);
  }, [containerId]);

  useEffect(() => {
    const el = wrap.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    const vis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return (
    <div ref={wrap} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Always-on CSS glow: this is what shows if 3D is unavailable. */}
      <div className="orb -left-24 top-10 h-72 w-72 bg-[#2f7bff]" />
      <div className="orb -right-16 top-24 h-80 w-80 bg-[#8b5cf6]" style={{ animationDelay: "-3s" }} />
      <div className="orb bottom-0 left-1/3 h-56 w-56 bg-[#22d3ee]/60" style={{ animationDelay: "-6s" }} />
      {load && (
        <Boundary>
          <HeroScene active={visible && tabVisible} reduced={reduced} eventSource={source} />
        </Boundary>
      )}
    </div>
  );
}
