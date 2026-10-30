"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useState } from "react";
import * as THREE from "three";

// The ecosystem network. Every node and every edge comes from a record: a company is the maker named on a product's official page, a product is a
// catalog tool, a model is a sourced model record. Edges are only the relationships those records state (company makes tool; model is by company;
// model is supported by a tool). Positions are a layout, not data: they carry no meaning.
export type GNode = { id: string; kind: "company" | "tool" | "model"; label: string; color: string; size: number; href: string; group: string };
export type GEdge = { a: string; b: string; kind: "makes" | "model" | "supports" };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function layout(nodes: GNode[]): Record<string, THREE.Vector3> {
  const companies = nodes.filter((n) => n.kind === "company");
  const pos: Record<string, THREE.Vector3> = {};
  companies.forEach((c, i) => {
    const n = companies.length;
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5));
    pos[c.id] = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(5.2);
  });
  for (const n of nodes) {
    if (n.kind === "company") continue;
    const base = pos[`c:${n.group}`] ?? new THREE.Vector3();
    const dir = base.clone().normalize();
    const jitter = new THREE.Vector3(hash(n.id + "x") - 0.5, hash(n.id + "y") - 0.5, hash(n.id + "z") - 0.5).multiplyScalar(1.4);
    pos[n.id] = base.clone().add(dir.multiplyScalar(n.kind === "model" ? 1.6 : 0.9)).add(jitter);
  }
  return pos;
}

function Graph({ nodes, edges, onSelect, selected }: { nodes: GNode[]; edges: GEdge[]; onSelect: (n: GNode) => void; selected: string | null }) {
  const [hot, setHot] = useState<string | null>(null);
  const pos = useMemo(() => layout(nodes), [nodes]);
  const lines = useMemo(() => {
    const make = (kind: GEdge["kind"][]) => {
      const pts: number[] = [];
      for (const e of edges.filter((x) => kind.includes(x.kind))) {
        const a = pos[e.a];
        const b = pos[e.b];
        if (a && b) pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      return g;
    };
    return { makes: make(["makes"]), model: make(["model", "supports"]) };
  }, [edges, pos]);
  const labelNode = nodes.find((n) => n.id === (hot ?? selected)) ?? null;
  const connected = useMemo(() => {
    if (!selected) return null;
    const s = new Set<string>([selected]);
    edges.forEach((e) => {
      if (e.a === selected) s.add(e.b);
      if (e.b === selected) s.add(e.a);
    });
    return s;
  }, [edges, selected]);

  return (
    <>
      <lineSegments geometry={lines.makes}>
        <lineBasicMaterial color="#9a7bff" transparent opacity={0.4} />
      </lineSegments>
      <lineSegments geometry={lines.model}>
        <lineBasicMaterial color="#FF4FA3" transparent opacity={0.8} />
      </lineSegments>
      {nodes.map((n) => {
        const dim = connected && !connected.has(n.id);
        const isHot = hot === n.id || selected === n.id;
        return (
          <mesh
            key={n.id}
            position={pos[n.id]}
            scale={isHot ? 1.6 : 1}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHot(n.id);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHot(null);
              document.body.style.cursor = "";
            }}
            onClick={(e) => {
              if (e.delta > 6) return;
              e.stopPropagation();
              onSelect(n);
            }}
          >
            <sphereGeometry args={[n.size, 12, 12]} />
            <meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={isHot ? 1.1 : 0.45} transparent opacity={dim ? 0.18 : 1} roughness={0.4} />
          </mesh>
        );
      })}
      {/* One label that stays mounted and moves; mounting and unmounting a label per hover caused DOM errors. */}
      <Html position={labelNode ? pos[labelNode.id] : [0, 0, 0]} center distanceFactor={12} style={{ pointerEvents: "none", transform: "translateY(-22px)", display: labelNode ? "block" : "none" }}>
        <span style={{ whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: "#fff", background: "rgba(23,26,48,.94)", border: `1px solid ${labelNode?.color ?? "#754BFF"}`, borderRadius: 8, padding: "3px 8px" }}>
          {labelNode ? `${labelNode.label} · ${labelNode.kind}` : ""}
        </span>
      </Html>
    </>
  );
}

function Dolly({ distance }: { distance: number }) {
  const { camera } = useThree();
  useFrame((_, dt) => {
    const len = camera.position.length();
    const next = len + (distance - len) * Math.min(1, dt * 4);
    camera.position.setLength(next);
  });
  return null;
}

export default function EcosystemScene({ nodes, edges, distance, onSelect, selected }: { nodes: GNode[]; edges: GEdge[]; distance: number; onSelect: (n: GNode) => void; selected: string | null }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2, 15], fov: 45 }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 5, 6]} intensity={2} />
      <pointLight position={[-6, -3, 4]} intensity={28} color="#25C6E8" />
      <Dolly distance={distance} />
      <Graph nodes={nodes} edges={edges} onSelect={onSelect} selected={selected} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.35} rotateSpeed={0.7} />
    </Canvas>
  );
}
