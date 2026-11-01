# Redesign route check (feature/futuristic-full-website-redesign)

Automated pass over every built route in a headless browser at 1366 px and 375 px against a local build (`node scripts/preview.mjs`). Per route and viewport: status 200, dark background (no white page), no horizontal overflow, exactly one h1, no large white content blocks, no console or page errors, shared header and neon button/panel styles present.

**Result: 324 routes x 2 viewports = 648 checks, 0 failures** (after the page-composition pass: neon banner on every page, category banners with their own colour and icon, tool pages with product banner, feature cards and neon plan cards, neon news/blog/article/compare/pricing components).

This is an automated structural check plus one screenshot per page type in `docs/screenshots/redesign/`. It does not replace a visual review.

## Routes by section

| Section | Routes | Example |
| --- | --- | --- |
| /about/ | 1 | /about/ |
| /affiliate-disclosure/ | 1 | /affiliate-disclosure/ |
| /best/ | 7 | /best/best-ai-assistants/ |
| /blog/ | 44 | /blog/ai-automation-tools-compared/ |
| /compare/ | 3 | /compare/canva-free-vs-pro/ |
| /contact/ | 1 | /contact/ |
| /credits/ | 1 | /credits/ |
| /ecosystem/ | 66 | /ecosystem/companies/adobe/ |
| /favorites/ | 1 | /favorites/ |
| // | 1 | // |
| /methodology/ | 1 | /methodology/ |
| /news/ | 18 | /news/agent-skills-donated-to-foundation/ |
| /pricing/ | 1 | /pricing/ |
| /privacy/ | 1 | /privacy/ |
| /recent/ | 1 | /recent/ |
| /reviews/ | 18 | /reviews/canva/ |
| /submit/ | 1 | /submit/ |
| /terms/ | 1 | /terms/ |
| /tools/ | 154 | /tools/assemblyai/alternatives/ |
| /verification/ | 1 | /verification/ |
| /does-not-exist/ | 1 | /does-not-exist/ |

## Every route tested

