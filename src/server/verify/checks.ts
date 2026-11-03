// Offline checks on the database (design section 3.1, checks 1, 2, 5, 6, 7, 9, 10, 11, 14). They read published and draft rows alike, never write,
// and never make a network request. Checks 3, 4, 12 and 13 need the network or the built site and live in links.ts and site.ts.
import type { Sql } from "../db/client.ts";
import { finding, type Finding, type ReviewQueueItem } from "./findings.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const DAY = 86_400_000;

export type CheckOptions = {
  /** "Today" as YYYY-MM-DD. Injectable so tests do not depend on the date. */
  today?: string;
  pricingMaxAgeDays?: number;
  reviewQueueAfterDays?: number;
};

/** True for an address the site can use: https, a host with a dot, no spaces. */
export function validHttpsUrl(value: unknown): boolean {
  if (typeof value !== "string" || /\s/.test(value)) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname.includes(".") && !u.username && !u.password;
  } catch {
    return false;
  }
}

/** Host plus path, so two open-source tools that both live on github.com are not mistaken for one product. */
const siteKey = (u: string) => {
  try {
    const x = new URL(u);
    return `${x.hostname.replace(/^www\./, "").toLowerCase()}${x.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "";
  }
};

export async function runDataChecks(sql: Sql, options: CheckOptions = {}): Promise<{ findings: Finding[]; humanReviewQueue: ReviewQueueItem[] }> {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const days = (d: string | null) => (d ? Math.floor((Date.parse(today) - Date.parse(d)) / DAY) : null);
  const out: Finding[] = [];
  const queue: ReviewQueueItem[] = [];

  const tools = await sql<Row[]>`
    select t.id, t.slug, t.name, t.tagline, t.description, t.website_url, t.official_url, t.pricing_url, t.pricing_source_url, t.open_source_source,
      t.pricing_status::text as pricing_status, t.pricing_model::text as pricing_model, t.verification_status::text as verification_status,
      t.pricing_checked_at::text as pricing_checked_at, t.verified_at::text as verified_at, t.status::text as status,
      (select count(*)::int from pricing_plans p where p.tool_id = t.id) as plans,
      (select count(*)::int from tool_categories c where c.tool_id = t.id) as categories,
      exists (select 1 from tool_categories c where c.tool_id = t.id and c.category_id = t.primary_category_id) as has_primary
    from tools t where t.deleted_at is null order by t.slug`;

  const seenNames = new Map<string, string>();
  const seenHosts = new Map<string, string>();
  for (const t of tools) {
    const id = t.slug as string;
    // 1 missing text
    for (const f of ["name", "tagline", "description"] as const) {
      if (!String(t[f] ?? "").trim()) out.push(finding("missing-text", "error", "tool", id, `The ${f} is empty.`, { field: f }));
    }
    // 2 addresses
    for (const f of ["website_url", "official_url", "pricing_url", "pricing_source_url", "open_source_source"] as const) {
      if (t[f] !== null && !validHttpsUrl(t[f])) out.push(finding("invalid-url", "error", "tool", id, `The address in ${f} is not a valid https address.`, { field: f }));
    }
    // 5 duplicates
    const nameKey = String(t.name).trim().toLowerCase();
    if (seenNames.has(nameKey)) out.push(finding("duplicate", "error", "tool", id, `The name "${t.name}" is also used by ${seenNames.get(nameKey)}.`, { field: "name" }));
    else seenNames.set(nameKey, id);
    const host = siteKey(t.website_url);
    if (host && seenHosts.has(host)) out.push(finding("duplicate", "warning", "tool", id, `The website ${host} is also listed for ${seenHosts.get(host)}.`, { field: "website_url", suggestion: "Check whether these are one product." }));
    else if (host) seenHosts.set(host, id);
    // 6 categories
    if (t.categories === 0) out.push(finding("category", "error", "tool", id, "The tool is in no category."));
    else if (!t.has_primary) out.push(finding("category", "error", "tool", id, "The primary category is not among the tool's categories."));
    // 7 pricing records
    if (t.pricing_status === "verified" && t.plans === 0) out.push(finding("pricing", "error", "tool", id, "Pricing is marked verified but no plan is recorded.", { field: "pricing_status" }));
    const age = days(t.pricing_checked_at);
    if (age !== null && age > (options.pricingMaxAgeDays ?? 90)) out.push(finding("pricing", "warning", "tool", id, `Pricing was last checked ${age} days ago.`, { field: "pricing_checked_at", suggestion: "Re-read the vendor's pricing page and record the check." }));
    if (t.pricing_status === "verified" && t.verification_status !== "verified") out.push(finding("pricing", "warning", "tool", id, `Pricing is "verified" but the tool's verification record says "${t.verification_status}".`, { field: "verification_status" }));
    // human review queue (never an automatic decision)
    const vAge = days(t.verified_at);
    if (t.status === "published") {
      if (vAge !== null && vAge > (options.reviewQueueAfterDays ?? 30)) queue.push({ entityType: "tool", entityId: id, reason: `Last verified ${vAge} days ago.` });
      else if (t.pricing_status !== "verified") queue.push({ entityType: "tool", entityId: id, reason: `Pricing is ${t.pricing_status}.` });
    }
  }

  // 2 addresses in sources
  for (const s of await sql<Row[]>`select t.slug, s.url, s.label from tool_sources s join tools t on t.id = s.tool_id where t.deleted_at is null`) {
    if (!validHttpsUrl(s.url)) out.push(finding("invalid-url", "error", "tool", s.slug, `The source "${s.label}" does not have a valid https address.`, { field: "tool_sources.url" }));
  }

  // 9, 10 reviews
  const reviews = await sql<Row[]>`
    select r.slug, r.method::text as method, r.status::text as status, (rt.review_id is not null) as has_testing, rt.tested_to::text as tested_to, rt.tested_from::text as tested_from,
      (select count(*)::int from review_evidence e where e.review_id = r.id and e.url ~ '^https://') as https_evidence
    from reviews r left join review_testing rt on rt.review_id = r.id where r.deleted_at is null`;
  for (const r of reviews) {
    if (r.method === "documentation" && r.has_testing) out.push(finding("review-method", "error", "review", r.slug, "A documentation review carries a testing record."));
    if (r.method === "hands-on") {
      if (!r.has_testing) out.push(finding("review-method", "error", "review", r.slug, "A hands-on review has no testing record."));
      else {
        if (r.tested_to > today) out.push(finding("review-method", "error", "review", r.slug, "The testing record ends in the future.", { field: "tested_to" }));
        if (r.status === "published" && r.https_evidence === 0) out.push(finding("review-method", "error", "review", r.slug, "A published hands-on review has no https evidence."));
      }
    }
  }

  // 11 affiliate
  for (const a of await sql<Row[]>`
    select t.slug, p.status::text as status, (select count(*)::int from affiliate_links l where l.program_id = p.id) as links
    from affiliate_programs p join tools t on t.id = p.tool_id`) {
    if (a.links > 0 && a.status !== "approved") out.push(finding("affiliate", "error", "tool", a.slug, `A tracked link is stored while the programme is "${a.status}".`));
    if (a.status === "approved" && a.links === 0) out.push(finding("affiliate", "error", "tool", a.slug, "The programme is approved but no link is stored."));
  }

  // 14 news
  for (const n of await sql<Row[]>`select slug, source_url, published_on::text as published_on, source_verified_at::text as source_verified_at, status::text as status from news_items where deleted_at is null`) {
    if (!validHttpsUrl(n.source_url)) out.push(finding("news", "error", "news", n.slug, "The source address is missing or not https.", { field: "source_url" }));
    if (n.published_on > today) out.push(finding("news", "error", "news", n.slug, "The source date is in the future.", { field: "published_on" }));
    if (!n.source_verified_at) out.push(finding("news", "info", "news", n.slug, "No person has recorded checking this source.", { field: "source_verified_at" }));
  }

  return { findings: out, humanReviewQueue: queue };
}
