// The ecosystem view, built only from verified records: companies are the `vendor` of catalog tools (as each product's official page names it),
// models come from content/models.json (each with a source), and relationships are the ones the records state: which company makes which tool,
// which tools a model is supported by, which news stories mention a company's tools. Nothing here is inferred.
import models from "../../content/models.json";
import { NEWS, type NewsItem } from "./news";
import { TOOLS } from "./tools";
import type { Tool } from "./catalog-types";

export type Model = {
  id: string;
  name: string;
  company: string;
  released: string;
  summary: string;
  licence: string;
  tools: string[];
  toolNote: string;
  news: string;
  sources: { label: string; url: string; checked: string }[];
};

export type Company = { slug: string; name: string; tools: Tool[]; models: Model[]; news: NewsItem[]; openSource: Tool[] };

export const MODELS = models as Model[];

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const COMPANIES: Company[] = (() => {
  const by = new Map<string, Tool[]>();
  for (const t of TOOLS) by.set(t.vendor, [...(by.get(t.vendor) ?? []), t]);
  return [...by.entries()]
    .map(([name, tools]) => ({
      slug: slugify(name),
      name,
      tools,
      models: MODELS.filter((m) => m.company === name),
      news: NEWS.filter((n) => n.tools?.some((id) => tools.some((t) => t.id === id))).sort((a, b) => b.date.localeCompare(a.date)),
      openSource: tools.filter((t) => t.openSource && t.openSource !== "proprietary"),
    }))
    .sort((a, b) => b.tools.length - a.tools.length || a.name.localeCompare(b.name));
})();

export function getCompany(slug: string): Company | undefined {
  return COMPANIES.find((c) => c.slug === slug);
}
