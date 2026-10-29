// Procedural texture generators (canvas 2D). Used by the live background scene and by the cover-image
// render script, so both share one look. Browser only: every function creates canvases.

export type Rand = () => number;

/** Small, fast, seedable random generator (mulberry32). */
export function rng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h = w): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** Fractal value noise as a grayscale canvas. */
export function fbm(size: number, seed: number, base = 6, octaves = 4): HTMLCanvasElement {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const R = rng(seed);
  const grids: Float32Array[] = [];
  for (let o = 0; o < octaves; o++) {
    const g = base * 2 ** o + 1;
    const arr = new Float32Array(g * g);
    for (let i = 0; i < arr.length; i++) arr[i] = R();
    grids.push(arr);
  }
  const smooth = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      let amp = 0.5;
      let norm = 0;
      for (let o = 0; o < octaves; o++) {
        const cells = base * 2 ** o;
        const g = cells + 1;
        const fx = (x / size) * cells;
        const fy = (y / size) * cells;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = smooth(fx - x0);
        const ty = smooth(fy - y0);
        const a = grids[o][y0 * g + x0];
        const b = grids[o][y0 * g + x0 + 1];
        const c2 = grids[o][(y0 + 1) * g + x0];
        const d = grids[o][(y0 + 1) * g + x0 + 1];
        v += amp * (a + (b - a) * tx + (c2 - a) * ty + (a - b - c2 + d) * tx * ty);
        norm += amp;
        amp *= 0.5;
      }
      const k = Math.round((v / norm) * 255);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = k;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Anisotropic brushed-metal roughness: fine horizontal streaks over soft noise. */
export function brushedRoughness(size: number, seed: number, mean = 0.4): HTMLCanvasElement {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  const R = rng(seed);
  const g = Math.round(mean * 255);
  ctx.fillStyle = `rgb(${g},${g},${g})`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 3; i++) {
    const y = R() * size;
    const v = Math.round(g + (R() - 0.5) * 70);
    ctx.fillStyle = `rgba(${v},${v},${v},${0.15 + R() * 0.3})`;
    ctx.fillRect(R() * size * 0.5, y, size * (0.2 + R() * 0.8), 0.6 + R() * 1.2);
  }
  ctx.globalAlpha = 0.25;
  ctx.drawImage(fbm(size, seed + 7, 5, 3), 0, 0);
  ctx.globalAlpha = 1;
  return c;
}

type Maps = { map: HTMLCanvasElement; emissive: HTMLCanvasElement; bump: HTMLCanvasElement };

export type Palette = { trace: string; glowA: string; glowB: string; base: string };
export const BLUE_VIOLET: Palette = { base: "#080d1c", trace: "#22365e", glowA: "#4d8dff", glowB: "#9d7bff" };

/** Printed-circuit style board: copper traces, vias and pads, with a matching glow and bump map. */
export function circuitMaps(size: number, seed: number, pal: Palette = BLUE_VIOLET): Maps {
  const R = rng(seed);
  const map = canvas(size);
  const emissive = canvas(size);
  const bump = canvas(size);
  const m = map.getContext("2d")!;
  const e = emissive.getContext("2d")!;
  const b = bump.getContext("2d")!;

  m.fillStyle = pal.base;
  m.fillRect(0, 0, size, size);
  m.globalAlpha = 0.35;
  m.drawImage(fbm(size, seed + 1, 8, 4), 0, 0);
  m.globalAlpha = 1;
  e.fillStyle = "#000";
  e.fillRect(0, 0, size, size);
  b.fillStyle = "#555";
  b.fillRect(0, 0, size, size);

  const cell = size / 128;
  const dirs: [number, number][] = [
    [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
  ];
  const traces = 320;
  for (let n = 0; n < traces; n++) {
    let x = Math.floor(R() * 128);
    let y = Math.floor(R() * 128);
    let d = Math.floor(R() * 4) * 2; // start axis-aligned
    const pts: [number, number][] = [[x, y]];
    const segs = 3 + Math.floor(R() * 9);
    for (let s = 0; s < segs; s++) {
      const len = 3 + Math.floor(R() * 12);
      x += dirs[d][0] * len;
      y += dirs[d][1] * len;
      if (x < 0 || y < 0 || x > 128 || y > 128) break;
      pts.push([x, y]);
      d = (d + (R() < 0.5 ? 1 : 7)) % 8; // turn 45 degrees
    }
    if (pts.length < 2) continue;
    const lit = R() < 0.3;
    const glow = R() < 0.5 ? pal.glowA : pal.glowB;
    const path = (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * cell, py * cell) : ctx.moveTo(px * cell, py * cell)));
      ctx.stroke();
    };
    m.strokeStyle = pal.trace;
    m.lineWidth = cell * 0.55;
    m.lineJoin = "round";
    path(m);
    b.strokeStyle = "#bbb";
    b.lineWidth = cell * 0.55;
    b.lineJoin = "round";
    path(b);
    if (lit) {
      e.strokeStyle = glow;
      e.shadowColor = glow;
      e.shadowBlur = cell * 4;
      e.lineWidth = cell * 0.32;
      e.lineJoin = "round";
      path(e);
      e.shadowBlur = 0;
    }
    // via at the start of the trace
    const [sx, sy] = pts[0];
    m.fillStyle = "#3a4f7a";
    m.beginPath();
    m.arc(sx * cell, sy * cell, cell * 0.55, 0, Math.PI * 2);
    m.fill();
    b.fillStyle = "#eee";
    b.beginPath();
    b.arc(sx * cell, sy * cell, cell * 0.55, 0, Math.PI * 2);
    b.fill();
    if (lit) {
      e.fillStyle = glow;
      e.shadowColor = glow;
      e.shadowBlur = cell * 5;
      e.beginPath();
      e.arc(sx * cell, sy * cell, cell * 0.4, 0, Math.PI * 2);
      e.fill();
      e.shadowBlur = 0;
    }
  }
  return { map, emissive, bump };
}

