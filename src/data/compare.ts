// Side-by-side tables shown on comparison pages. Cells are plain text, or {price: toolId} to show the
// verified USD price (with an estimated conversion) from lib/prices.ts.
export type Cell = string | { price: string };

export type Comparison = {
  slug: string;
  /** Matches the article file in content/articles. */
  article: string;
  leftLabel: string;
  rightLabel: string;
  leftTool?: string;
  rightTool?: string;
  rows: { label: string; left: Cell; right: Cell }[];
};

export const COMPARISONS: Comparison[] = [
  {
    slug: "chatgpt-vs-grammarly",
    article: "chatgpt-vs-grammarly",
    leftLabel: "ChatGPT",
    rightLabel: "Grammarly",
    leftTool: "chatgpt",
    rightTool: "grammarly",
    rows: [
      { label: "Main job", left: "Create: drafts, outlines, ideas and rewrites", right: "Fix: spelling, grammar and tone" },
      { label: "Best when", left: "You face a blank page or need ideas", right: "You already have text that needs cleaning up" },
      { label: "Free option", left: "A free tier is available", right: "A free plan is available" },
      { label: "Typical paid plan", left: { price: "chatgpt" }, right: { price: "grammarly" } },
      { label: "Watch out", left: "Can state wrong facts confidently. Check anything important.", right: "Suggestions are not always right for your style." },
    ],
  },
  {
    slug: "canva-free-vs-pro",
    article: "canva-free-vs-pro",
    leftLabel: "Canva Free",
    rightLabel: "Canva paid plan",
    leftTool: "canva",
    rows: [
      { label: "Choose it if", left: "You make a few social posts, simple flyers or a portfolio, work alone and do not need lots of premium templates", right: "You design for clients every week, want brand colours, fonts and logos in one place, or keep hitting limits" },
      { label: "How to decide", left: "Use it for two weeks and list what blocked you", right: "Upgrade when a named feature saves more time or money than it costs" },
      { label: "Price", left: "Free", right: "See Canva's plans page. We do not show a price because sources disagreed." },
    ],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
