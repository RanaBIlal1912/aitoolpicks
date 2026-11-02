// Prices in the catalog are text copied from each vendor's page ("$20/mo monthly · $17/mo yearly", "€7.49/mo billed yearly", "Rs 9200/yr").
// This reads the amounts in such text and converts each one into the visitor's currency. The original text is never changed or replaced:
// callers show it as written and add the estimate beside it. Text without an amount ("Free", "Custom pricing", "See note") has no estimate.
import { convertBetween, format, type CurrencyCode, type Rates } from "./currency";

// Longest prefixes first so "US$" is not read as "$" and "C$" is not read as "$".
const AMOUNT = /(US\$|C\$|CA\$|A\$|AU\$|\$|£|€|Rs\.?\s?)(\d[\d,]*(?:\.\d+)?)/g;

const SOURCE: Record<string, CurrencyCode> = { "US$": "USD", "$": "USD", "C$": "CAD", "CA$": "CAD", "A$": "AUD", "AU$": "AUD", "£": "GBP", "€": "EUR", Rs: "PKR" };

function sourceOf(prefix: string): CurrencyCode {
  return SOURCE[prefix.replace(/[.\s]/g, "")] ?? "USD";
}

export type PriceAmount = { currency: CurrencyCode; amount: number };

/** The amounts found in a price text, in order, each with the currency its symbol means. */
export function amountsIn(text: string): PriceAmount[] {
  return [...text.matchAll(AMOUNT)].map((m) => ({ currency: sourceOf(m[1]), amount: Number(m[2].replace(/,/g, "")) }));
}

/**
 * The estimate in `target` for every amount in the text, joined with " · " (for example "₨5,540 · ₨4,710"), or null when there is nothing to
 * show: no amount in the text, every amount already in the target currency, or no real exchange rates (`rates` null). Never invents a rate.
 */
export function estimateText(text: string, target: CurrencyCode, rates: Rates | null): string | null {
  if (!rates) return null;
  const found = amountsIn(text).filter((a) => Number.isFinite(a.amount));
  // A zero amount ("Rs 0/yr") is a free plan: nothing to estimate.
  if (found.length === 0 || found.every((a) => a.currency === target || a.amount === 0)) return null;
  return found.map((a) => format(convertBetween(a.amount, a.currency, target, rates), target)).join(" · ");
}
