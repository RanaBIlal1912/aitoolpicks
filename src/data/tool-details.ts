// Longer write-ups for each tool's own page. They describe what a tool is for and sensible cautions, in general
// terms that stay true as products change. No prices, ratings, benchmarks or feature claims we have not verified.
export type ToolDetail = { overview: string; goodFor: string[]; consider: string[] };

const VERIFY = "Plans, limits and features change, so confirm them on the official site before you pay.";

export const TOOL_DETAILS: Record<string, ToolDetail> = {
  chatgpt: {
    overview:
      "ChatGPT is OpenAI's chat assistant. You describe what you need in plain language and it replies in text. People use it as a thinking partner for drafts, outlines, explanations and ideas, then edit the result themselves.",
    goodFor: ["Turning rough notes into a first draft of an email or proposal", "Explaining an unfamiliar topic in simpler words", "Brainstorming names, angles and outlines"],
    consider: ["It can state wrong facts confidently, so check anything important", "Do not paste confidential client or personal information unless you are allowed to", VERIFY],
  },
  claude: {
    overview:
      "Claude is the AI assistant from Anthropic. You chat with it to write, summarise, analyse and work through problems, including longer documents you paste or upload.",
    goodFor: ["Summarising and questioning long documents", "Drafting and tightening written work", "Talking through a problem step by step"],
    consider: ["Like any assistant, it can be wrong, so verify facts and figures", "Keep private information out of chats unless you are allowed to share it", VERIFY],
  },
  gemini: {
    overview:
      "Gemini is Google's AI assistant, available in its own app and inside several Google products. It suits people who already do most of their work in Google's tools.",
    goodFor: ["Help inside the Google apps you already use", "Quick questions, drafts and summaries", "Working with files in the Gemini app, where supported"],
    consider: ["Check generated facts and links before relying on them", "Which features you get can depend on your account type and region", VERIFY],
  },
  copilot: {
    overview:
      "Microsoft Copilot is Microsoft's AI assistant. It is available as an app and built into some Microsoft products, so it fits people who work in Windows and Microsoft 365.",
    goodFor: ["Everyday questions and drafting in a Microsoft setup", "Help inside Microsoft apps, where included in your plan", "A free way to try an AI assistant"],
    consider: ["Features inside Microsoft 365 apps can depend on your licence", "Verify facts, especially numbers and quotes", VERIFY],
  },
  perplexity: {
    overview:
      "Perplexity is an AI answer engine. It searches the web and writes an answer with the sources it used, so you can open them and check.",
    goodFor: ["Quick research where you want to see the sources", "Getting oriented on an unfamiliar topic", "Finding pages to read in full"],
    consider: ["A summary can still misread a source, so open the links for anything important", "It is a starting point for research, not a replacement for reading", VERIFY],
  },
  grammarly: {
    overview:
      "Grammarly checks spelling, grammar and tone as you type in the browser and many apps. It helps you fix writing you have already written rather than creating content from scratch.",
    goodFor: ["Proofreading proposals, emails and essays", "Catching typos you stop seeing in your own text", "Adjusting tone before you send a message"],
    consider: ["Suggestions are not always right for your style, so you decide", "It does not check whether your facts are correct", VERIFY],
  },
  jasper: {
    overview:
      "Jasper is an AI writing platform aimed at marketing teams, with tools for producing copy and keeping a consistent brand voice.",
    goodFor: ["Teams that produce a lot of marketing copy", "Keeping tone consistent across campaigns", "Drafting variations of ads and posts to edit"],
    consider: ["It is built for teams, so a solo beginner may be better served by a general assistant first", "AI copy still needs a human edit for accuracy and originality", VERIFY],
  },
  notion: {
    overview:
      "Notion combines notes, documents and simple databases in one workspace. Freelancers often use it as a lightweight client tracker, template library and to-do list.",
    goodFor: ["A project and client tracker with deadlines", "Reusable proposal and email templates", "Class notes and assignment planning"],
    consider: ["It is easy to over-build a complicated setup, so start with one page", "It takes a little time to learn", VERIFY],
  },
  canva: {
    overview:
      "Canva is a template-based design tool for social posts, presentations, resumes and simple logos. It is made for people who are not designers.",
    goodFor: ["Social posts and simple flyers", "A portfolio PDF or proposal layout", "Presentation slides"],
    consider: ["Popular templates look familiar, so change colours and text to stand out", "Free-plan limits may push heavy users toward a paid plan", VERIFY],
  },
  figma: {
    overview:
      "Figma is a browser-based design tool used to design websites and app interfaces, and to share design work with a team in real time.",
    goodFor: ["Designing screens for websites and apps", "Working on a design with other people at once", "Sharing clickable prototypes for feedback"],
    consider: ["It is more technical than Canva, so allow time to learn it", "Beginners making simple graphics may not need it", VERIFY],
  },
  midjourney: {
    overview:
      "Midjourney generates images from text descriptions. People use it for concept art and visual ideas.",
    goodFor: ["Exploring visual ideas quickly", "Mood boards and concept art", "Inspiration before a real design or photo shoot"],
    consider: ["Check the current terms for commercial use before using images for clients", "Results vary with how you write the prompt", "How you access it and what plans exist can change, so check the official site"],
  },
  hostinger: {
    overview:
      "Hostinger sells web hosting and a website builder aimed at first-time site owners who want their own domain and a guided setup.",
    goodFor: ["A first website or portfolio on your own domain", "Beginners who prefer a guided setup", "A small business site on a budget"],
    consider: ["Introductory prices may differ from renewal prices, so read both", "A free option such as GitHub Pages may be enough for a simple portfolio", VERIFY],
  },
  namecheap: {
    overview:
      "Namecheap is a domain name registrar that also sells hosting and related services. Many people use it just to register and manage a domain.",
    goodFor: ["Registering a domain name for a site", "Managing domains in one dashboard", "Pairing a domain with a separate host"],
    consider: ["Check the renewal price and what privacy options are included before you buy", "A domain alone does not give you a website, you also need hosting", VERIFY],
  },
};
