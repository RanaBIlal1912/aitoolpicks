import type { Metadata } from "next";
import { SITE, absUrl } from "./site";

/** Keep the page title (plus the " | AI Tool Picks" suffix the layout adds) under about 65 characters so search results do not cut it off. */
export function shortTitle(title: string, max = 48): string {
  const t = title.replace(" overview: what it does, who it suits and what it costs", " overview: features, fit and cost");
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1);
  const at = cut.lastIndexOf(" ");
  const dangling = /(\s+(and|or|the|a|an|to|of|with|for|in|on|is|are|that|who|what|through|into|about|across|over|via|can|could|will|would|now|its|their|has|have|more|adds))+$/i;
  let out = cut.slice(0, at > 20 ? at : max);
  // Trim trailing punctuation and dangling words until neither changes the title.
  for (let prev = ""; prev !== out; ) {
    prev = out;
    out = out.replace(/[\s:,;.\-–]+$/, "").replace(dangling, "");
  }
  return out;
}

const TRAILING_WORDS = /(\s+(and|or|the|a|an|to|of|with|for|in|on|is|are|that|who|what|which|plus|its|their|from|by|as|at))+$/i;
// Places where a long sentence can end cleanly: a comma before a lowercase word (not a list of names), a semicolon, colon or dash, or just before "with", "which", "while", "because" or "plus".
const CLAUSE_BREAK = /, (?=[a-z])|; |: | – | (?=(?:with|which|while|because|plus) )/g;

/** Cut one sentence at its last clause break (or word) so the result is at most `max` characters, never ending mid-word. */
function clip(s: string, max: number, floor: number): string {
  if (s.length <= max) return s;
  const head = s.slice(0, max);
  let at = -1;
  for (const m of head.matchAll(CLAUSE_BREAK)) at = m.index ?? at;
  if (at >= floor) return head.slice(0, at).replace(/[\s,;:–(-]+$/, "").replace(TRAILING_WORDS, "") + ".";
  const sp = s.slice(0, max + 1).lastIndexOf(" ");
  return s.slice(0, sp > floor ? sp : max).replace(/[\s,;:–(-]+$/, "").replace(TRAILING_WORDS, "") + "…";
}

/**
 * Keep a meta description to about 160 characters so search results do not cut it off mid-sentence.
 * Whole sentences are kept while they fit; a sentence that does not fit is cut at its last clause break. Text that already fits is returned unchanged.
 */
export function fitDescription(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const sentences = t.split(/(?<=[.!?])\s+/);
  let out = "";
  let i = 0;
  for (; i < sentences.length; i++) {
    const next = out ? `${out} ${sentences[i]}` : sentences[i];
    if (next.length > max) break;
    out = next;
  }
  if (i === sentences.length || out.length >= 90) return out || clip(t, max, 60);
  const room = max - out.length - (out ? 1 : 0);
  if (!out) return clip(sentences[i], max, 60);
  return room >= 40 ? `${out} ${clip(sentences[i], room, 25)}` : out;
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
  const description = fitDescription(opts.description);
  return {
    title: shortTitle(opts.title),
    description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: opts.title,
      description,
      url,
      siteName: SITE.name,
      type: opts.type ?? "website",
      locale: "en_US",
      images: [{ url: absUrl("/brand/og.png"), width: 1200, height: 630, alt: `${SITE.name}: find the AI tool that fits, and what it really costs` }],
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: opts.title, description, images: [absUrl("/brand/og.png")] },
  };
}
