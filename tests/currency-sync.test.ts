import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { FALLBACK, type Rates } from "../src/lib/currency";
import { PICK_KEY, createCurrencyStore } from "../src/lib/currency-store";
import { amountsIn, estimateText } from "../src/lib/price-text";
import { TOOLS } from "../src/data/tools";

/** A stand-in for localStorage that several store instances (page loads) can share. */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
}

// Fixed, round rates so the arithmetic in the assertions is easy to check by hand.
const RATES: Rates = { USD: 1, GBP: 0.8, EUR: 0.9, PKR: 280, CAD: 1.4, AUD: 1.5 };

describe("one global currency store", () => {
  it("starts as USD on the server and on the first client render", () => {
    const store = createCurrencyStore(() => memoryStorage());
    expect(store.getServerSnapshot()).toBe("USD");
    expect(store.getSnapshot()).toBe("USD");
  });

  it("uses the default for the visitor's region on a first visit, and a saved choice afterwards", () => {
    const first = createCurrencyStore(() => memoryStorage());
    first.init("PKR");
    expect(first.getSnapshot()).toBe("PKR");

    const returning = createCurrencyStore(() => memoryStorage({ [PICK_KEY]: "GBP" }));
    returning.init("PKR");
    expect(returning.getSnapshot()).toBe("GBP");
  });

  it("ignores a saved value that is not a supported currency", () => {
    const store = createCurrencyStore(() => memoryStorage({ [PICK_KEY]: "XYZ" }));
    store.init("EUR");
    expect(store.getSnapshot()).toBe("EUR");
  });

  it("tells every subscriber at once, so every price on the page changes together", () => {
    const store = createCurrencyStore(() => memoryStorage());
    const home = vi.fn();
    const tools = vi.fn();
    const pricing = vi.fn();
    store.subscribe(home);
    store.subscribe(tools);
    store.subscribe(pricing);
    store.set("PKR");
    for (const seen of [home, tools, pricing]) expect(seen).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe("PKR");
  });

  it("does not notify when the choice did not change, or after a subscriber leaves", () => {
    const store = createCurrencyStore(() => memoryStorage());
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe(a);
    const leave = store.subscribe(b);
    store.set("USD");
    expect(a).not.toHaveBeenCalled();
    leave();
    store.set("EUR");
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });

  it("rejects an unsupported currency", () => {
    const store = createCurrencyStore(() => memoryStorage());
    store.set("XYZ" as never);
    expect(store.getSnapshot()).toBe("USD");
  });

  it("keeps the choice across a refresh and across pages (a new load reads what was saved)", () => {
    const storage = memoryStorage();
    const page1 = createCurrencyStore(() => storage);
    page1.init("USD");
    page1.set("PKR");
    expect(storage.data.get(PICK_KEY)).toBe("PKR");
    const afterRefresh = createCurrencyStore(() => storage);
    afterRefresh.init("USD");
    expect(afterRefresh.getSnapshot()).toBe("PKR");
  });

  it("follows a change made in another tab without writing it back", () => {
    const storage = memoryStorage({ [PICK_KEY]: "USD" });
    const store = createCurrencyStore(() => storage);
    store.init("USD");
    const seen = vi.fn();
    store.subscribe(seen);
    storage.data.set(PICK_KEY, "EUR");
    store.syncFromStorage("EUR");
    expect(store.getSnapshot()).toBe("EUR");
    expect(seen).toHaveBeenCalledTimes(1);
    store.syncFromStorage(null);
    store.syncFromStorage("nonsense");
    expect(store.getSnapshot()).toBe("EUR");
  });

  it("still works for the visit when storage is blocked", () => {
    const blocked = createCurrencyStore(() => {
      throw new Error("blocked");
    });
    expect(() => blocked.init("GBP")).not.toThrow();
    expect(() => blocked.set("AUD")).not.toThrow();
    expect(blocked.getSnapshot()).toBe("AUD");
    const none = createCurrencyStore(() => null);
    none.set("CAD");
    expect(none.getSnapshot()).toBe("CAD");
  });
});

