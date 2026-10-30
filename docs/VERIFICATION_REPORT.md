# Tool verification report

Generated from `content/tools/*.json`. Method: each vendor's official site and pricing page were opened in the Claude desktop app's built-in browser and the page text was read. Nothing was purchased, no trial was started, no account was created and no sign-in prompt was accepted.

## Totals

| Measure | Count |
| --- | --- |
| Total tools checked | 69 |
| verified | 47 |
| partial | 22 |
| login-required | 0 |
| custom-pricing | 0 |
| unavailable | 0 |
| discontinued | 0 |
| Renamed by the vendor | 2 (notebooklm, mistral) |

## Needs manual review

These records are not fully verified. The note says what is missing.

- **Canva** (`canva`): Product active. The pricing page opened for a Pakistan visitor in rupees on the Yearly view: Free Rs 0, Pro Rs 9,200 per year for one person, Business Rs 16,000 per year per person; Enterprise is contact sales. Pro and Business show a free-trial button. The Monthly view was not read, and USD prices were not seen, so this stays partially verified.
- **ChatGPT** (`chatgpt`): Product active. The pricing page opened for a Pakistan visitor in rupees: Free PKR 0, Go PKR 1,400/month, Plus PKR 5,700/month, Pro from PKR 27,999/month (three usage tiers). Business and Enterprise sit on a separate tab that was not read. The USD figures kept here ($20 Plus; $100/$200/$500 Pro tiers) come from an earlier check and were not shown in this browser, so they stay partially verified.
- **Cursor** (`cursor`): Product active (AI coding agent). The page's structured data lists Plus $8, Premium $30, Super $100, Ultra $200 and Teams $30 in USD, matching the stored prices. The pricing page text now describes a usage pool shared across Cursor and Grok, Plus as Grok-models-only, and third-party models at API list price; it is unusual and the visible plan cards could not be read cleanly, so the allowance details are unconfirmed. Needs manual review.
- **Descript** (`descript`): Product active. The page opened on the Annual view ('Saving up to 35% with annual billing') and shows two figures per plan: Hobbyist $16 and $24, Creator $24 and $35, Business $50 and $65 per person/month. The Monthly view could not be toggled, so the page text does not label which figure is which; the lower figure is most likely the annual price. Plan allowances read: Hobbyist 10 media hours and 400 AI credits per month, Creator 30 hours and 800 credits, Business 40 hours and 1,500 credits.
- **Fathom** (`fathom`): Product active. The page shows Free $0; Premium $16; Team $15 and Business $25 per user/month (Team and Business need 2 users); Enterprise by sales. The pricing toggle (Monthly / Annually, save 25%+) could not be switched, so the page text does not say which billing period these figures belong to; an earlier check also saw $20, $19 and $34. Kept partial.
- **Figma** (`figma`): Product active; prices in USD. Starter free (150 AI credits a day, up to 500 a month). Professional full seat $16/mo (dev $12, collab $3) behind a Monthly/Annual toggle whose selected state is not labelled; Organization full seat $55/mo and Enterprise full seat $90/mo, both labelled billed annually. Per-month AI credits: Professional full seat 3,000, Organization 3,500, Enterprise 4,250.
- **Fireflies.ai** (`fireflies`): Product active. Page opened with a Monthly/Annual toggle (save up to 44%). Billed annually per seat/month: Pro $10, Business $19, Enterprise $39 (annual only). A second, higher figure sits beside Pro ($18) and Business ($29) and is most likely the monthly-billing price, but the Monthly view could not be toggled so it is not recorded as a price. Corrected: plan prices and Free limits were previously missing.
- **Gemini** (`gemini`): Product active. The page opened in Urdu for Pakistan and shows Free Rs 0, Google AI Plus Rs 1,400 per month, Google AI Pro Rs 5,600 per month (PKR), matching the stored figures; Pro includes 4x Free usage limits and Plus 2x. The Business and Developer tabs were not read, so the stored Gemini Enterprise USD prices are unconfirmed in this check. Pakistan prices only.
- **Gemini Notebook (formerly NotebookLM)** (`notebooklm`): Product active but renamed: notebooklm.google now redirects to notebook.google, titled 'Gemini Notebook', and the help page is 'Learn about Gemini Notebook's plans'. The Standard tier is free with a Gmail account; Plus, Pro and Ultra tiers come with Google AI plans (see Gemini for the Pakistan prices of Plus and Pro). Notebook and source limits per tier were not re-read.
- **Grammarly** (`grammarly`): Product active (the page now mentions availability through Superhuman Go). Free $0 with 100 AI prompts; Pro shows $12 USD with no billing-period label, a $0-today free trial (reminder 2 days before it ends) and 2,000 AI prompts; Enterprise by sales. Because the Pro billing period is unlabelled, it stays partial.
- **Groq** (`groq`): Product active (homepage: 'the premier neocloud for fast inference'). The stored pricing URL now redirects to the homepage, and console.groq.com/docs/pricing returns 404, so no price list could be read. No prices are recorded. Needs manual review: find the current pricing page from the signed-in console.
- **Hex** (`hex`): Product active (Hex 4.0 announced). Community free; Professional $36 and Team $75 per editor/month (Team: 14 days free); Enterprise custom. The page does not say whether prices are monthly or annual billing, so it stays partial.
- **Hostinger** (`hostinger`): Company active. The Websites tab shows a Black Friday offer: Premium is $2.49/month only on a 48-month plan (list $12.19; 'today you pay $119.52 for 48 months; renews at $10.99/month'). Corrected: $2.49 was stored as a plain monthly price, but it is a promotional 48-month price and the renewal rate is much higher. Other plans (Unlimited, Cloud Startup, Agency) were not visible in the part read, so their stored prices are unconfirmed.
- **Julius AI** (`julius`): Product active (now an AI workspace for analysis, research and creation). USD: Plus $20, Pro $45, Business $450 per month; the page has an Annual Billing (save 20%) / Monthly Billing toggle that could not be switched, so the billing period behind these figures is unconfirmed. Plus 2,000 credits a month, Pro 5,000, Business 60,000.
- **Leonardo.Ai** (`leonardo`): Product active. Solo plans in USD, ex. tax: Free $0 (150 fast tokens/day), Essential $12, Premium $30, Ultimate $60 per month; Team Starter $72/month ($24 per seat). Fast tokens per month: Essential 8,500, Premium 25,000, Ultimate 60,000. The Pay Yearly / Pay Monthly toggle (up to 20% off) still does not change the displayed figures, so the billing period is unconfirmed.
- **Make** (`make`): Product active (visual automation; credits are the billing unit). The pricing page FAQ confirms the Free plan has 1,000 credits per month, and that Core, Pro and Teams are paid plans (annual payment is cheaper than monthly; Enterprise accepts wire transfer). The plan cards and their prices are not present in the page text this browser could read, so no paid price is recorded. Needs manual review.
- **Namecheap** (`namecheap`): Company active. The domain price page showed promotional first-year prices that differ from the stored ones: .com $6.48/yr for new customers (instead of $14.98), .net $11.68 with a promo code (instead of $14.98), .org $8.48 (instead of $12.98); .ai register $89.98, renew $114.98, transfer $99.98 matches. Promotions change often; renewal prices were read only for .ai. Hosting and email products were not read.
- **OpenRouter** (`openrouter`): Product active. Free tier read: 25+ free models, 4 free providers, 5 workspaces, 50 requests a day, community support. The Standard (5.5%) and Business (8%) credit-purchase fees on the stored record are from an earlier check; the page's FAQ, which holds them, was not expanded.
- **QuillBot** (`quillbot`): Product active. Free $0; Premium $4.17 per month billed annually (USD); Team plan on a separate page with no price. The monthly-billing price is not stated.
- **Tidio** (`tidio`): Product active. Free plan (50 billable conversations, 7-day trial) confirmed. The paid cards sit behind a Monthly / Annually (2 months free) toggle: Starter shows $24.17 a month, which equals $29 less 2 months free, so it is an annual-equivalent figure rather than a monthly price. Corrected: the stored Starter $24.17 and Growth $49.17 were labelled monthly; they are now recorded as annual-equivalent and the monthly prices are marked not captured.
- **Together AI** (`together`): Product active. Serverless rates per 1M tokens are listed per model (for example Kimi K3 $3.00 input / $15.00 output; GLM-5.3-Flash $0.15 / $0.50; gpt-oss-120B $0.15 / $0.60). Dedicated, cluster and fine-tuning prices and any free credit were not re-read, so the record stays partial.
- **Wispr Flow** (`wisprflow`): Product active. The page has a Monthly / Annual (20% discount) toggle and shows Free $0 (2,000 words a week on desktop), Pro $12 per user/month, Growth $18 per user/month, Enterprise custom. The toggle could not be switched, so it is not confirmed that these are annual-billing figures; the stored monthly figure for Pro ($15) is from an earlier check.

