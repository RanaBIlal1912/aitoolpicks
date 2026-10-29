// Offline "photography" for the site's cover images. Each scene is lit and shot like a still, then the
// render script adds bloom, vignette and grain. Nothing here is downloaded: every texture is generated.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { addLights, buildChip, dustField, makeEnvironment } from "@/lib/scene/chip";
import {
  BLUE_VIOLET,
  bokehSprite,
  brushedRoughness,
  circuitMaps,
  glowSprite,
  rng,
  waferMap,
  type Palette,
} from "@/lib/scene/procedural";

export type Shot = { scene: THREE.Scene; camera: THREE.PerspectiveCamera; exposure: number; dispose: () => void };
type Builder = (renderer: THREE.WebGLRenderer, aspect: number) => Shot;

function tex(c: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

function backdrop(scene: THREE.Scene, inner: string, outer = "#04050d", cx = 0.7, cy = 0.4): void {
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 900;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(c.width * cx, c.height * cy, 20, c.width * cx, c.height * cy, 1150);
  g.addColorStop(0, inner);
  g.addColorStop(0.55, outer);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  scene.background = tex(c);
}

function bokeh(
  scene: THREE.Scene,
  n: number,
  area: [number, number],
  zr: [number, number],
  colors: number[],
  size: [number, number],
  seed: number,
  opacity = 0.35,
): void {
  const R = rng(seed);
  const map = tex(bokehSprite(128));
  for (let i = 0; i < n; i++) {
    const mat = new THREE.SpriteMaterial({
      map,
      color: colors[Math.floor(R() * colors.length)],
      transparent: true,
      opacity: opacity * (0.4 + R() * 0.6),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const s = new THREE.Sprite(mat);
    const sc = size[0] + R() * (size[1] - size[0]);
    s.scale.set(sc, sc, 1);
    s.position.set((R() - 0.5) * area[0], (R() - 0.5) * area[1], zr[0] + R() * (zr[1] - zr[0]));
    scene.add(s);
  }
}

function setup(renderer: THREE.WebGLRenderer, scene: THREE.Scene, envIntensity: number): void {
  scene.background = new THREE.Color(0x04050d);
  scene.environment = makeEnvironment(renderer);
  scene.environmentIntensity = envIntensity;
}

// 1. Hero: the accelerator package, shot low and wide so the die, frame and gold pads show depth.
const chip: Builder = (renderer, aspect) => {
  const scene = new THREE.Scene();
  setup(renderer, scene, 0.42);
  scene.fog = new THREE.FogExp2(0x04050d, 0.03);
  backdrop(scene, "#2a3f9a", "#04050d", 0.72, 0.35);
  const cam = new THREE.PerspectiveCamera(26, aspect, 0.1, 100);
  cam.position.set(5.6, 3.3, 7.2);
  cam.lookAt(0.3, 0.1, 0);
  const c = buildChip({ seed: 7, texSize: 2048 });
  c.group.rotation.y = -0.42;
  c.update(0.4);
  scene.add(c.group);
  addLights(scene, 0.75);
  scene.add(dustField(260, [16, 9, 14], 0.07, 0x9db8ff, 5));
  bokeh(scene, 22, [18, 9], [-12, -4], [0x4d8dff, 0x9d7bff, 0x22d3ee], [1.4, 3.4], 11, 0.16);
  bokeh(scene, 7, [9, 5], [3.5, 5], [0x6f9bff, 0xb18cff], [1.2, 2.4], 12, 0.1);
  return { scene, camera: cam, exposure: 1.05, dispose: c.dispose };
};

// 2. Board: a macro run across a circuit board with a package in the middle distance.
const board: Builder = (renderer, aspect) => {
  const scene = new THREE.Scene();
  setup(renderer, scene, 0.3);
  scene.fog = new THREE.FogExp2(0x04050d, 0.05);
  backdrop(scene, "#12266a", "#04050d", 0.35, 0.3);
  const pal: Palette = { ...BLUE_VIOLET, glowA: "#38bdf8", glowB: "#a78bfa" };
  const maps = circuitMaps(2048, 21, pal);
  for (const t of [maps.map, maps.emissive, maps.bump]) void t;
  const mapT = tex(maps.map);
  mapT.wrapS = mapT.wrapT = THREE.RepeatWrapping;
  mapT.repeat.set(3, 2);
  const emT = tex(maps.emissive);
  emT.wrapS = emT.wrapT = THREE.RepeatWrapping;
  emT.repeat.set(3, 2);
  const buT = tex(maps.bump, false);
  buT.wrapS = buT.wrapT = THREE.RepeatWrapping;
  buT.repeat.set(3, 2);
  const floorMat = new THREE.MeshPhysicalMaterial({
    map: mapT, emissiveMap: emT, emissive: new THREE.Color(0xffffff), emissiveIntensity: 1.5,
    bumpMap: buT, bumpScale: 3, roughness: 0.62, metalness: 0.25, clearcoat: 0.2, clearcoatRoughness: 0.4, envMapIntensity: 0.4,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 26), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const c = buildChip({ seed: 33, palette: pal, texSize: 1024 });
  c.group.scale.setScalar(0.9);
  c.group.position.set(-1.2, 0.08, -1.5);
  c.group.rotation.y = 0.5;
  c.update(0.2);
  scene.add(c.group);
  // a few black IC packages with pin rows
  const R = rng(5);
  const icMat = new THREE.MeshPhysicalMaterial({ color: 0x101319, roughness: 0.38, metalness: 0.2, clearcoat: 0.5 });
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xc9ced8, metalness: 1, roughness: 0.3 });
  for (let i = 0; i < 12; i++) {
    const w = 0.5 + R() * 0.9;
    const d = 0.5 + R() * 0.7;
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new RoundedBoxGeometry(w, 0.1, d, 2, 0.02), icMat));
    const pins = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.02, d - 0.1), pinMat);
    pins.position.y = -0.03;
    g.add(pins);
    g.position.set((R() - 0.3) * 9, 0.07, 1 - R() * 5 - (R() > 0.5 ? 0 : 1.5));
    if (Math.abs(g.position.x + 1.2) < 3 && g.position.z < -0.2 && g.position.z > -3.2) g.position.x += 4.4;
    g.rotation.y = R() < 0.5 ? 0 : Math.PI / 2;
    scene.add(g);
  }
  const cam = new THREE.PerspectiveCamera(30, aspect, 0.1, 100);
  cam.position.set(3.4, 2.3, 6.4);
  cam.lookAt(-0.8, 0.0, -1.8);
  addLights(scene, 1.1);
  scene.add(dustField(200, [14, 6, 14], 0.06, 0x8fb0ff, 9));
  bokeh(scene, 16, [16, 7], [-14, -6], [0x38bdf8, 0xa78bfa, 0x4d8dff], [1.6, 3.6], 13, 0.25);
  return { scene, camera: cam, exposure: 1.0, dispose: () => c.dispose() };
};