- /about/
- /affiliate-disclosure/
- /best/best-ai-assistants/
- /best/best-ai-automation-and-agent-platforms/
- /best/best-ai-coding-tools/
- /best/best-ai-image-and-design-tools/
- /best/best-ai-video-generators/
- /best/best-ai-voice-music-and-transcription-tools/
- /best/
- /blog/ai-automation-tools-compared/
- /blog/ai-coding-assistants-compared/
- /blog/ai-customer-support-tools-compared/
- /blog/ai-data-analysis-tools-compared/
- /blog/ai-dictation-and-transcription-tools/
- /blog/ai-image-generators-compared/
- /blog/ai-meeting-notetakers-compared/
- /blog/ai-privacy-and-security-checklist/
- /blog/ai-research-tools-compared/
- /blog/ai-seo-and-writing-tools-for-marketing/
- /blog/ai-video-tools-compared/
- /blog/best-ai-tools-for-small-business/
- /blog/best-ai-tools-for-students/
- /blog/best-ai-writing-tools/
- /blog/best-hosting-for-beginners/
- /blog/build-a-free-portfolio-website/
- /blog/chatgpt-prompts-for-freelancers/
- /blog/free-tools-for-freelancers/
- /blog/how-to-choose-an-ai-tool/
- /blog/how-to-get-paid-as-a-freelancer/
- /blog/how-to-get-paid-as-a-freelancer-in-pakistan/
- /blog/how-to-get-your-first-freelance-client/
- /blog/how-to-read-ai-pricing-pages/
- /blog/how-to-start-freelancing/
- /blog/how-to-start-freelancing-from-pakistan/
- /blog/how-to-write-a-freelance-proposal/
- /blog/
- /blog/open-source-ai-tools-explained/
- /blog/open-weight-vs-api-models/
- /blog/topic/automation/
- /blog/topic/beginners/
- /blog/topic/business/
- /blog/topic/comparisons/
- /blog/topic/design/
- /blog/topic/developers/
- /blog/topic/freelancing/
- /blog/topic/imagevideo/
- /blog/topic/marketing/
- /blog/topic/productivity/
- /blog/topic/research/
- /blog/topic/security/
- /blog/topic/students/
- /blog/topic/websites/
- /blog/topic/writing/
- /compare/canva-free-vs-pro/
- /compare/chatgpt-vs-grammarly/
- /compare/
- /contact/
- /credits/
- /ecosystem/companies/adobe/
- /ecosystem/companies/anthropic/
- /ecosystem/companies/assemblyai/
- /ecosystem/companies/canva/
- /ecosystem/companies/cognition/
- /ecosystem/companies/consensus/
- /ecosystem/companies/cursor/
- /ecosystem/companies/deepgram/
- /ecosystem/companies/deepl/
- /ecosystem/companies/descript/
- /ecosystem/companies/elevenlabs/
- /ecosystem/companies/elicit/
- /ecosystem/companies/fathom/
- /ecosystem/companies/figma/
- /ecosystem/companies/fireflies-ai/
- /ecosystem/companies/fireworks-ai/
- /ecosystem/companies/gamma/
- /ecosystem/companies/ggml-org/
- /ecosystem/companies/github-microsoft/
- /ecosystem/companies/google/
- /ecosystem/companies/grammarly/
- /ecosystem/companies/granola/
- /ecosystem/companies/groq/
- /ecosystem/companies/hex/
- /ecosystem/companies/heygen/
- /ecosystem/companies/hostinger/
- /ecosystem/companies/hugging-face/
- /ecosystem/companies/ideogram/
- /ecosystem/companies/intercom/
- /ecosystem/companies/jasper/
- /ecosystem/companies/julius/
- /ecosystem/companies/langchain/
- /ecosystem/companies/leonardo-ai/
- /ecosystem/companies/lovable/
- /ecosystem/companies/luma-ai/
- /ecosystem/companies/make/
- /ecosystem/companies/microsoft/
- /ecosystem/companies/midjourney/
- /ecosystem/companies/mistral-ai/
- /ecosystem/companies/n8n/
- /ecosystem/companies/namecheap/
- /ecosystem/companies/notion/
- /ecosystem/companies/ollama/
- /ecosystem/companies/openai/
- /ecosystem/companies/openrouter/
- /ecosystem/companies/otter-ai/
- /ecosystem/companies/perplexity-ai/
- /ecosystem/companies/pika/
- /ecosystem/companies/quillbot/
- /ecosystem/companies/replicate/
- /ecosystem/companies/replit/
- /ecosystem/companies/runway/
- /ecosystem/companies/scite/
- /ecosystem/companies/stackblitz/
- /ecosystem/companies/suno/
- /ecosystem/companies/surfer/
- /ecosystem/companies/synthesia/
- /ecosystem/companies/tidio/
- /ecosystem/companies/together-ai/
- /ecosystem/companies/vercel/
- /ecosystem/companies/vllm-project/
- /ecosystem/companies/wispr/
- /ecosystem/companies/writesonic/
- /ecosystem/companies/zapier/
- /ecosystem/companies/zendesk/
- /ecosystem/
- /favorites/
- //
- /methodology/
- /news/agent-skills-donated-to-foundation/
- /news/ai-for-science-expands/
- /news/anthropic-ai-spend-tools/
- /news/anthropic-files-s1/
- /news/anthropic-gsa-partnership/
- /news/anthropic-singapore-office/
- /news/anthropic-usage-policy-2026/
- /news/chrome-autofill-reads-gmail/
- /news/claude-drug-development-progress/
- /news/gemini-app-edit-files/
- /news/genie-4-world-model/
- /news/google-opens-gemini-and-search-to-apps/
- /news/granola-adds-dictation/
- /news/
- /news/mistral-large-4-on-hugging-face/
- /news/mistral-releases-trillion-parameter-weights/
- /news/nvidia-open-transcription-model/
- /news/project-protostar/
- /pricing/
- /privacy/
- /recent/
- /reviews/canva/
- /reviews/chatgpt/
- /reviews/claude/
- /reviews/cursor/
- /reviews/deepl/
- /reviews/elevenlabs/
- /reviews/github-copilot/
- /reviews/grammarly/
- /reviews/hex/
- /reviews/hostinger/
- /reviews/
- /reviews/midjourney/
- /reviews/notion/
- /reviews/ollama/
- /reviews/perplexity/
- /reviews/runway/
- /reviews/zapier/
- /reviews/zendesk/
- /submit/
- /terms/
- /tools/assemblyai/alternatives/
- /tools/assemblyai/
- /tools/bolt/alternatives/
- /tools/bolt/
- /tools/canva/alternatives/
- /tools/canva/
- /tools/category/analytics/
- /tools/category/assistants/
- /tools/category/audio/
- /tools/category/automation/
- /tools/category/coding/
- /tools/category/image/
- /tools/category/marketing/
- /tools/category/models/
- /tools/category/open-source/
- /tools/category/productivity/
- /tools/category/research/
- /tools/category/support/
- /tools/category/video/
- /tools/category/web/
- /tools/category/writing/
- /tools/chatgpt/alternatives/
- /tools/chatgpt/
- /tools/claude/alternatives/
- /tools/claude/
- /tools/consensus/alternatives/
- /tools/consensus/
- /tools/copilot/alternatives/
- /tools/copilot/
- /tools/cursor/alternatives/
- /tools/cursor/
- /tools/deepgram/alternatives/
- /tools/deepgram/
- /tools/deepl/alternatives/
- /tools/deepl/
- /tools/descript/alternatives/
- /tools/descript/
- /tools/devin/alternatives/
- /tools/devin/
- /tools/elevenlabs/alternatives/
- /tools/elevenlabs/
- /tools/elicit/alternatives/
- /tools/elicit/
- /tools/fathom/alternatives/
- /tools/fathom/
- /tools/figma/alternatives/
- /tools/figma/
- /tools/fireflies/alternatives/
- /tools/fireflies/
- /tools/firefly/alternatives/
- /tools/firefly/
- /tools/fireworks/alternatives/
- /tools/fireworks/
- /tools/gamma/alternatives/
- /tools/gamma/
- /tools/gemini/alternatives/
- /tools/gemini/
- /tools/github-copilot/alternatives/
- /tools/github-copilot/
- /tools/grammarly/alternatives/
- /tools/grammarly/
- /tools/granola/alternatives/
- /tools/granola/
- /tools/groq/alternatives/
- /tools/groq/
- /tools/hex/alternatives/
- /tools/hex/
- /tools/heygen/alternatives/
- /tools/heygen/
- /tools/hostinger/alternatives/
- /tools/hostinger/
- /tools/huggingface/alternatives/
- /tools/huggingface/
- /tools/ideogram/alternatives/
- /tools/ideogram/
- /tools/
- /tools/intercom/alternatives/
- /tools/intercom/
- /tools/jasper/alternatives/
- /tools/jasper/
- /tools/julius/alternatives/
- /tools/julius/
- /tools/langchain/alternatives/
- /tools/langchain/
- /tools/langgraph/alternatives/
- /tools/langgraph/
- /tools/langsmith/alternatives/
- /tools/langsmith/
- /tools/leonardo/alternatives/
- /tools/leonardo/
- /tools/llamacpp/alternatives/
- /tools/llamacpp/
- /tools/lovable/alternatives/
- /tools/lovable/
- /tools/luma/alternatives/
- /tools/luma/
- /tools/make/alternatives/
- /tools/make/
- /tools/midjourney/alternatives/
- /tools/midjourney/
- /tools/mistral/alternatives/
- /tools/mistral/
- /tools/n8n/alternatives/
- /tools/n8n/
- /tools/namecheap/alternatives/
- /tools/namecheap/
- /tools/notebooklm/alternatives/
- /tools/notebooklm/
- /tools/notion/alternatives/
- /tools/notion/
- /tools/ollama/alternatives/
- /tools/ollama/
- /tools/openrouter/alternatives/
- /tools/openrouter/
- /tools/otter/alternatives/
- /tools/otter/
- /tools/perplexity/alternatives/
- /tools/perplexity/
- /tools/pika/alternatives/
- /tools/pika/
- /tools/quillbot/alternatives/
- /tools/quillbot/
- /tools/replicate/alternatives/
- /tools/replicate/
- /tools/replit/alternatives/
- /tools/replit/
- /tools/runway/alternatives/
- /tools/runway/
- /tools/scite/alternatives/
- /tools/scite/
- /tools/suno/alternatives/
- /tools/suno/
- /tools/surfer/alternatives/
- /tools/surfer/
- /tools/synthesia/alternatives/
- /tools/synthesia/
- /tools/tidio/alternatives/
- /tools/tidio/
- /tools/together/alternatives/
- /tools/together/
- /tools/v0/alternatives/
- /tools/v0/
- /tools/vllm/alternatives/
- /tools/vllm/
- /tools/whisper/alternatives/
- /tools/whisper/
- /tools/wisprflow/alternatives/
- /tools/wisprflow/
- /tools/writesonic/alternatives/
- /tools/writesonic/
- /tools/zapier/alternatives/
- /tools/zapier/
- /tools/zendesk/alternatives/
- /tools/zendesk/
- /verification/
- /does-not-exist/
