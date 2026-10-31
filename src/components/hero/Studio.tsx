"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

/**
 * Reflections for glossy materials from one small painted image: a dark navy room with a white softbox overhead, a cyan strip on the left, a magenta
 * strip on the right and a violet floor glow. It is cheap to turn into an environment map (a full lit room rendered to a cube map cost seconds of
 * main-thread time on a modest GPU) and it lights the robot in the same colours as the page.
 */
function paint() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, "#1b2a8a");
  bg.addColorStop(0.5, "#0a0f3a");
  bg.addColorStop(1, "#2a1573");
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 256);
  const box = (x: number, y: number, w: number, h: number, col: string, blur: number) => {
    g.save();
    g.shadowColor = col;
    g.shadowBlur = blur;
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
    g.restore();
  };
  box(150, 14, 220, 40, "#ffffff", 40); // overhead softbox
  box(40, 80, 26, 110, "#35e0ff", 36); // cyan strip, left
  box(446, 80, 26, 110, "#ff4fd8", 36); // magenta strip, right
  box(226, 215, 60, 22, "#8b5cff", 30); // floor glow
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function Studio({ intensity = 0.85 }: { intensity?: number }) {
  const { scene } = useThree();
  useEffect(() => {
    const tex = paint();
    scene.environment = tex;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      tex.dispose();
    };
  }, [scene, intensity]);
  return null;
}