// 3. Neural: layered fields of light with fine connections, shot with a shallow focal plane.
const neural: Builder = (renderer, aspect) => {
  const scene = new THREE.Scene();
  setup(renderer, scene, 0.3);
  backdrop(scene, "#1a1560", "#04050d");
  const R = rng(41);
  const layers = 7;
  const nodes: THREE.Vector3[][] = [];
  for (let l = 0; l < layers; l++) {
    const arr: THREE.Vector3[] = [];
    const n = 16 + Math.floor(R() * 8);
    for (let i = 0; i < n; i++) arr.push(new THREE.Vector3(-9 + l * 3 + (R() - 0.5) * 1.1, (R() - 0.5) * 9, (R() - 0.5) * 7));
    nodes.push(arr);
  }
  const linePts: number[] = [];
  const lineCol: number[] = [];
  const colA = new THREE.Color(0x4d8dff);
  const colB = new THREE.Color(0xa78bfa);
  for (let l = 0; l < layers - 1; l++) {
    for (const a of nodes[l]) {
      const links = 2 + Math.floor(R() * 2);
      for (let k = 0; k < links; k++) {
        const b = nodes[l + 1][Math.floor(R() * nodes[l + 1].length)];
        linePts.push(a.x, a.y, a.z, b.x, b.y, b.z);
        const c = colA.clone().lerp(colB, R());
        lineCol.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
    }
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(linePts, 3));
  lg.setAttribute("color", new THREE.Float32BufferAttribute(lineCol, 3));
  scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false })));
  const sprite = tex(glowSprite(128, 0.2));
  for (const layer of nodes) {
    for (const p of layer) {
      const near = Math.abs(p.z + 0.5) < 1.6;
      const m = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: sprite, color: near ? 0xcfe0ff : 0x7da6ff, transparent: true, opacity: near ? 0.95 : 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      const s = near ? 0.34 : 0.2 + Math.abs(p.z) * 0.12;
      m.scale.set(s, s, 1);
      m.position.copy(p);
      scene.add(m);
    }
  }
  bokeh(scene, 18, [22, 10], [-6, -2], [0x4d8dff, 0xa78bfa], [1.0, 2.6], 17, 0.22);
  bokeh(scene, 8, [12, 6], [4, 8], [0x6f9bff, 0xc4b5fd], [1.5, 3.2], 18, 0.16);
  const cam = new THREE.PerspectiveCamera(32, aspect, 0.1, 120);
  cam.position.set(-1.5, 0.6, 14);
  cam.lookAt(1.5, 0, 0);
  return { scene, camera: cam, exposure: 1.1, dispose: () => {} };
};

