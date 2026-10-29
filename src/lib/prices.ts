// One reference price per tool, taken from the vendor's own pricing page (see content/tools/*.json).
// The detailed plan tables live on each tool page; this is the single headline figure used inline in guides.
import refs from "@/data/generated/price-refs.json";
import type { MerchantCurrency } from "@/data/catalog-types";

export type PriceRef = { plan: string; amount: number; currency: MerchantCurrency; per: string; billing: string; source: string; checked: string };

export const PRICES = refs as Record<string, PriceRef>;
export const PRICES_AS_OF = "2026-10-29";
