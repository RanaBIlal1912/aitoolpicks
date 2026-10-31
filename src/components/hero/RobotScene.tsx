"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// A friendly AI robot built from plain geometry (no imported model, no generated image). A procedural studio environment gives the glossy shell,
// visor and headphones real reflections; the product logos are textured tiles floating at different depths and drifting with the pointer.

export type SceneLogo = { id: string; src: string; tile: "light" | "dark" };

/** The glowing fingertip and the cube, shared so the light trail can follow both as they move. */
const tipObj: { current: THREE.Object3D | null } = { current: null };
const cubeObj: { current: THREE.Object3D | null } = { current: null };


// Painted "matcap" shading: each material is a small picture of a lit glossy sphere (soft top light, cyan and magenta rim light, darker underside),
// so the robot looks polished and coloured by the scene without lights, an environment map or heavy physical shaders. That keeps start-up cheap
// on modest graphics hardware, where compiling physically based shaders and building a reflection map froze the page for seconds.
type Mc = { top: string; mid: string; low: string; rimL?: string; rimR?: string; spec?: number };
const MATCAPS: Record<string, Mc> = {
  shell: { top: "#ffffff", mid: "#dfe5ff", low: "#8c97dd", rimL: "#35e0ff", rimR: "#ff6fe0", spec: 1 },
  visor: { top: "#3a4aa8", mid: "#080c3a", low: "#02030f", rimL: "#35e0ff", rimR: "#8b5cff", spec: 1 },
  purple: { top: "#c9b8ff", mid: "#7a52ff", low: "#2c1a9a", rimL: "#35e0ff", rimR: "#ff6fe0", spec: 0.9 },
  metal: { top: "#f2f4ff", mid: "#9aa3d8", low: "#454c8a", rimL: "#35e0ff", spec: 0.8 },
  glass: { top: "#d9f3ff", mid: "#58b8ff", low: "#2f6bff", rimL: "#8ff3ff", rimR: "#b08bff", spec: 0.9 },
};
/** Painted textures that are drawn at about their own size need no mipmaps; skipping them saves work at start-up. */
function flat(t: THREE.CanvasTexture) {
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}
const mcCache: Record<string, THREE.CanvasTexture> = {};
function mc(name: keyof typeof MATCAPS) {
  if (mcCache[name]) return mcCache[name];
  const m = MATCAPS[name];
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
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
  const t = flat(new THREE.CanvasTexture(c));
  t.colorSpace = THREE.SRGBColorSpace;
  mcCache[name] = t;
  return t;
}

const SHELL = { color: "#eef1ff", roughness: 0.22, metalness: 0.1 } as const;
const GLOW = "#35e0ff";

/** Soft round glow (no hard edge), shared by the logo halos and the floor light. */
let glowTex: THREE.CanvasTexture | null = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,0.95)");
  r.addColorStop(0.35, "rgba(255,255,255,0.35)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  glowTex = flat(new THREE.CanvasTexture(c));
  return glowTex;
}

function chestTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
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
  const t = flat(new THREE.CanvasTexture(c));
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A rounded product tile with the logo drawn on it. The logo file is loaded once; the texture updates when it arrives. */
function useLogoTexture(src: string, tile: "light" | "dark") {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 2;
    const g = c.getContext("2d")!;
    const base = () => {
      g.clearRect(0, 0, 256, 256);
      g.fillStyle = tile === "light" ? "#f4f6fc" : "#10131f";
      g.beginPath();
      g.roundRect(6, 6, 244, 244, 58);
      g.fill();
    };
    base();
    const img = new Image();
    img.onload = () => {
      base();
      const pad = 54;
      const r = Math.min((256 - pad * 2) / img.width, (256 - pad * 2) / img.height);
      g.drawImage(img, (256 - img.width * r) / 2, (256 - img.height * r) / 2, img.width * r, img.height * r);
      t.needsUpdate = true;
    };
    img.src = src;
    return t;
  }, [src, tile]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function LogoTile({ logo, pos, size, phase, depth }: { logo: SceneLogo; pos: [number, number, number]; size: number; phase: number; depth: number }) {
  const g = useRef<THREE.Group>(null);
  const tex = useLogoTexture(logo.src, logo.tile);
  const { pointer } = useThree();
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime + phase;
    g.current.position.x = pos[0] + Math.sin(t * 0.7) * 0.1 + pointer.x * depth * 0.16;
    g.current.position.y = pos[1] + Math.sin(t * 1.1) * 0.14 + pointer.y * depth * 0.14;
    g.current.position.z = pos[2];
    g.current.rotation.y = Math.sin(t * 0.6) * 0.35 + pointer.x * 0.2;
    g.current.rotation.x = Math.cos(t * 0.5) * 0.12;
  });
  return (
    <group ref={g} position={pos}>
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[size * 2.1, size * 2.1]} />
        <meshBasicMaterial map={glowTexture()} color="#7a6bff" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

