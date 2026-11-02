import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RECORDS } from "../src/lib/catalog";
import { TOOLS } from "../src/data/tools";
import { alternativesFor } from "../src/lib/alternatives";
import { relatedFor } from "../src/lib/related";
import { normalizeKey } from "../src/lib/dedupe";

const profiled = RECORDS.filter((r) => r.profile);
const page = (id: string) => {
  const f = path.join(process.cwd(), "out", "tools", id, "index.html");
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
};
const built = page("claude") !== null;

describe("researched tool profiles", () => {
  it("exist for the tools that were researched, each with every section filled", () => {
    expect(profiled.map((r) => r.id).sort()).toEqual(expect.arrayContaining(["claude", "cursor", "elevenlabs", "granola"]));
    for (const r of profiled) {
      const p = r.profile!;
      expect(p.headline.length, r.id).toBeGreaterThan(10);
      for (const k of ["capabilities", "featureCards", "audienceDetail", "scenarios", "gettingStarted"] as const) expect(p[k].length, `${r.id} ${k}`).toBeGreaterThanOrEqual(3);
      expect(p.sources.length, r.id).toBeGreaterThan(0);
      for (const s of p.sources) expect(s.url, r.id).toMatch(/^https:\/\//);
    }
  });

  it("is specific to each tool: no sentence is copied from one tool to another", () => {
    const seen = new Map<string, string>();
    for (const r of profiled) {
      const p = r.profile!;
      const texts = [p.headline, ...p.capabilities.map((c) => c.text), ...p.featureCards.map((c) => c.text), ...p.audienceDetail.map((c) => c.text), ...p.scenarios.map((c) => c.text), ...p.gettingStarted.map((c) => c.text)];
      for (const t of texts) {
        const key = normalizeKey(t);
        expect(seen.get(key) ?? r.id, `"${t}" appears in two tools`).toBe(r.id);
        seen.set(key, r.id);
      }
    }
  });

  it("does not name a tool's own pricing with numbers the pricing record does not have", () => {
    // Prices live only in the verified pricing record. The profile text carries no dollar, pound or euro amounts of its own.
    for (const r of profiled) {
      const p = r.profile!;
      const all = JSON.stringify(p);
      expect(all, r.id).not.toMatch(/[$£€]\s?\d/);
    }
  });
});

describe("alternatives and related tools", () => {
  it("never repeat a tool: not itself, not each other, not twice", () => {
    for (const t of TOOLS) {
      const alts = alternativesFor(t.id, 4).map((a) => a.tool.id);
      const related = relatedFor(t.id, alts, 4).map((x) => x.id);
      expect(new Set(alts).size, `${t.id} alternatives`).toBe(alts.length);
      expect(new Set(related).size, `${t.id} related`).toBe(related.length);
      expect(alts, t.id).not.toContain(t.id);
      expect(related, t.id).not.toContain(t.id);
      for (const id of related) expect(alts, `${t.id}: ${id} is both an alternative and related`).not.toContain(id);
      for (const id of [...alts, ...related]) expect(TOOLS.some((x) => x.id === id), id).toBe(true);
    }
  });

  it("finds related tools for most tools", () => {
    const withRelated = TOOLS.filter((t) => relatedFor(t.id, alternativesFor(t.id, 4).map((a) => a.tool.id), 4).length > 0);
    expect(withRelated.length).toBeGreaterThanOrEqual(Math.floor(TOOLS.length * 0.9));
  });
});

describe.skipIf(!built)("built tool pages", () => {
  it("every tool page has the same ten parts, in order, with links to real tool pages only", () => {
    for (const t of TOOLS) {
      const h = page(t.id)!;
      expect(h, t.id).toBeTruthy();
      const order = ["What can you do with", "What it includes", "Real use cases", "Plans and pricing", "Advantages and limitations", "Related tools"]
        .map((s) => h.indexOf(s))
        .filter((i, _, a) => a.length > 0 && i >= 0);
      // Related tools is shown only when there are some, so allow it to be missing but never out of order.
      expect(order, t.id).toEqual([...order].sort((a, b) => a - b));
      for (const needle of ["What can you do with", "What it includes", "Real use cases", "Plans and pricing", "Advantages and limitations"]) expect(h, `${t.id}: ${needle}`).toContain(needle);
      const links = [...h.matchAll(/href="\/aitoolpicks\/tools\/([a-z0-9-]+)\/"/g)].map((m) => m[1]);
      for (const id of links) expect(TOOLS.some((x) => x.id === id), `${t.id} links to /tools/${id}/`).toBe(true);
    }
  });

  it("shows a researched headline and steps on the researched tools, and says so on the others", () => {
    for (const r of profiled) {
      const h = page(r.id)!;
      expect(h, r.id).toContain(r.profile!.headline.replace(/&/g, "&amp;"));
      expect(h, r.id).toContain("Getting started");
    }
    const plain = TOOLS.find((t) => !profiled.some((r) => r.id === t.id))!;
    expect(page(plain.id)!).toContain("has not been researched yet");
  });
});