// 4. Lens: a camera-style optical stack with coated glass, backlit by coloured light.
const lens: Builder = (renderer, aspect) => {
  const scene = new THREE.Scene();
  setup(renderer, scene, 0.9);
  backdrop(scene, "#2a1260", "#04050d");
  const R = rng(61);
  const metal = new THREE.MeshPhysicalMaterial({
    color: 0x20242d, metalness: 1, roughness: 1,
    roughnessMap: tex(brushedRoughness(512, 8, 0.3), false), envMapIntensity: 1.4,
  });
  const barrel = new THREE.Group();
  for (const [r, t, z] of [[3.2, 0.34, 0], [2.7, 0.28, 0.3], [2.2, 0.24, 0.6]] as const) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, t, 48, 160), metal);
    ring.position.z = z;
    barrel.add(ring);
  }
  // fine knurling on the outer ring
  const kn = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.5, 0.28), metal, 180);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 180; i++) {
    const a = (i / 180) * Math.PI * 2;
    m4.compose(new THREE.Vector3(Math.cos(a) * 3.55, Math.sin(a) * 3.55, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, a)), new THREE.Vector3(1, 1, 1));
    kn.setMatrixAt(i, m4);
  }
  barrel.add(kn);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 1.2, ior: 1.52,
    iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 380], envMapIntensity: 2.2, attenuationColor: new THREE.Color(0xa7b8ff), attenuationDistance: 6,
  });
  for (const [r, z, sc] of [[1.9, 0.55, 1], [1.5, 0.15, 0.9], [1.1, -0.2, 0.8]] as const) {
    const g = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 64), glassMat);
    g.scale.set(1, 1, 0.28 * sc);
    g.position.z = z;
    barrel.add(g);
  }
  barrel.rotation.set(0.28, -0.5, 0.1);
  barrel.position.set(1.6, 0, 0);
  scene.add(barrel);
  // coloured light sources behind the glass so transmission has something to refract
  const lights = [[-3, 2, -4, 0x4d8dff], [2, -1.5, -5, 0xa78bfa], [5, 3, -6, 0x22d3ee], [-1, -3, -5, 0xf5a3ff], [6, -2, -4, 0x6f9bff]] as const;
  for (const [x, y, z, col] of lights) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), new THREE.MeshBasicMaterial({ color: col }));
    s.position.set(x, y, z);
    scene.add(s);
    const pl = new THREE.PointLight(col, 60, 30, 2);
    pl.position.set(x, y, z + 1);
    scene.add(pl);
  }
  addLights(scene, 0.8);
  bokeh(scene, 26, [20, 10], [-10, -4], [0x4d8dff, 0xa78bfa, 0x22d3ee, 0xf5a3ff], [1.0, 3.0], 19, 0.3);
  void R;
  const cam = new THREE.PerspectiveCamera(30, aspect, 0.1, 100);
  cam.position.set(-1.5, 0.4, 13);
  cam.lookAt(1.4, 0, 0);
  return { scene, camera: cam, exposure: 1.0, dispose: () => {} };
};

