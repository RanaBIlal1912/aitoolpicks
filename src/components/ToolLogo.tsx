"use client";

import { useState } from "react";
import { logoFor } from "@/data/logos";
import { withBase } from "@/lib/site";

/**
 * The product's own icon in a fixed-size tile. Falls back to a plain letter mark when no verified logo exists or the file
 * fails to load, and never substitutes another product's image.
 */
export default function ToolLogo({ id, name, hue, size = 48, alt = "" }: { id: string; name: string; hue: number; size?: number; alt?: string }) {
  const logo = logoFor(id);
  const [failed, setFailed] = useState(false);
  const radius = Math.round(size * 0.26);
  if (logo && !failed) {
    const pad = Math.round(size * 0.16);
    return (
      <span
        className="grid shrink-0 place-items-center overflow-hidden ring-1 ring-inset ring-black/10"
        style={{ width: size, height: size, borderRadius: radius, background: logo.tile === "light" ? "#f4f5f9" : "#10131f", padding: pad }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBase(logo.src)}
          alt={alt}
          width={size - pad * 2}
          height={size - pad * 2}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center font-extrabold text-white"
      style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.4, background: `linear-gradient(145deg, hsl(${hue} 30% 36%), hsl(${(hue + 30) % 360} 28% 24%))`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.14)" }}
    >
      {name.charAt(0)}
    </span>
  );
}
