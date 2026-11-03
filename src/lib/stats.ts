// The one place that counts things about the catalog. Every page that shows a total (tools, categories, free,
// freemium, paid, verified, partly verified, not verified) reads it from here, so the numbers cannot drift apart.
// Counts come straight from the generated catalog index, which is rebuilt from content/tools/*.json on every build.
import { CATEGORIES, TOOLS, toolsInCategory, type Tool } from "@/data/tools";

export type CatalogStats = {
  tools: number;
  categories: number;
  /** pricingStatus */
  verified: number;
  partial: number;
  unverified: number;
  /** pricingModel */
  free: number;
  freemium: number;
  paid: number;
  other: number;
  /** A free plan is documented on the vendor's page (separate from the pricing model). */
  withFreePlan: number;
};

/** Counts for any list of tools. */
export function statsFor(list: readonly Tool[]): Omit<CatalogStats, "categories"> {
  const model = (m: Tool["pricingModel"]) => list.filter((t) => t.pricingModel === m).length;
  const free = model("free");
  const freemium = model("freemium");
  const paid = model("paid");
  return {
    tools: list.length,
    verified: list.filter((t) => t.pricingStatus === "verified").length,
    partial: list.filter((t) => t.pricingStatus === "partial").length,
    unverified: list.filter((t) => t.pricingStatus === "unverified").length,
    free,
    freemium,
    paid,
    other: list.length - free - freemium - paid,
    withFreePlan: list.filter((t) => t.freePlan === true).length,
  };
}

/** Whole-catalog counts. */
export const STATS: CatalogStats = { ...statsFor(TOOLS), categories: CATEGORIES.length };

/** Counts for one category page (tools whose primary or secondary category matches). */
export function categoryStats(slug: string) {
  return statsFor(toolsInCategory(slug));
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
