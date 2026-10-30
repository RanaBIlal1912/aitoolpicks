import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain JavaScript module shared with the build script
import { buildIndex, buildLinks, buildPriceRefs, healthReport, loadCategories, priceLabel, validateAll, validateTool } from "../scripts/catalog-lib.mjs";

const root = process.cwd();
const { entries, errors } = validateAll(root);
const categories = new Set<string>(loadCategories(root).map((c: { slug: string }) => c.slug));
const ids = new Set<string>(entries.map((t: { id: string }) => t.id));
const subs = new Map<string, Set<string>>(loadCategories(root).map((c: { slug: string; subs: { slug: string }[] }) => [c.slug, new Set(c.subs.map((x) => x.slug))]));
const ctx = { categories, ids, subs };

type Plan = { name: string; audience: string; currency: string; unit: string; monthly?: number; annual?: number; custom?: boolean; note?: string };
type Rec = { id: string; name: string; alternatives: string[]; pricing: { status: string; model: string; source: string; checked: string; blockedReason?: string; plans: Plan[]; reference?: unknown }; sources: unknown[] } & Record<string, unknown>;
const records = entries as Rec[];
const sample = () => structuredClone(records.find((t) => t.pricing.status === "verified")!) as Rec;

describe("catalog records", () => {
  it("validate with no problems", () => {
    expect(errors).toEqual([]);
  });

  it("covers the categories the product requires, with several tools each", () => {
    const counts = new Map<string, number>();
    for (const t of records) for (const c of t.categories as string[]) counts.set(c, (counts.get(c) ?? 0) + 1);
    for (const slug of ["assistants", "coding", "video", "image", "audio", "writing", "research", "marketing", "automation"]) {
      expect(counts.get(slug) ?? 0, slug).toBeGreaterThanOrEqual(2);
    }
    expect(records.length).toBeGreaterThanOrEqual(50);
  });

  it("keeps one file per tool named after its id", () => {
    const files = fs.readdirSync(path.join(root, "content", "tools")).filter((f) => f.endsWith(".json"));
    expect(files.sort()).toEqual(records.map((t) => `${t.id}.json`).sort());
  });

  it("never shows a price for a tool whose pricing page could not be read", () => {
    for (const t of records.filter((r) => r.pricing.status === "unverified")) {
      expect(t.pricing.blockedReason, t.id).toBeTruthy();
      for (const p of t.pricing.plans) {
        expect(p.monthly, t.id).toBeUndefined();
        expect(p.annual, t.id).toBeUndefined();
      }
      expect(t.pricing.reference, t.id).toBeUndefined();
    }
  });

  it("uses each product's own plan names instead of a shared template", () => {
    const names = new Set(records.flatMap((t) => t.pricing.plans.map((p) => p.name)));
    expect(names.has("Max")).toBe(true);
    expect(names.has("Credits")).toBe(false);
    expect(names.size).toBeGreaterThan(50);
  });

  it("keeps merchant currencies explicit and supports non-USD merchants", () => {
    const cur = new Set(records.flatMap((t) => t.pricing.plans.map((p) => p.currency)));
    expect(cur.has("USD")).toBe(true);
    expect(cur.has("EUR")).toBe(true);
  });

  it("flags pricing that has not been rechecked within the window", () => {
    const fresh = healthReport(records, new Date("2026-10-30T00:00:00Z"));
    expect(fresh.stale).toEqual([]);
    const old = healthReport(records, new Date("2027-03-01T00:00:00Z"));
    expect(old.stale.length).toBe(records.length);
  });

  it("generated files match the records (run `npm run catalog` after editing content/tools)", () => {
    const read = (f: string) => JSON.parse(fs.readFileSync(path.join(root, "src", "data", "generated", f), "utf-8"));
    expect(read("catalog-index.json")).toEqual(JSON.parse(JSON.stringify(buildIndex(records))));
    expect(read("price-refs.json")).toEqual(JSON.parse(JSON.stringify(buildPriceRefs(records))));
    expect(read("tool-links.json")).toEqual(JSON.parse(JSON.stringify(buildLinks(records))));
  });
});

describe("catalog validation rules", () => {
  it("accepts a good record", () => {
    expect(validateTool(sample(), ctx)).toEqual([]);
  });

  it("rejects placeholder text, bad urls and unknown categories", () => {
    const a = sample();
    a.description = "TODO write a real description here please";
    a.website = "http://insecure.example";
    a.category = "nonsense";
    const errs = validateTool(a, ctx).join("\n");
    expect(errs).toContain("todo");
    expect(errs).toContain("website must be https");
    expect(errs).toContain("unknown category");
  });

  it("rejects unknown alternatives and a verified record without plans", () => {
    const a = sample();
    a.alternatives = ["does-not-exist"];
    a.pricing.plans = [];
    const errs = validateTool(a, ctx).join("\n");
    expect(errs).toContain("bad alternative");
    expect(errs).toContain("verified pricing needs plans");
  });

  it("rejects prices on unverified records and unverified records without a reason", () => {
    const a = sample();
    a.pricing.status = "unverified";
    delete a.pricing.blockedReason;
    delete a.pricing.reference;
    const errs = validateTool(a, ctx).join("\n");
    expect(errs).toContain("must not carry prices");
    expect(errs).toContain("needs blockedReason");
  });

  it("formats plan prices in the merchant currency without converting", () => {
    expect(priceLabel({ currency: "USD", unit: "per month", monthly: 20, annual: 17 })).toBe("$20/mo monthly · $17/mo yearly");
    expect(priceLabel({ currency: "EUR", unit: "per month", annual: 20 })).toBe("€20/mo billed yearly");
    expect(priceLabel({ currency: "USD", unit: "per seat per month", monthly: 25 })).toBe("$25/seat/mo");
    expect(priceLabel({ currency: "USD", unit: "per month", monthly: 0 })).toBe("Free");
    expect(priceLabel({ currency: "USD", unit: "per month", custom: true })).toBe("Custom pricing");
  });
});

describe("catalog index", () => {
  it("only claims a free plan when documented, and keeps unknowns as null", () => {
    const idx = buildIndex(records) as { id: string; freePlan: boolean | null }[];
    expect(idx.find((t) => t.id === "claude")!.freePlan).toBe(true);
    expect(idx.find((t) => t.id === "chatgpt")!.freePlan).toBe(true); // documented on the official pricing page
    expect(idx.find((t) => t.id === "namecheap")!.freePlan).toBeNull();
    expect(idx.find((t) => t.id === "luma")!.freePlan).toBeNull();
  });

  it("sorts and filters on real numbers: lowest USD starting price", () => {
    const idx = buildIndex(records) as { id: string; fromUsd: number | null }[];
    const priced = idx.filter((t) => t.fromUsd !== null);
    expect(priced.length).toBeGreaterThan(15);
    expect(idx.find((t) => t.id === "github-copilot")!.fromUsd).toBe(10);
    expect(idx.find((t) => t.id === "namecheap")!.fromUsd).toBeNull(); // per-domain prices only, no plan price
  });
});
