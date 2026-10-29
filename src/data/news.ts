// AI news. Every item links to the original source and carries that source's own publication date.
// Summaries stay close to what the original post says. Add items by hand after reading the source;
// never add an item without a real date and a working link.
export type NewsTag = "Products" | "Models" | "Research" | "Policy & safety" | "Company news" | "Open standards";

export type NewsKind = "New product" | "Feature update" | "Model release" | "Research" | "Policy update" | "Company announcement" | "Open standard";

export type NewsItem = {
  /** Stable address for the item's page on this site. Never change it once published. */
  slug: string;
  /** Separates a new product or model from an update to something that already existed. */
  kind: NewsKind;
  title: string;
  date: string; // ISO date from the source
  source: string;
  url: string;
  tag: NewsTag;
  summary: string;
  /** Catalog tool ids this item concerns. */
  tools?: string[];
  /** True when the date was read from the article address because the page only showed relative times. */
  dateFromUrl?: boolean;
  /** Plain-language note on why it may matter to people choosing tools. Interpretation, not a claim from the source. */
  matters: string;
};

export const NEWS: NewsItem[] = [
  {
    slug: "gemini-app-edit-files",
    kind: "Feature update",
    title: "Gemini app lets you create, preview and edit files in a chat",
    date: "2026-10-29",
    source: "Google (The Keyword)",
    url: "https://blog.google/innovation-and-ai/products/gemini-app/edit-files-directly/",
    tag: "Products",
    tools: ["gemini"],
    summary:
      "Google says the Gemini app can now create, preview and edit files such as PDFs, slideshows and spreadsheets inside a chat. PDF viewing and editing works on web and phones; other formats such as Docs, Sheets and code are web-only.",
    matters: "If you draft documents with an AI assistant, check which file types your account supports before relying on it.",
  },
  {
    slug: "mistral-large-4-on-hugging-face",
    kind: "Model release",
    title: "Welcome Le Chonk: Mistral Large 4 on Hugging Face",
    date: "2026-10-29",
    source: "Hugging Face",
    url: "https://huggingface.co/blog/mistral-large4",
    tag: "Models",
    tools: ["mistral", "huggingface"],
    summary:
      "Hugging Face announced Mistral Large 4, a multimodal, multilingual Mixture-of-Experts model with about 1T total parameters, 49B active and a 1M-token context window, released under the Mistral Ecosystem Open-Weight License with day-0 support in transformers, vLLM and llama.cpp. It is positioned for cybersecurity, coding agents and multimodal tasks.",
    matters:
      "Open-weight releases let teams run or fine-tune a model themselves, but the licence decides what commercial use is allowed, so read it before building on the model.",
  },
  {
    slug: "project-protostar",
    kind: "Research",
    title: "Announcing Project ProtoStar: making publicly funded science AI-ready",
    date: "2026-10-29",
    source: "Hugging Face",
    url: "https://huggingface.co/blog/announcing-project-protostar",
    tag: "Research",
    tools: ["huggingface"],
    summary:
      "Hugging Face announced Project ProtoStar, an initiative with universities, research organisations and industry to release publicly funded scientific datasets, models and code in formats AI systems can use. The first challenge, hosted by Carnegie Mellon University and opening on 2 November, asks teams to forecast four urban climate indicators for 210 U.S. cities.",
    matters:
      "Datasets released in AI-ready formats can make public science easier to reuse. It matters mainly to researchers and anyone building on public data, not to everyday tool buyers.",
  },
  {
    slug: "ai-for-science-expands",
    kind: "Company announcement",
    title: "AI for Science expands to foundations and research institutions",
    date: "2026-10-28",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/ai-for-science-expands-foundations-research-institutions",
    tag: "Research",
    tools: ["claude"],
    summary: "Anthropic announced an expansion of its AI for Science programme to foundations and research institutions.",
    matters:
      "It shows where the vendor is investing. The announcement summary above does not mention any change to plans or prices.",
  },
  {
    slug: "claude-drug-development-progress",
    kind: "Research",
    title: "Early progress on accelerating drug development with Claude",
    date: "2026-10-27",
    source: "Anthropic",
    url: "https://www.anthropic.com/research/early-progress-drug-development",
    tag: "Research",
    tools: ["claude"],
    summary: "Anthropic published a research update on early progress using Claude to help accelerate drug development.",
    matters:
      "This is an early research update, not a product release. Treat any results as preliminary.",
  },
  {
    slug: "anthropic-gsa-partnership",
    kind: "Company announcement",
    title: "Expanding our partnership with GSA to bring Claude to all levels of government",
    date: "2026-10-27",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/expanding-partnership-gsa",
    tag: "Company news",
    tools: ["claude"],
    summary: "Anthropic announced an expanded partnership with GSA to bring Claude to all levels of government.",
    matters:
      "It is most relevant to public-sector buyers. The summary above does not mention any change to individual plans or prices.",
  },
  {
    slug: "anthropic-files-s1",
    kind: "Company announcement",
    title: "Anthropic files S-1 with the SEC for proposed initial public offering",
    date: "2026-10-26",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/s1-sec",
    tag: "Company news",
    tools: ["claude"],
    summary:
      "Anthropic says it filed a registration statement on Form S-1 with the U.S. SEC for a proposed IPO of its Class A common stock, with plans to list on the Nasdaq Global Select Market. The share count and price range have not been set.",
    matters:
      "A filing is a corporate event, not a product change. The announcement says the share count and price range had not been set.",
  },
  {
    slug: "agent-skills-donated-to-foundation",
    kind: "Open standard",
    title: "Donating Agent Skills to the Agentic AI Foundation",
    date: "2026-10-22",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation",
    tag: "Open standards",
    tools: ["claude"],
    summary:
      "Anthropic is donating Agent Skills, an open standard that gives AI agents specialised knowledge and workflows, to the Agentic AI Foundation under the Linux Foundation. It says more than 70 agent platforms have already integrated it.",
    matters:
      "If an open standard is widely adopted, the same skills can move between agent platforms, which lowers lock-in. Adoption claims come from the vendor.",
  },
  {
    slug: "anthropic-singapore-office",
    kind: "Company announcement",
    title: "Anthropic opens Singapore office and signs MOU with the Government of Singapore",
    date: "2026-10-14",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/singapore-office-opening",
    tag: "Company news",
    tools: ["claude"],
    summary:
      "Anthropic opened a new Singapore office, its fifth in the Asia-Pacific region, and signed a Memorandum of Understanding with Singapore's Ministry of Digital Development and Information covering AI safety, security and model evaluation, research on AI adoption, and responsible AI use.",
    matters:
      "It signals regional expansion and a focus on safety and evaluation work. No pricing change is stated in the summary above.",
  },
  {
    slug: "anthropic-usage-policy-2026",
    kind: "Policy update",
    title: "2026 Usage Policy update",
    date: "2026-10-08",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/2026-usage-policy-update",
    tag: "Policy & safety",
    tools: ["claude"],
    summary:
      "Anthropic published a 2026 update to its Usage Policy, effective 12 November, that clarifies existing rules and adds examples for newer capabilities. Changes include a section on deceptive campaigns, narrower election and surveillance rules, weapons restrictions covering software and components, human-oversight requirements for high-risk uses, and a ban on sustained, needless abuse of its models.",
    matters: "If you use AI tools for client work, it is worth reading the usage policy of each tool you rely on.",
  },
  {
    slug: "granola-adds-dictation",
    kind: "Feature update",
    title: "Granola crunches up a dictation feature to compete with Wispr",
    date: "2026-10-29",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/29/granola-crunches-up-a-dictation-feature-to-compete-with-wispr/",
    tag: "Products",
    tools: ["granola", "wisprflow"],
    summary: "TechCrunch reports that Granola has added a dictation feature to compete with Wispr.",
    dateFromUrl: true,
    matters:
      "Dictation is appearing inside meeting and notes apps. Before paying for two products, check whether one now covers both jobs for you.",
  },
  {
    slug: "mistral-releases-trillion-parameter-weights",
    kind: "Model release",
    title: "Mistral releases weights for its trillion-parameter AI model, targeting cybersecurity",
    date: "2026-10-29",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/29/mistral-releases-weights-for-its-trillion-parameter-ai-model-targeting-cybersecurity/",
    tag: "Models",
    summary: "TechCrunch reports that Mistral AI released the weights of its trillion-parameter model, which it positions for cybersecurity. Hugging Face published its own announcement the same day.",
    tools: ["mistral", "huggingface"],
    dateFromUrl: true,
    matters:
      "Published weights mean teams can run the model on their own infrastructure, subject to the licence. It is a developer concern more than a consumer one.",
  },
  {
    slug: "anthropic-ai-spend-tools",
    kind: "Feature update",
    title: "Anthropic just launched tools to show companies what their AI spending is buying",
    date: "2026-10-28",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/28/anthropic-just-launched-tools-to-show-companies-what-their-ai-spending-is-buying/",
    tag: "Products",
    summary: "TechCrunch reports that Anthropic launched tools meant to show companies what their AI spending is buying.",
    tools: ["claude"],
    dateFromUrl: true,
    matters:
      "Cost visibility matters for teams paying per seat or per token. Check the vendor's own documentation for exactly what is reported.",
  },
  {
    slug: "chrome-autofill-reads-gmail",
    kind: "Feature update",
    title: "Chrome's AI-powered Autofill can now dig through your Gmail to fill out forms",
    date: "2026-10-28",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/28/chromes-ai-powered-autofill-can-now-dig-through-your-gmail-to-fill-out-forms/",
    tag: "Products",
    summary: "TechCrunch reports that Chrome's AI-powered Autofill can now draw on information in Gmail to fill out forms.",
    matters: "Features that read your email raise privacy questions, so check the settings before you switch them on.",
    dateFromUrl: true,
  },
  {
    slug: "google-opens-gemini-and-search-to-apps",
    kind: "Feature update",
    title: "As AI agents reshape the web, Google opens Gemini and Search to more apps",
    date: "2026-10-28",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/28/as-ai-agents-reshape-the-web-google-opens-gemini-and-search-to-more-apps/",
    tag: "Products",
    summary: "TechCrunch reports that Google is opening Gemini and Search to more apps as AI agents change how people use the web.",
    tools: ["gemini"],
    dateFromUrl: true,
    matters:
      "When an assistant connects to more apps it can do more, and it can also reach more of your data. Review the permissions before you connect anything.",
  },
  {
    slug: "nvidia-open-transcription-model",
    kind: "Model release",
    title: "Voice AI in vogue: Nvidia releases new open transcription model",
    date: "2026-10-28",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/28/voice-ai-in-vogue-nvidia-releases-new-open-transcription-model/",
    tag: "Models",
    tools: ["huggingface"],
    summary: "TechCrunch reports that Nvidia released a new open transcription model. Hugging Face lists a related NVIDIA Nemotron 3.5 Transcribe post from the same period.",
    dateFromUrl: true,
    matters:
      "Open transcription models may lower the cost of speech-to-text for developers. Accuracy depends on your audio, so test on your own recordings.",
  },
  {
    slug: "genie-4-world-model",
    kind: "Research",
    title: "Google's Genie 4 world model adds audio, more realistic worlds and real-time steering",
    date: "2026-10-27",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/27/googles-genie-4-world-model-adds-audio-more-realistic-worlds-and-real-time-steering/",
    tag: "Research",
    summary: "TechCrunch reports that Google's Genie 4 world model adds audio, more realistic worlds and real-time steering.",
    dateFromUrl: true,
    matters:
      "This is a research model, not a product you can buy today. It shows a direction rather than a tool to adopt.",
  },
];

export const NEWS_CHECKED = "2026-10-29";

export const NEWS_KINDS: NewsKind[] = ["New product", "Feature update", "Model release", "Research", "Policy update", "Company announcement", "Open standard"];

export function getNews(slug: string): NewsItem | undefined {
  return NEWS.find((n) => n.slug === slug);
}

export function newsForTool(id: string): NewsItem[] {
  return NEWS.filter((n) => n.tools?.includes(id)).sort((a, b) => b.date.localeCompare(a.date));
}

export function monthOf(n: NewsItem): string {
  return n.date.slice(0, 7);
}

export const NEWS_TAGS: NewsTag[] = ["Products", "Models", "Research", "Policy & safety", "Company news", "Open standards"];
