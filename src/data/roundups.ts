// Best-tool roundups. Each pick says what the tool suits, using only facts recorded in content/tools/*.json
// (read from the vendor's own pages on the date shown there). Picks are grouped by fit, not ranked, and tools whose
// pricing we could not verify are named as such instead of being praised.
export type Pick = { id: string; badge: string; why: string };

export type Roundup = {
  slug: string;
  title: string;
  category: string;
  description: string;
  intro: string[];
  criteria: string[];
  picks: Pick[];
  note?: string;
};

export const ROUNDUPS: Roundup[] = [
  {
    slug: "best-ai-assistants",
    title: "Best AI assistants and answer engines",
    category: "assistants",
    description: "Compare AI assistants by free access, individual and team plan prices, usage limits and API pricing, using the vendors' own pricing pages.",
    intro: [
      "General-purpose assistants overlap a lot, so the useful differences are mostly about what the free plan includes, how usage is limited, which ecosystem you already work in, and what the paid tiers cost.",
      "Below, each pick is matched to a situation. We list prices exactly as the vendor publishes them, in the vendor's currency, and say when a price could not be read.",
    ],
    criteria: ["A documented free plan and what it includes", "Published individual plan prices and billing options", "Team or business seats and API pricing, where documented", "How clearly usage limits are explained"],
    picks: [
      { id: "claude", badge: "Clearest plan ladder", why: "The free plan is documented (web search, file creation, memory, up to 5 projects), Pro is $20 per month or $17 per month billed annually, Max starts at $100, and Team seats are priced separately. The page explains that limits reset on a rolling five-hour window but gives no fixed message count." },
      { id: "mistral", badge: "Lowest standalone subscription we verified", why: "Le Chat Pro is $14.99 per month (excluding taxes) and includes $15 per month of API credits. A free plan exists and the FAQ mentions a student price of $5.99 per month. The API is priced separately per token." },
      { id: "copilot", badge: "Best if you live in Microsoft 365", why: "Individual access comes through Microsoft 365 plans: Personal is $9.99 per month or $99.99 per year and includes Copilot in desktop Word, Excel, PowerPoint and Outlook. Family AI features are for the subscription owner only." },
      { id: "gemini", badge: "Best bundled with Google services", why: "Google AI plans bundle Gemini with storage and other Google features. Consumer prices on the page we read were localised to a local currency rather than USD, so check the price in your own country; Gemini Enterprise seats are $21 or $30 per month." },
      { id: "perplexity", badge: "Best when you want cited answers", why: "Perplexity is built around answers with sources you can open, and Pro adds extended search and research. We could not read its prices from the official pages, so check the current plans before deciding." },
      { id: "chatgpt", badge: "Most widely known", why: "ChatGPT is the most widely used assistant, but its official pricing page blocked automated access when we checked, so we do not publish plan prices for it. Read its official plans page yourself." },
    ],
    note: "Not exhaustive and not ranked. Assistants change quickly, so confirm plans on the official pages linked from each tool page.",
  },
  {
    slug: "best-ai-coding-tools",
    title: "Best AI coding assistants and app builders",
    category: "coding",
    description: "Compare AI coding assistants and app builders by free tier, monthly price, usage credits and team plans, using official pricing pages.",
    intro: [
      "Coding tools fall into two groups: assistants that live in your editor, and builders that generate a whole app from a prompt. Pricing is usually credit- or token-based, which makes the headline monthly price only part of the story.",
    ],
    criteria: ["Free tier and its daily or monthly limits", "Headline monthly price and what credits it includes", "How extra usage is billed", "Team and enterprise availability"],
    picks: [
      { id: "github-copilot", badge: "Lowest-priced paid plan we verified", why: "Free includes 2,000 inline suggestions per month; Pro is $10 per month with unlimited inline suggestions, code review and $15 of total AI credits. Extra usage is bought as credits (1 credit = $0.01). Business and Enterprise prices are not shown on the page." },
      { id: "cursor", badge: "Editor with agents", why: "The pricing page lists Free, Plus ($8), Premium ($30), Super ($100) and Ultra ($200) monthly plans plus Teams. Third-party model usage is billed separately at API list price. The page also mentions Grok products, so read it carefully before paying." },
      { id: "v0", badge: "Interfaces from prompts, with a published API", why: "Free is limited to 7 messages per day; Plus is $30 per user per month including $30 of monthly credits. Per-token API rates for v0 models are published on the page." },
      { id: "bolt", badge: "Clear token allowances", why: "Free gives 1M tokens per month (300K per day) and a 10 MB upload limit; Pro is $25 per month with 10M tokens that roll over. The yearly price was not captured." },
      { id: "replit", badge: "Build and deploy in one place", why: "Core is $20 per month or $18 per month billed annually, and Pro is $100 or $90. The page did not show a separate free plan and several Pro figures were unlabeled, so verify before buying." },
      { id: "lovable", badge: "Credit-based app builder", why: "Free includes 5 build credits per day (up to 30 per month). Paid plan prices were not captured from the page we read." },
    ],
  },
  {
    slug: "best-ai-video-generators",
    title: "Best AI video generation and avatar tools",
    category: "video",
    description: "Compare AI video generators and avatar tools by free credits, plan prices, credit allowances, watermarks and commercial-use terms.",
    intro: [
      "Video tools charge in credits, so two plans at similar prices can produce very different amounts of video. Watermarks, resolution caps and commercial-use terms matter as much as the monthly price.",
    ],
    criteria: ["Free credits or free videos, and watermarks", "Credits per month on the first paid plan", "Monthly versus annual price", "Commercial-use and resolution limits"],
    picks: [
      { id: "runway", badge: "Clear credit tiers", why: "Free gives 125 one-time credits; Standard is $15 per month ($12 billed annually) with 625 credits, no watermarks and 4K upscaling. Credits do not roll over on Standard and Pro." },
      { id: "luma", badge: "Commercial use stated", why: "Plus is $30 per month ($25 billed annually) with 10,000 credits and commercial use. A free plan was not stated on the page we read." },
      { id: "pika", badge: "Lowest paid entry we verified", why: "Starter is $10 per month ($8 billed annually) with 900 credits and a commercial licence. The free plan has no monthly credits (packs only) and no commercial licence." },
      { id: "heygen", badge: "Avatar videos", why: "Free allows 3 videos per month with a watermark, up to 1 minute each; Creator is $29 per month ($24 billed annually) with 600 credits and up to 30 minutes per video." },
      { id: "synthesia", badge: "Presenter videos and dubbing", why: "Basic is free with 500 credits and about 10 minutes of Studio video; Starter is $19 per month monthly or $14 per month billed yearly ($168)." },
      { id: "descript", badge: "Editing by text", why: "A free plan includes 60 minutes of media per month. Paid prices are shown as two figures per plan without saying which is annual, so confirm before buying." },
    ],
  },
  {
    slug: "best-ai-image-and-design-tools",
    title: "Best AI image generation and design tools",
    category: "image",
    description: "Compare AI image and design tools by credits, free access and plan prices, with unverified pricing clearly labelled.",
    intro: [
      "Several of the best-known image generators block automated access to their pricing pages. Rather than guess, we show verified details where we have them and say plainly where we do not.",
    ],
    criteria: ["Credits or generations per plan", "Free access", "Team licensing", "Whether we could verify the price"],
    picks: [
      { id: "firefly", badge: "Credit-based and fully priced", why: "Individual plans are Standard $9.99 (2,000 credits), Pro $19.99 (4,000), Pro Plus $49.99 (10,000) and Premium $199.99 (50,000) per month. Free daily generations are described but their amounts are not stated." },
      { id: "figma", badge: "Interface design with AI credits", why: "Starter is free with 150 AI credits per day (up to 500 per month). Professional Full seats are $16 per month, but the page does not label the billing cycle." },
      { id: "canva", badge: "Template design (price not verified)", why: "Canva is a template-based design tool for non-designers. Its pricing page blocked automated access, so check the current plans on Canva's site." },
      { id: "midjourney", badge: "Image generator (price not verified)", why: "Midjourney generates images from text prompts. Its plan comparison page blocked automated access, so we do not publish prices." },
    ],
    note: "Leonardo.Ai and Ideogram are also listed in the directory; their pricing pages blocked automated access, so we have not verified their prices.",
  },
  {
    slug: "best-ai-voice-music-and-transcription-tools",
    title: "Best AI voice, music and transcription tools",
    category: "audio",
    description: "Compare AI voice, music and transcription tools by free allowances, credits, minutes and commercial-use terms from official pricing pages.",
    intro: ["Audio tools meter usage in credits or minutes, and commercial rights often depend on the plan, so read the terms alongside the price."],
    criteria: ["Free allowance", "Credits or minutes per plan", "Commercial-use rights", "Annual versus monthly pricing"],
    picks: [
      { id: "elevenlabs", badge: "Voice and speech platform", why: "Free includes 10,000 credits per month; Pro is $99 per month ($82.50 billed annually) with 600,000 credits. Starter and Creator show introductory offers, so their regular monthly prices were not captured." },
      { id: "suno", badge: "Music generation", why: "Free songs have no commercial rights; Pro and Premier include commercial use rights (see the terms of service for limits). Pro is shown at $8 and Premier at $24, with yearly billing saving $24 and $72." },
      { id: "otter", badge: "Meeting transcription", why: "Basic is free with 300 minutes per month; Pro is $16.99 per user per month ($8.33 billed annually) with 1,200 meeting minutes. A 20% student discount applies to Pro." },
    ],
  },
  {
    slug: "best-ai-automation-and-agent-platforms",
    title: "Best AI automation and agent platforms",
    category: "automation",
    description: "Compare workflow automation and AI infrastructure platforms by free tier, task limits, plan prices and self-hosting options.",
    intro: ["Automation platforms bill by tasks, executions or credits. The right choice depends on your volume, whether you want to self-host, and where your data may be stored."],
    criteria: ["Free tier or trial", "Included tasks, executions or credits", "Self-hosting option", "Data location and currency of billing"],
    picks: [
      { id: "zapier", badge: "Easiest to start", why: "Free includes 100 tasks per month and new accounts get a 14-day Professional trial. Professional starts at $29.99 per month ($19.99 billed annually) for 750 tasks. AI agents and chatbots are priced as add-ons." },
      { id: "n8n", badge: "Self-hosting available", why: "Hosted plans start at €20 per month billed annually for 2.5K executions, with data stored in Frankfurt. A self-hosted Community Edition is available on GitHub; Business is self-hosted only." },
      { id: "make", badge: "Visual builder (prices not captured)", why: "A free plan includes 1,000 credits per month. The page did not show paid prices when we read it." },
      { id: "huggingface", badge: "Open models and compute", why: "A PRO account is $9 per month; Team is $20 and Enterprise $50 per user per month. Spaces and Inference Endpoints are billed hourly (for example, Endpoints from $0.033 per hour)." },
    ],
  },
];

export function getRoundup(slug: string): Roundup | undefined {
  return ROUNDUPS.find((r) => r.slug === slug);
}
