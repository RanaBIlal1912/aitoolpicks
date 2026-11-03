import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const walk = (dir: string): string[] =>
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
const sources = walk("src").filter((f) => /\.(ts|tsx)$/.test(f));
const usesGl = (f: string) => /from "three"|@react-three\/|OffscreenCanvas|getContext\("webgl/.test(read(f));

describe("3D and WebGL are documented as they really are", () => {
  const doc = read("docs/3D.md");
  const glFiles = sources.filter(usesGl).filter((f) => !f.startsWith("src/lib/scene/"));

  it("lists every file that uses Three.js, WebGL or OffscreenCanvas", () => {
    expect(glFiles.length).toBeGreaterThan(0);
    for (const f of glFiles) expect(doc, f).toContain(path.basename(f));
  });

  it("does not list files that no longer exist", () => {
    for (const m of doc.matchAll(/`(src\/[^`]+\.(?:ts|tsx))`/g)) expect(fs.existsSync(path.join(root, m[1])), m[1]).toBe(true);
  });

  it("keeps the offline cover-render code out of the site's pages and components", () => {
    const shipped = sources.filter((f) => !f.startsWith("src/lib/scene/"));
    for (const f of shipped) expect(read(f), f).not.toMatch(/lib\/scene/);
  });

  it("is not contradicted by the README", () => {
    const readme = read("README.md");
    expect(readme).not.toMatch(/no longer loads any WebGL/i);
    expect(readme).toContain("docs/3D.md");
  });

  it("keeps both scenes off for reduced motion and data saving until the visitor opts in", () => {
    for (const f of ["src/components/home/RobotHero.tsx", "src/components/universe/EcosystemNetwork.tsx"]) {
      const s = read(f);
      expect(s, f).toContain("motionLimit");
      expect(s, f).toContain("optIn");
    }
  });

  it("loads the ecosystem scene lazily, not in the page's first JavaScript", () => {
    expect(read("src/components/universe/EcosystemNetwork.tsx")).toMatch(/dynamic\(\(\) => import\("\.\/EcosystemScene"\), \{ ssr: false \}\)/);
  });

  it("ships Three.js as a runtime dependency, not a dev one", () => {
    const pkg = JSON.parse(read("package.json"));
    for (const d of ["three", "@react-three/fiber", "@react-three/drei"]) expect(pkg.dependencies[d], d).toBeTruthy();
  });
});

describe("the 3D scenes survive a weak or interrupted phone", () => {
  it("the hero worker tells the page when the graphics context is lost, and recovers when it returns", () => {
    const w = read("src/components/hero/robot.worker.ts");
    expect(w).toContain("webglcontextlost");
    expect(w).toContain("webglcontextrestored");
    expect(w).toContain('type: "lost"');
    expect(w).toContain("isContextLost()");
    expect(read("src/components/home/RobotHero.tsx")).toMatch(/"lost"\)\s*setReady\(false\)/);
  });

  it("the hero worker draws nothing while the hero is off screen, and exposes a frame counter", () => {
    const w = read("src/components/hero/robot.worker.ts");
    expect(w).toMatch(/m\.type === "active"[\s\S]*?else stop\(\)/);
    expect(w).toContain("__frames");
  });

  it("the ecosystem scene stops drawing off screen, shows a fallback if it fails, and does not trap a phone's vertical swipe", () => {
    const n = read("src/components/universe/EcosystemNetwork.tsx");
    const sc = read("src/components/universe/EcosystemScene.tsx");
    expect(sc).toMatch(/frameloop=\{active \? "always" : "never"\}/);
    expect(sc).toContain("webglcontextlost");
    expect(n).toContain("SceneBoundary");
    expect(n).toContain("IntersectionObserver");
    expect(n).toContain("eco-scene");
    expect(read("src/app/globals.css")).toMatch(/\.eco-scene canvas,\s*\.eco-scene div\s*\{\s*touch-action: pan-y !important;/);
  });

  it("the ecosystem frame height comes from CSS, so it cannot shift the page when the script starts", () => {
    const n = read("src/components/universe/EcosystemNetwork.tsx");
    expect(n).toContain("h-[380px]");
    expect(n).toContain("md:h-[560px]");
    expect(n).not.toMatch(/style=\{\{ height:/);
  });
});