## Every tool

| Tool | Status | Checked | Official site | Pricing source |
| --- | --- | --- | --- | --- |
| Adobe Firefly | verified | 2026-10-30 | https://www.adobe.com/products/firefly.html | https://www.adobe.com/products/firefly/plans.html |
| AssemblyAI | verified | 2026-10-30 | https://www.assemblyai.com/ | https://www.assemblyai.com/pricing |
| Bolt | verified | 2026-10-30 | https://bolt.new/ | https://bolt.new/pricing |
| Canva | partial | 2026-10-30 | https://www.canva.com/ | https://www.canva.com/pricing/ |
| ChatGPT | partial | 2026-10-30 | https://chatgpt.com/ | https://chatgpt.com/pricing/ |
| Claude | verified | 2026-10-30 | https://claude.ai/ | https://claude.com/pricing |
| Consensus | verified | 2026-10-30 | https://consensus.app/ | https://consensus.app/pricing/ |
| Cursor | partial | 2026-10-30 | https://cursor.com/ | https://cursor.com/pricing |
| Deepgram | verified | 2026-10-30 | https://deepgram.com/ | https://deepgram.com/pricing |
| DeepL | verified | 2026-10-30 | https://www.deepl.com/ | https://www.deepl.com/en/pro |
| Descript | partial | 2026-10-30 | https://www.descript.com/ | https://www.descript.com/pricing |
| Devin | verified | 2026-10-30 | https://devin.ai/ | https://devin.ai/pricing |
| ElevenLabs | verified | 2026-10-30 | https://elevenlabs.io/ | https://elevenlabs.io/pricing |
| Elicit | verified | 2026-10-30 | https://elicit.com/ | https://elicit.com/pricing |
| Fathom | partial | 2026-10-30 | https://fathom.ai/ | https://www.fathom.ai/pricing |
| Figma | partial | 2026-10-30 | https://www.figma.com/ | https://www.figma.com/pricing/ |
| Fireflies.ai | partial | 2026-10-30 | https://fireflies.ai/ | https://fireflies.ai/pricing |
| Fireworks AI | verified | 2026-10-30 | https://fireworks.ai/ | https://fireworks.ai/pricing |
| Gamma | verified | 2026-10-30 | https://gamma.app/ | https://gamma.app/pricing |
| Gemini | partial | 2026-10-30 | https://gemini.google.com/ | https://gemini.google/subscriptions/ |
| Gemini Notebook (formerly NotebookLM) | partial | 2026-10-30 | https://notebook.google/ | https://support.google.com/notebooklm/answer/16213268 |
| GitHub Copilot | verified | 2026-10-30 | https://github.com/features/copilot | https://github.com/features/copilot/plans |
| Grammarly | partial | 2026-10-30 | https://www.grammarly.com/ | https://www.grammarly.com/plans |
| Granola | verified | 2026-10-30 | https://www.granola.ai/ | https://www.granola.ai/pricing |
| Groq | partial | 2026-10-30 | https://groq.com/ | https://groq.com/pricing |
| Hex | partial | 2026-10-30 | https://hex.tech/ | https://hex.tech/pricing/ |
| HeyGen | verified | 2026-10-30 | https://www.heygen.com/ | https://www.heygen.com/pricing |
| Hostinger | partial | 2026-10-30 | https://www.hostinger.com/ | https://www.hostinger.com/pricing |
| Hugging Face | verified | 2026-10-30 | https://huggingface.co/ | https://huggingface.co/pricing |
| Ideogram | verified | 2026-10-30 | https://ideogram.ai/ | https://ideogram.ai/pricing/ |
| Intercom | verified | 2026-10-30 | https://www.intercom.com/ | https://www.intercom.com/pricing |
| Jasper | verified | 2026-10-30 | https://www.jasper.ai/ | https://www.jasper.ai/pricing |
| Julius AI | partial | 2026-10-30 | https://julius.ai/ | https://julius.ai/pricing |
| LangChain | verified | 2026-10-30 | https://github.com/langchain-ai/langchain | https://github.com/langchain-ai/langchain |
| LangGraph | verified | 2026-10-30 | https://github.com/langchain-ai/langgraph | https://github.com/langchain-ai/langgraph |
| LangSmith | verified | 2026-10-30 | https://www.langchain.com/langsmith | https://www.langchain.com/pricing |
| Leonardo.Ai | partial | 2026-10-30 | https://leonardo.ai/ | https://leonardo.ai/pricing |
| llama.cpp | verified | 2026-10-30 | https://github.com/ggml-org/llama.cpp | https://github.com/ggml-org/llama.cpp |
| Lovable | verified | 2026-10-30 | https://lovable.dev/ | https://lovable.dev/pricing |
| Luma | verified | 2026-10-30 | https://lumalabs.ai/ | https://lumalabs.ai/pricing |
| Make | partial | 2026-10-30 | https://www.make.com/ | https://www.make.com/en/pricing |
| Microsoft Copilot | verified | 2026-10-30 | https://copilot.microsoft.com/ | https://www.microsoft.com/en-us/copilot/solutions/individuals |
| Midjourney | verified | 2026-10-30 | https://www.midjourney.com/ | https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans |
| n8n | verified | 2026-10-30 | https://n8n.io/ | https://n8n.io/pricing/ |
| Namecheap | partial | 2026-10-30 | https://www.namecheap.com/ | https://www.namecheap.com/domains/ |
| Notion | verified | 2026-10-30 | https://www.notion.com/ | https://www.notion.com/pricing |
| Ollama | verified | 2026-10-30 | https://ollama.com/ | https://ollama.com/pricing |
| OpenRouter | partial | 2026-10-30 | https://openrouter.ai/ | https://openrouter.ai/pricing |
| Otter.ai | verified | 2026-10-30 | https://otter.ai/ | https://otter.ai/pricing |
| Perplexity | verified | 2026-10-30 | https://www.perplexity.ai/ | https://www.perplexity.ai/hub/pricing |
| Pika | verified | 2026-10-30 | https://pika.art/ | https://pika.art/pricing |
| QuillBot | partial | 2026-10-30 | https://quillbot.com/ | https://quillbot.com/premium |
| Replicate | verified | 2026-10-30 | https://replicate.com/ | https://replicate.com/pricing |
| Replit | verified | 2026-10-30 | https://replit.com/ | https://replit.com/pricing |
| Runway | verified | 2026-10-30 | https://runway.com/ | https://runway.com/pricing |
| Scite | verified | 2026-10-30 | https://scite.ai/ | https://scite.ai/pricing |
| Suno | verified | 2026-10-30 | https://suno.com/ | https://suno.com/pricing |
| Surfer | verified | 2026-10-30 | https://surfer.ai/ | https://surfer.ai/pricing/ |
| Synthesia | verified | 2026-10-30 | https://www.synthesia.io/ | https://www.synthesia.io/pricing |
| Tidio | partial | 2026-10-30 | https://www.tidio.com/ | https://www.tidio.com/pricing/ |
| Together AI | partial | 2026-10-30 | https://www.together.ai/ | https://www.together.ai/pricing |
| v0 | verified | 2026-10-30 | https://v0.app/ | https://v0.app/pricing |
| Vibe Chat (Mistral) | verified | 2026-10-30 | https://chat.mistral.ai/ | https://mistral.ai/pricing/ |
| vLLM | verified | 2026-10-30 | https://github.com/vllm-project/vllm | https://github.com/vllm-project/vllm |
| Whisper | verified | 2026-10-30 | https://github.com/openai/whisper | https://github.com/openai/whisper |
| Wispr Flow | partial | 2026-10-30 | https://wisprflow.ai/ | https://wisprflow.ai/pricing |
| Writesonic | verified | 2026-10-30 | https://writesonic.com/ | https://writesonic.com/pricing |
| Zapier | verified | 2026-10-30 | https://zapier.com/ | https://zapier.com/pricing |
| Zendesk | verified | 2026-10-30 | https://www.zendesk.com/ | https://www.zendesk.com/pricing/ |

