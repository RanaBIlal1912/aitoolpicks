# AI ecosystem discovery: status and what it needs

**Status: not launched.** The catalog records products (tools). An ecosystem view (companies, models, open-source projects, releases, and how they relate)
needs structured, verified records that do not exist yet. No page was created, because an ecosystem page built from the current data would be either empty or invented.

## What exists today

- `vendor` on every tool record (a company name as the vendor writes it; not yet a linked company record).
- 17 hand-edited news stories with `tools` links to catalog products.
- A handful of tools whose records describe models or platforms (OpenRouter, Together AI, Groq, Fireworks AI, Replicate, Hugging Face, Ollama), but no per-model records.

## What a launch requires

1. **Companies** (`content/companies/*.json`): id, official name, website, headquarters only if stated by the company, sources, checked date. Tools point to a company id instead of a free-text vendor.
2. **Models** (`content/models/*.json`): id, company id, name, release date from the vendor's announcement, licence (with the licence page), modality, source link. Never infer capabilities or rankings.
3. **Relationships** stored as explicit edges (`company -> model`, `model -> tool that uses it`, `tool -> hosts model`), each with a source. A relationship we cannot cite is not shown.
4. **Open-source projects** only with a repository link and the licence text read from it (the catalog already does this for tools via `openSource`).
5. Validators like `scripts/catalog-lib.mjs`, and tests that every edge points to an existing record.

Suggested first release once data exists: a `/companies/` index and company pages listing their catalog tools, models and related news, built from the records above.
