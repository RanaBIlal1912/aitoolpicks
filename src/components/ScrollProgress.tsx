"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin reading-progress line under the header. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 24, mass: 0.3 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "0 50%" }}
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px] bg-gradient-to-r from-electric via-violet to-cyan"
    />
  );
}
