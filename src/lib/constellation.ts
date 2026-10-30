import { CAT_COLORS } from "@/data/palette";

// A deterministic "constellation" used twice: as the static SVG that is on screen at first paint, and as the node layout of the WebGL hero scene.
// Positions are decoration only (they carry no data); using one generator keeps the two views the same picture.
const COLORS = Object.values(CAT_COLORS).map((c) => c[0]);

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type CNode = { x: number; y: number; z: number; color: string; size: number };

export function constellation(count: number, seed = 7): { nodes: CNode[]; edges: [number, number][] } {
  const r = rng(seed);
  const nodes: CNode[] = [];
  for (let i = 0; i < count; i++) {
    // Fibonacci sphere with a random radius, so nodes fill a thick shell rather than one surface.
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5));
    const rad = 2.1 + r() * 1.5;
    nodes.push({ x: Math.cos(a) * ring * rad, y: y * rad * 0.82, z: Math.sin(a) * ring * rad, color: COLORS[i % COLORS.length], size: 0.045 + r() * 0.07 });
  }
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const near = nodes
      .map((n, j) => ({ j, d: (n.x - nodes[i].x) ** 2 + (n.y - nodes[i].y) ** 2 + (n.z - nodes[i].z) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    for (const { j } of near) {
      const k = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(k)) {
        seen.add(k);
        edges.push([i, j]);
      }
    }
  }
  return { nodes, edges };
}
