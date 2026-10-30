// Trending tools are shown only from real, measured data in content/trending.json (see docs/TRENDING.md). That file does not exist yet, because the site
// collects no usage data, so getTrending() returns null and the home page shows no Trending section. Nothing here ever generates numbers.
import fs from "node:fs";
import path from "node:path";

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
