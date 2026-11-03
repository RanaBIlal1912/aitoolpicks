// Reads the original JSON catalogue (content/) and validates it. Nothing here writes to the files or touches a database.
// The schemas are strict: a field the importer does not know about is an error, so no data can be dropped silently.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const url = z.string().regex(/^https:\/\/[^/ ]+\.[^/ ]+/);
const loose = z.record(z.string(), z.unknown());

const plan = z
  .object({
    name: z.string().min(1),
    audience: z.enum(["individual", "team", "business", "enterprise", "api"]),
    currency: z.string().regex(/^[A-Z]{3}$/),
    unit: z.string().min(1),
    monthly: z.number().nonnegative().optional(),
    annual: z.number().nonnegative().optional(),
    annualTotal: z.number().nonnegative().optional(),
    billing: z.string().optional(),
    custom: z.literal(true).optional(),
    highlights: z.array(z.string()).min(1).optional(),
    limits: z.array(z.string()).min(1).optional(),
    note: z.string().optional(),
  })
  .strict();

export const toolSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    name: z.string().min(1),
    vendor: z.string().min(1),
    website: url,
    category: z.string(),
    categories: z.array(z.string()).min(1),
    subcategory: z.string(),
    tagline: z.string().min(1),
    description: z.string().min(1),
    features: z.array(z.string()),
    useCases: z.array(z.string()),
    audience: z.array(z.string()),
    strengths: z.array(z.string()),
    limitations: z.array(z.string()),
    alternatives: z.array(z.string()),
    hue: z.number().int().min(0).max(360),
    verified: date,
    status: z.enum(["active", "renamed", "discontinued"]),
    added: date,
    platforms: z.array(z.string()).min(1).optional(),
    aliases: z.array(z.string()).min(1).optional(),
    keyFeature: z.string().optional(),
    logoSite: z.string().optional(),
    review: z.string().optional(),
    openSource: z.object({ status: z.enum(["open-source", "source-available", "open-weights"]), note: z.string(), source: url }).strict().optional(),
    profile: loose,
    pricing: z
      .object({
        status: z.enum(["verified", "partial", "unverified"]),
        model: z.enum(["free", "freemium", "free-trial", "paid", "usage-based", "contact-sales", "open-source", "unknown"]),
        checked: date,
        source: url.optional(),
        free: loose.optional(),
        api: loose.optional(),
        reference: loose.optional(),
        regional: z.string().optional(),
        trial: z.string().optional(),
        notes: z.array(z.string()).min(1).optional(),
        plans: z.array(plan),
      })
      .strict(),
    sources: z.array(z.object({ label: z.string().min(1), url, type: z.enum(["pricing", "docs", "official", "other"]), checked: date }).strict()),
    verification: z
      .object({
        status: z.enum(["verified", "partial", "login-required", "custom-pricing", "unavailable", "discontinued"]),
        officialUrl: url,
        pricingUrl: url,
        notes: z.string(),
        checked: date,
        method: z.string(),
      })
      .strict(),
  })
  .strict();
export type ToolJson = z.infer<typeof toolSchema>;

export const categorySchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    label: z.string().min(1),
    short: z.string(),
    cover: z.enum(["chip", "board", "neural", "lens", "rack", "wafer", "fibre", "signal"]),
    blurb: z.string(),
    subs: z.array(z.object({ slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), label: z.string().min(1) }).strict()),
  })
  .strict();
export type CategoryJson = z.infer<typeof categorySchema>;

export const affiliateEntrySchema = z
  .object({
    status: z.enum(["approved", "pending", "unavailable", "ordinary"]),
    programme: z.object({ network: z.string(), applyUrl: url, checked: date }).strict().optional(),
    note: z.string().optional(),
    source: url.optional(),
    checked: date.optional(),
  })
  .strict();
export type AffiliateEntry = z.infer<typeof affiliateEntrySchema>;

export type Source = { tools: ToolJson[]; categories: CategoryJson[]; affiliate: Record<string, AffiliateEntry> };

