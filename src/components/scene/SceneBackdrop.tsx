"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";

const BackdropScene = dynamic(() => import("./BackdropScene"), { ssr: false });

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
 * The one and only WebGL scene on the site. It sits fixed behind every page, so the cinematic look carries
 * below the hero. It loads after the page is idle, pauses when the tab is hidden, is dimmed as you scroll
 * so text stays readable, and is skipped entirely when WebGL is missing or the visitor asked to save data.
 */
export default function SceneBackdrop() {
  const pathname = usePathname() ?? "/";
  const home = pathname === "/" || pathname === "";
  const wrap = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (nav.connection?.saveData || !webglOk()) return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMobile(window.matchMedia("(max-width: 760px)").matches || window.matchMedia("(pointer: coarse)").matches);
    const go = () => {
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      if (idle) idle(() => setLoad(true));
      else setTimeout(() => setLoad(true), 250);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => window.removeEventListener("load", go);
  }, []);

  // Fade the scene as you scroll (full strength on the hero, quieter behind reading) and park it on inner pages.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const inner = window.innerWidth < 760 ? 0.26 : 0.4;
      const base = home ? 1 : inner;
      const fade = home ? Math.max(inner, 1 - (y / vh) * 0.6) : inner;
      el.style.setProperty("--scene-o", String(Math.min(base, fade)));
      setVisible(!document.hidden);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    document.addEventListener("visibilitychange", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      document.removeEventListener("visibilitychange", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [home]);

  useEffect(() => {
    if (!load) return;
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-1000"
      style={{ opacity: ready ? "var(--scene-o, 1)" : 0 }}
    >
      {load && (
        <Boundary>
          <BackdropScene home={home} reduced={reduced} mobile={mobile} active={visible} />
        </Boundary>
      )}
    </div>
  );
}
