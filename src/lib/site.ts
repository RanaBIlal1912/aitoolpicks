export const SITE = {
  name: "AI Tool Picks",
  tagline: "Honest guides to AI tools for freelancers and small businesses",
  description:
    "Plain-English reviews, comparisons and guides to AI and online tools for freelancers, creators and small businesses. Free plans first, honest pros and cons.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ranabilal1912.github.io/aitoolpicks").replace(/\/$/, ""),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  repo: "https://github.com/RanaBIlal1912/aitoolpicks",
  // Optional public contact address. Left empty on purpose: the contact page falls back to GitHub issues.
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  updated: "2026-10-29",
} as const;

/** Prefix an internal path with the base path (for plain <a> tags and raw HTML). */
export function withBase(p: string): string {
  return `${SITE.basePath}${p}`;
}

/** Absolute public URL for canonical links, sitemap and structured data. */
export function absUrl(p: string): string {
  return `${SITE.url}${p}`;
}

export const NAV = [
  { href: "/tools/", label: "Tools" },
  { href: "/reviews/", label: "Reviews" },
  { href: "/compare/", label: "Compare" },
  { href: "/news/", label: "AI News" },
  { href: "/blog/", label: "Blog" },
  { href: "/about/", label: "About" },
] as const;

export const FOOTER_LINKS = [
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
  { href: "/affiliate-disclosure/", label: "Affiliate disclosure" },
  { href: "/privacy/", label: "Privacy" },
  { href: "/terms/", label: "Terms" },
] as const;
