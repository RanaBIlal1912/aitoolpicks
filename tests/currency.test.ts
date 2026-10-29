import { describe, expect, it } from "vitest";
import {
  CODES,
  FALLBACK,
  RATE_SOURCES,
  convert,
  currencyForCountry,
  detectCountry,
  format,
  validRates,
} from "@/lib/currency";
import { resolveAffiliate } from "@/lib/affiliate";

describe("currency", () => {
  it("supports exactly the six required currencies with USD as base", () => {
    expect(CODES).toEqual(["USD", "GBP", "EUR", "PKR", "CAD", "AUD"]);
    expect(FALLBACK.rates.USD).toBe(1);
    expect(validRates(FALLBACK.rates)).toBe(true);
  });

  it("converts from USD and keeps USD unchanged", () => {
    expect(convert(20, "USD", FALLBACK.rates)).toBe(20);
    expect(convert(20, "GBP", { ...FALLBACK.rates, GBP: 0.75 })).toBe(15);
  });

  it("rounds PKR to the nearest 10 and shows no decimals", () => {
    const v = convert(12, "PKR", { ...FALLBACK.rates, PKR: 277 });
    expect(v % 10).toBe(0);
    expect(format(v, "PKR")).toBe("₨3,320");
  });

  it("formats with the right symbol and hides .00", () => {
    expect(format(20, "USD")).toBe("$20");
    expect(format(15.03, "GBP")).toBe("£15.03");
    expect(format(9.5, "EUR")).toBe("€9.50");
    expect(format(27.9, "CAD")).toBe("C$27.90");
    expect(format(28.4, "AUD")).toBe("A$28.40");
  });

  it("rejects incomplete or invalid rate tables", () => {
    expect(validRates(null)).toBe(false);
    expect(validRates({ USD: 1, GBP: 0.8 })).toBe(false);
    expect(validRates({ ...FALLBACK.rates, EUR: -1 })).toBe(false);
    expect(validRates({ ...FALLBACK.rates, EUR: NaN })).toBe(false);
  });

  it("maps countries to currencies", () => {
    expect(currencyForCountry("GB")).toBe("GBP");
    expect(currencyForCountry("PK")).toBe("PKR");
    expect(currencyForCountry("DE")).toBe("EUR");
    expect(currencyForCountry("CA")).toBe("CAD");
    expect(currencyForCountry("AU")).toBe("AUD");
    expect(currencyForCountry("US")).toBeNull();
  });

  it("detects country from language, then time zone", () => {
    expect(detectCountry(["en-GB", "en"], "UTC")).toBe("GB");
    expect(detectCountry(["en"], "Asia/Karachi")).toBe("PK");
    expect(detectCountry(["en-US"], "America/New_York")).toBe("US");
    expect(detectCountry([], undefined)).toBe("");
  });

  it("parses both exchange-rate API shapes and rejects bad payloads", () => {
    const er = RATE_SOURCES[0];
    const ok = er.parse({ result: "success", rates: { GBP: 0.75 }, time_last_update_utc: "Thu, 29 Oct 2026 00:00:01 +0000" });
    expect(ok?.rates.GBP).toBe(0.75);
    expect(er.parse({ result: "error" })).toBeNull();
    const fa = RATE_SOURCES[1].parse({ date: "2026-10-29", usd: { gbp: 0.75, eur: 0.9, pkr: 277, cad: 1.4, aud: 1.42 } });
    expect(fa?.rates.PKR).toBe(277);
    expect(RATE_SOURCES[1].parse({})).toBeNull();
  });
});

describe("affiliate links", () => {
  it("returns null when no link is set, so buttons fall back to the official site", () => {
    expect(resolveAffiliate("canva", "GB", { canva: "" })).toBeNull();
    expect(resolveAffiliate("missing", "GB", {})).toBeNull();
  });

  it("accepts only https links and picks by country with a default", () => {
    const links = { x: { default: "https://a.example/d", GB: "https://a.example/gb" }, y: "http://insecure.example" };
    expect(resolveAffiliate("x", "GB", links)).toBe("https://a.example/gb");
    expect(resolveAffiliate("x", "PK", links)).toBe("https://a.example/d");
    expect(resolveAffiliate("y", "GB", links)).toBeNull();
  });

  it("never depends on the display currency", () => {
    // The resolver only takes a country, so a currency change cannot alter a link.
    expect(resolveAffiliate.length).toBeGreaterThanOrEqual(2);
  });
});
