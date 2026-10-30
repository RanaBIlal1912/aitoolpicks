"use client";

import type { ReactNode } from "react";
import { CurrencyProvider } from "./CurrencyProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CurrencyProvider>{children}</CurrencyProvider>
  );
}