function Eye({ x }: { x: number }) {
  return (
    <mesh position={[x, 0.1, 1.05]}>
      <torusGeometry args={[0.15, 0.045, 14, 32, Math.PI]} />
      <meshBasicMaterial color={GLOW} toneMapped={false} />
    </mesh>
  );
}

function Robot({ lite }: { lite: boolean }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const chest = useMemo(() => chestTexture(), []);
  const { pointer } = useThree();
  const seg = lite ? 16 : 24;

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    if (root.current) {
      root.current.position.y = -0.85 + Math.sin(t * 1.2) * 0.1;
      root.current.rotation.y += (-0.3 + pointer.x * 0.3 - root.current.rotation.y) * Math.min(1, dt * 2.5);
      root.current.rotation.z = Math.sin(t * 0.8) * 0.02;
    }
    if (head.current) {
      head.current.rotation.y += (pointer.x * 0.45 - head.current.rotation.y) * Math.min(1, dt * 4);
      head.current.rotation.x += (-pointer.y * 0.25 - head.current.rotation.x) * Math.min(1, dt * 4);
    }
    if (hand.current) hand.current.rotation.z = -0.25 + Math.sin(t * 2.2) * 0.07;
    if (ring.current) ring.current.rotation.z += dt * 0.5;
    if (ring2.current) ring2.current.rotation.z -= dt * 0.3;
  });

  return (
    <group ref={root} position={[0, -0.85, 0]}>
      <group ref={head} position={[0, 1.35, 0]}>
        <mesh scale={[1.18, 1, 1.02]}>
          <sphereGeometry args={[1, seg, seg]} />
          <meshMatcapMaterial matcap={mc("shell")} />
        </mesh>
        {/* visor: a cap cut from a slightly larger copy of the head so it follows the shell and has a clean edge */}
        <mesh scale={[1.18, 1, 1.02]}>
          <sphereGeometry args={[1.014, seg * 2, seg, Math.PI / 2 - 1.0, 2.0, Math.PI / 2 - 0.5, 1.0]} />
          <meshMatcapMaterial matcap={mc("visor")} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>
        <Eye x={-0.36} />
        <Eye x={0.36} />
        <mesh position={[0, -0.2, 1.04]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.17, 0.04, 14, 32, Math.PI]} />
          <meshBasicMaterial color={GLOW} toneMapped={false} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 1.22, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.36, 0.36, 0.3, seg]} />
              <meshMatcapMaterial matcap={mc("purple")} />
            </mesh>
            <mesh position={[s * 0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.22, 0.04, 12, 32]} />
              <meshBasicMaterial color={GLOW} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[1.22, 0.07, 10, 48, Math.PI]} />
          <meshMatcapMaterial matcap={mc("purple")} />
        </mesh>
        <mesh position={[0, 1.08, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.22, 10]} />
          <meshMatcapMaterial matcap={mc("metal")} />
        </mesh>
        <mesh position={[0, 1.24, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#ff5bd8" toneMapped={false} />
        </mesh>
      </group>

      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.2, 24]} />
        <meshMatcapMaterial matcap={mc("metal")} />
      </mesh>
      <mesh position={[0, -0.25, 0]} scale={[1, 1.12, 0.82]}>
        <capsuleGeometry args={[0.62, 0.55, 8, seg]} />
        <meshMatcapMaterial matcap={mc("shell")} />
      </mesh>
      <mesh position={[0, -0.1, 0.56]}>
        <planeGeometry args={[0.88, 0.88]} />
        <meshBasicMaterial map={chest} transparent toneMapped={false} />
      </mesh>

      <group position={[-0.82, 0.05, 0]} rotation={[0, 0, 0.5]}>
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.17, 0.5, 8, 20]} />
          <meshMatcapMaterial matcap={mc("shell")} />
        </mesh>
        <mesh position={[0, -0.82, 0]}>
          <sphereGeometry args={[0.21, 20, 20]} />
          <meshMatcapMaterial matcap={mc("purple")} />
        </mesh>
      </group>
      <group position={[0.82, 0.1, 0]} rotation={[0, 0, -0.9]}>
        <mesh position={[0, -0.34, 0]}>
          <capsuleGeometry args={[0.17, 0.46, 8, 20]} />
          <meshMatcapMaterial matcap={mc("shell")} />
        </mesh>
        <group ref={hand} position={[0, -0.78, 0.05]}>
          <mesh>
            <sphereGeometry args={[0.24, 24, 24]} />
            <meshMatcapMaterial matcap={mc("shell")} />
          </mesh>
          <mesh position={[0.02, -0.26, 0.1]} rotation={[0.5, 0, 0]}>
            <capsuleGeometry args={[0.07, 0.3, 6, 14]} />
            <meshMatcapMaterial matcap={mc("shell")} />
          </mesh>
          <mesh ref={(o) => { tipObj.current = o; }} position={[0.02, -0.46, 0.18]}>
            <sphereGeometry args={[0.095, 12, 12]} />
            <meshBasicMaterial color={GLOW} toneMapped={false} />
          </mesh>
        </group>
      </group>

      <mesh ref={ring} position={[0, -0.55, 0]} rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[1.75, 0.025, 8, 96]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} transparent opacity={0.95} />
      </mesh>
      <mesh ref={ring2} position={[0, -0.55, 0]} rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[1.98, 0.015, 8, 96]} />
        <meshBasicMaterial color="#b06bff" toneMapped={false} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.4, 5.4]} />
        <meshBasicMaterial map={glowTexture()} color="#4a7bff" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}


