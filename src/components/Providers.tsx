"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { CurrencyProvider } from "./CurrencyProvider";
import SmoothScroll from "./SmoothScroll";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    // "user" makes every Framer Motion animation respect the visitor's reduced-motion setting.
    <MotionConfig reducedMotion="user">
      <CurrencyProvider>
        <SmoothScroll />
        {children}
      </CurrencyProvider>
    </MotionConfig>
  );
}
