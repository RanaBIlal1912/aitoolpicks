import * as THREE from "three";

// The hero robot, rendered in a web worker. The page hands the worker a canvas (OffscreenCanvas) and a few messages; all of the scene building,
// shader compiling and drawing happens on the worker's own thread, so the page's main thread stays free for scrolling, typing and hydration.
//
// The robot is built from plain geometry (no imported model, no generated image). Shading uses small painted "matcap" pictures of a lit glossy
// sphere, so it needs no lights or environment map and stays cheap on modest graphics hardware.

type Msg =
  | { type: "init"; canvas: OffscreenCanvas; w: number; h: number; dpr: number; lite: boolean; forced: boolean; touch?: boolean; logos: { id: string; bitmap: ImageBitmap }[] }
  | { type: "size"; w: number; h: number; dpr: number }
  | { type: "pointer"; x: number; y: number }
  | { type: "active"; on: boolean };

type Scope = {
  postMessage(m: unknown): void;
  onmessage: ((e: MessageEvent<Msg>) => void) | null;
  requestAnimationFrame?: (cb: (t: number) => void) => number;
  cancelAnimationFrame?: (id: number) => void;
};
const ctx = self as unknown as Scope;

const GLOW = "#35e0ff";

function canvas2d(w: number, h = w) {
  const c = new OffscreenCanvas(w, h);
  return { c, g: c.getContext("2d")! };
}