## Notes per tool

### Adobe Firefly

Status: verified. Product active. Individuals tab, monthly billing, US$: Standard $9.99, Pro $19.99, Pro Plus $49.99, Premium $199.99; free trial shown on Standard, Pro and Pro Plus. Generative credits per month: 2,000 / 4,000 / 10,000 / 50,000. Free daily generations exist without a plan. Team plans were not re-read.

### AssemblyAI

Status: verified. Product active (speech-to-text, understanding and text-to-speech APIs). Pricing page lists pay-as-you-go per-hour rates and a custom tier. Corrected: the free tier is now described as up to 185 hours of pre-recorded and 333 hours of streaming transcription (the old '$50 credit' wording was not on the page). Streaming per-hour prices sit on a separate tab that was not re-read.

### Bolt

Status: verified. Product active (AI app and website builder). Free $0, Pro $25/month billed monthly, Teams $30/member/month billed monthly, Enterprise custom annual contract. A yearly toggle (save up to 28%) exists; yearly prices were not read. Pro now lists 10M tokens/month with rollover, 100 MB uploads, 1M web requests per month; the page says taxes are extra.

### Canva

Status: partial. Product active. The pricing page opened for a Pakistan visitor in rupees on the Yearly view: Free Rs 0, Pro Rs 9,200 per year for one person, Business Rs 16,000 per year per person; Enterprise is contact sales. Pro and Business show a free-trial button. The Monthly view was not read, and USD prices were not seen, so this stays partially verified.

