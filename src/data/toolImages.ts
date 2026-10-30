// The preview image each vendor publishes on its own official site, with the page it came from. Files are made by
// `npm run tool-images` (scripts/fetch-tool-images.mjs). They are the vendor's images, shown with credit and a link to identify the product.
import manifest from "../../content/tool-images.json";

type Entry = { file: string; imageUrl: string; page: string; credit: string; width: number; height: number };
const IMAGES = manifest as unknown as Record<string, Entry>;

export type ToolImage = { src: string; srcSm: string; credit: string; page: string; width: number; height: number };

export function toolImage(id: string): ToolImage | null {
  const e = IMAGES[id];
  if (!e) return null;
  return { src: `/images/tools/${e.file}.webp`, srcSm: `/images/tools/${e.file}-sm.webp`, credit: e.credit, page: e.page, width: e.width, height: e.height };
}