// 5. Rack: a mirrored aisle of server racks with indicator lights, in perspective.
const rack: Builder = (renderer, aspect) => {
  const scene = new THREE.Scene();
  setup(renderer, scene, 0.35);
  scene.fog = new THREE.FogExp2(0x04050d, 0.045);
  backdrop(scene, "#0f1c52", "#04050d");
  const R = rng(77);
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x0c1018, roughness: 0.42, metalness: 0.65, clearcoat: 0.4 });
  const ledColors = [0x4d8dff, 0x4d8dff, 0x9d7bff, 0x22d3ee, 0xf5b04c];
  const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.03, 0.01), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 6000);
  let li = 0;
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  for (const side of [-1, 1]) {
    for (let i = 0; i < 16; i++) {
      const z = -i * 1.35;
      const rackMesh = new THREE.Mesh(new RoundedBoxGeometry(1.1, 3.2, 1.1, 2, 0.02), bodyMat);
      rackMesh.position.set(side * 2.6, 1.6, z);
      scene.add(rackMesh);
      const faceX = side * 2.6 - side * 0.56;
      for (let u = 0; u < 34; u++) {
        const y = 0.2 + u * 0.09;
        // slot line
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.006, 0.92), new THREE.MeshBasicMaterial({ color: 0x1a2440 }));
        slot.position.set(faceX, y, z);
        scene.add(slot);
        for (let k = 0; k < 6; k++) {
          if (R() < 0.45) continue;
          col.setHex(ledColors[Math.floor(R() * ledColors.length)]);
          col.multiplyScalar(0.8 + R() * 1.6);
          m4.makeTranslation(faceX, y + 0.02, z - 0.38 + k * 0.13);
          m4.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
          leds.setMatrixAt(li, m4);
          leds.setColorAt(li, col);
          li++;
        }
      }
    }
  }
  leds.count = li;
  scene.add(leds);
  // ceiling light strips
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.03, 0.12), new THREE.MeshBasicMaterial({ color: 0xaecbff, toneMapped: false }));
    s.position.set(0, 3.6, -i * 1.35);
    scene.add(s);
  }
  // mirror floor with a dark glossy veil on top so it reads as polished concrete
  const refl = new Reflector(new THREE.PlaneGeometry(40, 60), { color: 0x555d73, textureWidth: 1024, textureHeight: 1024, clipBias: 0.003 });
  refl.rotation.x = -Math.PI / 2;
  refl.position.set(0, 0, -20);
  scene.add(refl);
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshStandardMaterial({ color: 0x070a12, roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.62 }));
  veil.rotation.x = -Math.PI / 2;
  veil.position.set(0, 0.002, -20);
  scene.add(veil);
  addLights(scene, 0.5);
  const cam = new THREE.PerspectiveCamera(34, aspect, 0.1, 140);
  cam.position.set(0.2, 1.3, 5.2);
  cam.lookAt(0, 1.55, -20);
  bokeh(scene, 12, [10, 5], [-30, -20], [0x4d8dff, 0x9d7bff], [1.6, 3.0], 23, 0.22);
  return { scene, camera: cam, exposure: 1.0, dispose: () => {} };
};