### ChatGPT

Status: partial. Product active. The pricing page opened for a Pakistan visitor in rupees: Free PKR 0, Go PKR 1,400/month, Plus PKR 5,700/month, Pro from PKR 27,999/month (three usage tiers). Business and Enterprise sit on a separate tab that was not read. The USD figures kept here ($20 Plus; $100/$200/$500 Pro tiers) come from an earlier check and were not shown in this browser, so they stay partially verified.

### Claude

Status: verified. Product active. Individual tab: Free $0; Pro $17/month on annual billing ($200 billed up front) or $20 billed monthly; Max from $100/month (5x and 20x tiers), monthly billing only. Team & Enterprise tab: Standard seat $20 annual / $25 monthly; Premium seat $100 annual / $125 monthly; Enterprise US$20 per seat per month billed annually, 20 seat minimum, plus usage at API rates. Prices exclude tax.

### Consensus

Status: verified. Product active. Individual plans read on the Monthly and Annual views: Free $0; Pro $20/month or $144/year ($12/month equivalent); Deep $65/month or $540/year ($45/month equivalent). Team and Enterprise are on a separate tab and were not read. Previously stored as partial with no prices; corrected.

### Cursor

Status: partial. Product active (AI coding agent). The page's structured data lists Plus $8, Premium $30, Super $100, Ultra $200 and Teams $30 in USD, matching the stored prices. The pricing page text now describes a usage pool shared across Cursor and Grok, Plus as Grok-models-only, and third-party models at API list price; it is unusual and the visible plan cards could not be read cleanly, so the allowance details are unconfirmed. Needs manual review.

### Deepgram

Status: verified. Product active. Pay as you go with $200 free credit (no card, no expiry); Growth from $4,000/year in prepaid credits (up to 20% off); Enterprise custom. Streaming speech-to-text rates were read; the pre-recorded tab was not re-read.

