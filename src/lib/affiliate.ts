// Affiliate links and status live in content/affiliate.json and nowhere else.
//
// Status:
//   approved     we hold an official affiliate link (set `link`); the button says "Try <tool>" and is marked as an affiliate link
//   pending      we applied and are waiting; there is no link yet, so buttons go to the official site
//   unavailable  the programme's own page says we cannot join; buttons go to the official site
//   ordinary     no affiliate relationship (the default for any tool without an entry); buttons go to the official site
//
// A link is used ONLY when the status is "approved", so a link typed in early can never go live by accident.
// A link is either a plain https URL, or an object with an optional URL per country code:
//   canva: { default: "https://...", GB: "https://...", PK: "https://..." }
// The link is chosen once from the visitor's country. Changing the display currency never changes a link.
// Never invent a link. The tool's own website lives in the tool record; the two are kept apart.
import data from "../../content/affiliate.json";

export type AffiliateValue = string | Record<string, string>;
export type AffiliateStatus = "approved" | "pending" | "unavailable" | "ordinary";
export type AffiliateEntry = {
  status: AffiliateStatus;
  link?: AffiliateValue;
  programme?: { network: string; applyUrl: string; checked: string };
  note?: string;
  source?: string;
  checked?: string;
};

export const AFFILIATE_STATUSES: AffiliateStatus[] = ["approved", "pending", "unavailable", "ordinary"];

export const AFFILIATE_PROGRAMS = data.programs as Record<string, AffiliateEntry>;

/** The usable links: only entries whose status is approved. */
export function linksFrom(programs: Record<string, AffiliateEntry>): Record<string, AffiliateValue> {
  const out: Record<string, AffiliateValue> = {};
  for (const [id, e] of Object.entries(programs)) if (e.status === "approved" && e.link) out[id] = e.link;
  return out;
}

export const AFFILIATE_LINKS: Record<string, AffiliateValue> = linksFrom(AFFILIATE_PROGRAMS);

export function affiliateStatus(id: string, programs: Record<string, AffiliateEntry> = AFFILIATE_PROGRAMS): AffiliateStatus {
  return programs[id]?.status ?? "ordinary";
}

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