export class SourceError extends Error {
  problems: string[];
  constructor(problems: string[]) {
    super(`The source data is not valid:\n  - ${problems.join("\n  - ")}`);
    this.problems = problems;
  }
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Read and validate content/. `root` is the repository root. Throws SourceError listing every problem. */
export function loadSource(root: string): Source {
  const problems: string[] = [];
  const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8")) as unknown;
  const tools: ToolJson[] = [];
  for (const file of fs.readdirSync(path.join(root, "content/tools")).filter((f) => f.endsWith(".json")).sort()) {
    const r = toolSchema.safeParse(read(`content/tools/${file}`));
    if (!r.success) problems.push(...r.error.issues.map((i) => `content/tools/${file}: ${i.path.join(".") || "(root)"}: ${i.message}`));
    else if (`${r.data.id}.json` !== file) problems.push(`content/tools/${file}: id "${r.data.id}" does not match the file name`);
    else tools.push(r.data);
  }
  const categories: CategoryJson[] = [];
  for (const [i, c] of (read("content/categories.json") as unknown[]).entries()) {
    const r = categorySchema.safeParse(c);
    if (!r.success) problems.push(...r.error.issues.map((x) => `content/categories.json[${i}]: ${x.path.join(".")}: ${x.message}`));
    else categories.push(r.data);
  }
  const affiliate: Record<string, AffiliateEntry> = {};
  const aff = read("content/affiliate.json") as { programs?: Record<string, unknown> };
  for (const [id, e] of Object.entries(aff.programs ?? {})) {
    const r = affiliateEntrySchema.safeParse(e);
    if (!r.success) problems.push(...r.error.issues.map((x) => `content/affiliate.json ${id}: ${x.path.join(".")}: ${x.message}`));
    else affiliate[id] = r.data;
  }

  // Cross references.
  const toolIds = new Set(tools.map((t) => t.id));
  const topSlugs = new Set(categories.map((c) => c.slug));
  const subsOf = new Map(categories.map((c) => [c.slug, new Set(c.subs.map((s) => s.slug))]));
  for (const t of tools) {
    if (!topSlugs.has(t.category)) problems.push(`${t.id}: unknown category "${t.category}"`);
    for (const c of t.categories) if (!topSlugs.has(c)) problems.push(`${t.id}: unknown category "${c}"`);
    if (!t.categories.includes(t.category)) problems.push(`${t.id}: the primary category is not in categories`);
    if (new Set(t.categories).size !== t.categories.length) problems.push(`${t.id}: a category is listed twice`);
    if (!subsOf.get(t.category)?.has(t.subcategory)) problems.push(`${t.id}: subcategory "${t.subcategory}" is not under "${t.category}"`);
    for (const a of t.alternatives) if (!toolIds.has(a) || a === t.id) problems.push(`${t.id}: alternative "${a}" is unknown or the tool itself`);
    if (new Set(t.alternatives).size !== t.alternatives.length) problems.push(`${t.id}: an alternative is listed twice`);
  }
  for (const id of Object.keys(affiliate)) if (!toolIds.has(id)) problems.push(`content/affiliate.json: "${id}" is not a tool`);
  for (const [id, e] of Object.entries(affiliate)) if (e.programme && e.checked) problems.push(`content/affiliate.json ${id}: has both programme.checked and checked`);
  const vendors = new Map<string, string>();
  for (const t of tools) {
    const s = slugify(t.vendor);
    const seen = vendors.get(s);
    if (seen && seen !== t.vendor) problems.push(`vendors "${seen}" and "${t.vendor}" share the slug "${s}"`);
    vendors.set(s, t.vendor);
  }
  if (problems.length) throw new SourceError(problems);
  return { tools, categories, affiliate };
}

/** Counts of what the files contain, computed from the files themselves. */
export function countSource(src: Source) {
  return {
    companies: new Set(src.tools.map((t) => slugify(t.vendor))).size,
    categories: src.categories.length,
    subcategories: src.categories.reduce((n, c) => n + c.subs.length, 0),
    tools: src.tools.length,
    toolCategoryLinks: src.tools.reduce((n, t) => n + t.categories.length, 0),
    alternatives: src.tools.reduce((n, t) => n + t.alternatives.length, 0),
    pricingPlans: src.tools.reduce((n, t) => n + t.pricing.plans.length, 0),
    toolSources: src.tools.reduce((n, t) => n + t.sources.length, 0),
    affiliatePrograms: Object.keys(src.affiliate).length,
  };
}
