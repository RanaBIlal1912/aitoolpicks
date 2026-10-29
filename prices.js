// Base prices, always stored in USD. Other currencies are calculated from these in currency.js.
// Only add a product here once you have checked its official pricing page, then update asOf.
// Canva and Hostinger are left out on purpose: sources disagreed, so no price is shown for them.
const PRICES = {
  asOf: "2026-10",
  items: {
    chatgpt:   { usd: 20, per: "month",            note: "Plus plan" },
    grammarly: { usd: 12, per: "month",            note: "Pro plan, billed yearly" },
    notion:    { usd: 10, per: "member per month", note: "Plus plan, billed yearly" }
  }
};
