"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const a = new THREE.Color("#3b82f6");
    const b = new THREE.Color("#a78bfa");
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 7;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      p[i * 3] = r * Math.sin(ph) * Math.cos(th);
      p[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
      p[i * 3 + 2] = r * Math.cos(ph) - 2;
      tmp.copy(a).lerp(b, Math.random());
      c[i * 3] = tmp.r;
      c[i * 3 + 1] = tmp.g;
      c[i * 3 + 2] = tmp.b;
    }
    return { positions: p, colors: c };
  }, [count]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.025;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

function Rig({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringC = useRef<THREE.Mesh>(null);
  const cube = useRef<THREE.Mesh>(null);
  const octa = useRef<THREE.Mesh>(null);
  const knot = useRef<THREE.Mesh>(null);
  const tetra = useRef<THREE.Mesh>(null);
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);

  // Keep the shapes on the right so they never sit behind the headline; centre and shrink them on phones.
  const scale = size.width < 520 ? 0.62 : size.width < 900 ? 0.68 : 1;
  const baseX = size.width >= 640 ? viewport.width * (size.width < 900 ? 0.3 : 0.21) : 0;

  useFrame((state, dt) => {
    if (!animate) return;
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (g) {
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, state.pointer.x * 0.5, 0.05);
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -state.pointer.y * 0.3, 0.05);
      g.position.y = Math.sin(t * 0.6) * 0.12;
    }
    if (core.current) {
      core.current.rotation.x += dt * 0.18;
      core.current.rotation.y += dt * 0.3;
    }
    if (ringA.current) ringA.current.rotation.x += dt * 0.4;
    if (ringB.current) ringB.current.rotation.y -= dt * 0.35;
    if (ringC.current) ringC.current.rotation.z += dt * 0.25;
    if (cube.current) {
      cube.current.rotation.x += dt * 0.5;
      cube.current.rotation.y += dt * 0.4;
      cube.current.position.y = 2.1 + Math.sin(t * 0.9) * 0.25;
    }
    if (octa.current) {
      octa.current.rotation.y += dt * 0.6;
      octa.current.position.y = -2 + Math.cos(t * 0.8) * 0.22;
    }
    if (knot.current) {
      knot.current.rotation.x += dt * 0.35;
      knot.current.rotation.z += dt * 0.25;
      knot.current.position.y = -0.2 + Math.sin(t * 0.7 + 1) * 0.3;
    }
    if (tetra.current) {
      tetra.current.rotation.y -= dt * 0.55;
      tetra.current.position.y = 1.3 + Math.cos(t * 0.65) * 0.2;
    }
  });

  return (
    <group position={[baseX, 0, 0]} scale={scale}>
      <group ref={group}>
        <group ref={core}>
          <mesh>
            <icosahedronGeometry args={[1.35, 1]} />
            <meshStandardMaterial color="#2f66ff" emissive="#1c3fcf" emissiveIntensity={0.55} metalness={0.75} roughness={0.22} flatShading />
          </mesh>
          <mesh scale={1.5}>
            <icosahedronGeometry args={[1.35, 1]} />
            <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.4} />
          </mesh>
          <mesh scale={0.5}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial color="#a5f3fc" />
          </mesh>
        </group>

        <mesh ref={ringA} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[2.5, 0.022, 12, 120]} />
          <meshBasicMaterial color="#60a5fa" />
        </mesh>
        <mesh ref={ringB} rotation={[0.4, 0, 0.7]}>
          <torusGeometry args={[3.05, 0.02, 12, 120]} />
          <meshBasicMaterial color="#a78bfa" />
        </mesh>
        <mesh ref={ringC} rotation={[1.1, 0.6, 0]}>
          <torusGeometry args={[3.6, 0.016, 12, 120]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} />
        </mesh>

        <mesh ref={cube} position={[-1.8, 2.1, -0.4]}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#5b30d9" emissiveIntensity={0.6} metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh ref={octa} position={[2.9, -2, 0.5]}>
          <octahedronGeometry args={[0.6]} />
          <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.5} metalness={0.6} roughness={0.25} flatShading />
        </mesh>
        <mesh ref={knot} position={[3.4, 0.6, -1]}>
          <torusKnotGeometry args={[0.38, 0.12, 80, 12]} />
          <meshStandardMaterial color="#c4b5fd" emissive="#7c3aed" emissiveIntensity={0.45} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh ref={tetra} position={[-2.4, -1.1, 0.3]}>
          <tetrahedronGeometry args={[0.55]} />
          <meshStandardMaterial color="#60a5fa" emissive="#2563eb" emissiveIntensity={0.5} metalness={0.7} roughness={0.25} flatShading />
        </mesh>
      </group>
    </group>
  );
}

export default function HeroScene({
  active,
  reduced,
  eventSource,
}: {
  active: boolean;
  reduced: boolean;
  eventSource: HTMLElement | null;
}) {
  const small = typeof window !== "undefined" && window.innerWidth < 700;
  return (
    <Canvas
      className="!absolute inset-0"
      frameloop={reduced ? "demand" : active ? "always" : "never"}
      dpr={[1, small ? 1.4 : 1.75]}
      camera={{ position: [0, 0, 9], fov: 45 }}
      gl={{ antialias: !small, alpha: true, powerPreference: "low-power" }}
      eventSource={eventSource ?? undefined}
      eventPrefix="client"
      aria-hidden="true"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 8]} intensity={1.5} />
      <pointLight position={[-6, 3, 4]} intensity={80} color="#3b82f6" />
      <pointLight position={[6, -3, 3]} intensity={70} color="#8b5cf6" />
      <Rig animate={!reduced} />
      <Particles count={small ? 260 : 620} />
    </Canvas>
  );
}
