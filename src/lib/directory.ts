// Pure filtering, sorting and paging for the tool directory. Kept apart from the component so it can be tested
// and reused by the pricing hub and category pages.
import type { Tool } from "@/data/catalog-types";

export type Sort = "name" | "verified" | "price" | "added" | "updated";

export type Filters = {
  q: string;
  category: string;
  sub: string;
  models: string[];
  freeOnly: boolean;
  trialOnly: boolean;
  openOnly: boolean;
  verifiedOnly: boolean;
};

export const NO_FILTERS: Filters = { q: "", category: "all", sub: "all", models: [], freeOnly: false, trialOnly: false, openOnly: false, verifiedOnly: false };

export const PAGE_SIZE = 24;

const STATUS_RANK = { verified: 0, partial: 1, unverified: 2 } as const;

export function filterTools(list: Tool[], f: Filters): Tool[] {
  const needle = f.q.trim().toLowerCase();
  return list.filter((t) => {
    if (f.category !== "all" && !t.categories.includes(f.category)) return false;
    if (f.sub !== "all" && t.subcategory !== f.sub) return false;
    if (f.models.length && !f.models.includes(t.pricingModel)) return false;
    if (f.freeOnly && t.freePlan !== true) return false;
    if (f.trialOnly && !t.trial) return false;
    if (f.openOnly && !(t.openSource === "open-source" || t.openSource === "source-available" || t.openSource === "open-weights")) return false;
    if (f.verifiedOnly && t.pricingStatus !== "verified") return false;
    if (!needle) return true;
    return [t.name, t.vendor, t.tagline, t.description, t.bestFor, t.keyFeature].join(" ").toLowerCase().includes(needle);
  });
}

export function sortTools(list: Tool[], sort: Sort): Tool[] {
  const out = [...list];
  const byName = (a: Tool, b: Tool) => a.name.localeCompare(b.name);
  out.sort((a, b) => {
    if (sort === "verified") return STATUS_RANK[a.pricingStatus] - STATUS_RANK[b.pricingStatus] || byName(a, b);
    if (sort === "added") return b.added.localeCompare(a.added) || byName(a, b);
    if (sort === "updated") return b.verified.localeCompare(a.verified) || byName(a, b);
    if (sort === "price") return (a.fromUsd ?? Number.POSITIVE_INFINITY) - (b.fromUsd ?? Number.POSITIVE_INFINITY) || byName(a, b);
    return byName(a, b);
  });
  return out;
}

export function page<T>(list: T[], pages: number, size = PAGE_SIZE): { items: T[]; more: number } {
  const n = pages * size;
  return { items: list.slice(0, n), more: Math.max(0, list.length - n) };
}