let cubeTex: THREE.CanvasTexture | null = null;
function cubeFace() {
  if (cubeTex) return cubeTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
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
  cubeTex = flat(new THREE.CanvasTexture(c));
  cubeTex.colorSpace = THREE.SRGBColorSpace;
  return cubeTex;
}

/** A glowing glass cube with "AI" on it, floating where the robot points (the hero of the reference artwork). */
function AiCube({ lite }: { lite: boolean }) {
  const g = useRef<THREE.Group | null>(null);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.15, 1.15, 1.15)), []);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    g.current.position.y = (lite ? -0.5 : -0.45) + Math.sin(t * 1.3) * 0.12;
    g.current.rotation.y = -0.5 + Math.sin(t * 0.6) * 0.35;
    g.current.rotation.x = 0.18 + Math.sin(t * 0.8) * 0.06;
  });
  return (
    <group ref={(o) => { g.current = o; cubeObj.current = o; }} position={lite ? [1.38, -0.5, 0.7] : [1.72, -0.45, 0.7]} scale={lite ? 0.74 : 0.9}>
      <mesh>
        <boxGeometry args={[1.15, 1.15, 1.15]} />
        <meshMatcapMaterial matcap={mc("glass")} transparent opacity={0.6} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#8ff3ff" toneMapped={false} />
      </lineSegments>
      <mesh position={[0, 0, 0.585]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial map={cubeFace()} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[lite ? 2.5 : 2.9, lite ? 2.5 : 2.9]} />
        <meshBasicMaterial map={glowTexture()} color="#4aa8ff" transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

const TRAIL_N = 44;

/** A soft, flowing light trail from the robot's fingertip to the AI cube: a string of glow points on a curve, with a brighter pulse travelling along it. */
function Trail() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
    return g;
  }, []);
  const v = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() }), []);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame((st) => {
    if (!tipObj.current || !cubeObj.current) return;
    const { a, b, c } = v;
    tipObj.current.getWorldPosition(a);
    cubeObj.current.getWorldPosition(b);
    c.set((a.x + b.x) / 2 - 0.05, Math.max(a.y, b.y) + 0.7, (a.z + b.z) / 2 + 0.3);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    const head = (st.clock.elapsedTime * 0.5) % 1.5;
    for (let i = 0; i < TRAIL_N; i++) {
      const u = i / (TRAIL_N - 1);
      const w = 1 - u;
      pos.setXYZ(i, w * w * a.x + 2 * w * u * c.x + u * u * b.x, w * w * a.y + 2 * w * u * c.y + u * u * b.y, w * w * a.z + 2 * w * u * c.z + u * u * b.z);
      const k = (0.55 + 1.1 * Math.exp(-((u - head) ** 2) / 0.015)) * Math.min(1, u * 6 + 0.3) * Math.min(1, (1 - u) * 5 + 0.2);
      col.setXYZ(i, 0.3 * k, 0.85 * k, 1 * k);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={glowTexture()} size={0.34} sizeAttenuation vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  );
}

const SLOTS: { pos: [number, number, number]; size: number; depth: number }[] = [
  { pos: [-2.0, 1.95, 0.7], size: 1.15, depth: 1.0 },
  { pos: [1.05, 2.55, -0.8], size: 1.1, depth: 0.5 },
  { pos: [2.0, 1.45, -0.3], size: 1.0, depth: 0.9 },
  { pos: [-2.55, 0.35, -0.3], size: 0.98, depth: 0.6 },
  { pos: [-2.15, -1.8, 0.8], size: 0.95, depth: 0.8 },
  { pos: [2.05, -1.95, -0.2], size: 0.9, depth: 1.1 },
];
/** Phone version: the same arrangement pulled in so every tile stays on a 375 px screen. */
const SLOTS_LITE: { pos: [number, number, number]; size: number; depth: number }[] = [
  { pos: [-1.5, 2.0, 0.7], size: 0.95, depth: 1.0 },
  { pos: [1.0, 2.4, -0.8], size: 0.9, depth: 0.5 },
  { pos: [1.95, 1.3, -0.3], size: 0.82, depth: 0.9 },
  { pos: [-2.0, 0.5, -0.3], size: 0.8, depth: 0.6 },
  { pos: [-1.65, -1.75, 0.8], size: 0.78, depth: 0.8 },
  { pos: [1.95, -1.9, -0.2], size: 0.76, depth: 1.1 },
];

/** Compiles every shader off the main thread (where the browser supports it) before the first frame, so building the scene does not freeze the page. */
function Warm({ onWarm }: { onWarm: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        await gl.compileAsync(scene, camera);
      } catch {
        /* compile on first draw instead */
      }
      if (live) onWarm();
    })();
    return () => {
      live = false;
    };
  }, [gl, scene, camera, onWarm]);
  return null;
}


