import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fitDescription } from "../src/lib/meta";

describe("fitDescription", () => {
  it("returns text that already fits unchanged", () => {
    const t = "A short, clear description of a page.";
    expect(fitDescription(t)).toBe(t);
  });
  it("keeps whole sentences and drops the one that does not fit", () => {
    const a = "First sentence that says what the page is about, who it is for and why it matters to anyone choosing a tool.";
    const b = "Second sentence that adds a lot more detail than any search result can show on one line of text.";
    expect(fitDescription(`${a} ${b}`)).toBe(a);
  });
  it("cuts a single long sentence at a clause break, not mid-word, and never exceeds the limit", () => {
    const t = "Run open and custom models through an API, billed by use, with per-second prices for every hardware tier and a long list of extra details nobody reads.";
    const r = fitDescription(t);
    expect(r.length).toBeLessThanOrEqual(160);
    expect(r).toMatch(/[.…]$/);
    expect(t.startsWith(r.replace(/[.…]$/, ""))).toBe(true);
  });
});

const built = fs.existsSync(path.join(process.cwd(), "out/index.html"));
describe.skipIf(!built)("built meta descriptions", () => {
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const dec = (s: string) => s.replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  const pages = walk(path.join(process.cwd(), "out")).filter((f) => f.endsWith("index.html") && !f.includes("_not-found"));
  it("are at most 160 characters and match Open Graph and Twitter", () => {
    for (const f of pages) {
      const h = fs.readFileSync(f, "utf8");
      if (h.includes("This page has moved")) continue;
      const d = h.match(/<meta name="description" content="([^"]*)"/)?.[1];
      if (!d) continue;
      expect(dec(d).length, f).toBeLessThanOrEqual(160);
      expect(h.match(/<meta property="og:description" content="([^"]*)"/)?.[1], f).toBe(d);
      expect(h.match(/<meta name="twitter:description" content="([^"]*)"/)?.[1], f).toBe(d);
    }
  });
  it("do not show internal repository paths to visitors", () => {
    const eco = fs.readFileSync(path.join(process.cwd(), "out/ecosystem/index.html"), "utf8");
    expect(eco).not.toMatch(/docs\/[A-Z_]+\.md/);
  });
});
