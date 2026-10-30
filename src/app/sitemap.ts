import type { MetadataRoute } from "next";
import { ARTICLES } from "@/data/articles";
import { REVIEWS } from "@/data/reviews";
import { COMPARISONS } from "@/data/compare";
import { CATEGORIES, TOOLS } from "@/data/tools";
import { NEWS } from "@/data/news";
import { ROUNDUPS } from "@/data/roundups";
import { TOPICS } from "@/data/articles";
import { COMPANIES } from "@/data/companies";
import { SITE, absUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const last = new Date(SITE.updated);
  const fixed = ["/", "/submit/", "/ecosystem/", "/tools/", "/reviews/", "/compare/", "/pricing/", "/best/", "/news/", "/blog/", "/methodology/", "/verification/", "/about/", "/contact/", "/affiliate-disclosure/", "/privacy/", "/terms/"];
  const dynamicPaths = [
    ...REVIEWS.map((r) => `/reviews/${r.slug}/`),
    ...COMPARISONS.map((c) => `/compare/${c.slug}/`),
    ...ARTICLES.filter((a) => a.kind === "guide").map((a) => `/blog/${a.slug}/`),
    ...TOOLS.map((t) => `/tools/${t.id}/`),
    ...TOOLS.map((t) => `/tools/${t.id}/alternatives/`),
    ...COMPANIES.map((c) => `/ecosystem/companies/${c.slug}/`),
    ...NEWS.map((n) => `/news/${n.slug}/`),
    ...ROUNDUPS.map((r) => `/best/${r.slug}/`),
    ...CATEGORIES.map((c) => `/tools/category/${c.slug}/`),
    ...TOPICS.map((t) => `/blog/topic/${t.id}/`),
  ];
  return [...fixed, ...dynamicPaths].map((p) => ({
    url: absUrl(p),
    lastModified: last,
    changeFrequency: p === "/" || p === "/news/" ? "weekly" : "monthly",
    priority: p === "/" ? 1 : p.split("/").length > 3 ? 0.7 : 0.8,
  }));
}