/** Painted textures drawn at about their own size need no mipmaps; skipping them saves start-up work. */
function flat<T extends THREE.Texture>(t: T): T {
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

type Mc = { top: string; mid: string; low: string; rimL?: string; rimR?: string; spec?: number };
const MATCAPS: Record<string, Mc> = {
  shell: { top: "#ffffff", mid: "#dfe5ff", low: "#8c97dd", rimL: "#35e0ff", rimR: "#ff6fe0", spec: 1 },
  visor: { top: "#3a4aa8", mid: "#080c3a", low: "#02030f", rimL: "#35e0ff", rimR: "#8b5cff", spec: 1 },
  purple: { top: "#c9b8ff", mid: "#7a52ff", low: "#2c1a9a", rimL: "#35e0ff", rimR: "#ff6fe0", spec: 0.9 },
  metal: { top: "#f2f4ff", mid: "#9aa3d8", low: "#454c8a", rimL: "#35e0ff", spec: 0.8 },
  glass: { top: "#d9f3ff", mid: "#58b8ff", low: "#2f6bff", rimL: "#8ff3ff", rimR: "#b08bff", spec: 0.9 },
};
const mcCache: Record<string, THREE.MeshMatcapMaterial> = {};
/** A matcap material: a small painted picture of a lit glossy sphere (soft top light, cyan and magenta rim light, darker underside). */
function mc(name: keyof typeof MATCAPS, extra: THREE.MeshMatcapMaterialParameters = {}) {
  const key = name + JSON.stringify(extra);
  if (mcCache[key]) return mcCache[key];
  const m = MATCAPS[name];
  const S = 128;
  const { c, g } = canvas2d(S);
  g.fillStyle = m.low;
  g.fillRect(0, 0, S, S);
  const base = g.createRadialGradient(S * 0.42, S * 0.3, 0, S / 2, S / 2, S * 0.62);
  base.addColorStop(0, m.top);
  base.addColorStop(0.55, m.mid);
  base.addColorStop(1, m.low);
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  const rim = (x: number, col: string) => {
    const r = g.createRadialGradient(x, S * 0.78, 0, x, S * 0.78, S * 0.42);
    r.addColorStop(0, col);
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = 0.55;
    g.fillStyle = r;
    g.fillRect(0, 0, S, S);
    g.globalAlpha = 1;
  };
  if (m.rimL) rim(S * 0.12, m.rimL);
  if (m.rimR) rim(S * 0.88, m.rimR);
  const spec = m.spec ?? 0.8;
  const soft = g.createRadialGradient(S * 0.36, S * 0.24, 0, S * 0.36, S * 0.24, S * 0.2);
  soft.addColorStop(0, `rgba(255,255,255,${0.95 * spec})`);
  soft.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = soft;
  g.fillRect(0, 0, S, S);
  const dot = g.createRadialGradient(S * 0.33, S * 0.2, 0, S * 0.33, S * 0.2, S * 0.05);
  dot.addColorStop(0, `rgba(255,255,255,${spec})`);
  dot.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = dot;
  g.fillRect(0, 0, S, S);
  const t = flat(new THREE.CanvasTexture(c as unknown as HTMLCanvasElement));
  t.colorSpace = THREE.SRGBColorSpace;
  mcCache[key] = new THREE.MeshMatcapMaterial({ matcap: t, ...extra });
  return mcCache[key];
}

let glowTex: THREE.CanvasTexture | null = null;
/** Soft round glow (no hard edge), shared by the logo halos, the cube glow, the floor light and the particles. */
function glowTexture() {
  if (glowTex) return glowTex;
  const { c, g } = canvas2d(128);
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,0.95)");
  r.addColorStop(0.35, "rgba(255,255,255,0.35)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  glowTex = flat(new THREE.CanvasTexture(c as unknown as HTMLCanvasElement));
  return glowTex;
}

function chestTexture() {
  const { c, g } = canvas2d(256);
  const bg = g.createLinearGradient(0, 0, 256, 256);
  bg.addColorStop(0, "#2c3cff");
  bg.addColorStop(1, "#8a3dff");
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(8, 8, 240, 240, 48);
  g.fill();
  g.strokeStyle = "#7ff0ff";
  g.lineWidth = 8;
  g.stroke();
  g.fillStyle = "#fff";
  g.font = "800 140px ui-sans-serif, system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "#35e0ff";
  g.shadowBlur = 24;
  g.fillText("AI", 128, 138);
  const t = flat(new THREE.CanvasTexture(c as unknown as HTMLCanvasElement));
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function cubeFace() {
  const { c, g } = canvas2d(256);
  const bg = g.createLinearGradient(0, 0, 256, 256);
  bg.addColorStop(0, "rgba(80,190,255,0.55)");
  bg.addColorStop(1, "rgba(120,90,255,0.45)");
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#fff";
  g.font = "800 150px ui-sans-serif, system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "#5cf0ff";
  g.shadowBlur = 30;
  g.fillText("AI", 128, 140);
  const t = flat(new THREE.CanvasTexture(c as unknown as HTMLCanvasElement));
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const basic = (color: string, extra: THREE.MeshBasicMaterialParameters = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...extra });
const glowMat = (color: string, opacity: number) =>
  new THREE.MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, pos?: [number, number, number], rot?: [number, number, number]) => {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  return m;
};
const group = (pos?: [number, number, number], rot?: [number, number, number]) => {
  const g = new THREE.Group();
  if (pos) g.position.set(...pos);
  if (rot) g.rotation.set(...rot);
  return g;
};

function buildRobot(lite: boolean) {
  const seg = lite ? 16 : 24;
  const root = group([0, -0.85, 0]);
  const head = group([0, 1.35, 0]);
  const shell = mc("shell");
  const purple = mc("purple");
  const metal = mc("metal");

  const skull = mesh(new THREE.SphereGeometry(1, seg, seg), shell);
  skull.scale.set(1.18, 1, 1.02);
  head.add(skull);
  // visor: a cap cut from a slightly larger copy of the head so it follows the shell and has a clean edge
  const visor = mesh(new THREE.SphereGeometry(1.014, seg * 2, seg, Math.PI / 2 - 1.0, 2.0, Math.PI / 2 - 0.5, 1.0), mc("visor", { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  visor.scale.set(1.18, 1, 1.02);
  head.add(visor);
  for (const x of [-0.36, 0.36]) head.add(mesh(new THREE.TorusGeometry(0.15, 0.045, 14, 32, Math.PI), basic(GLOW), [x, 0.1, 1.05]));
  head.add(mesh(new THREE.TorusGeometry(0.17, 0.04, 14, 32, Math.PI), basic(GLOW), [0, -0.2, 1.04], [0, 0, Math.PI]));
  for (const s of [-1, 1]) {
    const ear = group([s * 1.22, 0, 0]);
    ear.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, seg), purple, undefined, [0, 0, Math.PI / 2]));
    ear.add(mesh(new THREE.TorusGeometry(0.22, 0.04, 12, 32), basic(GLOW), [s * 0.17, 0, 0], [0, 0, Math.PI / 2]));
    head.add(ear);
  }
  head.add(mesh(new THREE.TorusGeometry(1.22, 0.07, 10, 48, Math.PI), purple, [0, 0.2, 0]));
  head.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 10), metal, [0, 1.08, 0]));
  head.add(mesh(new THREE.SphereGeometry(0.08, 16, 16), basic("#ff5bd8"), [0, 1.24, 0]));
  root.add(head);

  root.add(mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.2, 24), metal, [0, 0.52, 0]));
  const body = mesh(new THREE.CapsuleGeometry(0.62, 0.55, 8, seg), shell, [0, -0.25, 0]);
  body.scale.set(1, 1.12, 0.82);
  root.add(body);
  root.add(mesh(new THREE.PlaneGeometry(0.88, 0.88), basic("#ffffff", { map: chestTexture(), transparent: true }), [0, -0.1, 0.56]));

  const left = group([-0.82, 0.05, 0], [0, 0, 0.5]);
  left.add(mesh(new THREE.CapsuleGeometry(0.17, 0.5, 8, 20), shell, [0, -0.38, 0]));
  left.add(mesh(new THREE.SphereGeometry(0.21, 20, 20), purple, [0, -0.82, 0]));
  root.add(left);

  const right = group([0.82, 0.1, 0], [0, 0, -0.9]);
  right.add(mesh(new THREE.CapsuleGeometry(0.17, 0.46, 8, 20), shell, [0, -0.34, 0]));
  const hand = group([0, -0.78, 0.05]);
  hand.add(mesh(new THREE.SphereGeometry(0.24, 24, 24), shell));
  hand.add(mesh(new THREE.CapsuleGeometry(0.07, 0.3, 6, 14), shell, [0.02, -0.26, 0.1], [0.5, 0, 0]));
  const tip = mesh(new THREE.SphereGeometry(0.095, 12, 12), basic(GLOW), [0.02, -0.46, 0.18]);
  hand.add(tip);
  right.add(hand);
  root.add(right);

  const ring = mesh(new THREE.TorusGeometry(1.75, 0.025, 8, 96), basic(GLOW, { transparent: true, opacity: 0.95 }), [0, -0.55, 0], [Math.PI / 2.15, 0, 0]);
  const ring2 = mesh(new THREE.TorusGeometry(1.98, 0.015, 8, 96), basic("#b06bff", { transparent: true, opacity: 0.75 }), [0, -0.55, 0], [Math.PI / 2.15, 0, 0]);
  root.add(ring, ring2);
  root.add(mesh(new THREE.PlaneGeometry(5.4, 5.4), glowMat("#4a7bff", 0.55), [0, -1.3, 0], [-Math.PI / 2, 0, 0]));

  return { root, head, hand, ring, ring2, tip };
}

