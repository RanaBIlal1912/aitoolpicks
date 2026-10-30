// Blog topics and their cover renders. Kept apart from articles.ts so client components can import it
// without pulling in the file-reading code that builds the article list.
import type { CoverId } from "./covers";

export type TopicId = "freelancing" | "writing" | "design" | "business" | "websites" | "students" | "developers" | "productivity" | "imagevideo" | "beginners" | "research" | "automation" | "marketing" | "security" | "comparisons";

export const TOPICS: { id: TopicId; label: string; blurb: string }[] = [
  { id: "freelancing", label: "Freelancing", blurb: "Find clients, write proposals and get paid." },
  { id: "writing", label: "AI writing", blurb: "Assistants, proofreading and prompts." },
  { id: "design", label: "Design", blurb: "Clean visuals without design skills." },
  { id: "business", label: "Small business", blurb: "A small stack that does the work." },
  { id: "websites", label: "Websites & hosting", blurb: "Portfolios, domains and first sites." },
  { id: "students", label: "AI for education", blurb: "Study help and honest AI use." },
  { id: "developers", label: "AI for developers", blurb: "Coding tools, models and inference." },
  { id: "productivity", label: "AI productivity", blurb: "Meetings, dictation and notes." },
  { id: "imagevideo", label: "Image and video", blurb: "Generators and avatar tools compared." },
  { id: "beginners", label: "Beginner guides", blurb: "How to choose and how to read pricing." },
  { id: "research", label: "AI research", blurb: "Finding and checking sources." },
  { id: "automation", label: "AI automation", blurb: "Workflows that connect your apps." },
  { id: "marketing", label: "AI marketing", blurb: "Copy, SEO and AI search visibility." },
  { id: "security", label: "AI security and privacy", blurb: "What to check before sharing data." },
  { id: "comparisons", label: "Comparisons", blurb: "Side-by-side looks at tools." },
];

export const COVER_BY_TOPIC: Record<TopicId, CoverId> = {
  freelancing: "board",
  writing: "neural",
  design: "lens",
  business: "rack",
  websites: "wafer",
  students: "fibre",
  developers: "board",
  productivity: "signal",
  imagevideo: "lens",
  beginners: "neural",
  research: "lens",
  automation: "rack",
  marketing: "signal",
  security: "wafer",
  comparisons: "fibre",
};
