// Editorial overviews. These are written from each product's own public documentation and general,
// well-known behaviour. We have NOT run lab tests or long-term trials, and the pages say so.
// Prices are never typed here: they come from lib/prices.ts so there is one verified source.
export type Review = {
  slug: string;
  toolId: string;
  title: string;
  summary: string;
  useCases: string[];
  pros: string[];
  cons: string[];
  bestFor: string;
  skipIf: string;
  pricingNote: string;
  verdict: string;
};

export const REVIEWS: Review[] = [
  {
    slug: "chatgpt",
    toolId: "chatgpt",
    title: "ChatGPT overview: a flexible assistant, if you check its work",
    summary:
      "ChatGPT is a chat-based AI assistant. You describe what you need and it drafts, rewrites, summarises or explains. It is most useful when you already know what good looks like and treat its answer as a draft.",
    useCases: [
      "Turning notes into a first draft of a proposal or email",
      "Outlining an article, a project plan or a study guide",
      "Explaining a hard concept in simpler words",
      "Brainstorming names, angles and ideas",
    ],
    pros: [
      "Handles many different writing and thinking tasks in one place",
      "Widely used, so tutorials and examples are easy to find",
      "Fast for first drafts and outlines",
    ],
    cons: [
      "Can state wrong facts confidently, so important details need checking",
      "Output can sound generic until you edit it into your own voice",
      "You should not paste confidential client information without permission",
    ],
    bestFor: "Freelancers, students and small business owners who need quick drafts and ideas.",
    skipIf: "You need guaranteed-accurate facts with no checking, or you are not allowed to use AI for the work.",
    pricingNote: "ChatGPT's official pricing page blocked automated access when we checked, so we do not publish its plan prices. Read the official plans page before you decide.",
    verdict:
      "A strong first-draft and brainstorming partner. Check the current plans on the official site, always review what it writes, and only pay if you hit limits on paid work.",
  },
  {
    slug: "grammarly",
    toolId: "grammarly",
    title: "Grammarly overview: a safety net for your writing",
    summary:
      "Grammarly checks spelling, grammar and tone as you type, in the browser and in many apps. It does not create content from scratch; it helps you fix what you have written.",
    useCases: [
      "Proofreading proposals and client messages before sending",
      "Cleaning up essays and reports",
      "Making a message sound friendlier or more formal",
    ],
    pros: [
      "Works where you already write, so it fits into your normal routine",
      "Catches typos and grammar slips quickly",
      "A free plan is available",
    ],
    cons: [
      "Suggestions are not always right for your style, so you decide what stays",
      "It does not check whether your facts are correct",
      "Advanced features need a paid plan",
    ],
    bestFor: "Anyone who writes in English for clients, school or work and wants fewer mistakes.",
    skipIf: "You rarely write, or you already have a trusted human editor for everything.",
    pricingNote: "A free plan is documented on Grammarly's plans page. Pro is shown at $12 USD, but the page we read did not label the billing period, so confirm whether that is monthly or annual.",
    verdict:
      "Worth installing the free version if you send written messages to clients or teachers. Upgrade only if you use the advanced suggestions often.",
  },
  {
    slug: "notion",
    toolId: "notion",
    title: "Notion overview: one workspace for notes, tasks and clients",
    summary:
      "Notion combines notes, documents and simple databases. Freelancers often use it as a lightweight client tracker, proposal library and to-do list.",
    useCases: [
      "A client and project tracker with deadlines",
      "A library of reusable proposal and email templates",
      "Class notes and assignment planning",
    ],
    pros: [
      "Very flexible: one tool can replace several small ones",
      "Many ready-made templates to start from",
      "A free plan is available for personal use",
    ],
    cons: [
      "Easy to over-build; a complicated setup wastes time",
      "Takes a little while to learn",
      "Some features sit behind paid plans",
    ],
    bestFor: "Freelancers and students who want everything organised in one place.",
    skipIf: "A simple notes app or a paper list already works for you.",
    pricingNote: "A free plan is documented. Plus is $10 per member per month billed monthly on the official pricing page; the yearly price was not captured.",
    verdict:
      "Start with one page and one table. If you keep using it for a month, it is worth growing; if not, you have lost nothing.",
  },
  {
    slug: "canva",
    toolId: "canva",
    title: "Canva overview: quick, clean design without design skills",
    summary:
      "Canva is a template-based design tool for social posts, presentations, resumes and simple logos. It is built for people who are not designers.",
    useCases: [
      "Social media posts and simple flyers",
      "A portfolio PDF or proposal layout",
      "Presentation slides",
    ],
    pros: [
      "Templates make decent results fast",
      "Easy to learn",
    ],
    cons: [
      "Popular templates look familiar, so change colours and text to stand out",
      "We could not verify Canva's current plans automatically, so check its pricing page for free-plan limits",
      "Not a replacement for professional design software",
    ],
    bestFor: "Beginners, freelancers and small businesses that need clean visuals quickly.",
    skipIf: "You need precise, custom brand design or advanced illustration.",
    pricingNote:
      "Canva's official pricing page blocked automated access when we checked, so we do not publish its prices. See Canva's own plans page.",
    verdict:
      "Use the free plan for two weeks and note what blocks you. Pay only when a specific paid feature clearly saves time.",
  },
  {
    slug: "hostinger",
    toolId: "hostinger",
    title: "Hostinger overview: a beginner-friendly place to host a first site",
    summary:
      "Hostinger sells web hosting and a website builder aimed at first-time site owners. It is one of several hosts a beginner might compare.",
    useCases: [
      "A portfolio or small business website on your own domain",
      "A blog you want to run yourself",
    ],
    pros: [
      "Aimed at beginners, with guided setup",
      "Covers hosting and a website builder in one place",
    ],
    cons: [
      "Introductory prices may differ from renewal prices, so check both before buying",
      "No free plan, so you commit money early",
      "A free alternative (such as GitHub Pages) may be enough for a simple portfolio",
    ],
    bestFor: "Someone ready to pay for a first website on their own domain.",
    skipIf: "A free static site already meets your needs.",
    pricingNote:
      "Hostinger's hosting plans are paid upfront for a multi-year term and renew at higher prices (for example, Premium is $2.49 per month on a 48-month term and renews at $10.99 per month). Check the official plans page before buying.",
    verdict:
      "Worth comparing if you want your own domain and a managed setup. Read the renewal price and the terms before you pay.",
  },
];

export function getReview(slug: string): Review | undefined {
  return REVIEWS.find((r) => r.slug === slug);
}
