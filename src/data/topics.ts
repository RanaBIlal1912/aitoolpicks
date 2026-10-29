// Blog topics and their cover renders. Kept apart from articles.ts so client components can import it
// without pulling in the file-reading code that builds the article list.
import type { CoverId } from "./covers";

export type TopicId = "freelancing" | "writing" | "design" | "business" | "websites" | "students";

export const TOPICS: { id: TopicId; label: string; blurb: string }[] = [
  { id: "freelancing", label: "Freelancing", blurb: "Find clients, write proposals and get paid." },
  { id: "writing", label: "AI writing", blurb: "Assistants, proofreading and prompts." },
  { id: "design", label: "Design", blurb: "Clean visuals without design skills." },
  { id: "business", label: "Small business", blurb: "A small stack that does the work." },
  { id: "websites", label: "Websites & hosting", blurb: "Portfolios, domains and first sites." },
  { id: "students", label: "Students", blurb: "Study help and honest AI use." },
];

export const COVER_BY_TOPIC: Record<TopicId, CoverId> = {
  freelancing: "board",
  writing: "neural",
  design: "lens",
  business: "rack",
  websites: "wafer",
  students: "fibre",
};
