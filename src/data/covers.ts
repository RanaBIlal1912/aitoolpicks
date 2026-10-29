// Cover images are 3D renders made for this site by `npm run covers` (see scripts/covers). They are
// illustrations, not photos of real products, and the pages label them as such.
export type CoverId = "chip" | "board" | "neural" | "lens" | "rack" | "wafer" | "fibre" | "signal";

export const COVERS: Record<CoverId, { alt: string }> = {
  chip: { alt: "Render of an AI processor package with a silicon die, gold edge contacts and glowing circuit traces" },
  board: { alt: "Render of a circuit board with glowing blue traces and a processor in the middle distance" },
  neural: { alt: "Render of glowing nodes joined by fine lines, like layers of a neural network" },
  lens: { alt: "Render of a camera-style glass lens inside dark metal rings, backlit by coloured light" },
  rack: { alt: "Render of an aisle of server racks with indicator lights and a polished floor" },
  wafer: { alt: "Render of an iridescent silicon wafer divided into a grid of tiny dies" },
  fibre: { alt: "Render of glowing fibre-optic strands curving across a dark background" },
  signal: { alt: "Render of warm and cool light strands crossing a dark background with soft bokeh" },
};

export const COVER_IDS = Object.keys(COVERS) as CoverId[];
export const COVER_SIZES = { full: { w: 1600, h: 900 }, og: { w: 1200, h: 630 }, sm: { w: 640, h: 360 } } as const;

export function coverPath(id: CoverId, size: "full" | "og" | "sm" = "full"): string {
  return `/images/covers/${id}${size === "full" ? "" : `-${size}`}.jpg`;
}
