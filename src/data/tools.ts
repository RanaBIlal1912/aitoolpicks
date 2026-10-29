// Client-safe view of the catalog. The full records (pricing tables, sources, features) are read from
// content/tools/*.json on the server; this file only exposes the compact generated index and categories.
import index from "./generated/catalog-index.json";
import categoriesJson from "../../content/categories.json";
import type { Tool } from "./catalog-types";

export type { Tool } from "./catalog-types";

export type Category = { slug: string; label: string; short: string; cover: "chip" | "board" | "neural" | "lens" | "rack" | "wafer" | "fibre" | "signal"; blurb: string };

export const CATEGORIES = categoriesJson as Category[];
export const TOOLS = index as Tool[];

export const PRICING_MODEL_LABEL: Record<string, string> = {
  free: "Free",
  freemium: "Free plan + paid",
  "free-trial": "Free trial",
  paid: "Paid",
  "usage-based": "Usage-based",
  "contact-sales": "Contact sales",
  "open-source": "Open source",
  unknown: "Not verified",
};

export function getTool(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id);
}
export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
export function toolsInCategory(slug: string): Tool[] {
  return TOOLS.filter((t) => t.categories.includes(slug));
}
