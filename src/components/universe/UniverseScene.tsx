"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type UniverseItem = { slug: string; label: string; count: number; color: string };

function Node({ item, pos, lite, onSelect }: { item: UniverseItem; pos: THREE.Vector3; lite: boolean; onSelect: (slug: string) => void }) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hot, setHot] = useState(false);
  const size = 0.2 + Math.min(item.count, 14) * 0.012;
  useFrame((_, dt) => {
    if (!mesh.current) return;
    const target = hot ? 1.5 : 1;
    const next = mesh.current.scale.x + (target - mesh.current.scale.x) * Math.min(1, dt * 8);
    mesh.current.scale.setScalar(next);
  });
  return (
    <group position={pos}>
      <mesh
        ref={mesh}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHot(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHot(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          if (e.delta > 6) return; // a drag to rotate, not a tap
          e.stopPropagation();
          onSelect(item.slug);
        }}
      >
        <sphereGeometry args={[size, lite ? 14 : 24, lite ? 14 : 24]} />
        <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={hot ? 1.2 : 0.55} roughness={0.35} metalness={0.2} />
      </mesh>
      <Html center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: "none", transform: "translateY(-26px)" }}>
        <span
          style={{
            whiteSpace: "nowrap",
            fontSize: hot ? 15 : 12,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 1px 6px rgba(0,0,0,.9)",
            background: hot ? "rgba(23,26,48,.92)" : "transparent",
            padding: hot ? "3px 8px" : 0,
            borderRadius: 8,
            border: hot ? `1px solid ${item.color}` : "none",
          }}
        >
          {item.label}
          {hot ? ` · ${item.count} tools` : ""}
        </span>
      </Html>
    </group>
  );
}

function Hub({ lite }: { lite: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.4;
      ref.current.rotation.x += dt * 0.15;
    }
  });
  return (
    <group>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.8, lite ? 1 : 2]} />
        <meshPhysicalMaterial color="#754BFF" metalness={0.3} roughness={0.2} clearcoat={1} emissive="#3b1fb0" emissiveIntensity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.15, 24, 24]} />
        <meshBasicMaterial color="#25C6E8" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

function Universe({ items, lite, onSelect }: { items: UniverseItem[]; lite: boolean; onSelect: (slug: string) => void }) {
  const positions = useMemo(() => {
    const n = items.length;
    return items.map((_, i) => {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * Math.PI * (3 - Math.sqrt(5));
      return new THREE.Vector3(Math.cos(a) * r, y * 0.9, Math.sin(a) * r).multiplyScalar(3.1);
    });
  }, [items]);
  const lines = useMemo(() => {
    const pts: number[] = [];
    positions.forEach((p) => pts.push(0, 0, 0, p.x, p.y, p.z));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [positions]);
  return (
    <>
      <Hub lite={lite} />
      <lineSegments geometry={lines}>
        <lineBasicMaterial color="#9a7bff" transparent opacity={0.28} />
      </lineSegments>
      {items.map((it, i) => (
        <Node key={it.slug} item={it} pos={positions[i]} lite={lite} onSelect={onSelect} />
      ))}
    </>
  );
}

export default function UniverseScene({ items, lite, onSelect }: { items: UniverseItem[]; lite: boolean; onSelect: (slug: string) => void }) {
  return (
    <Canvas dpr={lite ? 1 : [1, 1.5]} camera={{ position: [0, 0.4, 8.6], fov: 45 }} gl={{ antialias: !lite, alpha: true, powerPreference: "low-power" }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <pointLight position={[-4, -2, 3]} intensity={24} color="#25C6E8" />
      <pointLight position={[4, 2, -2]} intensity={20} color="#FF4FA3" />
      <Universe items={items} lite={lite} onSelect={onSelect} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.7} rotateSpeed={0.7} />
    </Canvas>
  );
}
