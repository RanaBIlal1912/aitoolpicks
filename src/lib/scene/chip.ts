import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { BLUE_VIOLET, brushedRoughness, circuitMaps, dieMaps, glowSprite, rng, type Palette } from "./procedural";

function texture(c: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export type Chip = { group: THREE.Group; update: (t: number) => void; dispose: () => void };

/**
 * A photoreal-style AI accelerator package: printed board with glowing traces, a nickel frame, an
 * iridescent silicon die, surface-mount parts and gold edge pads. All materials are physically based and
 * lit by an environment map, so reflections and depth come from the lighting rather than from tricks.
 */
export function buildChip(opts: { seed?: number; palette?: Palette; texSize?: number } = {}): Chip {
  const seed = opts.seed ?? 7;
  const pal = opts.palette ?? BLUE_VIOLET;
  const size = opts.texSize ?? 1024;
  const R = rng(seed);
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const keep = <T extends { dispose: () => void }>(o: T): T => (disposables.push(o), o);

  const board = circuitMaps(size, seed, pal);
  const die = dieMaps(size, seed + 11);

  const boardMat = keep(
    new THREE.MeshPhysicalMaterial({
      map: keep(texture(board.map)),
      emissiveMap: keep(texture(board.emissive)),
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.5,
      bumpMap: keep(texture(board.bump, false)),
      bumpScale: 2.6,
      roughness: 0.62,
      metalness: 0.2,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.55,
    }),
  );
  const boardMesh = new THREE.Mesh(keep(new RoundedBoxGeometry(4.4, 0.16, 4.4, 3, 0.04)), boardMat);
  group.add(boardMesh);

  const nickel = keep(
    new THREE.MeshPhysicalMaterial({
      color: 0x9aa3b4,
      metalness: 1,
      roughness: 1,
      roughnessMap: keep(texture(brushedRoughness(512, seed + 2, 0.34), false)),
      envMapIntensity: 1.1,
    }),
  );
  const frame = new THREE.Mesh(keep(new RoundedBoxGeometry(2.78, 0.1, 2.78, 3, 0.03)), nickel);
  frame.position.y = 0.12;
  group.add(frame);

  const dieMat = keep(
    new THREE.MeshPhysicalMaterial({
      map: keep(texture(die.map)),
      roughnessMap: keep(texture(die.rough, false)),
      bumpMap: keep(texture(die.bump, false)),
      bumpScale: 2.0,
      metalness: 0.95,
      roughness: 1,
      iridescence: 1,
      iridescenceIOR: 1.45,
      iridescenceThicknessRange: [220, 640],
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.1,
    }),
  );
  const dieMesh = new THREE.Mesh(keep(new RoundedBoxGeometry(2.4, 0.16, 2.4, 3, 0.02)), dieMat);
  dieMesh.position.y = 0.2;
  group.add(dieMesh);

  // Surface-mount capacitors in the ring between the frame and the board edge.
  const bodyMat = keep(new THREE.MeshPhysicalMaterial({ color: 0x2b2522, roughness: 0.5, metalness: 0.1, clearcoat: 0.3 }));
  const capMat = keep(new THREE.MeshPhysicalMaterial({ color: 0xc3c9d4, roughness: 0.3, metalness: 1 }));
  const count = 84;
  const bodies = new THREE.InstancedMesh(keep(new THREE.BoxGeometry(0.13, 0.06, 0.075)), bodyMat, count);
  const caps = new THREE.InstancedMesh(keep(new THREE.BoxGeometry(0.03, 0.064, 0.08)), capMat, count * 2);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  let placed = 0;
  let guard = 0;
  while (placed < count && guard++ < 2000) {
    const x = (R() * 2 - 1) * 1.98;
    const z = (R() * 2 - 1) * 1.98;
    if (Math.abs(x) < 1.55 && Math.abs(z) < 1.55) continue;
    const rot = R() < 0.5 ? 0 : Math.PI / 2;
    q.setFromEuler(e.set(0, rot, 0));
    m4.compose(new THREE.Vector3(x, 0.11, z), q, new THREE.Vector3(1, 1, 1));
    bodies.setMatrixAt(placed, m4);
    for (const s of [-1, 1]) {
      const ox = Math.cos(rot) * 0.05 * s;
      const oz = -Math.sin(rot) * 0.05 * s;
      m4.compose(new THREE.Vector3(x + ox, 0.11, z + oz), q, new THREE.Vector3(1, 1, 1));
      caps.setMatrixAt(placed * 2 + (s > 0 ? 1 : 0), m4);
    }
    placed++;
  }
  bodies.count = placed;
  caps.count = placed * 2;
  group.add(bodies, caps);

  // Gold edge pads.
  const goldMat = keep(new THREE.MeshPhysicalMaterial({ color: 0xdcb765, metalness: 1, roughness: 0.26, envMapIntensity: 1.2 }));
  const pads = new THREE.InstancedMesh(keep(new THREE.BoxGeometry(0.1, 0.028, 0.24)), goldMat, 4 * 26);
  let pi = 0;
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < 26; i++) {
      const u = -2 + (i / 25) * 4;
      const a = (side * Math.PI) / 2;
      const px = Math.cos(a) * 2.04 - Math.sin(a) * u;
      const pz = Math.sin(a) * 2.04 + Math.cos(a) * u;
      q.setFromEuler(e.set(0, -a, 0));
      m4.compose(new THREE.Vector3(px, 0.085, pz), q, new THREE.Vector3(1, 1, 1));
      pads.setMatrixAt(pi++, m4);
    }
  }
  group.add(pads);

  // Orientation mark in one corner.
  const mark = new THREE.Mesh(
    keep(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 3)),
    keep(new THREE.MeshStandardMaterial({ color: 0xe8ecf6, roughness: 0.35, metalness: 0.2 })),
  );
  mark.position.set(-1.95, 0.095, -1.95);
  group.add(mark);

  return {
    group,
    update(t: number) {
      boardMat.emissiveIntensity = 1.3 + 0.35 * Math.sin(t * 0.9);
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}

/** Image-based lighting from a neutral studio room, so metals and glass have something real to reflect. */
export function makeEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(new RoomEnvironment(), 0.04);
  pmrem.dispose();
  return rt.texture;
}

/** Cinematic three-point rig with a cool key, violet rim and blue fill. */
export function addLights(scene: THREE.Scene, strength = 1): THREE.Light[] {
  const key = new THREE.DirectionalLight(0xbcd2ff, 1.5 * strength);
  key.position.set(4, 7, 5);
  const rim = new THREE.PointLight(0x9d6bff, 110 * strength, 24, 2);
  rim.position.set(-6, 2.5, -3.5);
  const fill = new THREE.PointLight(0x3f7dff, 55 * strength, 24, 2);
  fill.position.set(5, -1.5, 4.5);
  const amb = new THREE.AmbientLight(0x1a2240, 0.6 * strength);
  scene.add(key, rim, fill, amb);
  return [key, rim, fill, amb];
}

/** Soft light dust: tiny additive sprites scattered in depth. */
export function dustField(count: number, spread: [number, number, number], size = 0.05, color = 0x9db8ff, seed = 3): THREE.Points {
  const R = rng(seed);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (R() - 0.5) * spread[0];
    pos[i * 3 + 1] = (R() - 0.5) * spread[1];
    pos[i * 3 + 2] = (R() - 0.5) * spread[2];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const sprite = new THREE.CanvasTexture(glowSprite(64));
  const m = new THREE.PointsMaterial({
    size,
    map: sprite,
    color,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  return new THREE.Points(g, m);
}