describe("price text is converted, never just re-labelled", () => {
  it("reads each amount with the currency its symbol means", () => {
    expect(amountsIn("$20/mo monthly · $17/mo yearly")).toEqual([
      { currency: "USD", amount: 20 },
      { currency: "USD", amount: 17 },
    ]);
    expect(amountsIn("€7.49/mo billed yearly")).toEqual([{ currency: "EUR", amount: 7.49 }]);
    expect(amountsIn("Rs 9200/yr")).toEqual([{ currency: "PKR", amount: 9200 }]);
    expect(amountsIn("C$12 or A$14 or £9 or US$5")).toEqual([
      { currency: "CAD", amount: 12 },
      { currency: "AUD", amount: 14 },
      { currency: "GBP", amount: 9 },
      { currency: "USD", amount: 5 },
    ]);
    expect(amountsIn("$1,200/yr")).toEqual([{ currency: "USD", amount: 1200 }]);
  });

  it("converts the number, not only the symbol", () => {
    expect(estimateText("$20/mo", "PKR", RATES)).toBe("₨5,600");
    expect(estimateText("$20/mo", "GBP", RATES)).toBe("£16");
    expect(estimateText("$20/mo monthly · $17/mo yearly", "PKR", RATES)).toBe("₨5,600 · ₨4,760");
    // €7.49 → USD 8.32 → GBP 6.66
    expect(estimateText("€7.49/mo billed yearly", "GBP", RATES)).toBe("£6.66");
  });

  it("changes when the selected currency changes", () => {
    const seen = new Set(["USD", "GBP", "EUR", "PKR", "CAD", "AUD"].map((c) => estimateText("$10/mo", c as never, RATES)));
    expect(seen.size).toBe(6 - 1 + 1); // USD has no estimate (null); the other five differ
  });

  it("shows no estimate for free, custom or unverified text", () => {
    for (const t of ["Free", "Custom pricing", "See note", "Contact sales"]) expect(estimateText(t, "PKR", RATES), t).toBeNull();
  });

  it("shows no estimate for a zero amount (a free plan written with a price)", () => {
    expect(estimateText("Rs 0/yr", "USD", RATES)).toBeNull();
    expect(estimateText("$0/mo", "PKR", RATES)).toBeNull();
  });
  it("shows no estimate when the price is already in the chosen currency", () => {
    expect(estimateText("$20/mo", "USD", RATES)).toBeNull();
    expect(estimateText("Rs 9200/yr", "PKR", RATES)).toBeNull();
  });

  it("never converts without real rates", () => {
    expect(estimateText("$20/mo", "PKR", null)).toBeNull();
  });

  it("can read every plan price in the catalog without inventing an amount", () => {
    for (const t of TOOLS) {
      for (const p of t.plans) {
        const digits = (p.price.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).length;
        const parsed = amountsIn(p.price).length;
        // Every number that has a currency symbol is read; text with no symbol is left alone.
        expect(parsed, `${t.id}: ${p.price}`).toBeLessThanOrEqual(digits);
      }
    }
    expect(FALLBACK.rates.USD).toBe(1);
  });
});

describe("every price on the site goes through the shared currency", () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.endsWith(".tsx")) files.push(p);
    }
  };
  walk(path.join(process.cwd(), "src"));

  it("never prints a vendor plan price as raw text", () => {
    const offenders = files.filter((f) => /(?<!text=)\{p\.price\}/.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(process.cwd(), f));
    expect(offenders).toEqual([]);
  });

  it("keeps the display currency in the shared store only", () => {
    // Components read it with useCurrency(); none keeps its own copy in local state.
    const offenders = files
      .filter((f) => !f.endsWith("CurrencyProvider.tsx"))
      .filter((f) => /useState<CurrencyCode>|useState\(\s*"(USD|GBP|EUR|PKR|CAD|AUD)"\s*\)/.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(process.cwd(), f));
    expect(offenders).toEqual([]);
  });

  it("has exactly one provider, mounted once in the root layout", () => {
    const layout = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(layout).toMatch(/<Providers>/);
    const mounts = files.filter((f) => /<CurrencyProvider[ >]/.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(process.cwd(), f));
    expect(mounts).toEqual([path.join("src", "components", "Providers.tsx")]);
  });
});