### DeepL

Status: verified. Product active. /en/pricing redirects to /en/pro. Translator tab, Annual view, shown in USD for a Pakistan visitor: Individual $8.74/month billed annually, Team $28.74 per user/month billed annually, Business $57.49 per user/month billed annually, Enterprise custom; Individual and Team show a 30-day free trial. An earlier check with Germany selected showed EUR 7.49 / 24.99 / 49.99, so prices differ by region. The Monthly view and the free consumer tier were not re-read. API tab: Developer free (1M characters one-time), Growth $26.00/month billed annually plus usage.

### Descript

Status: partial. Product active. The page opened on the Annual view ('Saving up to 35% with annual billing') and shows two figures per plan: Hobbyist $16 and $24, Creator $24 and $35, Business $50 and $65 per person/month. The Monthly view could not be toggled, so the page text does not label which figure is which; the lower figure is most likely the annual price. Plan allowances read: Hobbyist 10 media hours and 400 AI credits per month, Creator 30 hours and 800 credits, Business 40 hours and 1,500 credits.

### Devin

Status: verified. Product active (now an editor plus cloud agents). Free $0; Pro $20/month; Max $200/month; Teams is $80/month for the team plan plus $40/month per full developer seat (up to 200 users); Enterprise by demo. Corrected: Teams was stored as $40 per user only; the $80 team base was missing. Paid plans have daily and weekly usage allowances; extra usage is bought at API pricing.

### ElevenLabs

Status: verified. Product active. Monthly billing view (prices exclude taxes): Free $0 with 10k credits; Starter $6 regular (first month $1 until Nov 1); Creator $22 regular (first month $11); Pro $99; Scale $299 with 3 seats; Business $990 with 10 seats; Enterprise custom. Credits per month: Starter 30k, Creator 121k, Pro 600k, Scale 1.8M, Business 6M. Corrected: Starter and Creator regular monthly prices were previously not captured. The Yearly view was not re-read; the stored annual figures come from an earlier check.

### Elicit

Status: verified. Product active. Basic is free; Pro $49 per user per month billed as $588 annually (save 35%); Scale $229 per user per month billed as $2,748 annually (save 39%); Enterprise custom. The Monthly toggle was not read, so monthly-billing prices remain unstated.

### Fathom

Status: partial. Product active. The page shows Free $0; Premium $16; Team $15 and Business $25 per user/month (Team and Business need 2 users); Enterprise by sales. The pricing toggle (Monthly / Annually, save 25%+) could not be switched, so the page text does not say which billing period these figures belong to; an earlier check also saw $20, $19 and $34. Kept partial.

### Figma

Status: partial. Product active; prices in USD. Starter free (150 AI credits a day, up to 500 a month). Professional full seat $16/mo (dev $12, collab $3) behind a Monthly/Annual toggle whose selected state is not labelled; Organization full seat $55/mo and Enterprise full seat $90/mo, both labelled billed annually. Per-month AI credits: Professional full seat 3,000, Organization 3,500, Enterprise 4,250.

### Fireflies.ai

Status: partial. Product active. Page opened with a Monthly/Annual toggle (save up to 44%). Billed annually per seat/month: Pro $10, Business $19, Enterprise $39 (annual only). A second, higher figure sits beside Pro ($18) and Business ($29) and is most likely the monthly-billing price, but the Monthly view could not be toggled so it is not recorded as a price. Corrected: plan prices and Free limits were previously missing.

### Fireworks AI

Status: verified. Product active (inference, training and on-demand GPU deployments). Pre-paid, usage-based pricing per token / per GPU second / per 1M training tokens; enterprise by contact. Embeddings from $0.008 per 1M input tokens. Per-model serverless rates are in the separate pricing docs and were not recorded. No standing free credit is stated; a time-limited free training offer ends 11/30.

### Gamma

Status: verified. Product active. Individual tab, annual view: Plus $9, Pro $18, Ultra $90 per seat/month ($108 / $216 / $1,080 billed annually); the monthly figures ($12 / $25 / $100) are from an earlier check and were not re-seen. Free: 400 credits at signup. Monthly credits: Plus 1,500, Pro 4,000, Ultra 20,000. Business tab not read. Prices subject to tax.

### Gemini

Status: partial. Product active. The page opened in Urdu for Pakistan and shows Free Rs 0, Google AI Plus Rs 1,400 per month, Google AI Pro Rs 5,600 per month (PKR), matching the stored figures; Pro includes 4x Free usage limits and Plus 2x. The Business and Developer tabs were not read, so the stored Gemini Enterprise USD prices are unconfirmed in this check. Pakistan prices only.

### Gemini Notebook (formerly NotebookLM)

Status: partial. Product active but renamed: notebooklm.google now redirects to notebook.google, titled 'Gemini Notebook', and the help page is 'Learn about Gemini Notebook's plans'. The Standard tier is free with a Gmail account; Plus, Pro and Ultra tiers come with Google AI plans (see Gemini for the Pakistan prices of Plus and Pro). Notebook and source limits per tier were not re-read.

