// Decides which tools each section of the home page shows. Every section draws from a shared Claimed set, so a tool shown in one
// section is never shown in another: Trending, then Editor's picks, then Recently added, then the hero artwork, then the logo ribbon.
import { TOOLS, getTool, type Tool } from "@/data/tools";
import { logoFor } from "@/data/logos";
import { Claimed } from "./dedupe";
import { getNewsBuzz, getTrending } from "./trending";

export type TrendingRow = { id: string; badge: string };

export type HomeTools = {
  trending: { rows: TrendingRow[]; lead: string } | null;
  picks: string[];
  recent: Tool[];
  hero: string[];
  ribbon: Tool[];
};

/** Curated order for Editor's picks; the first five that are not already shown elsewhere are used. */
const PICK_ORDER = ["claude", "github-copilot", "runway", "elevenlabs", "perplexity", "notion", "chatgpt", "midjourney", "cursor", "canva", "figma", "gemini"];
/** Preferred hero artwork, in slot order. A tool already shown elsewhere is replaced by another tool that has a real logo. */
const HERO_ORDER = ["chatgpt", "midjourney", "gemini", "notion", "canva", "figma"];

export function allocateHomeTools(): HomeTools {
  const used = new Claimed();

  let trending: HomeTools["trending"] = null;
  const measured = getTrending();
  const buzz = getNewsBuzz();
  if (measured) {
    const rows = used.take(measured.items, 6, (i) => i.id).map((i) => ({ id: i.id, badge: `${i.views} views` }));
    trending = { rows, lead: `Measured page views from ${measured.period.from} to ${measured.period.to} (${measured.source}).` };
  } else if (buzz) {
    const rows = used.take(buzz, 6, (b) => b.id).map((b) => ({ id: b.id, badge: `In ${b.stories} news ${b.stories === 1 ? "story" : "stories"}` }));
    trending = { rows, lead: "Ranked by how many news stories on this site mention each tool. This is coverage in our own feed, not page-view or usage data." };
  }

  const pickTools = PICK_ORDER.map((id) => getTool(id)).filter((t): t is Tool => !!t);
  const picks = used.take(pickTools, 5, (t) => t.id).map((t) => t.id);

  // "Added to our directory", newest first; not "released by the vendor".
  const newest = [...TOOLS].sort((a, b) => b.added.localeCompare(a.added) || a.name.localeCompare(b.name));
  const recent = used.take(newest, 6, (t) => t.id);

  const heroPool = [...HERO_ORDER.map((id) => getTool(id)).filter((t): t is Tool => !!t), ...TOOLS.filter((t) => !HERO_ORDER.includes(t.id))].filter((t) => !!logoFor(t.id));
  const hero = used.take(heroPool, 6, (t) => t.id).map((t) => t.id);

  const ribbon = used.take(
    TOOLS.filter((t) => t.openSource !== "open-source"),
    20,
    (t) => t.id,
  );

  return { trending, picks, recent, hero, ribbon };
}
