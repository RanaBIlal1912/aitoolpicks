// Catalog loader, validator and index builder. Plain JavaScript so the build script, the tests and the app's
// generated files all use exactly the same rules.
//
// One JSON file per tool lives in content/tools/. Adding a tool means adding one file; nothing else changes.
// Run `npm run catalog` to validate and regenerate the lightweight files the browser needs.
import fs from "node:fs";
import path from "node:path";

export const PRICING_STATUS = ["verified", "partial", "unverified"];
export const PRICING_MODELS = ["free", "freemium", "free-trial", "paid", "usage-based", "contact-sales", "open-source", "unknown"];
export const AUDIENCES = ["individual", "team", "business", "enterprise", "api"];
export const CURRENCIES = ["USD", "GBP", "EUR", "PKR", "CAD", "AUD"];
export const STALE_AFTER_DAYS = 90;
export const OPEN_SOURCE_STATUS = ["open-source", "source-available", "open-weights", "proprietary"];

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS = /^https:\/\//;

export function loadCategories(root) {
  return JSON.parse(fs.readFileSync(path.join(root, "content", "categories.json"), "utf-8"));
}

export function subMap(categoryList) {
  return new Map(categoryList.map((c) => [c.slug, new Set((c.subs ?? []).map((s) => s.slug))]));
}

export function loadTools(root) {
  const dir = path.join(root, "content", "tools");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ file: f, tool: JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) }));
}

const isStr = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const isList = (v, min = 1) => Array.isArray(v) && v.length >= min && v.every((x) => isStr(x));

/** Returns a list of human-readable problems; an empty list means the record is valid. */
export function validateTool(t, ctx) {
  const e = [];
  const at = (m) => e.push(`${t.id ?? "?"}: ${m}`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(t.id ?? "")) at("id must be kebab-case");
  for (const k of ["name", "vendor", "tagline"]) if (!isStr(t[k], 2)) at(`missing ${k}`);
  if (!isStr(t.description, 40)) at("description must be a real sentence (40+ chars)");
  if (!HTTPS.test(t.website ?? "")) at("website must be https");
  if (!ctx.categories.has(t.category)) at(`unknown category ${t.category}`);
  if (!Array.isArray(t.categories) || !t.categories.includes(t.category) || !t.categories.every((c) => ctx.categories.has(c))) at("categories must include the primary category and only known slugs");
  for (const k of ["features", "useCases", "audience", "strengths", "limitations"]) if (!isList(t[k])) at(`${k} must be a non-empty list of strings`);
  if (!Array.isArray(t.alternatives)) at("alternatives must be a list");
  else for (const a of t.alternatives) if (!ctx.ids.has(a) || a === t.id) at(`bad alternative ${a}`);
  if (!ISO.test(t.verified ?? "")) at("verified must be an ISO date");
  if (!ISO.test(t.added ?? "")) at("added must be an ISO date");
  if (t.subcategory !== undefined && !(ctx.subs?.get(t.category)?.has(t.subcategory))) at(`subcategory ${t.subcategory} is not defined for ${t.category}`);
  if (t.openSource !== undefined) {
    const o = t.openSource;
    if (!OPEN_SOURCE_STATUS.includes(o.status) || !isStr(o.note) || !HTTPS.test(o.source ?? "")) at("openSource needs a status, a note and an https source");
  }
  if (!Array.isArray(t.sources) || t.sources.length < 1) at("needs at least one source");
  else for (const s of t.sources) if (!isStr(s.label) || !HTTPS.test(s.url ?? "") || !ISO.test(s.checked ?? "")) at(`bad source ${JSON.stringify(s)}`);
  if (!Number.isFinite(t.hue)) at("hue must be a number");
  const blob = JSON.stringify(t).toLowerCase();
  for (const bad of ["lorem", "todo", "tbd", "placeholder"]) if (blob.includes(bad)) at(`contains "${bad}"`);

  const p = t.pricing;
  if (!p || typeof p !== "object") return (at("missing pricing"), e);
  if (!PRICING_STATUS.includes(p.status)) at("pricing.status invalid");
  if (!PRICING_MODELS.includes(p.model)) at("pricing.model invalid");
  if (!ISO.test(p.checked ?? "")) at("pricing.checked must be an ISO date");
  if (!HTTPS.test(p.source ?? "")) at("pricing.source must be an https official page");
  if (!Array.isArray(p.plans)) at("pricing.plans must be a list");
  else {
    for (const pl of p.plans) {
      if (!isStr(pl.name)) at("plan without a name");
      if (!AUDIENCES.includes(pl.audience)) at(`plan ${pl.name}: bad audience`);
      if (!CURRENCIES.includes(pl.currency)) at(`plan ${pl.name}: bad currency`);
      for (const k of ["monthly", "annual", "annualTotal"]) if (pl[k] !== undefined && !(typeof pl[k] === "number" && pl[k] >= 0)) at(`plan ${pl.name}: ${k} must be a number >= 0`);
      const priced = pl.monthly !== undefined || pl.annual !== undefined || pl.annualTotal !== undefined;
      if (p.status === "verified" && !priced && !pl.custom && !pl.note) at(`plan ${pl.name}: verified pricing needs a price, custom flag or note`);
    }
    if (p.status === "verified" && p.plans.length === 0) at("verified pricing needs plans");
    if (p.status === "unverified") {
      if (p.plans.some((pl) => pl.monthly !== undefined || pl.annual !== undefined)) at("unverified pricing must not carry prices");
      if (!isStr(p.blockedReason)) at("unverified pricing needs blockedReason");
    }
  }
  if (p.trial !== undefined && !isStr(p.trial, 5)) at("pricing.trial must be a sentence of text");
  if (p.free?.details !== undefined && !isStr(p.free.details, 5)) at("pricing.free.details must be text");
  if (p.reference) {
    const r = p.reference;
    if (!(typeof r.amount === "number" && r.amount >= 0) || !CURRENCIES.includes(r.currency) || !isStr(r.plan)) at("bad pricing.reference");
    if (p.status === "unverified") at("unverified pricing cannot have a reference price");
  }
  return e;
}

