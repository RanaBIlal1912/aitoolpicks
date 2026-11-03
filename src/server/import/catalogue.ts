// Imports the JSON catalogue (companies, categories, tools and their children, affiliate programmes) into the database, and exports it back
// to the original JSON shape so the two can be compared. Repeatable: rows are matched by slug and rewritten only when they differ.
// Nothing is ever deleted; rows that exist in the database but not in the files are reported.
import type { Sql } from "../db/client.ts";
import { slugify, type AffiliateEntry, type CategoryJson, type Source, type ToolJson } from "./source.ts";

type Tx = Sql;
/** A database row as the driver returns it; columns are read by name and cast where used. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export type GroupCount = { inserted: number; updated: number; unchanged: number };
export type ImportResult = {
  dryRun: boolean;
  groups: Record<"companies" | "categories" | "tools" | "affiliatePrograms", GroupCount>;
  /** In the database but not in the files. Never deleted. */
  extra: { tools: string[]; companies: string[]; categories: string[]; affiliatePrograms: string[] };
};

class DryRunRollback extends Error {}

// ---------------------------------------------------------------------------------------------------------------------------------
// Canonical form, used to compare the files with what the database exports.
// ---------------------------------------------------------------------------------------------------------------------------------
export function canonical(v: unknown): string {
  const norm = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(norm);
    if (x && typeof x === "object") return Object.fromEntries(Object.entries(x as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, y]) => [k, norm(y)]));
    return x;
  };
  return JSON.stringify(norm(v));
}

/**
 * The form two tools are compared in. `review` is excluded until reviews are imported (they link to tools by slug).
 */
export const comparable = (t: ToolJson) => {
  const { review: _review, ...rest } = t;
  return rest;
};

// ---------------------------------------------------------------------------------------------------------------------------------
// Export: database -> original JSON shape
// ---------------------------------------------------------------------------------------------------------------------------------
const omitEmpty = <T extends Record<string, unknown>>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))) as Partial<T>;
const num = (v: string | null) => (v === null ? undefined : Number(v));

export async function exportTools(sql: Tx): Promise<ToolJson[]> {
  const tools = await sql<Row[]>`
    select t.*, co.name as company_name, pc.slug as primary_slug, sc.slug as sub_slug,
      t.added_on::text as added_t, t.pricing_checked_at::text as pricing_checked_t, t.verified_at::text as verified_at_t, t.catalog_verified_on::text as catalog_verified_t
    from tools t join companies co on co.id = t.company_id join categories pc on pc.id = t.primary_category_id left join categories sc on sc.id = t.subcategory_id
    where t.deleted_at is null order by t.slug`;
  const cats = await sql<{ tool_id: string; slug: string }[]>`select tc.tool_id, c.slug from tool_categories tc join categories c on c.id = tc.category_id order by tc.tool_id, tc.position`;
  const alts = await sql<{ tool_id: string; slug: string }[]>`select a.tool_id, t.slug from tool_alternatives a join tools t on t.id = a.alternative_tool_id order by a.tool_id, a.sort_order`;
  const plans = await sql<Row[]>`select *, monthly::text as monthly_t, annual::text as annual_t, annual_total::text as annual_total_t from pricing_plans order by tool_id, position`;
  const srcs = await sql<Row[]>`select *, checked_at::text as checked_t from tool_sources order by tool_id, position`;
  const group = <T extends Row>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) (m.get(String(r.tool_id)) ?? m.set(String(r.tool_id), []).get(String(r.tool_id))!).push(r);
    return m;
  };
  const gCats = group(cats), gAlts = group(alts), gPlans = group(plans), gSrcs = group(srcs);
  return tools.map((t) => {
    const id = String(t.id);
    const out = {
      id: t.slug,
      name: t.name,
      vendor: t.company_name,
      website: t.website_url,
      category: t.primary_slug,
      categories: (gCats.get(id) ?? []).map((r) => r.slug),
      subcategory: t.sub_slug,
      tagline: t.tagline,
      description: t.description,
      features: t.features,
      useCases: t.use_cases,
      audience: t.audience,
      strengths: t.strengths,
      limitations: t.limitations,
      alternatives: (gAlts.get(id) ?? []).map((r) => r.slug),
      hue: t.hue,
      verified: t.catalog_verified_t,
      status: t.product_status,
      added: t.added_t,
      ...omitEmpty({ platforms: t.platforms, aliases: t.aliases, keyFeature: t.key_feature, logoSite: t.logo_site }),
      ...(t.open_source_status ? { openSource: { status: t.open_source_status, note: t.open_source_note, source: t.open_source_source } } : {}),
      profile: t.profile,
      pricing: {
        status: t.pricing_status,
        model: t.pricing_model,
        checked: t.pricing_checked_t,
        ...omitEmpty({ source: t.pricing_source_url, free: t.pricing_free, api: t.pricing_api, reference: t.pricing_reference, regional: t.pricing_regional_note, trial: t.pricing_trial, notes: t.pricing_notes }),
        plans: (gPlans.get(id) ?? []).map((p) =>
          omitEmpty({
            name: p.name, audience: p.audience, currency: p.currency, unit: p.unit, monthly: num(p.monthly_t), annual: num(p.annual_t), annualTotal: num(p.annual_total_t),
            billing: p.billing, custom: p.is_custom ? true : undefined, highlights: p.highlights, limits: p.limits, note: p.note,
          }),
        ),
      },
      sources: (gSrcs.get(id) ?? []).map((s) => ({ label: s.label, url: s.url, type: s.type, checked: s.checked_t })),
      verification: { status: t.verification_status, officialUrl: t.official_url, pricingUrl: t.pricing_url, notes: t.verification_notes, checked: t.verified_at_t, method: t.verification_method },
    };
    return out as unknown as ToolJson;
  });
}

