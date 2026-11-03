import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOOLS } from "../src/data/tools";
import { AFFILIATE_LINKS, AFFILIATE_PROGRAMS, AFFILIATE_STATUSES, affiliateStatus, linksFrom, resolveAffiliate, type AffiliateEntry } from "../src/lib/affiliate";
import { OUTBOUND_EVENT, track } from "../src/lib/analytics";

const root = process.cwd();
const https = /^https:\/\//;

describe("affiliate registry (content/affiliate.json)", () => {
  it("only names real tools and real statuses", () => {
    for (const [id, e] of Object.entries(AFFILIATE_PROGRAMS)) {
      expect(TOOLS.some((t) => t.id === id), `${id} is not a catalog tool`).toBe(true);
      expect(AFFILIATE_STATUSES, id).toContain(e.status);
    }
  });

  it("holds a link only for an approved programme, and an approved programme always has an https link", () => {
    for (const [id, e] of Object.entries(AFFILIATE_PROGRAMS)) {
      const urls = e.link === undefined ? [] : typeof e.link === "string" ? [e.link] : Object.values(e.link);
      if (e.status === "approved") {
        expect(urls.length, `${id} is approved but has no link`).toBeGreaterThan(0);
        for (const u of urls) expect(u, id).toMatch(https);
      } else {
        expect(urls, `${id} has a link but is not approved`).toEqual([]);
      }
    }
  });

  it("gives every unavailable programme a reason and an official source", () => {
    for (const [id, e] of Object.entries(AFFILIATE_PROGRAMS).filter(([, e]) => e.status === "unavailable")) {
      expect(e.note?.length ?? 0, id).toBeGreaterThan(20);
      expect(e.source, id).toMatch(https);
    }
  });

  it("gives every researched programme an https application page and a check date", () => {
    for (const [id, e] of Object.entries(AFFILIATE_PROGRAMS).filter(([, e]) => e.programme)) {
      expect(e.programme!.applyUrl, id).toMatch(https);
      expect(e.programme!.checked, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("makes no tool earn a commission today: nothing is approved until you hold a real link", () => {
    // Update this when the first programme is genuinely approved.
    expect(Object.keys(AFFILIATE_LINKS)).toEqual([]);
    expect(TOOLS.every((t) => resolveAffiliate(t.id, "PK") === null)).toBe(true);
  });
});

describe("how status turns into a link", () => {
  const fake: Record<string, AffiliateEntry> = {
    a: { status: "approved", link: "https://a.example/x" },
    b: { status: "pending", link: "https://b.example/x" },
    c: { status: "unavailable" },
    d: { status: "ordinary", link: { default: "https://d.example/x" } },
    e: { status: "approved", link: { default: "https://e.example/d", PK: "https://e.example/pk" } },
  };
  it("uses a link only when approved, so a link typed in early never goes live", () => {
    const links = linksFrom(fake);
    expect(Object.keys(links).sort()).toEqual(["a", "e"]);
    expect(resolveAffiliate("a", "GB", links)).toBe("https://a.example/x");
    expect(resolveAffiliate("b", "GB", links)).toBeNull();
    expect(resolveAffiliate("d", "GB", links)).toBeNull();
    expect(resolveAffiliate("e", "PK", links)).toBe("https://e.example/pk");
    expect(resolveAffiliate("e", "GB", links)).toBe("https://e.example/d");
  });
  it("treats a tool with no entry as ordinary", () => {
    expect(affiliateStatus("nope", fake)).toBe("ordinary");
    expect(affiliateStatus("c", fake)).toBe("unavailable");
  });
});

describe("click tracking", () => {
  it("announces every outbound click as a browser event without sending anything anywhere", () => {
    const seen: unknown[] = [];
    const g = globalThis as unknown as { window?: EventTarget & { dispatchEvent: (e: Event) => boolean } };
    const target = new EventTarget();
    g.window = Object.assign(target, { dispatchEvent: target.dispatchEvent.bind(target) });
    target.addEventListener(OUTBOUND_EVENT, (e) => seen.push((e as CustomEvent).detail));
    track("outbound_click", { tool: "surfer", kind: "official", status: "ordinary", placement: "card" });
    track("outbound_click", { tool: "x", kind: "affiliate", status: "approved" });
    delete g.window;
    expect(seen).toEqual([
      { event: "outbound_click", tool: "surfer", kind: "official", status: "ordinary", placement: "card" },
      { event: "outbound_click", tool: "x", kind: "affiliate", status: "approved" },
    ]);
  });
  it("keeps analytics off", async () => {
    const { ANALYTICS_ENABLED } = await import("../src/lib/analytics");
    expect(ANALYTICS_ENABLED).toBe(false);
  });
});

describe("the generated status report is current", () => {
  it("docs/AFFILIATE_STATUS.md lists every researched programme and every unavailable one", () => {
    const doc = fs.readFileSync(path.join(root, "docs/AFFILIATE_STATUS.md"), "utf8");
    for (const [id, e] of Object.entries(AFFILIATE_PROGRAMS)) if (e.programme || e.status === "unavailable") expect(doc, id).toContain(`(\`${id}\`)`);
  });
});

// Reads the built site (npm run build first); skipped when out/ does not exist.
const built = fs.existsSync(path.join(root, "out/index.html"));
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === "_next" ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]));

describe.skipIf(!built)("disclosure and honesty on the built pages", () => {
  const pages = built ? walk(path.join(root, "out")).filter((f) => f.endsWith("index.html")) : [];
  it("every page with an outbound button also tells visitors about affiliate links", () => {
    for (const f of pages) {
      const h = fs.readFileSync(f, "utf8");
      if (!/data-cta="outbound"|data-aff=/.test(h)) continue;
      const text = h.replace(/<[^>]*>/g, " ");
      expect(text, path.relative(root, f)).toMatch(/affiliate links?/i);
      expect(h, path.relative(root, f)).toContain("/affiliate-disclosure/");
    }
  });
  it("no button claims to be an affiliate link while nothing is approved", () => {
    for (const f of pages) expect(fs.readFileSync(f, "utf8"), path.relative(root, f)).not.toContain('data-affiliate="true"');
  });
});
