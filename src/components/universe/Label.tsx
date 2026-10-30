"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * A text label drawn into the 3D scene as a sprite (a canvas texture). It replaces drei's Html labels, which put real DOM nodes in a portal and threw
 * "removeChild" errors when the page was left while the scene was still mounted.
 */
export default function Label({
  text,
  sub,
  color = "#754BFF",
  position,
  boxed = false,
  size = 0.5,
}: {
  text: string;
  sub?: string;
  color?: string;
  position: THREE.Vector3 | [number, number, number];
  boxed?: boolean;
  size?: number;
}) {
  const { texture, aspect } = useMemo(() => {
    const dpr = 2;
    const font = `700 ${22 * dpr}px ui-sans-serif, system-ui, "Segoe UI", sans-serif`;
    const subFont = `500 ${18 * dpr}px ui-sans-serif, system-ui, "Segoe UI", sans-serif`;
    const probe = document.createElement("canvas").getContext("2d")!;
    probe.font = font;
    const w1 = probe.measureText(text).width;
    probe.font = subFont;
    const w2 = sub ? probe.measureText(sub).width + 14 * dpr : 0;
    const pad = (boxed ? 14 : 6) * dpr;
    const w = Math.ceil(w1 + w2 + pad * 2);
    const h = Math.ceil(36 * dpr + pad);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    if (boxed) {
      g.fillStyle = "rgba(13,16,36,0.94)";
      g.strokeStyle = color;
      g.lineWidth = 2 * dpr;
      const r = 10 * dpr;
      g.beginPath();
      g.roundRect(g.lineWidth, g.lineWidth, w - g.lineWidth * 2, h - g.lineWidth * 2, r);
      g.fill();
      g.stroke();
    }
    g.textBaseline = "middle";
    g.font = font;
    g.fillStyle = "#ffffff";
    if (!boxed) {
      g.shadowColor = "rgba(0,0,0,0.95)";
      g.shadowBlur = 6 * dpr;
    }
    g.fillText(text, pad, h / 2);
    if (sub) {
      g.shadowBlur = 0;
      g.font = subFont;
      g.fillStyle = "#a8aac0";
      g.fillText(sub, pad + w1 + 14 * dpr, h / 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { texture: t, aspect: w / h };
  }, [text, sub, color, boxed]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={position as THREE.Vector3} scale={[size * aspect, size, 1]} renderOrder={10}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}
