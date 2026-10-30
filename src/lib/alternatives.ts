// Alternatives are chosen by rules over verified catalog fields, and each one carries the reasons it was chosen and the differences we can
// state from the records. Two tools being listed together never means they are the same product or equally good.
import type { Tool } from "@/data/catalog-types";
import { getDetail } from "@/data/detail";
import { CATEGORIES, TOOLS, getTool } from "@/data/tools";

export type Alternative = { tool: Tool; score: number; reasons: string[]; differences: string[]; curated: boolean };

const catLabel = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
const subLabel = (t: Tool) => CATEGORIES.find((c) => c.slug === t.category)?.subs.find((s) => s.slug === t.subcategory)?.label;
const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function alternativesFor(id: string, limit = 12): Alternative[] {
  const base = getTool(id);
  if (!base) return [];
  const bd = getDetail(id);
  const out: Alternative[] = [];
  for (const t of TOOLS) {
    if (t.id === id) continue;
    const td = getDetail(t.id);
    const curated = !!bd?.alternatives.includes(t.id) || !!td?.alternatives.includes(id);
    let score = curated ? 5 : 0;
    const reasons: string[] = [];
    const differences: string[] = [];

    if (curated) reasons.push(`Listed as an alternative in our ${bd?.alternatives.includes(t.id) ? base.name : t.name} record`);
    if (base.subcategory && t.category === base.category && t.subcategory === base.subcategory) {
      score += 4;
      reasons.push(`Same kind of tool: ${subLabel(base)}`);
    } else if (t.category === base.category) {
      score += 2;
      reasons.push(`Same category: ${catLabel(base.category)}`);
    } else {
      const shared = t.categories.find((c) => base.categories.includes(c));
      if (shared) {
        score += 1;
        reasons.push(`Both appear in ${catLabel(shared)}`);
      }
    }
    const aud = (bd?.audience ?? []).filter((a) => td?.audience.includes(a));
    if (aud.length) {
      score += Math.min(2, aud.length);
      reasons.push(`Aimed at the same people: ${aud.slice(0, 2).join(", ").toLowerCase()}`);
    }
    if (base.freePlan === true && t.freePlan === true) {
      score += 1;
      reasons.push("Both document a free plan");
    } else if (base.freePlan !== null && t.freePlan !== null && base.freePlan !== t.freePlan) {
      differences.push(t.freePlan ? `${t.name} documents a free plan; ${base.name} does not` : `${base.name} documents a free plan; ${t.name} does not`);
    }
    if (base.fromUsd !== null && t.fromUsd !== null && base.fromUsd !== t.fromUsd) {
      differences.push(`Lowest USD plan: ${base.name} ${usd(base.fromUsd)}/month, ${t.name} ${usd(t.fromUsd)}/month`);
    }
    const bo = base.openSource && base.openSource !== "proprietary";
    const to = t.openSource && t.openSource !== "proprietary";
    if (bo !== to && (base.openSource || t.openSource)) differences.push(to ? `${t.name} is ${t.openSource}` : `${base.name} is ${base.openSource}`);
    if (base.pricingModel !== t.pricingModel) differences.push(`Pricing model: ${base.name} ${base.pricingModel.replace("-", " ")}, ${t.name} ${t.pricingModel.replace("-", " ")}`);

    // Unrelated tools are not recommended: a pair needs a curated link, the same subcategory/category, or a shared audience plus a shared category.
    const related = curated || reasons.some((r) => r.startsWith("Same")) || (aud.length > 0 && reasons.some((r) => r.startsWith("Both appear")));
    if (!related || score < 3) continue;
    out.push({ tool: t, score, reasons, differences: differences.slice(0, 3), curated });
  }
  return out.sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name)).slice(0, limit);
}
