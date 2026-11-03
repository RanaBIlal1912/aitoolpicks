import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REVIEWS } from "../src/data/reviews";
import { TOOLS } from "../src/data/tools";
import { DEFAULT_REVIEWER, METHOD_LABEL, reviewerOf, trustProblems, type HandsOnTest, type ReviewTrust } from "../src/lib/review-trust";

const root = process.cwd();
const TODAY = "2026-11-03";

const test: HandsOnTest = {
  testedBy: "A. Tester",
  role: "freelance writer, paying customer",
  plan: "Pro, paid",
  region: "Pakistan",
  testedFrom: "2026-10-20",
  testedTo: "2026-10-27",
  hours: 6,
  tasks: [{ task: "Draft a client proposal", result: "A usable first draft after two edits" }],
  worked: ["Tone control"],
  failed: ["Invented a statistic that had to be removed"],
  conflicts: "None: no affiliate link is configured and the plan was paid for.",
  evidence: [{ label: "Prompt and output log", url: "https://example.com/log" }],
  screenshots: [],
};
const handsOn: ReviewTrust = { method: "hands-on", testing: test };

describe("every published review states how it was made", () => {
  it("has a valid method and passes the trust rules", () => {
    expect(REVIEWS.length).toBeGreaterThan(0);
    for (const r of REVIEWS) {
      expect(["documentation", "hands-on"], r.slug).toContain(r.method);
      expect(trustProblems(r, TODAY, (s) => fs.existsSync(path.join(root, "public", s))), r.slug).toEqual([]);
      expect(TOOLS.some((t) => t.id === r.toolId), `${r.slug} -> ${r.toolId}`).toBe(true);
    }
  });

  it("does not claim hands-on testing today, because no testing record exists", () => {
    // Update when the first real hands-on review is added; its testing record must then pass the rules above.
    expect(REVIEWS.filter((r) => r.method === "hands-on")).toEqual([]);
  });

  it("credits the site's editors for research and the named tester for testing", () => {
    expect(reviewerOf({ method: "documentation" })).toBe(DEFAULT_REVIEWER);
    expect(reviewerOf(handsOn)).toBe("A. Tester");
  });
});

describe("the rules that stop a false hands-on label", () => {
  it("accepts a complete testing record", () => {
    expect(trustProblems(handsOn, TODAY)).toEqual([]);
  });

  it("rejects a documentation review that carries a testing record", () => {
    expect(trustProblems({ method: "documentation", testing: test }, TODAY)).not.toEqual([]);
  });

  it("rejects a hands-on review with nothing attached", () => {
    expect(trustProblems({ method: "hands-on" }, TODAY)).toEqual(["a hands-on review needs a testing record"]);
  });

  const broken: [string, Partial<HandsOnTest>][] = [
    ["no tester", { testedBy: " " }],
    ["no plan", { plan: "" }],
    ["no region", { region: "" }],
    ["no conflicts statement", { conflicts: "" }],
    ["bad start date", { testedFrom: "last week" }],
    ["test in the future", { testedTo: "2026-12-31" }],
    ["ends before it starts", { testedFrom: "2026-10-28", testedTo: "2026-10-27" }],
    ["no tasks", { tasks: [] }],
    ["a task with no result", { tasks: [{ task: "Draft", result: "" }] }],
    ["nothing that worked", { worked: [] }],
    ["nothing that failed", { failed: [] }],
    ["no evidence", { evidence: [] }],
    ["evidence over http", { evidence: [{ label: "Log", url: "http://example.com" }] }],
    ["negative hours", { hours: -1 }],
    ["screenshot without alt text", { screenshots: [{ src: "/shots/a.png", alt: "", caption: "A" }] }],
  ];
  for (const [name, patch] of broken) {
    it(`rejects: ${name}`, () => {
      expect(trustProblems({ method: "hands-on", testing: { ...test, ...patch } }, TODAY, () => true), name).not.toEqual([]);
    });
  }

  it("rejects a screenshot that is not in public/", () => {
    const r: ReviewTrust = { method: "hands-on", testing: { ...test, screenshots: [{ src: "/shots/none.png", alt: "Output", caption: "Output" }] } };
    expect(trustProblems(r, TODAY, () => false)).toEqual(["screenshot /shots/none.png does not exist in public/"]);
  });

  it("has a label for each method", () => {
    expect(METHOD_LABEL).toEqual({ documentation: "Editorial research", "hands-on": "Hands-on tested" });
  });
});

// Reads the built site (npm run build first); skipped when out/ does not exist.
const built = fs.existsSync(path.join(root, "out/index.html"));
const html = (route: string) => fs.readFileSync(path.join(root, "out", route, "index.html"), "utf8");
const text = (route: string) => html(route).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

describe.skipIf(!built)("the built review pages show the method honestly", () => {
  it("every review page shows its label, who wrote it, when the facts were checked, and that nobody tested it", () => {
    for (const r of REVIEWS) {
      const t = text(`reviews/${r.slug}`);
      expect(t, r.slug).toContain(METHOD_LABEL[r.method]);
      expect(t, r.slug).toContain(reviewerOf(r));
      expect(t, r.slug).toContain("Facts last checked");
      if (r.method === "documentation") {
        expect(t, r.slug).toContain("No one ran the product for this page");
        expect(t, r.slug).not.toMatch(/hands-on tested/i);
      }
    }
  });

  it("no page shows a rating, a score or review stars in its structured data", () => {
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === "_next" ? [] : walk(path.join(d, e.name))) : e.name === "index.html" ? [path.join(d, e.name)] : []));
    for (const f of walk(path.join(root, "out"))) {
      const h = fs.readFileSync(f, "utf8");
      expect(h, path.relative(root, f)).not.toMatch(/aggregateRating|reviewRating|"ratingValue"/);
    }
  });

  it("the reviews list says how many pages are research and none is a hands-on test", () => {
    const t = text("reviews");
    expect(t).toContain(`${REVIEWS.length} of ${REVIEWS.length} pages are editorial research`);
    expect(t).toContain("None is a hands-on test yet");
  });
});
