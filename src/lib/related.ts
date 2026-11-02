// "Related tools" on a tool page: other tools from the same category or the same kind of work, chosen from the catalog's own fields.
// Never the tool itself and never a tool already shown as an alternative on the same page, so no tool appears twice.
import { getDetail } from "@/data/detail";
import { TOOLS, getTool, type Tool } from "@/data/tools";
import { Claimed } from "./dedupe";

const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3));

export function relatedFor(id: string, exclude: Iterable<string> = [], limit = 4): Tool[] {
  const base = getTool(id);
  if (!base) return [];
  const taken = new Claimed();
  taken.add([id, ...exclude]);
  const baseUse = words((getDetail(id)?.useCases ?? []).join(" ") + " " + base.bestFor);
  const scored = TOOLS.filter((t) => !taken.has(t.id))
    .map((t) => {
      let score = 0;
      if (t.category === base.category) score += 3;
      if (base.subcategory && t.subcategory === base.subcategory) score += 3;
      score += t.categories.filter((c) => base.categories.includes(c)).length;
      const use = words((getDetail(t.id)?.useCases ?? []).join(" ") + " " + t.bestFor);
      score += Math.min(3, [...use].filter((w) => baseUse.has(w)).length);
      return { t, score };
    })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name));
  return taken.take(scored, limit, (x) => x.t.id).map((x) => x.t);
}
