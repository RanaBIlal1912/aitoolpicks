import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIES, TOOLS, toolsInCategory } from "../src/data/tools";
import { STATS, categoryStats, statsFor } from "../src/lib/stats";

const root = process.cwd();
const dir = path.join(root, "content/tools");
// The raw records are the ground truth: the statistics module must agree with them, not with itself.
const raw = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
const n = (pred: (r: (typeof raw)[number]) => boolean) => raw.filter(pred).length;

describe("catalog statistics", () => {
  it("match the raw tool records", () => {
    expect(STATS.tools).toBe(raw.length);
    expect(STATS.verified).toBe(n((r) => r.pricing.status === "verified"));
    expect(STATS.partial).toBe(n((r) => r.pricing.status === "partial"));
    expect(STATS.unverified).toBe(n((r) => r.pricing.status === "unverified"));
    expect(STATS.free).toBe(n((r) => r.pricing.model === "free"));
    expect(STATS.freemium).toBe(n((r) => r.pricing.model === "freemium"));
    expect(STATS.paid).toBe(n((r) => r.pricing.model === "paid"));
    expect(STATS.withFreePlan).toBe(n((r) => r.pricing.free?.available === true));
    expect(STATS.categories).toBe(CATEGORIES.length);
  });

  it("add up: every tool has exactly one pricing status and one pricing model bucket", () => {
    expect(STATS.verified + STATS.partial + STATS.unverified).toBe(STATS.tools);
    expect(STATS.free + STATS.freemium + STATS.paid + STATS.other).toBe(STATS.tools);
  });

  it("agree between the pricing status and the verification log, so no page can contradict another", () => {
    for (const r of raw) expect(r.verification.status, r.id).toBe(r.pricing.status);
  });

  it("work for any subset, and category counts never exceed the catalog", () => {
    for (const c of CATEGORIES) {
      const s = categoryStats(c.slug);
      expect(s.tools, c.slug).toBe(toolsInCategory(c.slug).length);
      expect(s.tools, c.slug).toBeLessThanOrEqual(STATS.tools);
      expect(s.verified + s.partial + s.unverified, c.slug).toBe(s.tools);
    }
    expect(statsFor([]).tools).toBe(0);
    expect(statsFor(TOOLS).verified).toBe(STATS.verified);
  });
});

// These read the built site (npm run build first); they are skipped when out/ does not exist.
const built = fs.existsSync(path.join(root, "out/index.html"));
const text = (route: string) => {
  const f = path.join(root, "out", route, "index.html");
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ") : null;
};

describe.skipIf(!built)("every page that shows a total shows the same one", () => {
  it("home page and footer", () => {
    expect(text("")!).toContain(`${STATS.tools} tools`);
    expect(text("")!).toContain(`${STATS.categories} categories`);
  });
  it("pricing page", () => {
    const t = text("pricing")!;
    expect(t).toContain(`${STATS.tools} tools`);
    expect(t).toContain(`${STATS.verified} are fully verified`);
    expect(t).toContain(`${STATS.partial} are partly verified`);
  });
  it("methodology page", () => {
    const t = text("methodology")!;
    // React splits "(48 tools)" into separate text nodes, so allow spaces around the number once tags are stripped.
    const near = (label: string, count: number) => new RegExp(String.raw`${label} \(\s*${count}\s*tools\)`);
    expect(t).toMatch(near("Pricing verified", STATS.verified));
    expect(t).toMatch(near("Pricing partly verified", STATS.partial));
  });
  it("verification log", () => {
    const t = text("verification")!;
    expect(t).toContain(`${STATS.tools} tools checked: ${STATS.verified} verified, ${STATS.partial} partially verified`);
  });
  it("tools directory", () => {
    expect(text("tools")!).toContain(`${STATS.tools} in the directory`);
  });
});
