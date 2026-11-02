"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  FALLBACK,
  RATE_SOURCES,
  currencyForCountry,
  detectCountry,
  validRates,
  type CurrencyCode,
  type Rates,
} from "@/lib/currency";
import { PICK_KEY, currencyStore } from "@/lib/currency-store";

const CACHE_KEY = "aitp_rates_v2";
const MAX_AGE = 12 * 3600 * 1000;

export type RateMeta = { source: string; date: string; credit: string; live: boolean };

type Ctx = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Rates;
  /** The rates to convert with, or null when only the built-in approximations are available. Estimates are shown only when this is set; prices are never converted with made-up rates. */
  liveRates: Rates | null;
  meta: RateMeta;
  country: string;
};

const FALLBACK_META: RateMeta = { source: "fallback", date: FALLBACK.date, credit: "", live: false };

const CurrencyContext = createContext<Ctx>({
  currency: "USD",
  setCurrency: () => {},
  rates: FALLBACK.rates,
  liveRates: null,
  meta: FALLBACK_META,
  country: "",
});

export const useCurrency = () => useContext(CurrencyContext);

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* storage blocked: the site still works */
  }
}

type Cached = { t: number; rates: Rates; date: string; source: string; credit: string };

function readCache(): Cached | null {
  try {
    const c = JSON.parse(read(CACHE_KEY) || "null") as Cached | null;
    if (c && validRates(c.rates)) return c;
  } catch {
    /* bad cache */
  }
  return null;
}

async function fetchJson(url: string): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadRates(): Promise<Cached | null> {
  const cached = readCache();
  if (cached && Date.now() - cached.t < MAX_AGE) return cached;
  for (const s of RATE_SOURCES) {
    try {
      const p = s.parse(await fetchJson(s.url));
      if (!p) continue;
      const rates = { ...p.rates, USD: 1 };
      if (!validRates(rates)) continue;
      const fresh: Cached = { t: Date.now(), rates, date: p.date, source: s.name, credit: s.credit };
      write(CACHE_KEY, JSON.stringify(fresh));
      return fresh;
    } catch {
      /* try the next source */
    }
  }
  return cached;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // The display currency lives in one shared store (src/lib/currency-store.ts); every component reads it from here.
  const currency = useSyncExternalStore(currencyStore.subscribe, currencyStore.getSnapshot, currencyStore.getServerSnapshot);
  const [rates, setRates] = useState<Rates>(FALLBACK.rates);
  const [meta, setMeta] = useState<RateMeta>(FALLBACK_META);
  const [country, setCountry] = useState("");

  const apply = useCallback((r: Cached | null) => {
    if (r && validRates(r.rates)) {
      setRates(r.rates);
      setMeta({ source: r.source, date: r.date, credit: r.credit, live: true });
    } else {
      setRates(FALLBACK.rates);
      setMeta(FALLBACK_META);
    }
  }, []);

  useEffect(() => {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language || ""];
    let tz: string | undefined;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      /* no Intl */
    }
    const c = detectCountry(langs, tz);
    setCountry(c);
    currencyStore.init(currencyForCountry(c) ?? "USD");
    apply(readCache());
    // Another tab changed the choice: follow it here too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === PICK_KEY) currencyStore.syncFromStorage(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    let alive = true;
    loadRates()
      .then((r) => alive && apply(r))
      .catch(() => {});
    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [apply]);

  const setCurrency = useCallback((c: CurrencyCode) => currencyStore.set(c), []);

  const liveRates = meta.live ? rates : null;
  const value = useMemo(() => ({ currency, setCurrency, rates, liveRates, meta, country }), [currency, setCurrency, rates, liveRates, meta, country]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
