"use client";

import type { ReactNode, PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** A glass card that tilts toward the pointer in 3D and shows a soft light that follows it. Mouse only. */
export default function TiltCard({
  children,
  hue = 250,
  className = "",
  max = 8,
}: {
  children: ReactNode;
  hue?: number;
  className?: string;
  max?: number;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 220, damping: 22 });
  const ry = useSpring(useTransform(px, [0, 1], [-max * 1.2, max * 1.2]), { stiffness: 220, damping: 22 });

  function move(e: PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    px.set(x);
    py.set(y);
    e.currentTarget.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
  }
  function leave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      onPointerMove={move}
      onPointerLeave={leave}
      style={{
        ["--hue" as string]: hue,
        ...(reduce ? {} : { rotateX: rx, rotateY: ry, transformPerspective: 1000 }),
      }}
      className={`glass card-glow ${className}`}
    >
      {children}
    </motion.div>
  );
}
