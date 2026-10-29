// One place that maps a tool id to its logo file. The files are downloaded by `npm run logos` from each product's own
// website and described in content/logos.json (source URL, format, size, date, review status). Components never
// hard-code logo paths; they call logoFor(). A tool without a verified logo gets a plain letter mark instead.
import manifest from "../../content/logos.json";

type Entry = { file: string | null; status: "ok" | "low-resolution" | "needs-review" | "missing"; source?: string; origin?: string; checked: string; tile?: "light" | "dark" };

const LOGOS = manifest as unknown as Record<string, Entry>;

export type Logo = { src: string; tile: "light" | "dark"; status: Entry["status"]; source: string; checked: string };

export function logoFor(id: string): Logo | null {
  const e = LOGOS[id];
  if (!e || !e.file) return null;
  return { src: `/logos/${e.file}`, tile: e.tile ?? "light", status: e.status, source: e.source ?? "", checked: e.checked };
}

/** Everything that still needs a human look, for the health report. */
export function logoReview(): { id: string; status: Entry["status"] }[] {
  return Object.entries(LOGOS)
    .filter(([, e]) => e.status !== "ok")
    .map(([id, e]) => ({ id, status: e.status }));
}
