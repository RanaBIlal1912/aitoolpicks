import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const css = read("src/app/globals.css");

const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const contrastWithWhite = (hex: string) => 1.05 / (lum(hex) + 0.05);

// Guards for the accessibility fixes from the cross-browser audit (docs/BROWSER_ACCESSIBILITY_AUDIT.md).
describe("accessibility guards", () => {
  it("keeps white text on the primary button and active chips at 4.5:1 or better along the whole gradient", () => {
    const m = css.match(/--grad-neon-ink:\s*linear-gradient\(120deg,\s*(#[0-9a-f]{6})[^,]*,\s*(#[0-9a-f]{6})[^,]*,\s*(#[0-9a-f]{6})/i);
    expect(m).not.toBeNull();
    for (const hex of m!.slice(1)) expect(contrastWithWhite(hex), hex).toBeGreaterThanOrEqual(4.5);
    expect(css).toMatch(/\.btn-primary\s*\{\s*background:\s*var\(--grad-neon-ink\)/);
    expect(css).toMatch(/\.chip\[aria-pressed="true"\],\s*\.chip\[aria-current="true"\]\s*\{\s*background:\s*var\(--grad-neon-ink\)/);
  });

  it("keeps keyboard focus clear of the sticky header and the compare bar", () => {
    expect(css).toMatch(/scroll-padding-top:\s*5\.5rem/);
    expect(css).toMatch(/scroll-padding-bottom:\s*6rem/);
  });

  it("scales the large-screen root size with a percentage, so a visitor's own default font size still applies", () => {
    expect(css).not.toMatch(/@media \(min-width: (1920|2400|3000|3600)px\)\s*\{\s*html\s*\{\s*font-size:\s*\d+px/);
    expect(css).toMatch(/font-size:\s*106\.25%/);
  });

  it("makes a table that scrolls sideways reachable by keyboard", () => {
    expect(read("src/components/ComparisonTable.tsx")).toMatch(/role="region"[^>]*tabIndex=\{0\}/);
  });

  it("only points aria-describedby at hints that exist on the submit form", () => {
    const f = read("src/components/SubmitForm.tsx");
    expect(f).toContain("HINTED");
    const hinted = [...f.matchAll(/<Field id="sub-(\w+)"[^>]*hint=/g)].map((m) => m[1]).sort();
    const list = (f.match(/const HINTED[^=]*=\s*\[([^\]]*)\]/)?.[1] ?? "").split(",").map((x) => x.replace(/["\s]/g, "")).filter(Boolean).sort();
    expect(list).toEqual(hinted);
  });

  it("gives repeated links and checkboxes a name that says which tool they belong to", () => {
    expect(read("src/components/ToolCard.tsx")).toContain("aria-label={`Compare ${tool.name}`}");
    expect(read("src/components/PricingHub.tsx")).toContain('<span className="sr-only"> for {t.name}</span>');
    expect(read("src/components/AffLink.tsx")).toContain("for {name}");
  });

  it("keeps tool logo tiles legible in Windows high-contrast mode", () => {
    expect(read("src/components/ToolLogo.tsx")).toContain('forcedColorAdjust: "none"');
  });
});
