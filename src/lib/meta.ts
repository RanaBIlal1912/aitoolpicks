import type { Metadata } from "next";
import { SITE, absUrl } from "./site";

/** Keep the page title (plus the " | AI Tool Picks" suffix the layout adds) under about 65 characters so search results do not cut it off. */
export function shortTitle(title: string, max = 50): string {
  const t = title.replace(" overview: what it does, who it suits and what it costs", " overview: features, fit and cost");
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1);
  const at = cut.lastIndexOf(" ");
  return cut
    .slice(0, at > 20 ? at : max)
    .replace(/[\s:,;.\-–]+$/, "")
    .replace(/(\s+(and|or|the|a|an|to|of|with|for|in|on|is|are|that|who|what))+$/i, "");
}

/** Build consistent per-page metadata: unique title and description, canonical URL, Open Graph and Twitter cards. */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  noindex?: boolean;
}): Metadata {
  const url = absUrl(opts.path);
  return {
    title: shortTitle(opts.title),
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE.name,
      type: opts.type ?? "website",
      locale: "en_US",
      images: [{ url: absUrl("/brand/og.png"), width: 1200, height: 630, alt: `${SITE.name}: find the AI tool that fits, and what it really costs` }],
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [absUrl("/brand/og.png")] },
  };
}
