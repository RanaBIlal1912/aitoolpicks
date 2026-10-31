"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import Studio from "./Studio";

// A friendly AI robot built from plain geometry (no imported model, no generated image). A procedural studio environment gives the glossy shell,
// visor and headphones real reflections; the product logos are textured tiles floating at different depths and drifting with the pointer.

export type SceneLogo = { id: string; src: string; tile: "light" | "dark" };

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
  glowTex = new THREE.CanvasTexture(c);
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
  const t = new THREE.CanvasTexture(c);
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
    t.anisotropy = 4;
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
    g.current.position.x = pos[0] + Math.sin(t * 0.7) * 0.12 + pointer.x * depth * 0.35;
    g.current.position.y = pos[1] + Math.sin(t * 1.1) * 0.16 + pointer.y * depth * 0.2;
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
  const seg = lite ? 24 : 48;

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
          <meshPhysicalMaterial {...SHELL} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={1.1} />
        </mesh>
        {/* visor: a cap cut from a slightly larger copy of the head so it follows the shell and has a clean edge */}
        <mesh scale={[1.18, 1, 1.02]}>
          <sphereGeometry args={[1.014, seg * 2, seg, Math.PI / 2 - 1.0, 2.0, Math.PI / 2 - 0.5, 1.0]} />
          <meshPhysicalMaterial color="#03051a" roughness={0.05} metalness={0.5} clearcoat={1} clearcoatRoughness={0.03} envMapIntensity={1.6} emissive="#0a1450" emissiveIntensity={0.6} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
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
              <meshPhysicalMaterial color="#6b4bff" roughness={0.25} metalness={0.45} clearcoat={0.8} emissive="#3b1fd0" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[s * 0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.22, 0.04, 12, 32]} />
              <meshBasicMaterial color={GLOW} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[1.22, 0.07, 14, 64, Math.PI]} />
          <meshPhysicalMaterial color="#6b4bff" roughness={0.25} metalness={0.45} clearcoat={0.8} emissive="#3b1fd0" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 1.08, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.22, 10]} />
          <meshStandardMaterial color="#aab4ff" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.24, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#ff5bd8" toneMapped={false} />
        </mesh>
      </group>

      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.2, 24]} />
        <meshStandardMaterial color="#8b94d6" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.25, 0]} scale={[1, 1.12, 0.82]}>
        <capsuleGeometry args={[0.62, 0.55, 12, seg]} />
        <meshPhysicalMaterial {...SHELL} clearcoat={0.9} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[0, -0.12, 0.56]}>
        <planeGeometry args={[0.62, 0.62]} />
        <meshBasicMaterial map={chest} transparent toneMapped={false} />
      </mesh>

      <group position={[-0.82, 0.05, 0]} rotation={[0, 0, 0.5]}>
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.17, 0.5, 8, 20]} />
          <meshPhysicalMaterial {...SHELL} clearcoat={0.8} />
        </mesh>
        <mesh position={[0, -0.82, 0]}>
          <sphereGeometry args={[0.21, 20, 20]} />
          <meshPhysicalMaterial color="#6b4bff" roughness={0.25} metalness={0.4} emissive="#3b1fd0" emissiveIntensity={0.45} />
        </mesh>
      </group>
      <group position={[0.82, 0.1, 0]} rotation={[0, 0, -0.9]}>
        <mesh position={[0, -0.34, 0]}>
          <capsuleGeometry args={[0.17, 0.46, 8, 20]} />
          <meshPhysicalMaterial {...SHELL} clearcoat={0.8} />
        </mesh>
        <group ref={hand} position={[0, -0.78, 0.05]}>
          <mesh>
            <sphereGeometry args={[0.24, 24, 24]} />
            <meshPhysicalMaterial {...SHELL} clearcoat={0.8} />
          </mesh>
          <mesh position={[0.02, -0.26, 0.1]} rotation={[0.5, 0, 0]}>
            <capsuleGeometry args={[0.07, 0.3, 6, 14]} />
            <meshPhysicalMaterial {...SHELL} clearcoat={0.8} />
          </mesh>
          <mesh position={[0.02, -0.46, 0.18]}>
            <sphereGeometry args={[0.095, 14, 14]} />
            <meshBasicMaterial color={GLOW} toneMapped={false} />
          </mesh>
        </group>
      </group>

      <mesh ref={ring} position={[0, -0.55, 0]} rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[1.75, 0.025, 12, 128]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} transparent opacity={0.95} />
      </mesh>
      <mesh ref={ring2} position={[0, -0.55, 0]} rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[1.98, 0.015, 12, 128]} />
        <meshBasicMaterial color="#b06bff" toneMapped={false} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.4, 5.4]} />
        <meshBasicMaterial map={glowTexture()} color="#4a7bff" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

const SLOTS: { pos: [number, number, number]; size: number; depth: number }[] = [
  { pos: [-2.15, 1.7, 0.6], size: 0.95, depth: 1.0 },
  { pos: [1.45, 2.55, -0.8], size: 0.95, depth: 0.5 },
  { pos: [2.5, 1.25, 0.2], size: 0.85, depth: 0.9 },
  { pos: [-2.55, -0.1, -0.4], size: 0.8, depth: 0.6 },
  { pos: [2.45, -0.6, 0.9], size: 0.85, depth: 1.1 },
  { pos: [-1.9, -1.55, 0.7], size: 0.78, depth: 0.8 },
];

export default function RobotScene({ lite = false, active = true, logos = [], onReady }: { lite?: boolean; active?: boolean; logos?: SceneLogo[]; onReady?: () => void }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={lite ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0.5, 9.3], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => onReady?.()}
    >
      <Studio />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <pointLight position={[-4, 1, 3]} intensity={42} color="#35e0ff" />
      <pointLight position={[4, -1, 2]} intensity={38} color="#ff4fd8" />
      <pointLight position={[0, 2.5, -3]} intensity={34} color="#6b4bff" />
      <Sparkles count={lite ? 40 : 90} scale={[9, 6, 4]} size={lite ? 2.5 : 3.2} speed={0.35} opacity={0.85} color="#a8e8ff" />
      <Robot lite={lite} />
      {logos.slice(0, SLOTS.length).map((l, i) => (
        <LogoTile key={l.id} logo={l} pos={SLOTS[i].pos} size={SLOTS[i].size} depth={SLOTS[i].depth} phase={i * 1.3} />
      ))}
    </Canvas>
  );
}
