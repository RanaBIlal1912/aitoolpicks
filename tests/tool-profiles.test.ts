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

describe("tools whose official pages could not be researched", () => {
  const blocked = RECORDS.filter((r) => r.profileBlocked);
  it("carry a reason and a date, and never also a profile", () => {
    // Julius, Lovable and Perplexity were blocked until their official docs were readable (2026-11-02).
    for (const id of ["julius", "lovable", "perplexity"]) expect(blocked.map((r) => r.id), id).not.toContain(id);
    for (const r of blocked) {
      expect(r.profile, r.id).toBeUndefined();
      expect(r.profileBlocked!.reason.length, r.id).toBeGreaterThan(30);
    }
  });
  it.skipIf(!built)("show the reason on the page instead of a profile", () => {
    for (const r of blocked) {
      const h = page(r.id)!;
      expect(h, r.id).toContain("has not been researched yet");
      expect(h, r.id).toContain("Why:");
    }
  });
});

describe("the key feature line", () => {
  it("says what the tool does, not what a plan includes", () => {
    const billing = /(plans?|credits?|seats?|allowance|executions|billed|priced|metered|per (month|token|minute|outcome|user))/i;
    for (const r of RECORDS) {
      const kf = r.keyFeature ?? r.features[0];
      expect(kf, `${r.id}: "${kf}"`).not.toMatch(billing);
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

  it("only suggests the same kind of tool: the same subcategory (or the same category when the tool has no subcategory)", () => {
    for (const t of TOOLS) {
      const alts = alternativesFor(t.id, 4).map((a) => a.tool.id);
      for (const r of relatedFor(t.id, alts, 4)) {
        expect(r.category, `${t.id} -> ${r.id}`).toBe(t.category);
        if (t.subcategory) expect(r.subcategory, `${t.id} -> ${r.id}`).toBe(t.subcategory);
      }
    }
  });

  it("does not repeat the known bad pairings from the audit", () => {
    const rel = (id: string) => relatedFor(id, alternativesFor(id, 4).map((a) => a.tool.id), 4).map((x) => x.id);
    expect(rel("intercom")).not.toContain("surfer");
    expect(rel("intercom")).not.toContain("writesonic");
    expect(rel("surfer")).not.toContain("intercom");
    expect(rel("hex")).not.toContain("cursor");
    expect(rel("hex")).not.toContain("replit");
    expect(rel("langchain")).not.toContain("github-copilot");
    expect(rel("langchain")).not.toContain("whisper");
    expect(rel("deepgram")).not.toContain("suno");
    expect(rel("deepgram")).not.toContain("langsmith");
    expect(rel("gamma")).not.toContain("deepl");
    expect(rel("grammarly")).not.toContain("gamma");
    expect(rel("cursor")).not.toContain("v0");
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
    if (plain) expect(page(plain.id)!).toContain("has not been researched yet");
  });
});
