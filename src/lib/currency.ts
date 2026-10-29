// Pure currency helpers. USD is the base currency for every price on the site.
// Exchange rates are display estimates only; the merchant's own checkout price always wins.

export const CURRENCIES = {
  USD: { symbol: "$", label: "USD ($)", decimals: 2, roundTo: 0 },
  GBP: { symbol: "£", label: "GBP (£)", decimals: 2, roundTo: 0 },
  EUR: { symbol: "€", label: "EUR (€)", decimals: 2, roundTo: 0 },
  PKR: { symbol: "₨", label: "PKR (₨)", decimals: 0, roundTo: 10 },
  CAD: { symbol: "C$", label: "CAD (C$)", decimals: 2, roundTo: 0 },
  AUD: { symbol: "A$", label: "AUD (A$)", decimals: 2, roundTo: 0 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const CODES = Object.keys(CURRENCIES) as CurrencyCode[];
export type Rates = Record<CurrencyCode, number>;

/** Used only when no live or cached rates are available. Approximate, last reviewed on `date`. */
export const FALLBACK: { date: string; rates: Rates } = {
  date: "2026-10-29",
  rates: { USD: 1, GBP: 0.75, EUR: 0.9, PKR: 277, CAD: 1.4, AUD: 1.42 },
};

export const EURO_COUNTRIES = "AT BE BG HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES".split(" ");

const TZ_COUNTRY: Record<string, string> = {
  "Asia/Karachi": "PK",
  "Europe/London": "GB",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/St_Johns": "CA",
  "America/Regina": "CA",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Australia/Adelaide": "AU",
  "Australia/Hobart": "AU",
  "Australia/Darwin": "AU",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Dublin": "IE",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Lisbon": "PT",
  "Europe/Athens": "GR",
  "Europe/Helsinki": "FI",
};

export function isCurrency(v: unknown): v is CurrencyCode {
  return typeof v === "string" && v in CURRENCIES;
}

export function validRates(r: unknown): r is Rates {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return CODES.every((c) => typeof o[c] === "number" && Number.isFinite(o[c] as number) && (o[c] as number) > 0);
}

export function currencyForCountry(c: string): CurrencyCode | null {
  if (c === "GB") return "GBP";
  if (c === "PK") return "PKR";
  if (c === "CA") return "CAD";
  if (c === "AU") return "AUD";
  if (EURO_COUNTRIES.includes(c)) return "EUR";
  return null;
}

/** Country hints from browser languages (en-GB) and time zone. No IP lookup, so no third-party tracking. */
export function detectCountry(languages: readonly string[], timeZone?: string): string {
  const found: string[] = [];
  for (const l of languages) {
    const m = /[-_]([A-Za-z]{2})\b/.exec(l || "");
    if (m) found.push(m[1].toUpperCase());
  }
  if (timeZone && TZ_COUNTRY[timeZone]) found.push(TZ_COUNTRY[timeZone]);
  return found.find((c) => currencyForCountry(c)) ?? found[0] ?? "";
}

export function convert(usd: number, cur: CurrencyCode, rates: Rates): number {
  const c = CURRENCIES[cur];
  const v = usd * rates[cur];
  if (c.roundTo) return Math.round(v / c.roundTo) * c.roundTo;
  return Math.round(v * 100) / 100;
}

export function format(v: number, cur: CurrencyCode): string {
  const c = CURRENCIES[cur];
  const whole = c.decimals === 0 || v === Math.floor(v);
  const d = whole ? 0 : c.decimals;
  return c.symbol + v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export type RateSource = {
  name: string;
  url: string;
  credit: string;
  parse: (d: unknown) => { rates: Partial<Rates>; date: string } | null;
};

export const RATE_SOURCES: RateSource[] = [
  {
    name: "Exchange Rate API",
    url: "https://open.er-api.com/v6/latest/USD",
    credit: "https://www.exchangerate-api.com",
    parse: (d) => {
      const o = d as { result?: string; rates?: Partial<Rates>; time_last_update_utc?: string } | null;
      if (!o || o.result !== "success" || !o.rates) return null;
      return { rates: o.rates, date: (o.time_last_update_utc ?? "").slice(5, 16) };
    },
  },
  {
    name: "currency-api",
    url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    credit: "",
    parse: (d) => {
      const o = d as { usd?: Record<string, number>; date?: string } | null;
      if (!o || !o.usd) return null;
      const r: Partial<Rates> = {};
      for (const c of CODES) r[c] = o.usd[c.toLowerCase()];
      return { rates: r, date: o.date ?? "" };
    },
  },
];
