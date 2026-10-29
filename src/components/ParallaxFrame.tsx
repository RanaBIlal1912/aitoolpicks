"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * A framed image that drifts slowly inside its frame as the page scrolls (a gentle parallax).
 * The image is scaled up a little so the drift never shows an edge. Static for reduced motion.
 */
export default function ParallaxFrame({
  children,
  className = "",
  strength = 36,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div className="h-full w-full" style={reduce ? undefined : { y, scale: 1.18 }}>
        {children}
      </motion.div>
    </div>
  );
}
