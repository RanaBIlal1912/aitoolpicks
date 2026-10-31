import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { ARTICLES } from "../src/data/articles";
import { COVER_ASSIGNMENTS } from "../src/data/coverPhotos";
import { PHOTOS, photoPath } from "../src/data/photos";

describe("article cover photographs", () => {
  it("gives every article a photograph and uses none more than twice", () => {
    const count: Record<string, number> = {};
    for (const a of ARTICLES) {
      const id = COVER_ASSIGNMENTS[a.slug];
      expect(id, a.slug).toBeTruthy();
      count[id] = (count[id] ?? 0) + 1;
    }
    expect(Math.max(...Object.values(count))).toBeLessThanOrEqual(2);
    expect(Object.keys(count).length).toBeGreaterThanOrEqual(16);
  });
  it("has all three files and a credit for every photograph", () => {
    for (const [id, p] of Object.entries(PHOTOS)) {
      expect(p.by && p.page.startsWith("https://unsplash.com/photos/"), id).toBeTruthy();
      for (const s of ["full", "md", "sm"] as const) expect(existsSync(path.join(process.cwd(), "public", photoPath(id as keyof typeof PHOTOS, s))), id + s).toBe(true);
    }
  });
});