function buildCube(lite: boolean) {
  const g = group(lite ? [1.38, -0.5, 0.7] : [1.72, -0.45, 0.7]);
  g.scale.setScalar(lite ? 0.74 : 0.9);
  const box = new THREE.BoxGeometry(1.15, 1.15, 1.15);
  g.add(mesh(box, mc("glass", { transparent: true, opacity: 0.6 })));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color: "#8ff3ff", toneMapped: false })));
  g.add(mesh(new THREE.PlaneGeometry(1.1, 1.1), basic("#ffffff", { map: cubeFace(), transparent: true }), [0, 0, 0.585]));
  const s = lite ? 2.5 : 2.9;
  g.add(mesh(new THREE.PlaneGeometry(s, s), glowMat("#4aa8ff", 0.75), [0, 0, -0.1]));
  return g;
}

type Slot = { pos: [number, number, number]; size: number; depth: number };
const SLOTS: Slot[] = [
  { pos: [-2.0, 1.95, 0.7], size: 1.15, depth: 1.0 },
  { pos: [1.05, 2.55, -0.8], size: 1.1, depth: 0.5 },
  { pos: [2.0, 1.45, -0.3], size: 1.0, depth: 0.9 },
  { pos: [-2.55, 0.35, -0.3], size: 0.98, depth: 0.6 },
  { pos: [-2.15, -1.8, 0.8], size: 0.95, depth: 0.8 },
  { pos: [2.05, -1.95, -0.2], size: 0.9, depth: 1.1 },
];
/** Phone version: the same arrangement pulled in so every tile stays on a 375 px screen. */
const SLOTS_LITE: Slot[] = [
  { pos: [-1.5, 2.0, 0.7], size: 0.95, depth: 1.0 },
  { pos: [1.0, 2.4, -0.8], size: 0.9, depth: 0.5 },
  { pos: [1.95, 1.3, -0.3], size: 0.82, depth: 0.9 },
  { pos: [-2.0, 0.5, -0.3], size: 0.8, depth: 0.6 },
  { pos: [-1.65, -1.75, 0.8], size: 0.78, depth: 0.8 },
  { pos: [1.95, -1.9, -0.2], size: 0.76, depth: 1.1 },
];

