import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("analytics consent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is off unless a valid measurement ID is set at build time", async () => {
    expect((await import("@/lib/analytics")).ANALYTICS_ENABLED).toBe(false);
    for (const bad of ["abc", "UA-12345-1", "G-"]) {
      vi.resetModules();
      vi.stubEnv("NEXT_PUBLIC_GA_ID", bad);
      expect((await import("@/lib/analytics")).ANALYTICS_ENABLED).toBe(false);
    }
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-ABC123XYZ9");
    expect((await import("@/lib/analytics")).ANALYTICS_ENABLED).toBe(true);
  });

  it("never loads Google's script from anywhere except after consent, and keeps ads features off", () => {
    const src = read("src/lib/analytics.ts");
    expect(src.match(/googletagmanager\.com/g)).toHaveLength(1);
    expect(src).toContain("allow_google_signals: false");
    expect(src).toContain('ad_storage: "denied"');
    expect(read("src/components/ConsentBanner.tsx")).toContain('decide("denied")');
    // The only caller of loadGa outside setConsent is the banner, and only when the stored choice is "granted".
    expect(read("src/components/ConsentBanner.tsx")).toMatch(/if \(c === "granted"\) loadGa\(\)/);
  });

  it("describes analytics on the privacy page only when it is enabled", () => {
    const p = read("src/app/privacy/page.tsx");
    expect(p).toContain("ANALYTICS_ENABLED");
    expect(p).toContain("We do not currently run analytics or tracking scripts.");
  });
});
