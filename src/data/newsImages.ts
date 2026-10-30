// Announcement images that vendors published for their own stories, with credit and the page each came from.
// Files are made by `npm run news-images` (see scripts/fetch-news-images.mjs and docs/NEWS_WORKFLOW.md).
// Stories without an entry get a generated illustration (see NewsVisual), never a borrowed image.
import manifest from "../../content/news-images.json";

type Entry = { file: string; credit: string; page: string; alt: string; width?: number; height?: number };
const IMAGES = manifest as unknown as Record<string, Entry>;

export type NewsImage = { src: string; srcSm: string; credit: string; page: string; alt: string; width: number; height: number };

export function newsImage(slug: string): NewsImage | null {
  const e = IMAGES[slug];
  if (!e) return null;
  return { src: `/images/news/${e.file}.webp`, srcSm: `/images/news/${e.file}-sm.webp`, credit: e.credit, page: e.page, alt: e.alt, width: e.width ?? 1200, height: e.height ?? 630 };
}