### GitHub Copilot

Status: verified. Product active. Individuals tab, USD: Free $0 (2,000 completions a month), Pro $10, Pro+ $39, Max $100 per user/month. Included monthly credits: Pro $15, Pro+ $70, Max $200. Business tab not re-read.

### Grammarly

Status: partial. Product active (the page now mentions availability through Superhuman Go). Free $0 with 100 AI prompts; Pro shows $12 USD with no billing-period label, a $0-today free trial (reminder 2 days before it ends) and 2,000 AI prompts; Enterprise by sales. Because the Pro billing period is unlabelled, it stays partial.

### Granola

Status: verified. Product active. Basic $0, Business $14, Enterprise $35, all per user per month; the page does not state a billing period, so none is claimed. Business adds unlimited meeting history, advanced integrations, API access and MCP.

### Groq

Status: partial. Product active (homepage: 'the premier neocloud for fast inference'). The stored pricing URL now redirects to the homepage, and console.groq.com/docs/pricing returns 404, so no price list could be read. No prices are recorded. Needs manual review: find the current pricing page from the signed-in console.

### Hex

Status: partial. Product active (Hex 4.0 announced). Community free; Professional $36 and Team $75 per editor/month (Team: 14 days free); Enterprise custom. The page does not say whether prices are monthly or annual billing, so it stays partial.

### HeyGen

Status: verified. Product active. For Individuals, Monthly view: Free $0 (3 watermarked videos/month, 1 minute each); Creator $29/month (600 credits, 1080p, no branding); Pro $49/month (1,000 credits, 4K, videos up to 30 minutes). A Yearly toggle ('2 months free') exists. The For Businesses tab was not re-read, so Business $149 is from an earlier check.

### Hostinger

Status: partial. Company active. The Websites tab shows a Black Friday offer: Premium is $2.49/month only on a 48-month plan (list $12.19; 'today you pay $119.52 for 48 months; renews at $10.99/month'). Corrected: $2.49 was stored as a plain monthly price, but it is a promotional 48-month price and the renewal rate is much higher. Other plans (Unlimited, Cloud Startup, Agency) were not visible in the part read, so their stored prices are unconfirmed.

### Hugging Face

Status: verified. Product active. PRO Account $9/month (includes $2 of inference credits monthly, ZeroGPU quota and priority); Team $20 per user/month; Enterprise shown from $50; Spaces hardware and Inference Endpoints hourly prices listed (for example $0.033/hour entry). The page's text is surrounded by decorative symbols; plan figures were read by extracting the dollar amounts.

### Ideogram

Status: verified. Product active. Subscription tab, USD: Plus $20/month ($180 billed annually), Pro $60/month ($504 billed annually), Team $30 per user/month ($240 billed annually); Enterprise postpaid by contact; pay-as-you-go credits at 1 cent each. Priority credits: Plus 2,400, Pro 7,500, Team 3,600 per user per month.

### Intercom

Status: verified. Product active. Pricing is marked 'Pay annually': Essential $29 list ($19 shown to new customers, 'save 35%'), Advanced $85, Expert $132 per seat/month; Fin AI Agent $0.99 per outcome; 14-day cardless free trial. Corrected: these are annual-billing prices, not an unlabelled period.

### Jasper

Status: verified. Product active. The pricing FAQ states Pro is $59/month billed yearly or $69/month billed monthly, and Business is custom. A free trial is offered; the trial length was not re-read.

### Julius AI

Status: partial. Product active (now an AI workspace for analysis, research and creation). USD: Plus $20, Pro $45, Business $450 per month; the page has an Annual Billing (save 20%) / Monthly Billing toggle that could not be switched, so the billing period behind these figures is unconfirmed. Plus 2,000 credits a month, Pro 5,000, Business 60,000.

### LangChain

Status: verified. Project active. The repository page describes it as 'The agent engineering platform' and shows the MIT license. No pricing: open-source software; hosted LangSmith is a separate product.

### LangGraph

Status: verified. Project active. The repository page describes it as 'Build resilient agents.' and shows the MIT license. No pricing: open-source software.

### LangSmith

Status: verified. Product active. Developer $0 per seat/month (1 seat, up to 5k base traces/month, then pay as you go); Plus $39 per seat/month (up to 10k base traces/month, unlimited seats can be added); Enterprise custom. Usage in LangChain Standard Units at $1.00 each. Startup credits up to $10,000 offered.

### Leonardo.Ai

Status: partial. Product active. Solo plans in USD, ex. tax: Free $0 (150 fast tokens/day), Essential $12, Premium $30, Ultimate $60 per month; Team Starter $72/month ($24 per seat). Fast tokens per month: Essential 8,500, Premium 25,000, Ultimate 60,000. The Pay Yearly / Pay Monthly toggle (up to 20% off) still does not change the displayed figures, so the billing period is unconfirmed.

### llama.cpp

Status: verified. Project active (LLM inference in C/C++; about 132.8k stars; recent commits). MIT license shown. No pricing: open-source software.

### Lovable

