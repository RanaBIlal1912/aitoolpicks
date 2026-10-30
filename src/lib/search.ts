// Local search over the catalog. No server and no AI service: it splits the query into words, expands a small set of everyday words
// ("transcribe", "voiceover", "website") to the vocabulary the catalog uses, scores each tool by where the words match, and records WHY each tool
// matched so the page can show it. It matches words; it does not understand language. The shape (query in, ranked results with reasons out) is
// what a future semantic search would replace.
import type { Tool } from "@/data/catalog-types";
import { getDetail } from "@/data/detail";
import { CATEGORIES } from "@/data/tools";

export type Match = { tool: Tool; score: number; reasons: string[] };

const STOP = new Set(["i", "a", "an", "the", "to", "for", "of", "and", "or", "in", "on", "with", "my", "me", "want", "need", "would", "like", "that", "can", "do", "is", "it", "some", "ai", "tool", "tools", "using", "use", "best", "good", "help", "how", "make", "get", "create", "generate"]);

/** Everyday word -> words the catalog uses for the same idea. */
const SYNONYMS: Record<string, string[]> = {
  video: ["video", "avatar", "footage", "clip"],
  videos: ["video"],
  film: ["video"],
  voiceover: ["voice", "speech", "audio", "narration"],
  voiceovers: ["voice", "speech", "audio"],
  voice: ["voice", "speech", "audio"],
  narration: ["voice", "speech"],
  transcribe: ["transcription", "transcribe", "meeting", "speech", "dictation"],
  transcription: ["transcription", "meeting", "speech", "dictation"],
  dictate: ["dictation", "speech"],
  meetings: ["meeting"],
  code: ["coding", "code", "developer", "programming"],
  coding: ["coding", "code", "developer", "programming"],
  programming: ["coding", "code", "developer"],
  developer: ["developer", "coding", "api"],
  developers: ["developer", "coding", "api"],
  images: ["image", "design", "art"],
  image: ["image", "design", "art", "photo"],
  picture: ["image"],
  pictures: ["image"],
  photo: ["image", "photo"],
  photos: ["image", "photo"],
  art: ["image", "art"],
  logo: ["design", "image", "logo"],
  website: ["website", "site", "hosting", "domain", "builder", "app"],
  websites: ["website", "hosting", "domain", "builder"],
  site: ["website", "hosting", "builder"],
  app: ["app", "builder", "coding"],
  apps: ["app", "builder", "coding"],
  build: ["builder", "build", "coding"],
  research: ["research", "paper", "citation", "academic", "literature"],
  academic: ["academic", "paper", "research", "citation", "literature"],
  papers: ["paper", "research", "citation", "literature"],
  paper: ["paper", "research", "citation"],
  write: ["writing", "writer", "content", "grammar"],
  writing: ["writing", "content", "grammar", "proofreading"],
  grammar: ["grammar", "proofreading", "writing"],
  translate: ["translation", "translate", "language"],
  presentation: ["presentation", "slides", "deck"],
  slides: ["presentation", "slides"],
  automate: ["automation", "workflow", "automate"],
  automation: ["automation", "workflow"],
  workflow: ["workflow", "automation"],
  agent: ["agent", "agents", "autonomous"],
  agents: ["agent", "agents"],
  music: ["music", "song", "audio"],
  songs: ["music", "song"],
  seo: ["seo", "search", "marketing", "content"],
  support: ["support", "customer", "chat"],
  chatbot: ["chatbot", "assistant"],
  assistant: ["assistant"],
  hosting: ["hosting", "website", "domain"],
  domain: ["domain", "registrar", "website"],
  models: ["model", "inference", "api"],
  model: ["model", "inference", "api"],
  locally: ["local", "locally", "ollama"],
  opensource: ["open-source", "open", "weights"],
  free: ["free"],
};

const stem = (w: string) => w.replace(/(ing|ers|er|ed|es|s)$/, (m) => (w.length - m.length >= 4 ? "" : m));

export function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9+\-\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
}

function expand(word: string): string[] {
  const out = new Set<string>([word, stem(word)]);
  for (const s of SYNONYMS[word] ?? SYNONYMS[stem(word)] ?? []) out.add(s);
  return [...out].filter((w) => w.length > 1);
}

const has = (hay: string, needle: string) => hay.toLowerCase().includes(needle);

const catLabel = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
const subLabel = (t: Tool) => CATEGORIES.find((c) => c.slug === t.category)?.subs.find((s) => s.slug === t.subcategory)?.label ?? "";

/** Rank tools for a query. An empty query returns nothing; callers show the unfiltered list instead. */
export function searchTools(query: string, tools: Tool[]): Match[] {
  const words = tokens(query);
  if (!words.length) return [];
  const results: Match[] = [];
  for (const tool of tools) {
    const d = getDetail(tool.id);
    let score = 0;
    const reasons: string[] = [];
    const note = (r: string) => {
      if (reasons.length < 3 && !reasons.includes(r)) reasons.push(r);
    };
    let matchedWords = 0;
    for (const w of words) {
      let hit = false;
      for (const v of expand(w)) {
        // Only the word the visitor typed (or its stem) can match a name or company; synonyms match descriptions, categories and features.
        const direct = v === w || v === stem(w);
        if (direct && (has(tool.name, v) || tool.id === v)) {
          score += 12;
          note(`Name matches “${w}”`);
          hit = true;
        }
        if (direct && has(tool.vendor, v)) {
          score += 8;
          note(`Made by ${tool.vendor}`);
          hit = true;
        }
        const cats = tool.categories.map(catLabel).concat(subLabel(tool)).filter(Boolean);
        const catHit = cats.find((c) => has(c, v));
        if (catHit) {
          score += 6;
          note(`Category: ${catHit}`);
          hit = true;
        }
        if (has(tool.tagline, v) || has(tool.keyFeature, v)) {
          score += 5;
          note(`Described as: ${tool.tagline}`);
          hit = true;
        }
        const uc = d?.useCases.find((u) => has(u, v));
        if (uc) {
          score += 5;
          note(`Use case: ${uc}`);
          hit = true;
        }
        const ft = d?.features.find((f) => has(f, v));
        if (ft) {
          score += 4;
          note(`Feature: ${ft}`);
          hit = true;
        }
        if (has(tool.bestFor, v) || d?.audience.some((a) => has(a, v))) {
          score += 3;
          note(`Aimed at: ${tool.bestFor}`);
          hit = true;
        }
        if (has(tool.description, v)) {
          score += 2;
          hit = true;
        }
        if (v === "free" && tool.freePlan === true) {
          score += 4;
          note("Has a documented free plan");
          hit = true;
        }
        if ((v === "open-source" || v === "open") && tool.openSource && tool.openSource !== "proprietary") {
          score += 4;
          note(`Licence: ${tool.openSource}`);
          hit = true;
        }
      }
      if (hit) matchedWords++;
    }
    if (!score) continue;
    // Matching more of the words the visitor typed matters more than matching one word strongly.
    score += matchedWords * 6;
    if (matchedWords === words.length) score += 10;
    if (!reasons.length) reasons.push("Mentioned in its description");
    results.push({ tool, score, reasons });
  }
  return results.sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name));
}

export const TASK_SUGGESTIONS = [
  "Create professional videos",
  "Use an AI coding assistant",
  "Generate product images",
  "Transcribe meetings",
  "Research academic papers",
  "Build a website",
  "Create AI voiceovers",
  "Write and proofread",
  "Automate a workflow",
  "Run models locally",
];
