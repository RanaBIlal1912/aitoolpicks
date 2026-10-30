"use client";

import { useEffect, useState } from "react";
import { recordView, useFavorites } from "@/lib/saved";

/** Save / unsave a tool in this browser. */
export default function FavoriteButton({ id, name, label = false, className = "" }: { id: string; name: string; label?: boolean; className?: string }) {
  const fav = useFavorites();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const on = mounted && fav.has(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from saved tools` : `Save ${name}`}
      title={on ? "Saved in this browser. Click to remove." : "Save in this browser"}
      onClick={() => fav.toggle(id)}
      className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-semibold text-soft transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ${on ? "!border-amber/50 !text-amber" : ""} ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5.5 6.2 5.5c1.9 0 3.2 1 3.8 2.2.6-1.2 1.9-2.2 3.8-2.2 3.2 0 5 3.1 3.7 6.3C19.500 16.400 12 21 12 21z" />
      </svg>
      {label && <span>{on ? "Saved" : "Save"}</span>}
    </button>
  );
}

/** Records a visit to a tool page in this browser's recently viewed list. Renders nothing. */
export function RecentTracker({ id }: { id: string }) {
  useEffect(() => {
    recordView(id);
  }, [id]);
  return null;
}
