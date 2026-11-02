// Site-wide search over tools, blog articles and AI news. Pure and client-safe: the page builds a small index of articles and news on the
// server (src/lib/search-index.ts) and passes it in; tools are searched with the existing catalog search (src/lib/search.ts).
// Every result carries the exact page it opens. Nothing here ever points at a listing page.
import { TOOLS } from "@/data/tools";
import { normalizeKey } from "./dedupe";
import { searchTools } from "./search";

export type ResultType = "tool" | "article" | "news";

export const TYPE_LABEL: Record<ResultType, string> = { tool: "Tool", article: "Blog", news: "AI News" };

/** An article or news item as the search sees it. `href` is the exact page, without the site's base path. */
export type ContentDoc = { type: "article" | "news"; id: string; title: string; description: string; extra: string; href: string; meta: string };

export type SiteResult = { type: ResultType; id: string; title: string; description: string; href: string; meta: string };

const MAX = { tool: 6, article: 4, news: 4 } as const;

const words = (q: string): string[] => q.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 0);

/** Score for a document, or 0 when it does not match. Every word of the query has to match somewhere (title, tags or description). */
function scoreDoc(d: ContentDoc, ws: string[]): number {
  const title = d.title.toLowerCase();
  const titleWords = title.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/);
  const extra = d.extra.toLowerCase();
  const desc = d.description.toLowerCase();
  let score = 0;
  for (const w of ws) {
    let s = 0;
    if (titleWords.includes(w)) s = 12;
    else if (titleWords.some((t) => t.startsWith(w))) s = 8;
    else if (title.includes(w)) s = 5;
    else if (extra.includes(w)) s = 4;
    else if (desc.includes(w)) s = 2;
    if (s === 0) return 0;
    score += s;
  }
  if (title.includes(ws.join(" "))) score += 10;
  return score;
}

/**
 * The results for a query, grouped Tools, Blog, AI News and de-duplicated (one result per destination page).
 * An empty list means nothing matched, and the caller shows an empty state.
 */
export function searchSite(query: string, docs: ContentDoc[]): SiteResult[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const ws = words(q);
  if (ws.length === 0) return [];
  const key = normalizeKey(q);

  // Tools: a tool whose name or id is what was typed comes first, then the catalog's own ranking.
  const named = TOOLS.filter((t) => normalizeKey(t.name).startsWith(key) || normalizeKey(t.id) === key || normalizeKey(t.name).includes(key));
  const ranked = searchTools(q, TOOLS).map((m) => m.tool);
  const toolList = [...named, ...ranked];
  const tools: SiteResult[] = toolList.map((t) => ({ type: "tool", id: t.id, title: t.name, description: t.tagline, href: `/tools/${t.id}/`, meta: t.vendor }));

  const scored = (type: "article" | "news") =>
    docs
      .filter((d) => d.type === type)
      .map((d) => ({ d, s: scoreDoc(d, ws) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ d }) => ({ type: d.type, id: d.id, title: d.title, description: d.description, href: d.href, meta: d.meta }) as SiteResult);

  // Something whose title contains the whole phrase that was typed is what the visitor is after, so it goes first, whatever its type.
  const phrase = q.toLowerCase();
  const exact: SiteResult[] = phrase.length >= 4 ? docs.filter((d) => d.title.toLowerCase().includes(phrase)).map((d) => ({ type: d.type, id: d.id, title: d.title, description: d.description, href: d.href, meta: d.meta }) as SiteResult) : [];

  const seen = new Set<string>();
  const out: SiteResult[] = [];
  const add = (list: SiteResult[], max: number) => {
    let n = 0;
    for (const r of list) {
      if (n >= max) break;
      const dest = r.href;
      const same = `${r.type}:${normalizeKey(r.title)}`;
      if (seen.has(dest) || seen.has(same)) continue;
      seen.add(dest);
      seen.add(same);
      out.push(r);
      n++;
    }
  };
  // A tool that was named outright stays first (searching "ChatGPT" opens ChatGPT); otherwise an exact title match leads.
  add(named.length ? tools : [...exact, ...tools], MAX.tool + (named.length ? 0 : 3));
  if (named.length) add(exact, 3);
  add(scored("article"), MAX.article);
  add(scored("news"), MAX.news);
  return out;
}
