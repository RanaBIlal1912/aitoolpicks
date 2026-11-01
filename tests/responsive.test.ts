import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

// Guards for layout bugs found by the responsive audit (see docs/RESPONSIVE_AUDIT.md). The browser-driven checks live outside the repo; these keep the causes from coming back.
describe("responsive layout guards", () => {
  const css = read("src/app/globals.css");

  it("keeps the .glass/.panel/.tile position rule in the components layer so absolute, fixed and sticky utilities still win", () => {
    // An unlayered `.glass { position: relative }` overrides Tailwind's `absolute` and broke the desktop "More" menu.
    expect(css).toMatch(/@layer components\s*\{\s*\.panel,\s*\.glass,\s*\.news-card,\s*\.tile,\s*\.versus\s*\{\s*position:\s*relative;/);
    expect(css).not.toMatch(/\n\.panel,\n\.glass,\n\.news-card,\n\.tile,\n\.versus \{\n  position: relative;/);
  });

  it("lets grid items shrink below their content width (no column blow-out on phones)", () => {
    expect(css).toMatch(/@layer base\s*\{\s*\.grid > \*\s*\{\s*min-width:\s*0;/);
  });

  it("scales the root size on large monitors, TVs and ultrawide screens", () => {
    for (const w of [1920, 2400, 3000, 3600]) expect(css).toContain(`@media (min-width: ${w}px)`);
    expect(css).toMatch(/body\s*\{[^}]*font-size:\s*1\.0625rem/);
  });

  it("keeps the page-header logo from drifting into the headline on wide screens", () => {
    expect(css).toMatch(/\.ph-aside\s*\{\s*(?:\/\*[^*]*\*\/\s*)?right:\s*min\(max\(/);
  });

  it("hands the hero canvas to the worker once, whatever the parent does", () => {
    const hero = read("src/components/home/RobotHero.tsx");
    expect(hero).toContain("canvas.dataset.offscreen");
    expect(hero).toMatch(/\},\s*\[gl\]\);/);
    expect(hero).not.toMatch(/\},\s*\[gl,\s*logos\]\);/);
  });

  it("lets touch steer the robot, offers an opt-in to the 3D scenes, and never freezes the worker", () => {
    const hero = read("src/components/home/RobotHero.tsx");
    expect(hero).toContain('"touchmove"');
    expect(hero).toContain("optIn");
    expect(read("src/components/universe/UniverseSection.tsx")).toContain("optIn");
    const worker = read("src/components/hero/robot.worker.ts");
    expect(worker).not.toMatch(/\?\s*"still"/);
    expect(worker).toContain("nextProbe");
  });
});