export function validateAll(root) {
  const categoryList = loadCategories(root);
  const categories = new Set(categoryList.map((c) => c.slug));
  const subs = subMap(categoryList);
  const entries = loadTools(root);
  const ids = new Set(entries.map((e) => e.tool.id));
  const errors = [];
  if (ids.size !== entries.length) errors.push("duplicate tool ids");
  for (const { file, tool } of entries) {
    if (file !== `${tool.id}.json`) errors.push(`${file}: file name must match id`);
    errors.push(...validateTool(tool, { categories, ids, subs }));
  }
  return { entries: entries.map((e) => e.tool), errors };
}

/** Compact text for one plan price in the merchant's own currency (never converted). */
export function priceLabel(pl) {
  const sym = { USD: "$", GBP: "£", EUR: "€", PKR: "Rs ", CAD: "C$", AUD: "A$" }[pl.currency] ?? "";
  const n = (v) => `${sym}${Number.isInteger(v) ? v : v.toFixed(2)}`;
  const suffix = ({ "per month": "/mo", "per seat per month": "/seat/mo", "per user per month": "/user/mo", "per member per month": "/member/mo", "per licence per month": "/licence/mo", "per outcome": "/outcome" })[pl.unit] ?? "/mo";
  const hasMonthly = pl.monthly !== undefined;
  const hasAnnual = pl.annual !== undefined;
  if (pl.custom && !hasMonthly && !hasAnnual) return "Custom pricing";
  if (pl.monthly === 0 && !hasAnnual) return "Free";
  if (hasMonthly && hasAnnual) return `${n(pl.monthly)}${suffix} monthly · ${n(pl.annual)}${suffix} yearly`;
  if (hasMonthly) return `${n(pl.monthly)}${suffix}`;
  if (hasAnnual) return `${n(pl.annual)}${suffix} billed yearly`;
  if (pl.annualTotal !== undefined) return `${n(pl.annualTotal)}/yr`;
  return "See note";
}

function freeFlag(t) {
  const p = t.pricing;
  if (p.free && typeof p.free.available === "boolean") return p.free.available;
  if (p.plans.some((pl) => pl.monthly === 0)) return true;
  return null; // not stated
}

/** Lowest individual-plan price in USD, used for sorting and "from" labels. Null when unknown. */
function fromUsd(t) {
  const prices = t.pricing.plans
    .filter((pl) => pl.currency === "USD" && pl.audience === "individual" && !(pl.monthly === 0 && pl.annual === undefined))
    .map((pl) => (pl.monthly !== undefined ? pl.monthly : pl.annual))
    .filter((v) => typeof v === "number" && v > 0);
  return prices.length ? Math.min(...prices) : null;
}

export function buildIndex(tools) {
  return tools.map((t) => ({
    id: t.id,
    name: t.name,
    vendor: t.vendor,
    category: t.category,
    subcategory: t.subcategory ?? null,
    categories: t.categories,
    tagline: t.tagline,
    description: t.description,
    bestFor: t.audience.slice(0, 2).join(" and "),
    officialUrl: t.website,
    hue: t.hue,
    ...(t.review ? { review: t.review } : {}),
    keyFeature: t.features[0],
    freePlan: freeFlag(t),
    trial: Boolean(t.pricing.trial),
    openSource: t.openSource ? t.openSource.status : null,
    added: t.added,
    pricingModel: t.pricing.model,
    pricingStatus: t.pricing.status,
    fromUsd: fromUsd(t),
    verified: t.verified,
    checked: t.pricing.checked,
    pricingSource: t.pricing.source,
    plans: t.pricing.plans.slice(0, 6).map((pl) => ({ name: pl.name, price: priceLabel(pl) })),
  }));
}

export function buildPriceRefs(tools) {
  const out = {};
  for (const t of tools) {
    const r = t.pricing.reference;
    if (r && t.pricing.status !== "unverified") out[t.id] = { ...r, source: t.pricing.source, checked: t.pricing.checked };
  }
  return out;
}

export function buildLinks(tools) {
  return Object.fromEntries(tools.map((t) => [t.id, [t.name, t.website]]));
}

export function healthReport(tools, today = new Date()) {
  const age = (d) => Math.floor((today - new Date(`${d}T12:00:00Z`)) / 86400000);
  return {
    total: tools.length,
    byStatus: Object.fromEntries(PRICING_STATUS.map((s) => [s, tools.filter((t) => t.pricing.status === s).map((t) => t.id)])),
    stale: tools.filter((t) => age(t.pricing.checked) > STALE_AFTER_DAYS).map((t) => t.id),
    needsAttention: tools.filter((t) => t.pricing.status !== "verified").map((t) => t.id),
  };
}
