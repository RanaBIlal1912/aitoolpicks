// Merchant prices, always stored in USD. Other currencies are estimates calculated from these.
// Only add a tool here after checking its official pricing page, then update PRICES_AS_OF.
// Canva and Hostinger are left out on purpose: sources disagreed, so we show no price for them.
export type PriceItem = {
  usd: number;
  per: string;
  plan: string;
  note: string;
  /** Official pricing page where the number can be verified. */
  source: string;
};

export const PRICES_AS_OF = "2026-10";

export const PRICES: Record<string, PriceItem> = {
  chatgpt: {
    usd: 20,
    per: "month",
    plan: "Plus",
    note: "Plus plan",
    source: "https://openai.com/chatgpt/pricing/",
  },
  grammarly: {
    usd: 12,
    per: "month",
    plan: "Pro",
    note: "Pro plan, billed yearly",
    source: "https://www.grammarly.com/plans",
  },
  notion: {
    usd: 10,
    per: "member per month",
    plan: "Plus",
    note: "Plus plan, billed yearly",
    source: "https://www.notion.com/pricing",
  },
};
