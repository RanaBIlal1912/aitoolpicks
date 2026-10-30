"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CAT_COLORS } from "@/data/palette";

// A small "discovery network": one glowing core, a node for each tool category (in that category's colour) joined to its nearest neighbours,
// and a thin shell of dust. It turns slowly and leans toward the pointer. It is decoration, loaded only on larger screens, only when the visitor has
// not asked for reduced motion, and only after the page is idle (see HeroVisual).
const NODE_COLORS = Object.values(CAT_COLORS).map((c) => c[0]);

function Network() {
  const group = useRef<THREE.Group>(null);
  const { nodes, lines, dust } = useMemo(() => {
    const n = NODE_COLORS.length;
    const nodes = Array.from({ length: n }, (_, i) => {
      // Evenly spread points on a sphere (golden-angle spiral).
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * Math.PI * (3 - Math.sqrt(5));
      return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(2.1);
    });
    const pts: number[] = [];
    nodes.forEach((p, i) => {
      nodes
        .map((q, j) => ({ j, d: p.distanceTo(q) }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2)
        .forEach(({ j }) => pts.push(p.x, p.y, p.z, nodes[j].x, nodes[j].y, nodes[j].z));
    });
    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const dustPos: number[] = [];
    const dustCol: number[] = [];
    const palette = [new THREE.Color("#25C6E8"), new THREE.Color("#FF4FA3"), new THREE.Color("#754BFF")];
    for (let i = 0; i < 140; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(3 + Math.random() * 1.8);
      dustPos.push(v.x, v.y, v.z);
      const c = palette[i % 3];
      dustCol.push(c.r, c.g, c.b);
    }
    const dust = new THREE.BufferGeometry();
    dust.setAttribute("position", new THREE.Float32BufferAttribute(dustPos, 3));
    dust.setAttribute("color", new THREE.Float32BufferAttribute(dustCol, 3));
    return { nodes, lines, dust };
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += dt * 0.12;
    g.rotation.x += (state.pointer.y * 0.35 - g.rotation.x) * Math.min(1, dt * 2);
    g.position.x += (state.pointer.x * 0.35 - g.position.x) * Math.min(1, dt * 2);
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[0.95, 1]} />
        <meshBasicMaterial color="#754BFF" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial color="#25C6E8" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.8, 24, 24]} />
        <meshBasicMaterial color="#754BFF" transparent opacity={0.16} />
      </mesh>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color="#9a7bff" transparent opacity={0.45} />
      </lineSegments>
      {nodes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshBasicMaterial color={NODE_COLORS[i]} />
        </mesh>
      ))}
      <points geometry={dust}>
        <pointsMaterial size={0.035} vertexColors transparent opacity={0.85} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7.2], fov: 42 }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} aria-hidden="true">
      <Network />
    </Canvas>
  );
}
