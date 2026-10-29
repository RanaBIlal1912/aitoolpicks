"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { addLights, buildChip, dustField, makeEnvironment, type Chip } from "@/lib/scene/chip";

type Props = { home: boolean; reduced: boolean; mobile: boolean; active: boolean };

function Rig({ home, reduced, mobile, active }: Props) {
  const { scene, gl, invalidate } = useThree();
  const holder = useRef<THREE.Group>(null);
  const chipRef = useRef<Chip | null>(null);
  const dustRef = useRef<THREE.Points | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const state = useRef({ x: 2.4, y: 0, yaw: 0.5, pitch: 0.6, scale: 1, t: 0 });
  const activeRef = useRef(active);
  activeRef.current = active;

  // Build the scene once. The chip, textures and environment live for the whole visit.
  useEffect(() => {
    const chip = buildChip({ seed: 7, texSize: mobile ? 768 : 1024 });
    chipRef.current = chip;
    holder.current?.add(chip.group);
    const env = makeEnvironment(gl);
    scene.environment = env;
    scene.environmentIntensity = 0.42;
    const lights = addLights(scene, 0.75);
    const dust = dustField(mobile ? 90 : 170, [18, 11, 16], 0.06, 0x9db8ff, 5);
    dustRef.current = dust;
    scene.add(dust);
    scene.fog = new THREE.FogExp2(0x05060f, 0.028);
    invalidate();
    return () => {
      chip.dispose();
      env.dispose();
      lights.forEach((l) => scene.remove(l));
      scene.remove(dust);
      dust.geometry.dispose();
      (dust.material as THREE.Material).dispose();
      scene.environment = null;
    };
  }, [gl, scene, invalidate, mobile]);

  // Pointer parallax (desktop only).
  useEffect(() => {
    if (reduced || mobile) return;
    const on = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [reduced, mobile]);

  // Frame pacing: render at a capped rate, and not at all while the tab is hidden or the scene is off.
  useEffect(() => {
    if (reduced) {
      const on = () => invalidate();
      window.addEventListener("resize", on);
      return () => window.removeEventListener("resize", on);
    }
    const fps = mobile ? 20 : 30;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || !activeRef.current) return;
      if (now - last < 1000 / fps) return;
      last = now;
      invalidate();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, mobile, invalidate]);

  useFrame((s, dt) => {
    const g = holder.current;
    const chip = chipRef.current;
    if (!g || !chip) return;
    const st = state.current;
    const h = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, window.scrollY / h));
    if (!reduced) st.t += Math.min(dt, 0.1);
    chip.update(st.t);

    // Scroll path: the chip drifts side to side and turns as you move down the page, so each section sees it
    // from a different angle. Pointer position adds a small parallax.
    const narrow = s.size.width < 700;
    const aspect = s.size.width / s.size.height;
    // Fit the chip to the window: smaller on squarer windows so it never swamps the headline.
    const fit = Math.min(1, Math.max(0.58, aspect / 1.95));
    const wide = Math.min(1, aspect / 1.6);
    // Home: the chip sways across the page behind glass cards. Inner pages: it stays at the right edge,
    // clear of the reading column.
    const tx = narrow ? 0 : home ? 2.7 * wide * Math.cos(p * Math.PI * 2.4) : (4.3 + 0.7 * Math.cos(p * Math.PI * 2.4)) * wide;
    const ty = -p * 1.2 + (narrow ? 1.4 : 0);
    const yaw = 0.55 + p * 2.8 + st.t * 0.035 + pointer.current.x * 0.22;
    const pitch = 0.62 - p * 0.28 + pointer.current.y * 0.12;
    const sc = (narrow ? 0.6 : fit) * (1 - p * 0.18);
    const k = reduced ? 1000 : 3.2;
    st.x = THREE.MathUtils.damp(st.x, tx, k, dt);
    st.y = THREE.MathUtils.damp(st.y, ty, k, dt);
    st.yaw = THREE.MathUtils.damp(st.yaw, yaw, k, dt);
    st.pitch = THREE.MathUtils.damp(st.pitch, pitch, k, dt);
    st.scale = THREE.MathUtils.damp(st.scale, sc, k, dt);
    g.position.set(st.x, st.y, 0);
    g.rotation.set(st.pitch, st.yaw, 0);
    g.scale.setScalar(st.scale);
    if (dustRef.current && !reduced) dustRef.current.rotation.y = st.t * 0.01;
  });

  return <group ref={holder} />;
}

export default function BackdropScene(props: Props) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, props.mobile ? 1.25 : 1.6]}
      camera={{ position: [0, 3.4, 12.5], fov: 28, near: 0.1, far: 80 }}
      gl={{ antialias: !props.mobile, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      aria-hidden="true"
    >
      <Rig {...props} />
    </Canvas>
  );
}
