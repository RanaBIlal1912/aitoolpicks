import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOOLS, CATEGORIES, toolsInCategory } from "@/data/tools";
import { logoFor } from "@/data/logos";
import { NO_FILTERS, filterTools } from "@/lib/directory";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "content", "logos.json"), "utf-8")) as Record<
  string,
  { file: string | null; website: string; status: string; source?: string; origin?: string; checked: string; notes?: string }
>;

describe("tool logos", () => {
  it("records a result for every tool and nothing for tools that do not exist", () => {
    for (const t of TOOLS) expect(manifest[t.id], t.id).toBeTruthy();
    for (const id of Object.keys(manifest)) expect(TOOLS.some((t) => t.id === id), id).toBe(true);
  });

  it("points every logo at a real file that is an image, with its source and date recorded", () => {
    for (const [id, m] of Object.entries(manifest)) {
      if (!m.file) {
        expect(m.status, id).toBe("missing");
        expect(m.notes, id).toBeTruthy();
        expect(logoFor(id), id).toBeNull();
        continue;
      }
      const file = path.join(root, "public", "logos", m.file);
      expect(fs.existsSync(file), `${id}: ${m.file}`).toBe(true);
      const buf = fs.readFileSync(file);
      expect(buf.length, id).toBeGreaterThan(100);
      const isPng = buf.subarray(1, 4).toString() === "PNG";
      const isIco = buf[0] === 0 && buf[2] === 1;
      const isSvg = buf.toString("utf-8", 0, 4000).toLowerCase().includes("<svg");
      expect(isPng || isIco || isSvg, `${id} is not a PNG, ICO or SVG`).toBe(true);
      expect(m.source, id).toMatch(/^https:\/\//);
      expect(m.origin, id).toBeTruthy();
      expect(m.checked, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(logoFor(id)?.src, id).toBe(`/logos/${m.file}`);
    }
  });

  it("never ships an SVG with scripts, event handlers or external references", () => {
    for (const m of Object.values(manifest)) {
      if (!m.file?.endsWith(".svg")) continue;
      const s = fs.readFileSync(path.join(root, "public", "logos", m.file), "utf-8");
      expect(s, m.file).not.toMatch(/<script|\son[a-z]+\s*=|javascript:|<foreignObject|href\s*=\s*["']https?:/i);
    }
  });

  it("does not let a logo depend on the visitor's OS colour scheme", () => {
    for (const m of Object.values(manifest)) {
      if (!m.file?.endsWith(".svg")) continue;
      expect(fs.readFileSync(path.join(root, "public", "logos", m.file), "utf-8"), m.file).not.toContain("prefers-color-scheme");
    }
  });

  it("only takes a logo from the product's own site, or flags it for review when a favicon service was needed", () => {
    for (const [id, m] of Object.entries(manifest)) {
      if (!m.file) continue;
      if (m.origin === "official-site") expect(m.status, id).not.toBe("needs-review");
      else expect(m.status, id).toBe("needs-review");
    }
  });
});

describe("brand assets", () => {
  it("ships the mark and its PNG renditions at the sizes the metadata declares", () => {
    const dims: Record<string, number> = { "favicon-32.png": 32, "icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon.png": 180 };
    for (const [f, n] of Object.entries(dims)) {
      const buf = fs.readFileSync(path.join(root, "public", "brand", f));
      expect(buf.subarray(1, 4).toString(), f).toBe("PNG");
      expect(buf.readUInt32BE(16), f).toBe(n);
      expect(buf.readUInt32BE(20), f).toBe(n);
    }
    const og = fs.readFileSync(path.join(root, "public", "brand", "og.png"));
    expect([og.readUInt32BE(16), og.readUInt32BE(20)]).toEqual([1200, 630]);
    expect(fs.readFileSync(path.join(root, "public", "brand", "mark.svg"), "utf-8")).toContain("<svg");
  });
});

describe("one source for catalog totals", () => {
  it("category counts match what the directory filter returns for the same category", () => {
    for (const c of CATEGORIES) {
      expect(filterTools(TOOLS, { ...NO_FILTERS, category: c.slug }).length, c.slug).toBe(toolsInCategory(c.slug).length);
    }
  });

  it("gives every tool a primary category that exists and a subcategory that belongs to it", () => {
    for (const t of TOOLS) {
      const c = CATEGORIES.find((x) => x.slug === t.category);
      expect(c, t.id).toBeTruthy();
      if (t.subcategory) expect(c!.subs.map((s) => s.slug), t.id).toContain(t.subcategory);
    }
  });
});
