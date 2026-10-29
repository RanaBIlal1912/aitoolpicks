"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CODES,
  FALLBACK,
  RATE_SOURCES,
  currencyForCountry,
  detectCountry,
  isCurrency,
  validRates,
  type CurrencyCode,
  type Rates,
} from "@/lib/currency";

const CACHE_KEY = "aitp_rates_v2";
const PICK_KEY = "aitp_currency_v2";
const MAX_AGE = 12 * 3600 * 1000;

export type RateMeta = { source: string; date: string; credit: string; live: boolean };

type Ctx = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Rates;
  meta: RateMeta;
  country: string;
};

const FALLBACK_META: RateMeta = { source: "fallback", date: FALLBACK.date, credit: "", live: false };

const CurrencyContext = createContext<Ctx>({
  currency: "USD",
  setCurrency: () => {},
  rates: FALLBACK.rates,
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
  const [currency, setCur] = useState<CurrencyCode>("USD");
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
    const saved = read(PICK_KEY);
    setCur(isCurrency(saved) ? saved : (currencyForCountry(c) ?? "USD"));
    apply(readCache());
    let alive = true;
    loadRates()
      .then((r) => alive && apply(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [apply]);

  const setCurrency = useCallback((c: CurrencyCode) => {
    if (!CODES.includes(c)) return;
    setCur(c);
    write(PICK_KEY, c);
  }, []);

  const value = useMemo(() => ({ currency, setCurrency, rates, meta, country }), [currency, setCurrency, rates, meta, country]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
