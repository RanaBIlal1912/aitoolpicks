// One place for "never show the same thing twice". Pages that show several lists of tools, articles or news claim items through a
// Claimed set, so an item taken by one section cannot be taken by the next. tests/integrity.test.ts checks the underlying data.

/** Lower-case letters and digits only, so "Vibe Chat (Mistral)" and "vibe-chat-mistral" compare equal. */
export function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** The address of a page without scheme, www, query, fragment or trailing slash. Two news items with the same one are the same page. */
export function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/** A set of ids already shown on a page. */
export class Claimed {
  private seen = new Set<string>();

  has(id: string): boolean {
    return this.seen.has(id);
  }

  get size(): number {
    return this.seen.size;
  }

  /** Marks ids as shown without choosing them (for items fixed by data, such as measured trending). */
  add(ids: Iterable<string>): void {
    for (const id of ids) this.seen.add(id);
  }

  /** Takes up to n candidates, in order, that are not claimed yet, and claims them. Duplicates inside the candidate list are skipped too. */
  take<T>(candidates: readonly T[], n: number, id: (item: T) => string): T[] {
    const out: T[] = [];
    for (const c of candidates) {
      if (out.length >= n) break;
      const key = id(c);
      if (this.seen.has(key)) continue;
      this.seen.add(key);
      out.push(c);
    }
    return out;
  }
}

/** Share of distinct words (longer than 3 letters) that two headlines have in common, 0 to 1. Used to flag near-identical headlines. */
export function titleSimilarity(a: string, b: string): number {
  const words = (t: string) => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
  const x = words(a);
  const y = words(b);
  const shared = [...x].filter((w) => y.has(w)).length;
  const total = x.size + y.size - shared;
  return total === 0 ? 0 : shared / total;
}