Status: verified. Product active. Page shows a Monthly / Yearly (2 months free) toggle with Monthly figures: Free $0 (no card needed); Pro $25/month with 100 monthly credits; Business $50/month with 100 Business credits; Enterprise volume-based with a platform fee. Yearly prices were not read. Corrected: Pro and Business prices were previously not captured.

### Luma

Status: verified. Product active. Monthly view, USD: Plus $30, Pro $90, Ultra $300 per month with 10,000 / 40,000 / 150,000 credits; Team and Enterprise by contact. A Yearly toggle (save up to 20%) exists; yearly prices were not re-read. Per-generation credit costs are listed on the page.

### Make

Status: partial. Product active (visual automation; credits are the billing unit). The pricing page FAQ confirms the Free plan has 1,000 credits per month, and that Core, Pro and Teams are paid plans (annual payment is cheaper than monthly; Enterprise accepts wire transfer). The plan cards and their prices are not present in the page text this browser could read, so no paid price is recorded. Needs manual review.

### Microsoft Copilot

Status: verified. Product active. Pricing URL now redirects to /copilot/solutions/individuals. Monthly view: Microsoft 365 Personal $9.99, Family $12.99, Premium $19.99, Pro $99.99 (monthly billing only); one-month free trial on Personal, Family and Premium. A Yearly toggle (save up to 17%) exists; yearly prices were not read. Prices shown in $ without a currency code.

### Midjourney

Status: verified. Product active. The official plan comparison lists monthly $10 / $30 / $60 / $120 and annual $96 / $288 / $576 / $1,152 (i.e. $8 / $24 / $48 / $96 a month) for Basic, Standard, Pro, Mega; extra GPU time $4/hour; companies above $1,000,000 USD gross revenue per year must use Pro or Mega. There is no free plan on this page.

### n8n

Status: verified. Product active. Annual view, shown in USD this time: Starter $20/month billed annually (2.5k executions), Pro $50 (10k), Business $800 (40k, self-hosted only); Enterprise custom. A Monthly toggle exists but was not read. An earlier check showed euros (EUR 20 / 50 / 667), so the displayed currency and the Business price differ by visit; the stored EUR figures are replaced by the USD figures seen now.

### Namecheap

Status: partial. Company active. The domain price page showed promotional first-year prices that differ from the stored ones: .com $6.48/yr for new customers (instead of $14.98), .net $11.68 with a promo code (instead of $14.98), .org $8.48 (instead of $12.98); .ai register $89.98, renew $114.98, transfer $99.98 matches. Promotions change often; renewal prices were read only for .ai. Hosting and email products were not read.

### Notion

Status: verified. Product active. USD, per seat/month: Free $0, Plus $10, Business $20 (recommended; includes 1,500 Standard and 500 Select credits a month), Enterprise custom; Pay monthly / Pay yearly toggle (save up to 20%) was not switched, so the yearly price is not recorded.

### Ollama

Status: verified. Product active. Pay as you go $0 (local models, 3 concurrent cloud requests); Pro $20/month or $200/year billed annually ($60 of monthly usage credits); Team early access $500/month ($1,000 of shared monthly credits, unlimited users); Enterprise custom. The Max tier price was not re-read.

### OpenRouter

Status: partial. Product active. Free tier read: 25+ free models, 4 free providers, 5 workspaces, 50 requests a day, community support. The Standard (5.5%) and Business (8%) credit-purchase fees on the stored record are from an earlier check; the page's FAQ, which holds them, was not expanded.

### Otter.ai

Status: verified. Product active. Annual view, USD: Pro $8.33 per user/month (save 51%), Business $19.99 per user/month (save 33%), Basic free with 300 monthly minutes, Enterprise by demo. Monthly figures ($16.99 and $30) are from an earlier check and were not re-seen.

### Perplexity

Status: verified. Product active. Individual tab, USD: Free $0; Pro $17/month when billed annually; Max $167/month when billed annually (10,000 monthly credits); Enterprise on a separate page. The monthly-billing price was not shown.

### Pika

Status: verified. Product active. Monthly view, USD: Free (no monthly credits, credit packs only), Starter $10/month with 900 credits, Creator $35/month with 3,150 credits; a Yearly toggle (save 20%) exists. Fancy and Enterprise were not re-read.

### QuillBot

Status: partial. Product active. Free $0; Premium $4.17 per month billed annually (USD); Team plan on a separate page with no price. The monthly-billing price is not stated.

### Replicate

Status: verified. Product active. Pay-as-you-go: most models billed by run time on the hardware used, some per input and output (flux-1.1-pro $0.04 per image, flux-dev $0.025, flux-schnell $3.00 per thousand images, deepseek-r1 $3.75 per million input tokens). No subscription tiers; enterprise by sales. Hardware per-second rates were not re-read.

### Replit

Status: verified. Product active. Page has Monthly / Yearly (up to 10% off) view: Core $20/month or $18/month billed annually; Pro $100/month or $90/month billed annually (credit tiers at $215, $425, $825 and $2,000 a month are offered for larger Pro usage); Enterprise custom. Taxes extra. The Core and Pro monthly prices are now confirmed by the struck-through figures.

