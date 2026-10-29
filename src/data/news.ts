// AI news. Every item links to the original source and carries that source's publication date.
// Summaries are short and kept to what the original post says. Add new items by hand after reading the source.
export type NewsItem = {
  title: string;
  date: string; // ISO date from the source
  source: string;
  url: string;
  summary: string;
};

export const NEWS: NewsItem[] = [
  {
    title: "Gemini app lets you create, preview and edit files in a chat",
    date: "2026-10-29",
    source: "Google (The Keyword)",
    url: "https://blog.google/innovation-and-ai/products/gemini-app/edit-files-directly/",
    summary:
      "Google says the Gemini app can now create, preview and edit files such as PDFs, slideshows and spreadsheets inside a chat. PDF viewing and editing works on web and phones; other formats such as Docs, Sheets and code are web-only.",
  },
  {
    title: "AI for Science expands to foundations and research institutions",
    date: "2026-10-28",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/ai-for-science-expands-foundations-research-institutions",
    summary: "Anthropic announced an expansion of its AI for Science programme to foundations and research institutions.",
  },
  {
    title: "Early progress on accelerating drug development with Claude",
    date: "2026-10-27",
    source: "Anthropic",
    url: "https://www.anthropic.com/research/early-progress-drug-development",
    summary: "Anthropic published a research update on early progress using Claude to help accelerate drug development.",
  },
  {
    title: "Expanding our partnership with GSA to bring Claude to all levels of government",
    date: "2026-10-27",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/expanding-partnership-gsa",
    summary: "Anthropic announced an expanded partnership with GSA to bring Claude to all levels of government.",
  },
  {
    title: "Anthropic files S-1 with the SEC for proposed initial public offering",
    date: "2026-10-26",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/s1-sec",
    summary:
      "Anthropic says it filed a registration statement on Form S-1 with the U.S. SEC for a proposed IPO of its Class A common stock, with plans to list on the Nasdaq Global Select Market. The share count and price range have not been set.",
  },
  {
    title: "Donating Agent Skills to the Agentic AI Foundation",
    date: "2026-10-22",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation",
    summary:
      "Anthropic is donating Agent Skills, an open standard that gives AI agents specialised knowledge and workflows, to the Agentic AI Foundation under the Linux Foundation. It says more than 70 agent platforms have already integrated it.",
  },
];

export const NEWS_CHECKED = "2026-10-29";
