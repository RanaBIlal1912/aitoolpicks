import { ARTICLES } from "./articles";
import type { TopicId } from "./topics";
import { pickPhoto, type PhotoId } from "./photos";

// Photographs that suit each topic, used when an article has no photo of its own below.
export const POOL: Record<TopicId, PhotoId[]> = {
  freelancing: ["freelance-cafe", "freelance-paper", "card-keyboard", "whiteboard", "notebook-pen", "laptop-desk", "marketing-strategy"],
  writing: ["notebook-pen", "red-pen-book", "laptop-desk"],
  design: ["colour-swatches", "stylus-wireframe", "architecture-ribs", "camera-lens"],
  business: ["shop-tablet", "whiteboard", "office-glass", "calculator-desk", "analytics-laptop"],
  websites: ["stylus-wireframe", "code-screen", "cable-network", "laptop-desk"],
  students: ["library-study", "notebook-pen", "data-presentation"],
  developers: ["code-screen", "circuit-macro", "processor-tweezers", "circuit-blue"],
  productivity: ["meeting-table", "microphone", "office-glass", "notebook-pen", "headphones-keys"],
  imagevideo: ["video-timeline", "camera-lens", "light-dark-room", "colour-swatches"],
  beginners: ["calculator-desk", "notebook-pen", "library-study", "processor-tweezers", "city-night"],
  research: ["research-books", "microscope-lab", "silicon-wafer", "library-study"],
  automation: ["robot-arm", "fibre-switch", "cable-network"],
  marketing: ["marketing-strategy", "analytics-laptop", "data-presentation", "city-night"],
  security: ["padlock-laptop", "cable-network", "server-aisle"],
  comparisons: ["support-headsets", "analytics-laptop", "red-pen-book", "stylus-wireframe", "circuit-blue"],
};

// Articles whose subject has a photograph that fits it exactly. Everything else takes the least-used photo from its topic pool.
const FIXED: Record<string, PhotoId> = {
  "ai-meeting-notetakers-compared": "meeting-table",
  "ai-dictation-and-transcription-tools": "microphone",
  "ai-video-tools-compared": "video-timeline",
  "ai-image-generators-compared": "camera-lens",
  "how-to-read-ai-pricing-pages": "calculator-desk",
  "how-to-choose-an-ai-tool": "library-study",
  "ai-research-tools-compared": "research-books",
  "best-ai-tools-for-students": "library-study",
  "ai-automation-tools-compared": "robot-arm",
  "ai-privacy-and-security-checklist": "padlock-laptop",
  "ai-customer-support-tools-compared": "support-headsets",
  "ai-data-analysis-tools-compared": "analytics-laptop",
  "best-ai-tools-for-small-business": "shop-tablet",
  "ai-seo-and-writing-tools-for-marketing": "marketing-strategy",
  "chatgpt-vs-grammarly": "red-pen-book",
  "canva-free-vs-pro": "colour-swatches",
  "best-ai-writing-tools": "notebook-pen",
  "ai-coding-assistants-compared": "code-screen",
  "open-weight-vs-api-models": "circuit-blue",
  "open-source-ai-tools-explained": "processor-tweezers",
  "build-a-free-portfolio-website": "stylus-wireframe",
  "best-hosting-for-beginners": "cable-network",
  "how-to-start-freelancing": "freelance-cafe",
  "how-to-get-paid-as-a-freelancer": "card-keyboard",
  "how-to-get-paid-as-a-freelancer-in-pakistan": "card-keyboard",
  "how-to-write-a-freelance-proposal": "freelance-paper",
  "chatgpt-prompts-for-freelancers": "notebook-pen",
  "how-to-get-your-first-freelance-client": "whiteboard",
  "free-tools-for-freelancers": "laptop-desk",
  "how-to-start-freelancing-from-pakistan": "freelance-cafe",
};

const assigned: Record<string, PhotoId> = {};
(() => {
  const used: Partial<Record<PhotoId, number>> = {};
  for (const a of ARTICLES) {
    const id = FIXED[a.slug];
    if (id) {
      assigned[a.slug] = id;
      used[id] = (used[id] ?? 0) + 1;
    }
  }
  for (const a of ARTICLES) {
    if (assigned[a.slug]) continue;
    const pool = POOL[a.topic];
    const least = Math.min(...pool.map((p) => used[p] ?? 0));
    const id = pickPhoto(pool.filter((p) => (used[p] ?? 0) === least), a.slug);
    assigned[a.slug] = id;
    used[id] = (used[id] ?? 0) + 1;
  }
})();

/** The cover photograph for an article: the same one on every page, and no photograph is reused more than the pools force. */
export function coverPhoto(slug: string, topic: TopicId): PhotoId {
  return assigned[slug] ?? pickPhoto(POOL[topic], slug || topic);
}
export const COVER_ASSIGNMENTS = assigned;