export async function exportCategories(sql: Tx): Promise<CategoryJson[]> {
  const rows = await sql<{ id: string; slug: string; parent_id: string | null; label: string; short_label: string; blurb: string; cover: string | null }[]>`
    select id, slug, parent_id, label, short_label, blurb, cover from categories where deleted_at is null order by sort_order, slug`;
  return rows.filter((r) => r.parent_id === null).map((r) => ({
    slug: r.slug, label: r.label, short: r.short_label, cover: r.cover as CategoryJson["cover"], blurb: r.blurb,
    subs: rows.filter((s) => s.parent_id === r.id).map((s) => ({ slug: s.slug, label: s.label })),
  }));
}

export async function exportAffiliate(sql: Tx): Promise<Record<string, AffiliateEntry>> {
  const rows = await sql<Row[]>`select p.*, t.slug as tool_slug, p.checked_at::text as checked_t from affiliate_programs p join tools t on t.id = p.tool_id order by t.slug`;
  const out: Record<string, AffiliateEntry> = {};
  for (const r of rows) {
    out[r.tool_slug] = {
      status: r.status,
      ...(r.network || r.apply_url ? { programme: { network: r.network, applyUrl: r.apply_url, checked: r.checked_t } } : r.checked_t ? { checked: r.checked_t } : {}),
      ...(r.note ? { note: r.note } : {}),
      ...(r.source_url ? { source: r.source_url } : {}),
    } as AffiliateEntry;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------------------------------------------------------------
const zero = (): GroupCount => ({ inserted: 0, updated: 0, unchanged: 0 });
const arr = (a: string[] | undefined) => a ?? [];

async function writeChildren(tx: Tx, toolId: string, t: ToolJson, catId: (slug: string) => string, toolIdOf: Map<string, string>) {
  await tx`delete from tool_categories where tool_id = ${toolId}`;
  for (const [i, c] of t.categories.entries()) await tx`insert into tool_categories (tool_id, category_id, position) values (${toolId}, ${catId(c)}, ${i + 1})`;
  await tx`delete from pricing_plans where tool_id = ${toolId}`;
  for (const [i, p] of t.pricing.plans.entries()) {
    await tx`insert into pricing_plans (tool_id, position, name, audience, currency, unit, monthly, annual, annual_total, billing, is_custom, highlights, limits, note)
      values (${toolId}, ${i + 1}, ${p.name}, ${p.audience}, ${p.currency}, ${p.unit}, ${p.monthly ?? null}, ${p.annual ?? null}, ${p.annualTotal ?? null}, ${p.billing ?? null},
        ${p.custom === true}, ${arr(p.highlights)}, ${arr(p.limits)}, ${p.note ?? null})`;
  }
  await tx`delete from tool_sources where tool_id = ${toolId}`;
  for (const [i, s] of t.sources.entries()) {
    await tx`insert into tool_sources (tool_id, position, label, url, type, checked_at) values (${toolId}, ${i + 1}, ${s.label}, ${s.url}, ${s.type}, ${s.checked})`;
  }
  void toolIdOf;
}

function toolRow(t: ToolJson, companyId: string, primaryId: string, subId: string, tx: Tx) {
  return {
    name: t.name, company_id: companyId, primary_category_id: primaryId, subcategory_id: subId, product_status: t.status, tagline: t.tagline, description: t.description,
    website_url: t.website, hue: t.hue, platforms: arr(t.platforms), aliases: arr(t.aliases), key_feature: t.keyFeature ?? null, logo_site: t.logoSite ?? null,
    open_source_status: t.openSource?.status ?? null, open_source_note: t.openSource?.note ?? null, open_source_source: t.openSource?.source ?? null, added_on: t.added,
    features: t.features, use_cases: t.useCases, audience: t.audience, strengths: t.strengths, limitations: t.limitations,
    profile: tx.json(t.profile as never),
    pricing_status: t.pricing.status, pricing_model: t.pricing.model, pricing_checked_at: t.pricing.checked, pricing_source_url: t.pricing.source ?? null,
    pricing_regional_note: t.pricing.regional ?? null, pricing_free: t.pricing.free ? tx.json(t.pricing.free as never) : null, pricing_api: t.pricing.api ? tx.json(t.pricing.api as never) : null,
    pricing_trial: t.pricing.trial ?? null, pricing_reference: t.pricing.reference ? tx.json(t.pricing.reference as never) : null, pricing_notes: arr(t.pricing.notes),
    verification_status: t.verification.status, verified_at: t.verification.checked, catalog_verified_on: t.verified, official_url: t.verification.officialUrl,
    pricing_url: t.verification.pricingUrl, verification_method: t.verification.method, verification_notes: t.verification.notes,
  };
}

export async function importCatalogue(sql: Sql, src: Source, options: { dryRun?: boolean } = {}): Promise<ImportResult> {
  const result: ImportResult = {
    dryRun: !!options.dryRun,
    groups: { companies: zero(), categories: zero(), tools: zero(), affiliatePrograms: zero() },
    extra: { tools: [], companies: [], categories: [], affiliatePrograms: [] },
  };
  try {
    await sql.begin(async (txRaw) => {
      const tx = txRaw as unknown as Sql;
      // Companies: the vendor named on each tool's page.
      const companyId = new Map<string, string>();
      for (const name of new Set(src.tools.map((t) => t.vendor))) {
        const slug = slugify(name);
        const [row] = await tx<{ id: string; name: string }[]>`select id, name from companies where slug = ${slug}`;
        if (!row) {
          const [n] = await tx<{ id: string }[]>`insert into companies (slug, name, status) values (${slug}, ${name}, 'published') returning id`;
          companyId.set(name, n.id);
          result.groups.companies.inserted++;
        } else {
          companyId.set(name, row.id);
          if (row.name !== name) {
            await tx`update companies set name = ${name} where id = ${row.id}`;
            result.groups.companies.updated++;
          } else result.groups.companies.unchanged++;
        }
      }
      const wantedCompanies = new Set(src.tools.map((t) => slugify(t.vendor)));
      result.extra.companies = (await tx<{ slug: string }[]>`select slug from companies`).map((r) => r.slug).filter((s) => !wantedCompanies.has(s));

      // Categories: top level first, then subcategories under their parent.
      const catIds = new Map<string, string>();
      const subIds = new Map<string, string>();
      for (const [i, c] of src.categories.entries()) {
        const [row] = await tx<Row[]>`select * from categories where slug = ${c.slug} and parent_id is null`;
        if (!row) {
          const [n] = await tx<{ id: string }[]>`insert into categories (slug, label, short_label, blurb, cover, sort_order, status) values (${c.slug}, ${c.label}, ${c.short}, ${c.blurb}, ${c.cover}, ${i + 1}, 'published') returning id`;
          catIds.set(c.slug, n.id);
          result.groups.categories.inserted++;
        } else {
          catIds.set(c.slug, row.id);
          if (row.label !== c.label || row.short_label !== c.short || row.blurb !== c.blurb || row.cover !== c.cover || row.sort_order !== i + 1) {
            await tx`update categories set label = ${c.label}, short_label = ${c.short}, blurb = ${c.blurb}, cover = ${c.cover}, sort_order = ${i + 1} where id = ${row.id}`;
            result.groups.categories.updated++;
          } else result.groups.categories.unchanged++;
        }
        for (const [j, s] of c.subs.entries()) {
          const parent = catIds.get(c.slug)!;
          const [sr] = await tx<Row[]>`select * from categories where slug = ${s.slug} and parent_id = ${parent}`;
          if (!sr) {
            const [n] = await tx<{ id: string }[]>`insert into categories (slug, parent_id, label, sort_order, status) values (${s.slug}, ${parent}, ${s.label}, ${j + 1}, 'published') returning id`;
            subIds.set(`${c.slug}/${s.slug}`, n.id);
            result.groups.categories.inserted++;
          } else {
            subIds.set(`${c.slug}/${s.slug}`, sr.id);
            if (sr.label !== s.label || sr.sort_order !== j + 1) {
              await tx`update categories set label = ${s.label}, sort_order = ${j + 1} where id = ${sr.id}`;
              result.groups.categories.updated++;
            } else result.groups.categories.unchanged++;
          }
        }
      }
      const wantedTop = new Set(src.categories.map((c) => c.slug));
      result.extra.categories = (await tx<{ slug: string }[]>`select slug from categories where parent_id is null`).map((r) => r.slug).filter((s) => !wantedTop.has(s));

      // Tools. A tool that already exists is rewritten only when its exported form differs from the file.
      const existing = new Map((await exportTools(tx)).map((t) => [t.id, canonical(comparable(t))]));
      const existingIds = new Map((await tx<{ id: string; slug: string }[]>`select id, slug from tools`).map((r) => [r.slug, r.id]));
      const catId = (slug: string) => catIds.get(slug)!;
      for (const t of src.tools) {
        const row = toolRow(t, companyId.get(t.vendor)!, catIds.get(t.category)!, subIds.get(`${t.category}/${t.subcategory}`)!, tx);
        const have = existing.get(t.id);
        if (have === undefined) {
          const [n] = await tx<{ id: string }[]>`insert into tools ${tx({ slug: t.id, ...row, status: "published", published_at: `${t.added}T00:00:00Z` } as never)} returning id`;
          existingIds.set(t.id, n.id);
          await writeChildren(tx, n.id, t, catId, existingIds);
          result.groups.tools.inserted++;
        } else if (have !== canonical(comparable(t))) {
          const id = existingIds.get(t.id)!;
          await tx`update tools set ${tx(row as never)} where id = ${id}`;
          await writeChildren(tx, id, t, catId, existingIds);
          result.groups.tools.updated++;
        } else result.groups.tools.unchanged++;
      }
      const wantedTools = new Set(src.tools.map((t) => t.id));
      result.extra.tools = [...existingIds.keys()].filter((s) => !wantedTools.has(s));

      // Alternatives need every tool to exist, so they come last. Order is kept in sort_order.
      for (const t of src.tools) {
        const id = existingIds.get(t.id)!;
        const have = await tx<{ slug: string }[]>`select x.slug from tool_alternatives a join tools x on x.id = a.alternative_tool_id where a.tool_id = ${id} order by a.sort_order`;
        if (canonical(have.map((r) => r.slug)) !== canonical(t.alternatives)) {
          await tx`delete from tool_alternatives where tool_id = ${id}`;
          for (const [i, a] of t.alternatives.entries()) await tx`insert into tool_alternatives (tool_id, alternative_tool_id, sort_order) values (${id}, ${existingIds.get(a)!}, ${i + 1})`;
        }
      }

      // Affiliate programmes. The links table is never written: no programme is approved.
      const haveAff = await exportAffiliate(tx);
      for (const [slug, e] of Object.entries(src.affiliate)) {
        const id = existingIds.get(slug)!;
        const checked = e.programme?.checked ?? e.checked ?? null;
        const values = { status: e.status, network: e.programme?.network ?? null, apply_url: e.programme?.applyUrl ?? null, source_url: e.source ?? null, checked_at: checked, note: e.note ?? null };
        if (!haveAff[slug]) {
          await tx`insert into affiliate_programs ${tx({ tool_id: id, ...values } as never)}`;
          result.groups.affiliatePrograms.inserted++;
        } else if (canonical(haveAff[slug]) !== canonical(normaliseAffiliate(e))) {
          await tx`update affiliate_programs set ${tx(values as never)} where tool_id = ${id}`;
          result.groups.affiliatePrograms.updated++;
        } else result.groups.affiliatePrograms.unchanged++;
      }
      result.extra.affiliatePrograms = Object.keys(haveAff).filter((s) => !(s in src.affiliate));

      if (options.dryRun) throw new DryRunRollback();
    });
  } catch (e) {
    if (!(e instanceof DryRunRollback)) throw e;
  }
  return result;
}

/** What an affiliate entry looks like after a trip through the database (the programme's date is the only date stored). */
export function normaliseAffiliate(e: AffiliateEntry): AffiliateEntry {
  const { checked, ...rest } = e;
  return e.programme ? (rest as AffiliateEntry) : checked ? { ...rest, checked } : rest;
}
