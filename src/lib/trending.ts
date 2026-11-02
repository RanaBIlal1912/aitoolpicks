// Trending tools are shown only from real data. Preferred: measured page views in content/trending.json (see docs/TRENDING.md); that file does not exist yet, because
// the site collects no usage data. Fallback: how many of the site's own news stories mention a tool (getNewsBuzz), which is counted from src/data/news.ts. Nothing here generates numbers.
import fs from "node:fs";
import path from "node:path";
import { NEWS } from "@/data/news";
import { getTool } from "@/data/tools";

export type Trending = { period: { from: string; to: string }; source: string; method: string; items: { id: string; views: number }[] };

const MIN_VIEWS = 30;

export function getTrending(): Trending | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "trending.json"), "utf-8")) as Trending;
    const items = raw.items.filter((i) => Number.isFinite(i.views) && i.views >= MIN_VIEWS).sort((a, b) => b.views - a.views).slice(0, 6);
    if (!raw.period?.from || !raw.period?.to || !raw.source || !raw.method || items.length < 3) return null;
    return { ...raw, items };
  } catch {
    return null;
  }
}

export type NewsBuzz = { id: string; stories: number; latest: string };

/** Tools ranked by how many news stories on this site mention them (ties: most recent story first). Null when fewer than 3 tools qualify. */
export function getNewsBuzz(limit = 6): NewsBuzz[] | null {
  const by = new Map<string, NewsBuzz>();
  for (const n of NEWS) {
    for (const id of n.tools ?? []) {
      if (!getTool(id)) continue;
      const cur = by.get(id) ?? { id, stories: 0, latest: "" };
      cur.stories += 1;
      if (n.date > cur.latest) cur.latest = n.date;
      by.set(id, cur);
    }
  }
  const list = [...by.values()].sort((a, b) => b.stories - a.stories || b.latest.localeCompare(a.latest) || a.id.localeCompare(b.id)).slice(0, limit);
  return list.length >= 3 ? list : null;
}
