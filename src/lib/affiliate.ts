// Affiliate links live here and nowhere else.
// Leave a value empty until an affiliate programme approves you and gives you an official link.
// Never invent a link. While a link is empty, buttons point to the tool's official site (no commission).
//
// A value is either a plain https URL, or an object with an optional URL per country code:
//   canva: { default: "https://...", GB: "https://...", PK: "https://..." }
// The link is chosen once from the visitor's country. Changing the display currency never changes a link.
export type AffiliateValue = string | Record<string, string>;

export const AFFILIATE_LINKS: Record<string, AffiliateValue> = {
  chatgpt: "",
  grammarly: "",
  notion: "",
  canva: "",
  hostinger: "",
  claude: "",
  gemini: "",
  copilot: "",
  perplexity: "",
  jasper: "",
  figma: "",
  midjourney: "",
  namecheap: "",
};

export function resolveAffiliate(
  id: string,
  country: string,
  links: Record<string, AffiliateValue> = AFFILIATE_LINKS,
): string | null {
  const v = links[id];
  let url = "";
  if (typeof v === "string") url = v;
  else if (v && typeof v === "object") url = v[country] || v.default || "";
  return /^https:\/\//i.test(url) ? url : null;
}
