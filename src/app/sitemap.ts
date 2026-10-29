import type { MetadataRoute } from "next";
import { ARTICLES } from "@/data/articles";
import { REVIEWS } from "@/data/reviews";
import { COMPARISONS } from "@/data/compare";
import { CATEGORIES, TOOLS, categorySlug } from "@/data/tools";
import { TOPICS } from "@/data/articles";
import { SITE, absUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const last = new Date(SITE.updated);
  const fixed = ["/", "/tools/", "/reviews/", "/compare/", "/news/", "/blog/", "/about/", "/contact/", "/affiliate-disclosure/", "/privacy/", "/terms/"];
  const dynamicPaths = [
    ...REVIEWS.map((r) => `/reviews/${r.slug}/`),
    ...COMPARISONS.map((c) => `/compare/${c.slug}/`),
    ...ARTICLES.filter((a) => a.kind === "guide").map((a) => `/blog/${a.slug}/`),
    ...TOOLS.map((t) => `/tools/${t.id}/`),
    ...CATEGORIES.map((c) => `/tools/category/${categorySlug(c)}/`),
    ...TOPICS.map((t) => `/blog/topic/${t.id}/`),
  ];
  return [...fixed, ...dynamicPaths].map((p) => ({
    url: absUrl(p),
    lastModified: last,
    changeFrequency: p === "/" || p === "/news/" ? "weekly" : "monthly",
    priority: p === "/" ? 1 : p.split("/").length > 3 ? 0.7 : 0.8,
  }));
}
