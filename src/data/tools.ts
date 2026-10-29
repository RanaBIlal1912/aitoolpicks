// Tool directory. Descriptions are deliberately general and factual. We only add prices (see lib/prices.ts)
// after checking the official pricing page, and only set `freePlan: true` where a free plan is well documented.
export const CATEGORIES = [
  "AI assistants",
  "Writing",
  "Design",
  "Productivity",
  "Research",
  "Image generation",
  "Hosting & domains",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Tool = {
  id: string;
  name: string;
  category: Category;
  tagline: string;
  description: string;
  bestFor: string;
  officialUrl: string;
  /** true = a free plan or free tier is documented; false = check the official site. */
  freePlan: boolean;
  /** Slug of our review page, if we have written one. */
  review?: string;
  /** Accent hue used for the card glow. */
  hue: number;
};

export const TOOLS: Tool[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    category: "AI assistants",
    tagline: "General-purpose AI assistant",
    description: "Drafts, rewrites, summaries, brainstorming and answers to questions in a chat window.",
    bestFor: "First drafts, outlines and idea generation",
    officialUrl: "https://chatgpt.com",
    freePlan: true,
    review: "chatgpt",
    hue: 160,
  },
  {
    id: "claude",
    name: "Claude",
    category: "AI assistants",
    tagline: "AI assistant from Anthropic",
    description: "A chat assistant for writing, analysis, coding help and working with long documents.",
    bestFor: "Writing, analysis and long documents",
    officialUrl: "https://claude.ai",
    freePlan: true,
    hue: 25,
  },
  {
    id: "gemini",
    name: "Gemini",
    category: "AI assistants",
    tagline: "AI assistant from Google",
    description: "Google's AI assistant, available in the Gemini app and built into several Google products.",
    bestFor: "People who already live in Google apps",
    officialUrl: "https://gemini.google.com",
    freePlan: true,
    hue: 225,
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    category: "AI assistants",
    tagline: "AI assistant from Microsoft",
    description: "Microsoft's AI assistant, available as an app and inside Microsoft products.",
    bestFor: "People who work in Windows and Microsoft 365",
    officialUrl: "https://copilot.microsoft.com",
    freePlan: true,
    hue: 200,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    category: "Research",
    tagline: "AI answer engine",
    description: "Answers questions by searching the web and showing the sources it used, so you can check them.",
    bestFor: "Quick research with sources you can open",
    officialUrl: "https://www.perplexity.ai",
    freePlan: true,
    hue: 185,
  },
  {
    id: "grammarly",
    name: "Grammarly",
    category: "Writing",
    tagline: "Spelling, grammar and tone checker",
    description: "Flags mistakes as you type in the browser and many apps, and suggests clearer wording.",
    bestFor: "Proofreading proposals, emails and essays",
    officialUrl: "https://www.grammarly.com",
    freePlan: true,
    review: "grammarly",
    hue: 150,
  },
  {
    id: "jasper",
    name: "Jasper",
    category: "Writing",
    tagline: "AI writing for marketing teams",
    description: "An AI writing platform aimed at marketing content and brand-voice consistency.",
    bestFor: "Marketing teams producing a lot of copy",
    officialUrl: "https://www.jasper.ai",
    freePlan: false,
    hue: 275,
  },
  {
    id: "notion",
    name: "Notion",
    category: "Productivity",
    tagline: "Notes, docs and databases",
    description: "Notes, task lists and simple databases in one workspace, with templates for client tracking.",
    bestFor: "Organising client work and deadlines",
    officialUrl: "https://www.notion.com",
    freePlan: true,
    review: "notion",
    hue: 255,
  },
  {
    id: "canva",
    name: "Canva",
    category: "Design",
    tagline: "Template-based design tool",
    description: "Make social posts, presentations, resumes and simple logos from templates, no design skills needed.",
    bestFor: "Non-designers who need clean visuals fast",
    officialUrl: "https://www.canva.com",
    freePlan: true,
    review: "canva",
    hue: 195,
  },
  {
    id: "figma",
    name: "Figma",
    category: "Design",
    tagline: "Collaborative interface design",
    description: "A browser-based design tool used for app and website interfaces and shared team design work.",
    bestFor: "Designing websites and apps with a team",
    officialUrl: "https://www.figma.com",
    freePlan: true,
    hue: 300,
  },
  {
    id: "midjourney",
    name: "Midjourney",
    category: "Image generation",
    tagline: "AI image generator",
    description: "Creates images from text descriptions. Check the official site for current access and plans.",
    bestFor: "Concept art and visual ideas",
    officialUrl: "https://www.midjourney.com",
    freePlan: false,
    hue: 240,
  },
  {
    id: "hostinger",
    name: "Hostinger",
    category: "Hosting & domains",
    tagline: "Beginner-friendly web hosting",
    description: "Web hosting and a website builder aimed at first-time site owners.",
    bestFor: "A first website on a small budget",
    officialUrl: "https://www.hostinger.com",
    freePlan: false,
    review: "hostinger",
    hue: 262,
  },
  {
    id: "namecheap",
    name: "Namecheap",
    category: "Hosting & domains",
    tagline: "Domains and hosting",
    description: "A domain name registrar that also sells hosting and related services.",
    bestFor: "Registering a domain name for your site",
    officialUrl: "https://www.namecheap.com",
    freePlan: false,
    hue: 20,
  },
];

export function getTool(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function categorySlug(c: Category): string {
  return c.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function categoryFromSlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => categorySlug(c) === slug);
}

export const CATEGORY_INFO: Record<Category, { cover: "neural" | "fibre" | "lens" | "board" | "signal" | "rack"; blurb: string }> = {
  "AI assistants": { cover: "neural", blurb: "Chat assistants that draft, explain, summarise and brainstorm. Start with a free tier and check what they write." },
  Writing: { cover: "fibre", blurb: "Tools that fix or produce written text, from spelling and tone checks to marketing copy." },
  Design: { cover: "lens", blurb: "Design tools for everything from quick social posts to full website and app interfaces." },
  Productivity: { cover: "board", blurb: "Notes, tasks and trackers that keep client work and deadlines organised." },
  Research: { cover: "signal", blurb: "Tools that help you find and check information, ideally with sources you can open." },
  "Image generation": { cover: "lens", blurb: "Tools that create images from text descriptions. Check commercial-use terms before using results for clients." },
  "Hosting & domains": { cover: "rack", blurb: "Domains and hosting for a first website, plus free options worth trying first." },
};

export function toolsInCategory(c: Category): Tool[] {
  return TOOLS.filter((t) => t.category === c);
}
