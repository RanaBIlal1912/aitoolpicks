// Affiliate links live here and nowhere else.
// Leave a value empty until an affiliate programme approves you and gives you an official link.
// One slot exists for every tool in content/tools, so adding a real link never needs code changes elsewhere.
// A genuine affiliate link is kept apart from the tool's official website, which lives in the tool record.
// Never invent a link. While a link is empty, buttons point to the tool's official site (no commission).
//
// A value is either a plain https URL, or an object with an optional URL per country code:
//   canva: { default: "https://...", GB: "https://...", PK: "https://..." }
// The link is chosen once from the visitor's country. Changing the display currency never changes a link.
export type AffiliateValue = string | Record<string, string>;

export const AFFILIATE_LINKS: Record<string, AffiliateValue> = {
  bolt: "",
  canva: "",
  chatgpt: "",
  claude: "",
  copilot: "",
  cursor: "",
  descript: "",
  elevenlabs: "",
  elicit: "",
  figma: "",
  firefly: "",
  gamma: "",
  gemini: "",
  "github-copilot": "",
  grammarly: "",
  heygen: "",
  hostinger: "",
  huggingface: "",
  ideogram: "",
  intercom: "",
  jasper: "",
  leonardo: "",
  lovable: "",
  luma: "",
  make: "",
  midjourney: "",
  mistral: "",
  "n8n": "",
  namecheap: "",
  notebooklm: "",
  notion: "",
  otter: "",
  perplexity: "",
  pika: "",
  replit: "",
  runway: "",
  suno: "",
  surfer: "",
  synthesia: "",
  "v0": "",
  writesonic: "",
  zapier: "",
  assemblyai: "",
  consensus: "",
  deepgram: "",
  devin: "",
  granola: "",
  groq: "",
  langsmith: "",
  ollama: "",
  openrouter: "",
  together: "",
  wisprflow: "",
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