// 6. Wafer: an iridescent silicon wafer with a grid of dies.
const wafer: Builder = (renderer, aspect) => {
  const scene = new THREE.Scene();
  setup(renderer, scene, 1.0);
  backdrop(scene, "#1b1a66", "#04050d");
  const map = tex(waferMap(2048, 5));
  const top = new THREE.MeshPhysicalMaterial({
    map, metalness: 0.8, roughness: 0.3, iridescence: 1, iridescenceIOR: 1.4, iridescenceThicknessRange: [200, 620],
    clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.9,
  });
  const edge = new THREE.MeshPhysicalMaterial({ color: 0x9aa3b4, metalness: 1, roughness: 0.25 });
  const geo = new THREE.CylinderGeometry(3.4, 3.4, 0.09, 192, 1);
  const w = new THREE.Mesh(geo, [edge, top, edge]);
  w.rotation.set(0.9, 0.0, 0.18);
  w.position.set(1.2, -0.2, 0);
  scene.add(w);
  // flat notch
  const notch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.2), new THREE.MeshBasicMaterial({ color: 0x04050d }));
  void notch;
  addLights(scene, 0.8);
  const spot = new THREE.SpotLight(0xdfe8ff, 120, 40, 0.6, 0.9, 2);
  spot.position.set(-5, 8, 6);
  spot.target = w;
  scene.add(spot);
  scene.add(dustField(180, [16, 9, 12], 0.06, 0x9db8ff, 15));
  bokeh(scene, 18, [20, 9], [-10, -5], [0x4d8dff, 0xa78bfa, 0x22d3ee], [1.4, 3.2], 25, 0.25);
  const cam = new THREE.PerspectiveCamera(30, aspect, 0.1, 100);
  cam.position.set(-0.6, 1.8, 10.5);
  cam.lookAt(1.0, -0.2, 0);
  return { scene, camera: cam, exposure: 1.05, dispose: () => {} };
};

// 7/8. Fibre: strands of light crossing frame with a sharp focal band and soft ends.
function fibre(seed: number, colors: number[], backColor: string): Builder {
  return (renderer, aspect) => {
    const scene = new THREE.Scene();
    setup(renderer, scene, 0.35);
    backdrop(scene, backColor, "#04050d", 0.62, 0.45);
    const R = rng(seed);
    const sprite = tex(glowSprite(128, 0.25));
    for (let i = 0; i < 34; i++) {
      const pts: THREE.Vector3[] = [];
      const y0 = (R() - 0.5) * 6;
      const z0 = -7 + R() * 9; // depth spread; near strands are thicker and softer
      const amp = 0.8 + R() * 1.8;
      const ph = R() * 6.28;
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const converge = (1 - t) * (y0 * 0.6) + t * y0 * 0.15; // strands gather toward the right
        pts.push(new THREE.Vector3(-13 + t * 26, converge + Math.sin(t * 4.2 + ph) * amp * (1 - t * 0.5), z0 + Math.cos(t * 2.4 + ph) * 1.1));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const nearness = (z0 + 7) / 9; // 0 far, 1 near
      const radius = 0.01 + nearness * 0.022;
      const c = new THREE.Color(colors[Math.floor(R() * colors.length)]).multiplyScalar(0.9 + (1 - nearness) * 0.8);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 200, radius, 8, false), new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: 0.55 + (1 - nearness) * 0.45 })));
      for (let g = 0; g < 4; g++) {
        const p = curve.getPoint(0.15 + R() * 0.75);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: c, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
        const sc = 0.35 + R() * 0.9 + nearness * 0.6;
        s.scale.set(sc, sc, 1);
        s.position.copy(p);
        scene.add(s);
      }
    }
    bokeh(scene, 16, [22, 10], [-10, -3], colors, [1.0, 3.0], seed + 3, 0.16);
    bokeh(scene, 5, [12, 6], [5, 9], colors, [1.6, 3.2], seed + 4, 0.1);
    const cam = new THREE.PerspectiveCamera(28, aspect, 0.1, 100);
    cam.position.set(0, 0.2, 13);
    cam.lookAt(0, 0, 0);
    return { scene, camera: cam, exposure: 1.0, dispose: () => {} };
  };
}

export const SCENES: Record<string, Builder> = {
  chip,
  board,
  neural,
  lens,
  rack,
  wafer,
  fibre: fibre(81, [0x4d8dff, 0x9d7bff, 0x22d3ee], "#12206a"),
  signal: fibre(95, [0xf5b04c, 0x4d8dff, 0xf5a3ff, 0x22d3ee], "#2a1450"),
};
