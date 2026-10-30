"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

/**
 * An interactive 3D map of the categories: a hub with one node per category, sized by how many catalog tools it holds. Drag to rotate; tap or click a node
 * to open the category. The list of links below is the same data as plain HTML, so the section works without WebGL, with a keyboard and with a screen reader.
 */
export default function UniverseSection() {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
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
    // The map is below the fold, so loading it when it scrolls into view does not touch the first paint.
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect();
          setOn(true);
        }
      },
      { rootMargin: "100px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, []);

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
        {on && (
          <div className="absolute inset-0 touch-pan-y" role="presentation">
            <UniverseScene items={ITEMS} links={LINKS} lite={lite} onSelect={(slug) => router.push(`/tools/category/${slug}/`)} onSelectTool={(id) => router.push(`/tools/${id}/`)} />
          </div>
        )}
        {!on && <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">The interactive map is loading. The category list below works without it.</p>}
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