/** probe: first frames at 1x resolution; full: 60 fps and sharper; smooth: about 30 fps; calm: about 15 fps; still: a picture that updates on pointer movement. */
type Mode = "probe" | "full" | "smooth" | "calm" | "still";

/** Watches the first frames and picks the richest mode the device can sustain. */
function Governor({ on, setMode }: { on: boolean; setMode: (m: Mode) => void }) {
  const { invalidate } = useThree();
  const n = useRef(0);
  const sum = useRef(0);
  const done = useRef(false);
  useFrame((_, dt) => {
    if (!on || done.current) return;
    n.current++;
    // The first frames include shader linking and texture upload, so they are not counted. Five frames are enough to tell a fast device from a slow one.
    if (n.current <= 3) return;
    sum.current += dt;
    if (n.current >= 8) {
      done.current = true;
      const avg = sum.current / 5;
      setMode(avg > 0.06 ? "still" : avg > 0.036 ? "calm" : avg > 0.021 ? "smooth" : "full");
    }
  });
  useEffect(() => {
    // In "still" mode a frame is drawn when the pointer moves; at most about ten a second, so a slow device is never flooded.
    let last = 0;
    const move = () => {
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      invalidate();
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [invalidate]);
  return null;
}

/** Draws on a timer instead of every display frame: the scene animates slowly, so fewer frames cost less main-thread time and look the same. */
function Pulse({ on, every }: { on: boolean; every: number }) {
  const invalidate = useThree((t) => t.invalidate);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(invalidate, every);
    return () => clearInterval(id);
  }, [on, every, invalidate]);
  return null;
}

export default function RobotScene({ lite = false, active = true, logos = [], onReady }: { lite?: boolean; active?: boolean; logos?: SceneLogo[]; onReady?: () => void }) {
  const [warm, setWarm] = useState(false);
  const [mode, setMode] = useState<Mode>("probe");
  // The scene is built in steps (robot, then logos, then the cube and trail, then particles) so no single piece of start-up work blocks the page for long.
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!warm) return;
    const ids = [200, 500, 800].map((ms, i) => window.setTimeout(() => setStage(i + 1), ms));
    return () => ids.forEach(clearTimeout);
  }, [warm]);
  const live = active && warm;
  const timed = mode === "smooth" || mode === "calm";
  const slots = lite ? SLOTS_LITE : SLOTS;
  return (
    <Canvas
      eventSource={typeof document === "undefined" ? undefined : document.documentElement}
      eventPrefix="client"
      frameloop={live ? (mode === "probe" || mode === "full" ? "always" : "demand") : "never"}
      dpr={mode === "full" ? (lite ? [1, 1.5] : [1, 1.5]) : 1}
      camera={{ position: [0, 0.5, lite ? 10.4 : 9.4], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Pulse on={live && timed} every={mode === "calm" ? 66 : 33} />
      <Governor on={live} setMode={setMode} />
      <Warm onWarm={() => { setWarm(true); onReady?.(); }} />
      {/* the whole scene sits a little right of the canvas centre, because the canvas reaches further to the left (towards the headline) than to the right */}
      <group position={[lite ? 0.12 : 0.35, 0, 0]}>
        {stage >= 3 && <Sparkles count={lite ? 36 : 80} scale={[9, 6, 4]} size={lite ? 2.5 : 3.2} speed={0.35} opacity={0.85} color="#a8e8ff" />}
        <Robot lite={lite} />
        {stage >= 2 && <AiCube lite={lite} />}
        {stage >= 1 && logos.slice(0, slots.length).map((l, i) => (
          <LogoTile key={l.id} logo={l} pos={slots[i].pos} size={slots[i].size} depth={slots[i].depth} phase={i * 1.3} />
        ))}
      </group>
      {/* the trail works in world coordinates, so it stays outside the shifted group */}
      {stage >= 2 && <Trail />}
    </Canvas>
  );
}
