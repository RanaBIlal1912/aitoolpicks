// Hosting preparation: the two build modes, the legacy redirects, the cutover stub and the shared-secret check. None of this deploys anything.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
// @ts-expect-error plain JavaScript module
import { legacyRedirects } from "../scripts/hosting/redirects.mjs";
// @ts-expect-error plain JavaScript module
import { buildStub, oldPaths, redirectPage } from "../scripts/hosting/make-redirect-stub.mjs";
import { checkBearer } from "../src/server/http/bearer.ts";
import { desired } from "../src/server/import/content.ts";
import { loadContent } from "../src/server/import/content-source.ts";
import { loadSource } from "../src/server/import/source.ts";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const walk = (dir: string): string[] => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aitp-host-"));
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

/** Load next.config.mjs fresh under the given environment. */
async function config(env: Record<string, string | undefined>) {
  const saved = { ...process.env };
  for (const k of ["VERCEL", "DEPLOY_TARGET"]) delete process.env[k];
  Object.assign(process.env, env);
  try {
    vi.resetModules();
    // @ts-expect-error plain JavaScript module
    return (await import("../next.config.mjs")).default as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  } finally {
    process.env = saved;
  }
}

describe("the two build modes", () => {
  it("GitHub Pages (the default) is a static export under /aitoolpicks with no server features", async () => {
    const c = await config({ NODE_ENV: "production" });
    expect(c.output).toBe("export");
    expect(c.basePath).toBe("/aitoolpicks");
    expect(c.pageExtensions).toEqual(["tsx", "ts"]);
    expect(c.redirects).toBeUndefined();
    expect(c.headers).toBeUndefined();
  });

  it("Vercel is not an export, sits at the root of its domain, and enables the server-only files", async () => {
    for (const env of [{ VERCEL: "1" }, { DEPLOY_TARGET: "vercel" }]) {
      const c = await config({ NODE_ENV: "production", ...env });
      expect(c.output).toBeUndefined();
      expect(c.basePath).toBe("");
      expect(c.pageExtensions).toContain("vercel.ts");
      expect(typeof c.redirects).toBe("function");
    }
  });

  it("sends real permanent redirects for every legacy address, and security headers on every page", async () => {
    const c = await config({ NODE_ENV: "production", VERCEL: "1" });
    const redirects = await c.redirects();
    expect(redirects).toHaveLength(32);
    expect(redirects.every((r: { permanent: boolean }) => r.permanent)).toBe(true);
    const headers = await c.headers();
    const all = Object.fromEntries(headers.find((h: { source: string }) => h.source === "/:path*").headers.map((h: { key: string; value: string }) => [h.key, h.value]));
    expect(all["X-Frame-Options"]).toBe("DENY");
    expect(all["X-Content-Type-Options"]).toBe("nosniff");
    expect(all["Strict-Transport-Security"]).toMatch(/max-age=\d+/);
    expect(all["Content-Security-Policy-Report-Only"]).toMatch(/frame-ancestors 'none'/);
    expect(all["Content-Security-Policy"]).toBeUndefined(); // report-only until a week of reports is clean
  });
});

describe("legacy redirects: one mapping in three places", () => {
  it("the Vercel redirects equal what the importer stores in the redirects table", () => {
    const cat = loadSource(root);
    const stored = desired(loadContent(root, cat)).redirects.map((r) => ({ source: r.from, destination: r.to }));
    const fromConfig = legacyRedirects(root) as { source: string; destination: string }[];
    expect(fromConfig.length).toBe(stored.length);
    expect(new Set(fromConfig.map((r) => `${r.source} ${r.destination}`))).toEqual(new Set(stored.map((r) => `${r.source} ${r.destination}`)));
  });
});

