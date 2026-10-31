"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Label from "./Label";

export type UniverseTool = { id: string; name: string };
export type UniverseItem = { slug: string; label: string; count: number; color: string; tools: UniverseTool[] };
/** Two categories are linked when at least one catalog tool belongs to both. `n` is how many tools do. */
export type UniverseLink = { a: string; b: string; n: number };

type Hover = { kind: "category" | "tool"; label: string; sub: string; color: string; pos: THREE.Vector3 } | null;

function toolOrbit(index: number, total: number, radius: number) {
  const a = (index / Math.max(1, total)) * Math.PI * 2;
  const tilt = ((index % 3) - 1) * 0.5;
  return new THREE.Vector3(Math.cos(a) * radius, Math.sin(tilt) * radius * 0.5, Math.sin(a) * radius);
}

function CategoryNode({ item, pos, lite, onSelect, onSelectTool, setHover }: { item: UniverseItem; pos: THREE.Vector3; lite: boolean; onSelect: (slug: string) => void; onSelectTool: (id: string) => void; setHover: (h: Hover) => void }) {
  const mesh = useRef<THREE.Mesh>(null);
  const orbit = useRef<THREE.Group>(null);
  const [hot, setHot] = useState(false);
  const size = 0.2 + Math.min(item.count, 14) * 0.012;
  useFrame((_, dt) => {
    if (mesh.current) {
      const target = hot ? 1.45 : 1;
      mesh.current.scale.setScalar(mesh.current.scale.x + (target - mesh.current.scale.x) * Math.min(1, dt * 8));
    }
    if (orbit.current) orbit.current.rotation.y += dt * 0.25;
  });
  const radius = size + 0.34;
  return (
    <group position={pos}>
      <mesh
        ref={mesh}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHot(true);
          setHover({ kind: "category", label: item.label, sub: `${item.count} tools`, color: item.color, pos });
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHot(false);
          setHover(null);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          if (e.delta > 6) return;
          e.stopPropagation();
          onSelect(item.slug);
        }}
      >
        <sphereGeometry args={[size, lite ? 14 : 24, lite ? 14 : 24]} />
        <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={hot ? 1.2 : 0.6} roughness={0.3} metalness={0.25} />
      </mesh>
      {!hot && <Label text={item.label} position={[0, size + 0.42, 0]} size={0.34} />}
      {!lite && (
        <mesh scale={1.9}>
          <sphereGeometry args={[size, 12, 12]} />
          <meshBasicMaterial color={item.color} transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      {/* The tools of this category, orbiting it. Each dot is one real catalog tool and opens its page. */}
      <group ref={orbit}>
        {item.tools.slice(0, lite ? 6 : 14).map((t, i, arr) => {
          const p = toolOrbit(i, arr.length, radius + (i % 2) * 0.12);
          return (
            <mesh
              key={t.id}
              position={p}
              onPointerOver={(e) => {
                e.stopPropagation();
                const wp = new THREE.Vector3();
                (e.object as THREE.Mesh).getWorldPosition(wp);
                setHover({ kind: "tool", label: t.name, sub: item.label, color: item.color, pos: wp });
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHover(null);
                document.body.style.cursor = "";
              }}
              onClick={(e) => {
                if (e.delta > 6) return;
                e.stopPropagation();
                onSelectTool(t.id);
              }}
            >
              <sphereGeometry args={[0.052, 8, 8]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Hub({ lite }: { lite: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.4;
      ref.current.rotation.x += dt * 0.15;
    }
    if (wire.current) wire.current.rotation.y -= dt * 0.2;
  });
  return (
    <group>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.8, lite ? 1 : 2]} />
        <meshPhysicalMaterial color="#754BFF" metalness={0.3} roughness={0.2} clearcoat={1} emissive="#3b1fb0" emissiveIntensity={0.9} />
      </mesh>
      <mesh ref={wire}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshBasicMaterial color="#25C6E8" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Dust({ lite }: { lite: boolean }) {
  const geo = useMemo(() => {
    const n = lite ? 120 : 320;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 5 + ((i * 37) % 100) / 12;
      const a = i * 2.399963;
      const y = (((i * 53) % 100) / 100 - 0.5) * 8;
      p[i * 3] = Math.cos(a) * r * 0.9;
      p[i * 3 + 1] = y;
      p[i * 3 + 2] = Math.sin(a) * r * 0.9;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, [lite]);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.02;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#9a8cff" size={0.03} sizeAttenuation transparent opacity={0.7} depthWrite={false} />
    </points>
  );
}

function Universe({ items, links, lite, onSelect, onSelectTool }: { items: UniverseItem[]; links: UniverseLink[]; lite: boolean; onSelect: (slug: string) => void; onSelectTool: (id: string) => void }) {
  const [hover, setHover] = useState<Hover>(null);
  const positions = useMemo(() => {
    const n = items.length;
    return items.map((_, i) => {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * Math.PI * (3 - Math.sqrt(5));
      return new THREE.Vector3(Math.cos(a) * r, y * 0.9, Math.sin(a) * r).multiplyScalar(3.2);
    });
  }, [items]);
  const spokes = useMemo(() => {
    const pts: number[] = [];
    positions.forEach((p) => pts.push(0, 0, 0, p.x, p.y, p.z));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [positions]);
  const shared = useMemo(() => {
    const idx = new Map(items.map((it, i) => [it.slug, i]));
    const pts: number[] = [];
    for (const l of links) {
      const a = idx.get(l.a);
      const b = idx.get(l.b);
      if (a === undefined || b === undefined) continue;
      pts.push(positions[a].x, positions[a].y, positions[a].z, positions[b].x, positions[b].y, positions[b].z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [items, links, positions]);
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.04;
  });

  return (
    <group ref={group}>
      <Hub lite={lite} />
      <lineSegments geometry={spokes}>
        <lineBasicMaterial color="#9a7bff" transparent opacity={0.2} />
      </lineSegments>
      <lineSegments geometry={shared}>
        <lineBasicMaterial color="#25C6E8" transparent opacity={0.55} />
      </lineSegments>
      {items.map((it, i) => (
        <CategoryNode key={it.slug} item={it} pos={positions[i]} lite={lite} onSelect={onSelect} onSelectTool={onSelectTool} setHover={setHover} />
      ))}
      <Dust lite={lite} />
      {hover && <Label text={hover.label} sub={hover.sub} color={hover.color} position={hover.pos.clone().add(new THREE.Vector3(0, 0.55, 0))} boxed size={0.42} />}
    </group>
  );
}

/** Opening camera move: starts far away and settles in over about two seconds. The resting distance depends on the shape of the box: a tall, narrow phone box needs the camera further back than a wide desktop one so no node is cut off at the sides. */
function Intro() {
  const { camera, size } = useThree();
  const t = useRef(0);
  const end = 8.9 * Math.max(1, 1.45 / (size.width / Math.max(1, size.height)));
  useFrame((_, dt) => {
    if (t.current >= 1) return;
    t.current = Math.min(1, t.current + dt / 2.2);
    const e = 1 - Math.pow(1 - t.current, 3);
    camera.position.z = end * 1.7 + (end - end * 1.7) * e;
    camera.position.y = 2.2 + (0.4 - 2.2) * e;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function UniverseScene({ items, links, lite, active = true, onSelect, onSelectTool }: { items: UniverseItem[]; links: UniverseLink[]; lite: boolean; active?: boolean; onSelect: (slug: string) => void; onSelectTool: (id: string) => void }) {
  return (
    <Canvas frameloop={active ? "always" : "never"} dpr={lite ? 1 : [1, 1.5]} camera={{ position: [0, 2.2, lite ? 21 : 15], fov: 45 }} gl={{ antialias: !lite, alpha: true, powerPreference: "low-power" }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <pointLight position={[-4, -2, 3]} intensity={24} color="#25C6E8" />
      <pointLight position={[4, 2, -2]} intensity={20} color="#FF4FA3" />
      <Intro />
      <Universe items={items} links={links} lite={lite} onSelect={onSelect} onSelectTool={onSelectTool} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} rotateSpeed={0.7} />
    </Canvas>
  );
}
