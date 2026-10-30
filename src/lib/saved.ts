"use client";

// Favorites and recently viewed tools. They live only in this browser's localStorage: there are no accounts, nothing is sent anywhere
// and nothing synchronises between devices. Every read and write is wrapped because storage can be blocked (private windows, site settings).
import { useSyncExternalStore } from "react";

export const FAVORITES_KEY = "atp:favorites";
export const RECENT_KEY = "atp:recent";
export const RECENT_LIMIT = 12;

const EMPTY: string[] = [];
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; list: string[] }>();

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const hit = cache.get(key);
    if (hit && hit.raw === raw) return hit.list;
    let list: string[] = EMPTY;
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed.filter((x): x is string => typeof x === "string");
    }
    cache.set(key, { raw, list });
    return list;
  } catch {
    return EMPTY;
  }
}

function write(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* storage unavailable: the feature simply does not persist */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === FAVORITES_KEY || e.key === RECENT_KEY || e.key === null) cb();
  };
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    removeEventListener("storage", onStorage);
  };
}

const use = (key: string) =>
  useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  );

/** Pure helpers (also used by tests). */
export function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}
export function pushRecent(list: string[], id: string, limit = RECENT_LIMIT): string[] {
  return [id, ...list.filter((x) => x !== id)].slice(0, limit);
}

export function useFavorites() {
  const list = use(FAVORITES_KEY);
  return {
    list,
    has: (id: string) => list.includes(id),
    toggle: (id: string) => write(FAVORITES_KEY, toggleId(read(FAVORITES_KEY), id)),
    clear: () => write(FAVORITES_KEY, []),
  };
}

export function useRecent() {
  const list = use(RECENT_KEY);
  return {
    list,
    clear: () => write(RECENT_KEY, []),
  };
}

export function recordView(id: string) {
  write(RECENT_KEY, pushRecent(read(RECENT_KEY), id));
}
