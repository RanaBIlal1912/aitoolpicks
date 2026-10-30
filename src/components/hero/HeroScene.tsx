"use client";

import { Float } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CAT_COLORS } from "@/data/palette";

// The home hero: a glass-and-light "AI core" (a torus knot with a clear-coat finish) wrapped by two orbit rings and a layer of floating polyhedra in the
// category colours, set in a shell of dust. The camera leans toward the pointer and pulls back as the page scrolls (scroll storytelling), so the scene
// reacts to the visitor without taking over the page. `lite` is the phone version: fewer particles and polygons, a lower pixel ratio, no extra polyhedra.
const COLORS = Object.values(CAT_COLORS).map((c) => c[0]);

function Core({ lite }: { lite: boolean }) {
  const knot = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (knot.current) {
      knot.current.rotation.y += dt * 0.35;
      knot.current.rotation.x += dt * 0.12;
    }
    if (ringA.current) ringA.current.rotation.z += dt * 0.25;
    if (ringB.current) ringB.current.rotation.z -= dt * 0.18;
  });
  return (
    <group>
      <mesh ref={knot}>
        <torusKnotGeometry args={[0.95, 0.3, lite ? 72 : 180, lite ? 12 : 28, 2, 3]} />
        <meshPhysicalMaterial color="#754BFF" metalness={0.35} roughness={0.18} clearcoat={1} clearcoatRoughness={0.1} emissive="#2a1a80" emissiveIntensity={0.7} />
      </mesh>
      <mesh ref={ringA} rotation={[1.1, 0.2, 0]}>
        <torusGeometry args={[2, 0.018, 8, lite ? 80 : 160]} />
        <meshBasicMaterial color="#25C6E8" />
      </mesh>
      <mesh ref={ringB} rotation={[0.4, 1.0, 0]}>
        <torusGeometry args={[2.5, 0.014, 8, lite ? 80 : 160]} />
        <meshBasicMaterial color="#FF4FA3" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshBasicMaterial color="#25C6E8" />
      </mesh>
    </group>
  );
}

const SHAPES = ["octahedron", "icosahedron", "dodecahedron", "tetrahedron"] as const;

function Shapes({ lite }: { lite: boolean }) {
  const items = useMemo(() => {
    const n = lite ? 4 : 10;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const r = 2.9 + (i % 3) * 0.55;
      return { pos: [Math.cos(a) * r, Math.sin(a * 1.7) * 1.5, Math.sin(a) * r * 0.7 - 0.5] as [number, number, number], shape: SHAPES[i % 4], color: COLORS[(i * 2) % COLORS.length], s: 0.2 + (i % 4) * 0.06 };
    });
  }, [lite]);
  return (
    <>
      {items.map((it, i) => (
        <Float key={i} speed={1.2 + (i % 3) * 0.4} rotationIntensity={1.2} floatIntensity={1.2}>
          <mesh position={it.pos} scale={it.s * 2.2}>
            {it.shape === "octahedron" && <octahedronGeometry args={[1, 0]} />}
            {it.shape === "icosahedron" && <icosahedronGeometry args={[1, 0]} />}
            {it.shape === "dodecahedron" && <dodecahedronGeometry args={[1, 0]} />}
            {it.shape === "tetrahedron" && <tetrahedronGeometry args={[1, 0]} />}
            <meshPhysicalMaterial color={it.color} metalness={0.2} roughness={0.25} clearcoat={0.8} emissive={it.color} emissiveIntensity={0.35} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function Dust({ lite }: { lite: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = lite ? 150 : 650;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const palette = ["#25C6E8", "#FF4FA3", "#754BFF", "#FFB020"].map((c) => new THREE.Color(c));
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      v.randomDirection().multiplyScalar(3.2 + Math.random() * 3.2);
      pos.set([v.x, v.y, v.z], i * 3);
      const c = palette[i % 4];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [lite]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.03;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={lite ? 0.05 : 0.04} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Rig() {
  const { camera, pointer } = useThree();
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 2.2);
    const scroll = Math.min(1, window.scrollY / 700);
    const z = 7.6 + scroll * 3.2; // pulls back as you scroll
    camera.position.x += (pointer.x * 0.9 - camera.position.x) * k;
    camera.position.y += (pointer.y * 0.55 - camera.position.y) * k;
    camera.position.z += (z - camera.position.z) * k;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene({ lite = false }: { lite?: boolean }) {
  return (
    <Canvas dpr={lite ? 1 : [1, 1.6]} camera={{ position: [0, 0, 7.6], fov: 42 }} gl={{ antialias: !lite, alpha: true, powerPreference: "low-power" }} aria-hidden="true">
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#ffffff" />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#25C6E8" />
      <pointLight position={[4, 2, -2]} intensity={26} color="#FF4FA3" />
      <Rig />
      <Core lite={lite} />
      <Shapes lite={lite} />
      <Dust lite={lite} />
    </Canvas>
  );
}
