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
