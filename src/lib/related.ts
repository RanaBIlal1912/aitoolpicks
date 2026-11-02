// "Related tools" on a tool page: other tools of the same kind, chosen from the catalog's own fields and shown only when they are genuinely close.
// A related tool shares the subcategory (or the primary category when the tool has no subcategory), or shares a wider category together with several words
// in what the two tools are used for. Never the tool itself and never a tool already shown as an alternative on the same page, so no tool appears twice. When nothing close exists the
// page shows no related section rather than an unrelated tool.
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
      const sameSub = !!base.subcategory && t.subcategory === base.subcategory && t.category === base.category;
      const sameCat = t.category === base.category;
      const sharedSecond = t.categories.some((c) => c !== base.category && base.categories.includes(c));
      const use = words((getDetail(t.id)?.useCases ?? []).join(" ") + " " + t.bestFor);
      const overlap = [...use].filter((w) => baseUse.has(w)).length;
      // Close enough. When the tool has a subcategory (for example "Customer support" inside Marketing), only that subcategory counts as the same kind
      // of tool; the wider category then needs real overlap in what the tools are used for.
      const close = base.subcategory ? sameSub || ((sameCat || sharedSecond) && overlap >= 3) : sameCat || (sharedSecond && overlap >= 3);
      const score = (sameSub ? 6 : 0) + (sameCat ? 4 : 0) + (sharedSecond ? 1 : 0) + Math.min(3, overlap);
      return { t, score, close };
    })
    .filter((x) => x.close)
    .sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name));
  return taken.take(scored, limit, (x) => x.t.id).map((x) => x.t);
}