describe("server-only files stay out of the GitHub Pages build", () => {
  it("every file that imports server code under src/app is a *.vercel.ts route in src/app/api", () => {
    const offenders = walk("src/app").filter((f) => /\.(ts|tsx)$/.test(f) && /server\/|src\/server/.test(read(f)) && !/^src\/app\/api\/.+\/route\.vercel\.ts$/.test(f));
    expect(offenders).toEqual([]);
  });

  it("the Vercel routes are all named *.vercel.ts, so a Pages build ignores them", () => {
    const api = walk("src/app/api").filter((f) => /\.(ts|tsx)$/.test(f));
    expect(api.length).toBeGreaterThanOrEqual(4);
    for (const f of api) expect(f, f).toMatch(/route\.vercel\.ts$/);
  });

  it("the analytics and cron routes do nothing without their settings", () => {
    expect(read("src/app/api/events/route.vercel.ts")).toMatch(/if \(!env\.ANALYTICS_ENABLED\) return new Response\(null, \{ status: 204 \}\)/);
    expect(read("src/app/api/cron/nightly/route.vercel.ts")).toMatch(/if \(!secret\) return new Response\(null, \{ status: 404 \}\)/);
    expect(read("src/app/api/health/db/route.vercel.ts")).toMatch(/if \(!secret\) return new Response\(null, \{ status: 404 \}\)/);
  });

  it("robots.txt keeps crawlers out of the API and admin paths", () => {
    expect(read("src/app/robots.ts")).toMatch(/disallow: \["\/api\/", "\/admin\/"\]/);
  });

  it("vercel.json schedules only the nightly job, once a day (the Hobby plan limit)", () => {
    const v = JSON.parse(read("vercel.json"));
    expect(v.crons).toEqual([{ path: "/api/cron/nightly", schedule: expect.stringMatching(/^\d+ \d+ \* \* \*$/) }]);
  });
});

describe("checkBearer", () => {
  const secret = "a-shared-secret-0123456789";
  it("accepts exactly the right secret", () => {
    expect(checkBearer(`Bearer ${secret}`, secret)).toBe(true);
  });
  it("refuses everything else, including missing or weak secrets", () => {
    for (const h of [null, undefined, "", secret, `bearer ${secret}`, `Bearer ${secret} `, `Bearer ${secret}x`, "Bearer ", "Basic abc"]) expect(checkBearer(h as string, secret), String(h)).toBe(false);
    expect(checkBearer("Bearer short", "short")).toBe(false);
    expect(checkBearer(`Bearer ${secret}`, undefined)).toBe(false);
    expect(checkBearer(`Bearer ${secret}`, "")).toBe(false);
  });
});

const built = fs.existsSync(path.join(root, "out/sitemap.xml"));
describe("redirect stub for the cutover", () => {
  it("builds a stub page for every old address and none outside the old site", () => {
    expect(redirectPage("https://x.example.com/a/")).toContain('<link rel="canonical" href="https://x.example.com/a/">');
    expect(() => buildStub({ from: "out", dest: path.join(tmp, "s"), to: "http://example.com" })).toThrow(/https/);
    expect(() => buildStub({ from: "out", dest: path.join(tmp, "s"), to: "https://example.com/blog" })).toThrow(/root/);
    expect(() => buildStub({ from: "out", dest: "out/stub", to: "https://example.com" })).toThrow(/separate/);
  });

  it.skipIf(!built)("covers the sitemap and the legacy pages of the real build, with correct destinations", () => {
    const dest = path.join(tmp, "stub");
    const r = buildStub({ from: "out", dest, to: "https://www.example.com" });
    const old = oldPaths({ from: path.join(root, "out") }) as string[];
    expect(r.written).toEqual(old);
    expect(old.filter((p) => p.endsWith(".html"))).toHaveLength(32);
    expect(old.filter((p) => p.endsWith("/")).length).toBe(320);
    const tool = fs.readFileSync(path.join(dest, "tools/chatgpt/index.html"), "utf8");
    expect(tool).toContain('content="0; url=https://www.example.com/tools/chatgpt/"');
    const legacy = fs.readFileSync(path.join(dest, "best-ai-writing-tools.html"), "utf8");
    expect(legacy).toContain("https://www.example.com/blog/best-ai-writing-tools/");
    expect(fs.readFileSync(path.join(dest, "404.html"), "utf8")).toContain("https://www.example.com/");
    expect(fs.existsSync(path.join(dest, ".nojekyll"))).toBe(true);
    // nothing of the real site is copied: no scripts, styles or images
    expect(walk(path.relative(root, dest).startsWith("..") ? "out" : "out").length).toBeGreaterThan(0);
    const files = fs.readdirSync(dest, { recursive: true }) as string[];
    expect(files.some((f) => /_next|\.(png|webp|svg|js|css)$/.test(f))).toBe(false);
  });
});