const TRAIL_N = 44;

let started = false;
ctx.onmessage = (e) => {
  const d = e.data;
  if (d.type === "init" && !started) {
    started = true;
    try {
      start(d);
    } catch {
      ctx.postMessage({ type: "unsupported" });
    }
  }
};

function start(init: Extract<Msg, { type: "init" }>) {
  const { canvas, lite, forced } = init;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  const gl = renderer.getContext();
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  // A machine that renders WebGL on the CPU cannot animate the robot smoothly, so it keeps the flat robot. ?robot=3d forces the 3D version (used in headless test browsers).
  if (/swiftshader|llvmpipe|software|basic render/i.test(name) && !forced) {
    renderer.dispose();
    ctx.postMessage({ type: "unsupported" });
    return;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.5, lite ? 10.4 : 9.4);
  camera.lookAt(0, 0, 0);

  const world = group([lite ? 0.12 : 0.35, 0, 0]);
  scene.add(world);

  const robot = buildRobot(lite);
  world.add(robot.root);
  const cube = buildCube(lite);
  world.add(cube);

  // floating product tiles
  const slots = lite ? SLOTS_LITE : SLOTS;
  const tiles = init.logos.slice(0, slots.length).map((l, i) => {
    const s = slots[i];
    const tex = new THREE.Texture(l.bitmap);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 2;
    tex.needsUpdate = true;
    const g = group(s.pos);
    g.add(mesh(new THREE.PlaneGeometry(s.size * 2.1, s.size * 2.1), glowMat("#7a6bff", 0.7), [0, 0, -0.06]));
    g.add(mesh(new THREE.PlaneGeometry(s.size, s.size), basic("#ffffff", { map: tex, transparent: true })));
    world.add(g);
    return { g, s, phase: i * 1.3 };
  });

  // drifting sparkles
  const SPARK = lite ? 36 : 80;
  const sp = new Float32Array(SPARK * 3);
  const spv = new Float32Array(SPARK);
  for (let i = 0; i < SPARK; i++) {
    sp[i * 3] = (Math.random() - 0.5) * 9;
    sp[i * 3 + 1] = (Math.random() - 0.5) * 6;
    sp[i * 3 + 2] = (Math.random() - 0.5) * 4;
    spv[i] = 0.05 + Math.random() * 0.12;
  }
  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const sparkles = new THREE.Points(spGeo, new THREE.PointsMaterial({ map: glowTexture(), color: "#a8e8ff", size: lite ? 2.5 : 3.2, sizeAttenuation: false, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  sparkles.frustumCulled = false;
  world.add(sparkles);

  // light trail from the fingertip to the cube (world coordinates, so it lives on the scene root)
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
  tGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
  const trail = new THREE.Points(tGeo, new THREE.PointsMaterial({ map: glowTexture(), size: 0.34, sizeAttenuation: true, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  trail.frustumCulled = false;
  scene.add(trail);
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();

  // ---- state
  const ptr = { x: 0, y: 0, ax: 0, ay: 0 };
  // Phones have no hovering pointer, so when nobody has touched the hero for a moment the robot looks around by itself (mouse devices keep following the mouse only).
  const touch = !!init.touch;
  let lastInput = -1e9;
  let idleMix = 0;
  let w = init.w;
  let h = init.h;
  let dpr = init.dpr;
  let fullQuality = false;
  const applySize = () => {
    renderer.setPixelRatio(fullQuality ? Math.min(dpr, 1.5) : 1);
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    camera.aspect = Math.max(1, w) / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  applySize();

  let active = true;
  let mode: "probe" | "full" | "smooth" | "calm" | "still" = "probe";
  let dirty = true;
  let raf = 0;
  let timer = 0;
  let lastDraw = 0;
  let lastFrame = 0;
  let nFrames = 0;
  let sum = 0;
  let readySent = false;
  let nextProbe = 0;
  let probes = 0;
  let elapsed = 0;
  let prev = performance.now();
  const tick = () => {
    const n = performance.now();
    const d = Math.min(0.1, (n - prev) / 1000);
    prev = n;
    elapsed += d;
    return d;
  };

  const animate = (t: number, dt: number) => {
    if (touch) {
      idleMix += ((t - lastInput > 2.5 ? 1 : 0) - idleMix) * Math.min(1, dt * 1.2);
      // ptr stays where the finger left it; the idle drift is blended over it.
      ptr.ax = ptr.x + (Math.sin(t * 0.45) * 0.55 - ptr.x) * idleMix;
      ptr.ay = ptr.y + (Math.sin(t * 0.33 + 1) * 0.3 - ptr.y) * idleMix;
    } else {
      ptr.ax = ptr.x;
      ptr.ay = ptr.y;
    }
    robot.root.position.y = -0.85 + Math.sin(t * 1.2) * 0.1;
    robot.root.rotation.y += (-0.3 + ptr.ax * 0.3 - robot.root.rotation.y) * Math.min(1, dt * 2.5);
    robot.root.rotation.z = Math.sin(t * 0.8) * 0.02;
    robot.head.rotation.y += (ptr.ax * 0.45 - robot.head.rotation.y) * Math.min(1, dt * 4);
    robot.head.rotation.x += (-ptr.ay * 0.25 - robot.head.rotation.x) * Math.min(1, dt * 4);
    robot.hand.rotation.z = -0.25 + Math.sin(t * 2.2) * 0.07;
    robot.ring.rotation.z += dt * 0.5;
    robot.ring2.rotation.z -= dt * 0.3;

    cube.position.y = (lite ? -0.5 : -0.45) + Math.sin(t * 1.3) * 0.12;
    cube.rotation.y = -0.5 + Math.sin(t * 0.6) * 0.35;
    cube.rotation.x = 0.18 + Math.sin(t * 0.8) * 0.06;

    for (const { g, s, phase } of tiles) {
      const tt = t + phase;
      g.position.x = s.pos[0] + Math.sin(tt * 0.7) * 0.1 + ptr.ax * s.depth * 0.16;
      g.position.y = s.pos[1] + Math.sin(tt * 1.1) * 0.14 + ptr.ay * s.depth * 0.14;
      g.position.z = s.pos[2];
      g.rotation.y = Math.sin(tt * 0.6) * 0.35 + ptr.ax * 0.2;
      g.rotation.x = Math.cos(tt * 0.5) * 0.12;
    }

    for (let i = 0; i < SPARK; i++) {
      sp[i * 3 + 1] += spv[i] * dt;
      if (sp[i * 3 + 1] > 3) sp[i * 3 + 1] = -3;
    }
    (spGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    scene.updateMatrixWorld(true);
    robot.tip.getWorldPosition(va);
    cube.getWorldPosition(vb);
    vc.set((va.x + vb.x) / 2 - 0.05, Math.max(va.y, vb.y) + 0.7, (va.z + vb.z) / 2 + 0.3);
    const pos = tGeo.attributes.position as THREE.BufferAttribute;
    const col = tGeo.attributes.color as THREE.BufferAttribute;
    const head = (t * 0.5) % 1.5;
    for (let i = 0; i < TRAIL_N; i++) {
      const u = i / (TRAIL_N - 1);
      const k1 = 1 - u;
      pos.setXYZ(i, k1 * k1 * va.x + 2 * k1 * u * vc.x + u * u * vb.x, k1 * k1 * va.y + 2 * k1 * u * vc.y + u * u * vb.y, k1 * k1 * va.z + 2 * k1 * u * vc.z + u * u * vb.z);
      const k = (0.55 + 1.1 * Math.exp(-((u - head) ** 2) / 0.015)) * Math.min(1, u * 6 + 0.3) * Math.min(1, (1 - u) * 5 + 0.2);
      col.setXYZ(i, 0.3 * k, 0.85 * k, k);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  };

  const stop = () => {
    if (raf && ctx.cancelAnimationFrame) ctx.cancelAnimationFrame(raf);
    clearTimeout(timer);
    raf = 0;
    timer = 0;
  };
  const schedule = () => {
    if (raf || timer || !active) return;
    if (ctx.requestAnimationFrame) raf = ctx.requestAnimationFrame(frame);
    else timer = setTimeout(() => frame(performance.now()), 16) as unknown as number;
  };

  function frame(now: number) {
    raf = 0;
    timer = 0;
    if (!active) return;
    const every = mode === "calm" ? 66 : mode === "smooth" ? 33 : 0;
    if (mode === "still") {
      if (!dirty) return;
    } else if (every && now - lastDraw < every - 4) {
      schedule();
      return;
    }
    dirty = false;
    lastDraw = now;
    const dt = tick();
    animate(elapsed, dt);
    renderer.render(scene, camera);

    if (!readySent) {
      readySent = true;
      ctx.postMessage({ type: "ready" });
    }
    // The first frames include shader linking and texture upload, so they are not counted. Five frames tell a fast device from a slow one.
    // The check is repeated (the first one runs while the page is still busy starting up), so a device can move up or down; the scene never freezes.
    if (mode === "probe") {
      nFrames++;
      if (lastFrame && nFrames > 3) sum += (now - lastFrame) / 1000;
      lastFrame = now;
      if (nFrames >= 8) {
        const avg = sum / 4;
        mode = avg > 0.036 ? "calm" : avg > 0.021 ? "smooth" : "full";
        const q = mode === "full";
        if (q !== fullQuality) {
          fullQuality = q;
          applySize();
        }
        nextProbe = now + (probes++ < 2 ? 4000 : 12000);
      }
    } else if (now > nextProbe) {
      mode = "probe";
      nFrames = 0;
      sum = 0;
      lastFrame = 0;
    }
    if (mode !== "still") schedule();
  }

  const wake = () => {
    stop();
    dirty = true;
    schedule();
  };

  ctx.onmessage = (ev) => {
    const m = ev.data;
    if (m.type === "pointer") {
      ptr.x = m.x;
      ptr.y = m.y;
      lastInput = elapsed;
      if (mode === "still" && !dirty) {
        dirty = true;
        schedule();
      }
    } else if (m.type === "size") {
      w = m.w;
      h = m.h;
      dpr = m.dpr;
      applySize();
      dirty = true;
      schedule();
    } else if (m.type === "active") {
      active = m.on;
      if (active) {
        prev = performance.now();
        wake();
      } else stop();
    }
  };

  // first frame as soon as the scene is built
  wake();
}
