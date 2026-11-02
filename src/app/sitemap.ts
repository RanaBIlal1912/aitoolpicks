import type { MetadataRoute } from "next";
import { ARTICLES } from "@/data/articles";
import { REVIEWS } from "@/data/reviews";
import { COMPARISONS } from "@/data/compare";
import { CATEGORIES, TOOLS } from "@/data/tools";
import { LISTED_NEWS } from "@/data/news";
import { ROUNDUPS } from "@/data/roundups";
import { TOPICS } from "@/data/articles";
import { COMPANIES } from "@/data/companies";
import { SITE, absUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Latest of the given ISO dates, so each page reports when its own content last changed. */
const latest = (dates: (string | undefined)[], fallback: string) => dates.filter((d): d is string => !!d).sort().at(-1) ?? fallback;

export default function sitemap(): MetadataRoute.Sitemap {
  const site = SITE.updated;
  const toolDate = (ids: (string | undefined)[]) => latest(ids.map((id) => TOOLS.find((t) => t.id === id)?.verified), site);
  const fixed = ["/", "/submit/", "/ecosystem/", "/tools/", "/reviews/", "/compare/", "/pricing/", "/best/", "/news/", "/blog/", "/methodology/", "/verification/", "/credits/", "/about/", "/contact/", "/affiliate-disclosure/", "/privacy/", "/terms/"];
  const dated: [string, string][] = [
    ...fixed.map((p): [string, string] => [p, p === "/news/" ? latest(LISTED_NEWS.map((n) => n.date), site) : p === "/tools/" || p === "/pricing/" ? latest(TOOLS.map((t) => t.verified), site) : site]),
    ...REVIEWS.map((r): [string, string] => [`/reviews/${r.slug}/`, toolDate([r.toolId])]),
    ...COMPARISONS.map((c): [string, string] => [`/compare/${c.slug}/`, toolDate([c.leftTool, c.rightTool])]),
    ...ARTICLES.filter((a) => a.kind === "guide").map((a): [string, string] => [`/blog/${a.slug}/`, a.date]),
    ...TOOLS.map((t): [string, string] => [`/tools/${t.id}/`, t.verified]),
    ...TOOLS.map((t): [string, string] => [`/tools/${t.id}/alternatives/`, t.verified]),
    ...COMPANIES.map((c): [string, string] => [`/ecosystem/companies/${c.slug}/`, latest([...c.tools.map((t) => t.verified), ...c.news.map((n) => n.date)], site)]),
    ...LISTED_NEWS.map((n): [string, string] => [`/news/${n.slug}/`, n.date]),
    ...ROUNDUPS.map((r): [string, string] => [`/best/${r.slug}/`, toolDate(r.picks.map((p) => p.id))]),
    ...CATEGORIES.map((c): [string, string] => [`/tools/category/${c.slug}/`, latest(TOOLS.filter((t) => t.category === c.slug || t.categories.includes(c.slug)).map((t) => t.verified), site)]),
    ...TOPICS.map((t): [string, string] => [`/blog/topic/${t.id}/`, latest(ARTICLES.filter((a) => a.topic === t.id).map((a) => a.date), site)]),
  ];
  return dated.map(([p, d]) => ({
    url: absUrl(p),
    lastModified: new Date(d),
    changeFrequency: p === "/" || p === "/news/" ? "weekly" : "monthly",
    priority: p === "/" ? 1 : p.split("/").length > 3 ? 0.7 : 0.8,
  }));
}
