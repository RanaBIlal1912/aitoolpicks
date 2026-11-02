// Server side only (articles are read from files at build time). Builds the compact article and news index the site search uses.
import { ARTICLES, TOPICS } from "@/data/articles";
import { LISTED_NEWS } from "@/data/news";
import { getTool } from "@/data/tools";
import type { ContentDoc } from "./site-search";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

export function buildContentIndex(): ContentDoc[] {
  const articles: ContentDoc[] = ARTICLES.map((a) => ({
    type: "article",
    id: a.slug,
    title: a.title,
    description: a.blurb,
    extra: [a.cat, TOPICS.find((t) => t.id === a.topic)?.label ?? "", ...a.tools.map((id) => getTool(id)?.name ?? "")].join(" "),
    href: a.href,
    meta: shortDate(a.date),
  }));
  // One entry per real-world story (see LISTED_NEWS), so search never lists the same story twice.
  const news: ContentDoc[] = LISTED_NEWS.map((n) => ({
    type: "news",
    id: n.slug,
    title: n.title,
    description: n.summary,
    extra: [n.source, n.kind, n.tag, ...(n.tools ?? []).map((id) => getTool(id)?.name ?? "")].join(" "),
    href: `/news/${n.slug}/`,
    meta: `${n.source} · ${shortDate(n.date)}`,
  }));
  return [...articles, ...news];
}
