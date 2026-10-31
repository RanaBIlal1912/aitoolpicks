"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { constellation } from "@/lib/constellation";

// The home hero: a living network. Nodes in the category colours are joined by their nearest neighbours; small bright "signals" travel along the links;
// a glass core with a wireframe shell sits at the centre. The camera leans toward the pointer and pulls back as the page scrolls. `lite` is the phone
// version: about half the nodes, a lower pixel ratio and no halo layer. The same layout is drawn as a static SVG before this loads (see HeroConstellation).
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(160,130,255,0.85)");
  grad.addColorStop(0.35, "rgba(117,75,255,0.35)");
  grad.addColorStop(1, "rgba(37,198,232,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function Network({ lite }: { lite: boolean }) {
  const group = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const sig = useRef<THREE.Points>(null);
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const { nodes, edges } = useMemo(() => constellation(lite ? 46 : 84), [lite]);
  const glow = useMemo(() => glowTexture(), []);

  const lines = useMemo(() => {
    const pts: number[] = [];
    for (const [a, b] of edges) pts.push(nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [nodes, edges]);

  const signals = useMemo(() => {
    const n = lite ? 8 : 16;
    return Array.from({ length: n }, (_, i) => ({ edge: (i * 7) % edges.length, t: (i * 0.37) % 1, speed: 0.25 + ((i * 13) % 10) / 30 }));
  }, [edges, lite]);
  const sigGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(signals.length * 3), 3));
    return g;
  }, [signals]);

  // Node size matches the static SVG network this scene fades in over (about 80 px per unit of node size on a desktop screen), so nothing inflates when WebGL starts.
  const k = lite ? 0.8 : 1.1;
  useEffect(() => {
    const m = new THREE.Matrix4();
    const col = new THREE.Color();
    nodes.forEach((n, i) => {
      m.compose(new THREE.Vector3(n.x, n.y, n.z), new THREE.Quaternion(), new THREE.Vector3(n.size * k, n.size * k, n.size * k));
      nodesRef.current?.setMatrixAt(i, m);
      nodesRef.current?.setColorAt(i, col.set(n.color));
      if (haloRef.current) {
        m.compose(new THREE.Vector3(n.x, n.y, n.z), new THREE.Quaternion(), new THREE.Vector3(n.size * k * 3.5, n.size * k * 3.5, n.size * k * 3.5));
        haloRef.current.setMatrixAt(i, m);
        haloRef.current.setColorAt(i, col.set(n.color));
      }
    });
    if (nodesRef.current) nodesRef.current.instanceMatrix.needsUpdate = true;
    if (nodesRef.current?.instanceColor) nodesRef.current.instanceColor.needsUpdate = true;
    if (haloRef.current) {
      haloRef.current.instanceMatrix.needsUpdate = true;
      if (haloRef.current.instanceColor) haloRef.current.instanceColor.needsUpdate = true;
    }
  }, [nodes, k]);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.07;
    if (core.current) core.current.rotation.y -= dt * 0.3;
    if (shell.current) {
      shell.current.rotation.y += dt * 0.18;
      shell.current.rotation.x += dt * 0.07;
    }
    const pos = sigGeo.getAttribute("position") as THREE.BufferAttribute;
    signals.forEach((s, i) => {
      s.t += dt * s.speed;
      if (s.t > 1) {
        s.t = 0;
        s.edge = (s.edge + 11) % edges.length;
      }
      const [a, b] = edges[s.edge];
      pos.setXYZ(i, nodes[a].x + (nodes[b].x - nodes[a].x) * s.t, nodes[a].y + (nodes[b].y - nodes[a].y) * s.t, nodes[a].z + (nodes[b].z - nodes[a].z) * s.t);
    });
    pos.needsUpdate = true;
  });

  return (
    <group position={[lite ? 0 : 2.4, lite ? 0.2 : 0, 0]}>
      <group ref={group}>
        <instancedMesh ref={nodesRef} args={[undefined, undefined, nodes.length]}>
          <sphereGeometry args={[1, lite ? 8 : 14, lite ? 8 : 14]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
        {!lite && (
          <instancedMesh ref={haloRef} args={[undefined, undefined, nodes.length]}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </instancedMesh>
        )}
        <lineSegments geometry={lines}>
          <lineBasicMaterial color="#8d7bff" transparent opacity={0.34} />
        </lineSegments>
        <points ref={sig} geometry={sigGeo}>
          <pointsMaterial color="#ffffff" size={lite ? 0.12 : 0.1} sizeAttenuation transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
      </group>
      <mesh ref={core}>
        <icosahedronGeometry args={[lite ? 0.55 : 0.78, lite ? 1 : 2]} />
        <meshPhysicalMaterial color="#754BFF" metalness={0.25} roughness={0.12} clearcoat={1} emissive="#3b1fb0" emissiveIntensity={0.9} />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[lite ? 0.9 : 1.25, 1]} />
        <meshBasicMaterial color="#25C6E8" wireframe transparent opacity={0.5} />
      </mesh>
      <sprite scale={[6, 6, 1]}>
        <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

function Rig() {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const scroll = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    target.current.set(pointer.x * 0.9, pointer.y * 0.55, 8.6 + scroll * 4.5);
    camera.position.lerp(target.current, Math.min(1, dt * 2.2));
    camera.lookAt(0.6, 0, 0);
  });
  return null;
}

export default function HeroScene({ lite, active = true }: { lite: boolean; active?: boolean }) {
  return (
    <Canvas frameloop={active ? "always" : "never"} dpr={lite ? 1 : [1, 1.6]} camera={{ position: [0, 0, 8.6], fov: 46 }} gl={{ antialias: !lite, alpha: true, powerPreference: "low-power" }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#25C6E8" />
      <pointLight position={[4, 2, -2]} intensity={26} color="#FF4FA3" />
      <Network lite={lite} />
      <Rig />
    </Canvas>
  );
}