### Runway

Status: verified. Product active. Individual tab: Free $0 (125 one-time credits, 5 GB); Standard $15 monthly or $12 a month billed annually (625 credits); Pro $35 or $28 (2,250 credits); Max $95 or $76 (9,500 credits, credits roll over one month). Team & Enterprise and API tabs not read.

### Scite

Status: verified. Product active. Basic $12/month and Pro $40/month, both billed yearly (save $96 and $120), each with a 7-day free trial; Pro adds API access and larger collections (10,000 papers); Enterprise custom. The monthly-billing price is not shown.

### Suno

Status: verified. Product active. Monthly view, USD: Free $0 (50 credits a day, no commercial rights); Pro $8/month (2,500 credits, 20 downloads); Premier $24/month (10,000 credits, 60 downloads). The page says billing yearly saves $24 and $72; the annual per-month price is not shown, so it is not recorded. Taxes calculated at checkout.

### Surfer

Status: verified. Product active. USD per month, billed yearly: AI Search Analytics $82 (saves $156), Standard $99 (saves $240), Pro $182 (saves $444), Peace of Mind $299 (saves $720); Enterprise by contact. The Discovery plan ($49) on the stored record was not visible in the part of the page read; the monthly-billing price is not shown.

### Synthesia

Status: verified. Product active. Page toggles Monthly / Yearly (save up to 4 months); the Yearly view shows Basic $0 (500 credits a month), Starter $29 struck to $18 a month ($216 billed yearly, 15,000 credits a year), Pro $89 struck to $64 a month ($768 billed yearly, 72,000 credits a year), Enterprise custom. Corrected: stored Starter $19/$14 and Pro annual $59 were out of date; the first-month promotions were not shown this time.

### Tidio

Status: partial. Product active. Free plan (50 billable conversations, 7-day trial) confirmed. The paid cards sit behind a Monthly / Annually (2 months free) toggle: Starter shows $24.17 a month, which equals $29 less 2 months free, so it is an annual-equivalent figure rather than a monthly price. Corrected: the stored Starter $24.17 and Growth $49.17 were labelled monthly; they are now recorded as annual-equivalent and the monthly prices are marked not captured.

### Together AI

Status: partial. Product active. Serverless rates per 1M tokens are listed per model (for example Kimi K3 $3.00 input / $15.00 output; GLM-5.3-Flash $0.15 / $0.50; gpt-oss-120B $0.15 / $0.60). Dedicated, cluster and fine-tuning prices and any free credit were not re-read, so the record stays partial.

### v0

Status: verified. Product active. USD, excluding tax: Free $0 ($5 one-time credits for new users, 7 messages a day); Plus $30 per user/month ($30 of monthly credits plus $2 free daily credits; an unlabelled $90 figure sits beside it); Business $100 per user/month; Enterprise custom. Model token rates match the stored ones.

### Vibe Chat (Mistral)

Status: verified. Product active but renamed: chat.mistral.ai now opens as 'Vibe Chat' (tab title and 'Vibe Terms of Service'), and the pricing page describes 'Vibe' on web, CLI, IDE and mobile. The catalog name was 'Le Chat'; the display name is updated and the id is unchanged. USD view: Free $0; Pro $14.99/month (student plan available); Team $24.99 per user/month; Enterprise custom; amounts exclude tax. The sign-in and terms prompt was not accepted.

### vLLM

Status: verified. Project active (high-throughput, memory-efficient inference and serving engine for LLMs). Apache-2.0 license shown. No pricing: open-source software.

### Whisper

Status: verified. Project active (about 111.6k stars; recent commit). MIT license shown. No pricing: open-source software; OpenAI's hosted transcription API is billed separately.

### Wispr Flow

Status: partial. Product active. The page has a Monthly / Annual (20% discount) toggle and shows Free $0 (2,000 words a week on desktop), Pro $12 per user/month, Growth $18 per user/month, Enterprise custom. The toggle could not be switched, so it is not confirmed that these are annual-billing figures; the stored monthly figure for Pro ($15) is from an earlier check.

### Writesonic

Status: verified. Product active (now positioned as an AI search visibility platform). USD per month, billed annually: Starter $79 (saves $240 a year), Basic $199 (saves $600), Growth $399 (saves $1,200); Enterprise custom. The Monthly toggle was not read, so monthly-billing prices are not recorded.

### Zapier

Status: verified. Product active. Page has Pay monthly / Pay yearly (save 33%) and a task tier selector; the figures read are 'starting from': Free $0 (100 tasks a month), Professional from $19.99/month, Team from $69/month (25 users, SAML SSO), Enterprise by sales. They match the stored annual prices; the stored monthly prices ($29.99, $103.50) were not re-seen.

### Zendesk

Status: verified. Product active. Customer Service view, per agent/month paid yearly: Support Team $19, Suite Team $55, Suite Professional $115, Suite Enterprise + Copilot by sales. Add-ons: Copilot $50, Workforce Engagement Bundle $50, Contact Center $83 per agent/month paid yearly. Monthly-billing prices ($25, $69, $149) are from an earlier check and were not re-seen.
