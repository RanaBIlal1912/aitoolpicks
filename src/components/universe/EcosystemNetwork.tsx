"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { COMPANIES, MODELS } from "@/data/companies";
import { catColors } from "@/data/palette";
import type { GEdge, GNode } from "./EcosystemScene";

const EcosystemScene = dynamic(() => import("./EcosystemScene"), { ssr: false });

/** Builds the graph from verified records only. */
function build(): { nodes: GNode[]; edges: GEdge[] } {
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];
  const toolIds = new Set<string>();
  for (const c of COMPANIES) {
    nodes.push({ id: `c:${c.slug}`, kind: "company", label: c.name, color: "#d9ccff", size: 0.16 + Math.min(c.tools.length, 3) * 0.06, href: `/ecosystem/companies/${c.slug}/`, group: c.slug });
    for (const t of c.tools) {
      toolIds.add(t.id);
      nodes.push({ id: `t:${t.id}`, kind: "tool", label: t.name, color: catColors(t.category)[0], size: 0.11, href: `/tools/${t.id}/`, group: c.slug });
      edges.push({ a: `c:${c.slug}`, b: `t:${t.id}`, kind: "makes" });
    }
  }
  for (const m of MODELS) {
    const co = COMPANIES.find((c) => c.name === m.company);
    if (!co) continue;
    nodes.push({ id: `m:${m.id}`, kind: "model", label: m.name, color: "#FF4FA3", size: 0.24, href: `/ecosystem/#models-title`, group: co.slug });
    edges.push({ a: `m:${m.id}`, b: `c:${co.slug}`, kind: "model" });
    for (const id of m.tools) if (toolIds.has(id)) edges.push({ a: `m:${m.id}`, b: `t:${id}`, kind: "supports" });
  }
  return { nodes, edges };
}

/**
 * A rotatable 3D map of the verified ecosystem: companies (white), their products (category colours) and models (pink). Click a node to see what it is and open
 * its page. The zoom buttons move the camera; the page does not capture the scroll wheel. Without WebGL, the lists below on the page carry the same data.
 */
export default function EcosystemNetwork() {
  const graph = useMemo(build, []);
  const box = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [lite, setLite] = useState(false);
  const [distance, setDistance] = useState(15);
  const [sel, setSel] = useState<GNode | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let gl = false;
    try {
      const c = document.createElement("canvas");
      gl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      gl = false;
    }
    if (calm || !gl) return;
    setLite(!matchMedia("(min-width: 768px)").matches);
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (setOn(true), io.disconnect()), { rootMargin: "300px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const related = sel ? graph.edges.filter((e) => e.a === sel.id || e.b === sel.id).length : 0;

  return (
    <section aria-labelledby="net-title">
      <h2 id="net-title" className="section-title text-white">
        The network
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {graph.nodes.filter((n) => n.kind === "company").length} companies, {graph.nodes.filter((n) => n.kind === "tool").length} products and {graph.nodes.filter((n) => n.kind === "model").length} verified model, joined only where a record states the
        relationship. Drag to rotate, click a node for details.
      </p>
      <div ref={box} className="relative mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-[#11152A]/70" style={{ height: lite ? 380 : 560 }}>
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 50% 50%, rgba(37,198,232,.14), transparent 70%)" }} />
        {on ? (
          <div className="absolute inset-0 touch-pan-y" role="presentation">
            <EcosystemScene nodes={graph.nodes} edges={graph.edges} distance={distance} selected={sel?.id ?? null} onSelect={setSel} />
          </div>
        ) : (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">The 3D network loads as you scroll. The lists below carry the same information.</p>
        )}
        {on && (
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button type="button" className="chip !min-h-9 !px-3" aria-label="Zoom in" onClick={() => setDistance((d) => Math.max(8, d - 3))}>
              +
            </button>
            <button type="button" className="chip !min-h-9 !px-3" aria-label="Zoom out" onClick={() => setDistance((d) => Math.min(24, d + 3))}>
              −
            </button>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-xl bg-black/40 px-3 py-2 text-xs text-soft backdrop-blur-sm">
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#d9ccff]" />
            company
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#25C6E8]" />
            product (colour = category)
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#FF4FA3]" />
            model
          </span>
        </div>
      </div>
      <div className="mt-4 min-h-[3.5rem] rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm" role="status" aria-live="polite">
        {sel ? (
          <p className="text-soft">
            <strong className="text-white">{sel.label}</strong> ({sel.kind}) has {related} recorded {related === 1 ? "relationship" : "relationships"}.{" "}
            <Link href={sel.href} className="underline">
              Open its page
            </Link>
          </p>
        ) : (
          <p className="text-muted">Select a node to see what it is.</p>
        )}
      </div>
    </section>
  );
}
