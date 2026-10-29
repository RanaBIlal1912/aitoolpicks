// AI news. Every item links to the original source and carries that source's own publication date.
// Summaries stay close to what the original post says. Add items by hand after reading the source;
// never add an item without a real date and a working link.
export type NewsTag = "Products" | "Models" | "Research" | "Policy & safety" | "Company news" | "Open standards";

export type NewsItem = {
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
  /** Optional plain-language note on why it may matter to freelancers and small businesses. */
  matters?: string;
};

export const NEWS: NewsItem[] = [
  {
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
    title: "Welcome Le Chonk: Mistral Large 4 on Hugging Face",
    date: "2026-10-29",
    source: "Hugging Face",
    url: "https://huggingface.co/blog/mistral-large4",
    tag: "Models",
    summary:
      "Hugging Face announced Mistral Large 4, a multimodal, multilingual Mixture-of-Experts model with about 1T total parameters, 49B active and a 1M-token context window, released under the Mistral Ecosystem Open-Weight License with day-0 support in transformers, vLLM and llama.cpp. It is positioned for cybersecurity, coding agents and multimodal tasks.",
  },
  {
    title: "Announcing Project ProtoStar: making publicly funded science AI-ready",
    date: "2026-10-29",
    source: "Hugging Face",
    url: "https://huggingface.co/blog/announcing-project-protostar",
    tag: "Research",
    summary:
      "Hugging Face announced Project ProtoStar, an initiative with universities, research organisations and industry to release publicly funded scientific datasets, models and code in formats AI systems can use. The first challenge, hosted by Carnegie Mellon University and opening on 2 November, asks teams to forecast four urban climate indicators for 210 U.S. cities.",
  },
  {
    title: "AI for Science expands to foundations and research institutions",
    date: "2026-10-28",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/ai-for-science-expands-foundations-research-institutions",
    tag: "Research",
    summary: "Anthropic announced an expansion of its AI for Science programme to foundations and research institutions.",
  },
  {
    title: "Early progress on accelerating drug development with Claude",
    date: "2026-10-27",
    source: "Anthropic",
    url: "https://www.anthropic.com/research/early-progress-drug-development",
    tag: "Research",
    summary: "Anthropic published a research update on early progress using Claude to help accelerate drug development.",
  },
  {
    title: "Expanding our partnership with GSA to bring Claude to all levels of government",
    date: "2026-10-27",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/expanding-partnership-gsa",
    tag: "Company news",
    summary: "Anthropic announced an expanded partnership with GSA to bring Claude to all levels of government.",
  },
  {
    title: "Anthropic files S-1 with the SEC for proposed initial public offering",
    date: "2026-10-26",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/s1-sec",
    tag: "Company news",
    summary:
      "Anthropic says it filed a registration statement on Form S-1 with the U.S. SEC for a proposed IPO of its Class A common stock, with plans to list on the Nasdaq Global Select Market. The share count and price range have not been set.",
  },
  {
    title: "Donating Agent Skills to the Agentic AI Foundation",
    date: "2026-10-22",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation",
    tag: "Open standards",
    summary:
      "Anthropic is donating Agent Skills, an open standard that gives AI agents specialised knowledge and workflows, to the Agentic AI Foundation under the Linux Foundation. It says more than 70 agent platforms have already integrated it.",
  },
  {
    title: "Anthropic opens Singapore office and signs MOU with the Government of Singapore",
    date: "2026-10-14",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/singapore-office-opening",
    tag: "Company news",
    summary:
      "Anthropic opened a new Singapore office, its fifth in the Asia-Pacific region, and signed a Memorandum of Understanding with Singapore's Ministry of Digital Development and Information covering AI safety, security and model evaluation, research on AI adoption, and responsible AI use.",
  },
  {
    title: "2026 Usage Policy update",
    date: "2026-10-08",
    source: "Anthropic",
    url: "https://www.anthropic.com/news/2026-usage-policy-update",
    tag: "Policy & safety",
    summary:
      "Anthropic published a 2026 update to its Usage Policy, effective 12 November, that clarifies existing rules and adds examples for newer capabilities. Changes include a section on deceptive campaigns, narrower election and surveillance rules, weapons restrictions covering software and components, human-oversight requirements for high-risk uses, and a ban on sustained, needless abuse of its models.",
    matters: "If you use AI tools for client work, it is worth reading the usage policy of each tool you rely on.",
  },
  {
    title: "Granola crunches up a dictation feature to compete with Wispr",
    date: "2026-10-29",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/29/granola-crunches-up-a-dictation-feature-to-compete-with-wispr/",
    tag: "Products",
    summary: "TechCrunch reports that Granola has added a dictation feature to compete with Wispr.",
    dateFromUrl: true,
  },
  {
    title: "Mistral releases weights for its trillion-parameter AI model, targeting cybersecurity",
    date: "2026-10-29",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/29/mistral-releases-weights-for-its-trillion-parameter-ai-model-targeting-cybersecurity/",
    tag: "Models",
    summary: "TechCrunch reports that Mistral AI released the weights of its trillion-parameter model, which it positions for cybersecurity. Hugging Face published its own announcement the same day.",
    tools: ["mistral", "huggingface"],
    dateFromUrl: true,
  },
  {
    title: "Anthropic just launched tools to show companies what their AI spending is buying",
    date: "2026-10-28",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/28/anthropic-just-launched-tools-to-show-companies-what-their-ai-spending-is-buying/",
    tag: "Products",
    summary: "TechCrunch reports that Anthropic launched tools meant to show companies what their AI spending is buying.",
    tools: ["claude"],
    dateFromUrl: true,
  },
  {
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
    title: "As AI agents reshape the web, Google opens Gemini and Search to more apps",
    date: "2026-10-28",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/28/as-ai-agents-reshape-the-web-google-opens-gemini-and-search-to-more-apps/",
    tag: "Products",
    summary: "TechCrunch reports that Google is opening Gemini and Search to more apps as AI agents change how people use the web.",
    tools: ["gemini"],
    dateFromUrl: true,
  },
  {
    title: "Voice AI in vogue: Nvidia releases new open transcription model",
    date: "2026-10-28",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/28/voice-ai-in-vogue-nvidia-releases-new-open-transcription-model/",
    tag: "Models",
    summary: "TechCrunch reports that Nvidia released a new open transcription model. Hugging Face lists a related NVIDIA Nemotron 3.5 Transcribe post from the same period.",
    dateFromUrl: true,
  },
  {
    title: "Google's Genie 4 world model adds audio, more realistic worlds and real-time steering",
    date: "2026-10-27",
    source: "TechCrunch",
    url: "https://techcrunch.com/2026/10/27/googles-genie-4-world-model-adds-audio-more-realistic-worlds-and-real-time-steering/",
    tag: "Research",
    summary: "TechCrunch reports that Google's Genie 4 world model adds audio, more realistic worlds and real-time steering.",
    dateFromUrl: true,
  },
];

export const NEWS_CHECKED = "2026-10-29";

export const NEWS_TAGS: NewsTag[] = ["Products", "Models", "Research", "Policy & safety", "Company news", "Open standards"];