/** Macro look of a processor die: tiled memory blocks, bus lines and thin-film colour variation. */
export function dieMaps(size: number, seed: number): { map: HTMLCanvasElement; rough: HTMLCanvasElement; bump: HTMLCanvasElement } {
  const R = rng(seed);
  const map = canvas(size);
  const rough = canvas(size);
  const bump = canvas(size);
  const m = map.getContext("2d")!;
  const r = rough.getContext("2d")!;
  const b = bump.getContext("2d")!;
  const grad = m.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#070d20");
  grad.addColorStop(0.5, "#0e1838");
  grad.addColorStop(1, "#160f34");
  m.fillStyle = grad;
  m.fillRect(0, 0, size, size);
  r.fillStyle = "#555";
  r.fillRect(0, 0, size, size);
  b.fillStyle = "#666";
  b.fillRect(0, 0, size, size);

  const tints = ["#1d3a78", "#2a2f7a", "#17485f", "#3a2a78", "#14306a", "#4a2f7d"];
  const blocks = 26;
  for (let i = 0; i < blocks; i++) {
    const w = size * (0.08 + R() * 0.22);
    const h = size * (0.08 + R() * 0.22);
    const x = R() * (size - w);
    const y = R() * (size - h);
    m.fillStyle = tints[Math.floor(R() * tints.length)];
    m.globalAlpha = 0.8;
    m.fillRect(x, y, w, h);
    m.globalAlpha = 1;
    // fine memory-array pattern
    const step = 3 + Math.floor(R() * 3);
    m.strokeStyle = "rgba(140,170,255,0.28)";
    m.lineWidth = 1;
    b.strokeStyle = "rgba(255,255,255,0.5)";
    b.lineWidth = 1;
    for (let gx = x; gx < x + w; gx += step) {
      m.beginPath(); m.moveTo(gx, y); m.lineTo(gx, y + h); m.stroke();
      b.beginPath(); b.moveTo(gx, y); b.lineTo(gx, y + h); b.stroke();
    }
    if (R() < 0.6) {
      for (let gy = y; gy < y + h; gy += step * 2) {
        m.beginPath(); m.moveTo(x, gy); m.lineTo(x + w, gy); m.stroke();
      }
    }
    m.strokeStyle = "rgba(210,225,255,0.5)";
    m.strokeRect(x, y, w, h);
    r.fillStyle = "#333";
    r.fillRect(x, y, w, h);
  }
  // bus lines
  for (let i = 0; i < 40; i++) {
    m.strokeStyle = `rgba(${150 + R() * 80},${170 + R() * 60},255,${0.2 + R() * 0.35})`;
    m.lineWidth = 1 + R() * 1.5;
    const y = R() * size;
    m.beginPath(); m.moveTo(0, y); m.lineTo(size, y); m.stroke();
    const x = R() * size;
    m.beginPath(); m.moveTo(x, 0); m.lineTo(x, size); m.stroke();
  }
  m.globalAlpha = 0.25;
  m.drawImage(fbm(size, seed + 3, 4, 4), 0, 0);
  m.globalAlpha = 1;
  return { map, rough, bump };
}

/** A silicon wafer: a circular grid of dies with colour that shifts across the surface. */
export function waferMap(size: number, seed: number): HTMLCanvasElement {
  const R = rng(seed);
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0b0f1d";
  ctx.fillRect(0, 0, size, size);
  const cx = size / 2;
  const rad = size / 2 - 4;
  const cw = size / 78;
  const ch = size / 92;
  for (let y = 0; y < size; y += ch) {
    for (let x = 0; x < size; x += cw) {
      const mx = x + cw / 2 - cx;
      const my = y + ch / 2 - cx;
      const d = Math.hypot(mx, my);
      if (d > rad - cw) continue;
      const hue = (210 + (mx / size) * 120 + (my / size) * 80 + R() * 14 + 360) % 360;
      ctx.fillStyle = `hsl(${hue} 55% ${14 + R() * 10}%)`;
      ctx.fillRect(x + 0.8, y + 0.8, cw - 1.6, ch - 1.6);
      ctx.strokeStyle = "rgba(200,215,255,0.16)";
      ctx.lineWidth = 0.5;
      for (let k = 2; k < cw - 1; k += 2) {
        ctx.beginPath(); ctx.moveTo(x + k, y + 1.5); ctx.lineTo(x + k, y + ch - 1.5); ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 0.18;
  ctx.drawImage(fbm(size, seed + 5, 3, 3), 0, 0);
  ctx.globalAlpha = 1;
  return c;
}

/** Soft round sprite for light dust and bokeh. */
export function glowSprite(size = 128, inner = 0.15): HTMLCanvasElement {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(inner, "rgba(255,255,255,0.65)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/** Hard-edged disc with a faint rim, for out-of-focus bokeh. */
export function bokehSprite(size = 128): HTMLCanvasElement {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.35)");
  g.addColorStop(0.82, "rgba(255,255,255,0.45)");
  g.addColorStop(0.92, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}
