"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// A friendly AI robot built from plain geometry (no imported model, no generated image): glossy white shell, dark visor with glowing
// cyan eyes and smile, headphones, a pointing hand, a glowing "AI" chest panel and an orbit ring. The head follows the pointer.

const SHELL = { color: "#e9edff", roughness: 0.28, metalness: 0.15 } as const;
const GLOW = "#35e0ff";

function chestTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 256, 256);
  bg.addColorStop(0, "#2c3cff");
  bg.addColorStop(1, "#6a3dff");
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(8, 8, 240, 240, 48);
  g.fill();
  g.strokeStyle = "#7ff0ff";
  g.lineWidth = 8;
  g.stroke();
  g.fillStyle = "#ffffff";
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

function Eye({ x }: { x: number }) {
  return (
    <mesh position={[x, 0.1, 1.08]} rotation={[0, 0, 0]}>
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
  const chest = useMemo(() => chestTexture(), []);
  const { pointer } = useThree();
  const seg = lite ? 20 : 40;

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    if (root.current) {
      root.current.position.y = -0.85 + Math.sin(t * 1.2) * 0.1;
      root.current.rotation.y += (-0.35 + pointer.x * 0.25 - root.current.rotation.y) * Math.min(1, dt * 2.5);
    }
    if (head.current) {
      head.current.rotation.y += (pointer.x * 0.4 - head.current.rotation.y) * Math.min(1, dt * 4);
      head.current.rotation.x += (-pointer.y * 0.25 - head.current.rotation.x) * Math.min(1, dt * 4);
    }
    if (hand.current) hand.current.rotation.z = -0.25 + Math.sin(t * 2.2) * 0.05;
    if (ring.current) ring.current.rotation.z += dt * 0.5;
  });

  return (
    <group ref={root} position={[0, -0.85, 0]}>
      {/* head */}
      <group ref={head} position={[0, 1.35, 0]}>
        <mesh scale={[1.18, 1, 1.02]}>
          <sphereGeometry args={[1, seg, seg]} />
          <meshPhysicalMaterial {...SHELL} clearcoat={1} clearcoatRoughness={0.15} />
        </mesh>
        {/* visor */}
        <mesh position={[0, 0.02, 0.46]} scale={[1.04, 0.76, 0.7]}>
          <sphereGeometry args={[0.95, seg, seg]} />
          <meshPhysicalMaterial color="#04061c" roughness={0.08} metalness={0.4} clearcoat={1} emissive="#0a1450" emissiveIntensity={0.7} />
        </mesh>
        {/* eyes and smile */}
        <Eye x={-0.36} />
        <Eye x={0.36} />
        <mesh position={[0, -0.2, 1.08]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.17, 0.04, 14, 32, Math.PI]} />
          <meshBasicMaterial color={GLOW} toneMapped={false} />
        </mesh>
        {/* headphones */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 1.22, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.36, 0.36, 0.3, seg]} />
              <meshPhysicalMaterial color="#6b4bff" roughness={0.3} metalness={0.3} emissive="#3b1fd0" emissiveIntensity={0.55} />
            </mesh>
            <mesh position={[s * 0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.22, 0.04, 12, 32]} />
              <meshBasicMaterial color={GLOW} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[1.22, 0.07, 14, 48, Math.PI]} />
          <meshPhysicalMaterial color="#6b4bff" roughness={0.3} metalness={0.3} emissive="#3b1fd0" emissiveIntensity={0.4} />
        </mesh>
        {/* antenna */}
        <mesh position={[0, 1.08, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.22, 10]} />
          <meshStandardMaterial color="#aab4ff" />
        </mesh>
        <mesh position={[0, 1.24, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#ff5bd8" toneMapped={false} />
        </mesh>
      </group>

      {/* neck and body */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.2, 24]} />
        <meshStandardMaterial color="#7b86c8" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.25, 0]} scale={[1, 1.12, 0.82]}>
        <capsuleGeometry args={[0.62, 0.55, 12, seg]} />
        <meshPhysicalMaterial {...SHELL} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, -0.12, 0.56]}>
        <planeGeometry args={[0.62, 0.62]} />
        <meshBasicMaterial map={chest} transparent toneMapped={false} />
      </mesh>

      {/* left arm (resting) */}
      <group position={[-0.82, 0.05, 0]} rotation={[0, 0, 0.5]}>
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.17, 0.5, 8, 20]} />
          <meshPhysicalMaterial {...SHELL} />
        </mesh>
        <mesh position={[0, -0.82, 0]}>
          <sphereGeometry args={[0.21, 20, 20]} />
          <meshStandardMaterial color="#6b4bff" emissive="#3b1fd0" emissiveIntensity={0.4} />
        </mesh>
      </group>
      {/* right arm, pointing out to the viewer */}
      <group position={[0.82, 0.1, 0]} rotation={[0, 0, -0.9]}>
        <mesh position={[0, -0.34, 0]}>
          <capsuleGeometry args={[0.17, 0.46, 8, 20]} />
          <meshPhysicalMaterial {...SHELL} />
        </mesh>
        <group ref={hand} position={[0, -0.78, 0.05]}>
          <mesh>
            <sphereGeometry args={[0.24, 20, 20]} />
            <meshPhysicalMaterial {...SHELL} />
          </mesh>
          <mesh position={[0.02, -0.26, 0.1]} rotation={[0.5, 0, 0]}>
            <capsuleGeometry args={[0.07, 0.3, 6, 14]} />
            <meshPhysicalMaterial {...SHELL} />
          </mesh>
          <mesh position={[0.02, -0.46, 0.18]}>
            <sphereGeometry args={[0.095, 14, 14]} />
            <meshBasicMaterial color={GLOW} toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* orbit ring */}
      <mesh ref={ring} position={[0, -0.55, 0]} rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[1.75, 0.025, 12, 96]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -0.55, 0]} rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[1.95, 0.015, 12, 96]} />
        <meshBasicMaterial color="#9a6bff" toneMapped={false} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Stars({ n }: { n: number }) {
  const geo = useMemo(() => {
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p[i * 3] = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 9;
      p[i * 3 + 1] = (Math.sin(i * 78.233) * 12345.678 % 1) * 5;
      p[i * 3 + 2] = -3 - Math.abs(Math.sin(i * 3.1) * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, [n]);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#bcd2ff" size={0.04} sizeAttenuation transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}

export default function RobotScene({ lite = false, active = true }: { lite?: boolean; active?: boolean }) {
  return (
    <Canvas frameloop={active ? "always" : "never"} dpr={lite ? [1, 1.5] : [1, 2]} camera={{ position: [0, 0.4, 7.4], fov: 38 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={2.6} />
      <pointLight position={[-4, 1, 3]} intensity={38} color="#35e0ff" />
      <pointLight position={[4, -1, 2]} intensity={34} color="#ff4fd8" />
      <pointLight position={[0, 2, -3]} intensity={30} color="#6b4bff" />
      <Stars n={lite ? 60 : 140} />
      <Robot lite={lite} />
    </Canvas>
  );
}
