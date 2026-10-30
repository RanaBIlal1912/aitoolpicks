"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { withBase } from "@/lib/site";
import { CATEGORIES, TOOLS, toolsInCategory } from "@/data/tools";
import { catColors } from "@/data/palette";

const UniverseScene = dynamic(() => import("./UniverseScene"), { ssr: false });

const ITEMS = CATEGORIES.map((c) => ({ slug: c.slug, label: c.short, count: toolsInCategory(c.slug).length, color: catColors(c.slug)[0], tools: toolsInCategory(c.slug).map((t) => ({ id: t.id, name: t.name })) }));

// Two categories are joined when at least one real catalog tool is listed in both.
const LINKS = (() => {
  const m = new Map<string, number>();
  for (const t of TOOLS) {
    const cs = [...new Set(t.categories)].sort();
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) m.set(`${cs[i]}|${cs[j]}`, (m.get(`${cs[i]}|${cs[j]}`) ?? 0) + 1);
  }
  return [...m.entries()].map(([k, n]) => ({ a: k.split("|")[0], b: k.split("|")[1], n }));
})();

/** The same categories drawn once as plain SVG (no JavaScript needed), so the box is never empty: the 3D map fades in over it, and it stays when WebGL is unavailable. Each node is a link. */
function StaticMap() {
  const html = useMemo(() => {
    const cx = 80, cy = 45, n = ITEMS.length;
    const pos = ITEMS.map((_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + Math.cos(a) * 58, y: cy + Math.sin(a) * 31 };
    });
    const idx = new Map(ITEMS.map((it, i) => [it.slug, i]));
    const lines = LINKS.map((l) => {
      const a = pos[idx.get(l.a) ?? 0], b = pos[idx.get(l.b) ?? 0];
      return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="rgba(37,198,232,${Math.min(0.45, 0.1 + l.n * 0.08).toFixed(2)})" stroke-width=".25"/>`;
    }).join("");
    const spokes = pos.map((p) => `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="rgba(141,123,255,.18)" stroke-width=".2"/>`).join("");
    const nodes = ITEMS.map((it, i) => {
      const p = pos[i], r = 2.2 + Math.sqrt(it.count) * 0.75;
      return `<a href="${withBase(`/tools/category/${it.slug}/`)}" aria-label="${it.label}, ${it.count} tools"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(r * 1.9).toFixed(1)}" fill="${it.color}" opacity=".13"/><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${it.color}"/><text x="${p.x.toFixed(1)}" y="${(p.y + r + 3.4).toFixed(1)}" text-anchor="middle" font-size="2.6" font-weight="700" fill="#fff">${it.label}</text><text x="${p.x.toFixed(1)}" y="${(p.y + r + 6.2).toFixed(1)}" text-anchor="middle" font-size="2.1" fill="#a9afc8">${it.count} tools</text></a>`;
    }).join("");
    return `${spokes}${lines}<circle cx="${cx}" cy="${cy}" r="11" fill="rgba(117,75,255,.25)"/><circle cx="${cx}" cy="${cy}" r="5" fill="#754bff"/><text x="${cx}" y="${cy + 1}" text-anchor="middle" font-size="2.6" font-weight="800" fill="#fff">AI</text>${nodes}`;
  }, []);
  return <svg viewBox="0 0 160 90" role="group" aria-label="Map of the tool categories; each node opens its category" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * An interactive 3D map of the categories: a hub with one node per category, sized by how many catalog tools it holds. Drag to rotate; tap or click a node
 * to open the category. The list of links below is the same data as plain HTML, so the section works without WebGL, with a keyboard and with a screen reader.
 */
export default function UniverseSection() {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let gl = false;
    try {
      const c = document.createElement("canvas");
      gl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      gl = false;
    }
    if (calm || saver || !gl) return;
    setLite(!matchMedia("(min-width: 768px)").matches);
    // The static SVG map is always there. The 3D code loads once the section is near the screen, after a short pause so a fast scroll past it costs nothing.
    let timer = 0;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect();
          timer = window.setTimeout(() => setOn(true), 600);
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // Remove the flat map once the 3D canvas exists.
  useEffect(() => {
    const el = box.current;
    if (!on || !el) return;
    const check = () => el.querySelector("canvas") && setReady(true);
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true });
    check();
    return () => mo.disconnect();
  }, [on]);

  return (
    <section aria-labelledby="universe-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">AI universe</span>
          <h2 id="universe-title" className="section-title mt-3 text-white">
            Explore AI by category
          </h2>
          <p className="mt-3 max-w-2xl text-soft">Drag to turn the map. Big nodes are categories and open that category; the small white dots around them are the real tools in it and open the tool. Cyan lines join categories that share a tool.</p>
        </div>
        <Link href="/tools/" className="btn-ghost btn-sm">
          Search all tools →
        </Link>
      </div>
      <div ref={box} className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#11152A]/70" style={{ height: lite ? 440 : 640 }}>
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 50% 50%, rgba(117,75,255,.22), transparent 70%)" }} />
        {!ready && <StaticMap />}
        {on && (
          <div className="absolute inset-0 touch-pan-y" role="presentation">
            <UniverseScene items={ITEMS} links={LINKS} lite={lite} onSelect={(slug) => router.push(`/tools/category/${slug}/`)} onSelectTool={(id) => router.push(`/tools/${id}/`)} />
          </div>
        )}
        {!ready && <p className="absolute bottom-3 left-0 right-0 px-6 text-center text-xs text-muted">Showing the flat map. {on ? "Loading the 3D version…" : "The 3D version loads as you scroll here."}</p>}
      </div>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Categories">
        {ITEMS.map((i) => (
          <li key={i.slug}>
            <Link href={`/tools/category/${i.slug}/`} className="chip w-full justify-between" style={{ borderColor: `${i.color}66` }}>
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />
                {i.label}
              </span>
              <span className="text-xs text-muted">{i.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
