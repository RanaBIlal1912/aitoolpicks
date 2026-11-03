# 6. Analytics, central statistics and data verification

Design only.

## 1. Analytics and event tracking

### 1.1 Starting point
`src/lib/analytics.ts` fires a browser event (`aitp:outbound`) on every outbound click and sends nothing anywhere; `ANALYTICS_ENABLED = false`. **That behaviour is kept** until you switch analytics on (D-07). The new system is built but dormant.

### 1.2 What would be collected (only when switched on)
| Event | Fields stored | Why |
| --- | --- | --- |
| `page_view` | time, path group (for example `tool`, `blog`, `news`), device class, country | which sections are used |
| `tool_view` | the above plus `tool_id` | popular tools |
| `category_visit` | plus `category_id` | category performance |
| `directory_search` | time, **only the length** of the search text and the number of results | search quality; the text itself is not stored |
| `outbound_official`, `outbound_affiliate` | time, `tool_id`, placement, affiliate status at the time | clicks to official sites and affiliate links |
| `submission_created` | time | submission volume |

**Not collected:** names, emails, IP addresses, full user-agent strings, search text, form contents, cookies or any identifier stored in the browser. Country comes from the hosting platform's coarse location header and is stored as a two-letter code. An optional unique-visitor count would use a salted hash of IP and user-agent that **rotates daily** and is never reversed; whether to enable even that is part of decision D-07, because hashed data can still count as personal data in some places.

### 1.3 How it works
- The browser sends a small `navigator.sendBeacon` JSON request to `/api/events` only when `ANALYTICS_ENABLED` is true and (where required) the visitor consented.
- The Route Handler validates with Zod (known event names, known ids, length limits), drops anything that does not validate, rate limits per IP hash, ignores known bots by user-agent, and inserts. Failures never affect the page.
- A nightly job (Supabase `pg_cron` or a Vercel cron call secured with `CRON_SECRET`; availability on the chosen plan is **to be verified in Phase 7**) rolls raw events into `analytics_daily` and deletes raw rows older than 90 days.
- The Analytics page offers date filters and aggregates: popular tools, outbound and affiliate clicks, top paths, category performance, submissions per week. It reads `analytics_daily`, never raw rows.
- Privacy policy and the privacy page are updated **before** the switch is turned on; a consent banner is added only if the chosen settings or your target countries require it.

## 2. One statistics service

Goal: no hard-coded number anywhere. Today `src/lib/stats.ts` computes totals from the generated catalogue. The platform keeps that contract and moves the authority into SQL.

- **Source of truth:** SQL views over published rows: `v_stats_catalog` (published tools, categories, free, freemium, paid, usage-based, open-source counts, verified, partial, unverified), `v_stats_content` (reviews by method, blog posts, news items, roundups, models), `v_stats_affiliate` (programmes by status), `v_stats_submissions` (by status).
- **Public site:** `scripts/snapshot.mjs` reads the views and writes `src/data/generated/stats.json`; `src/lib/stats.ts` re-exports it, so `STATS`, `categoryStats()` and `statsFor()` keep their signatures and every page that uses them (home, directory, pricing, methodology, category pages, company pages, footer, verification log) is unchanged.
- **Admin:** reads the same views live, plus draft and pending counts.
- **Consistency tests:** the existing `tests/stats.test.ts` is extended so that `stats.json` must equal the view output and must equal a recomputation from the exported records; any page that prints a total is checked against `STATS` in the built HTML.
- Adding a statistic means adding it to a view and to this file's list; there is nowhere else to type a number.

## 3. Data verification workflow

### 3.1 Checks
| # | Check | How | Severity | Automated? |
| --- | --- | --- | --- | --- |
| 1 | Missing tool description or tagline | rows with empty text | error | yes |
| 2 | Invalid website, pricing, source URLs | URL parse, https only | error | yes |
| 3 | URL unreachable or redirects off-site | HTTP request on a schedule (not at build) | warning | yes |
| 4 | Broken images | HTTP request for media; file exists in `public/` | warning | yes |
| 5 | Duplicate slugs or names | unique constraints plus a report | error | yes |
| 6 | Tool without a category, or without a primary category | query | error | yes |
| 7 | Inconsistent pricing records (plan currency or unit missing, `verified` with no plans, `pricing_checked_at` older than 90 days, `verification_status` differs from `pricing_status`) | query | error / warning | yes |
| 8 | Review without a method | not possible (not null) | n/a | constraint |
| 9 | Hands-on review with missing testing data, invalid or future dates, no https evidence | the Zod rules from `review-trust.ts` | error | yes |
| 10 | Documentation review that carries a testing record | rule | error | yes |
| 11 | Affiliate inconsistencies (link without approved status, approved without link, unknown tool) | query | error | yes |
| 12 | Broken internal links in article HTML and pages | crawl the built site | error | yes (CI) |
| 13 | Sitemap consistency (every published URL is in the sitemap, no draft or archived URL is) | compare database with built sitemap | error | yes (CI) |
| 14 | News: missing source URL, non-https, source not verified, date in the future | query | error / warning | yes |
| 15 | Facts that need a human (prices, features, review conclusions) | **never automatic** | n/a | no |

### 3.2 Rules about trust
- A reachable URL **does not** make a tool "verified". Verification is a human action recorded in `verification_checks` with a name, date and method.
- Automated results are written as `verification_checks` rows with `automated = true`; they can raise warnings but cannot change `tools.verification_status` or `pricing_status`.
- Nothing invents or fills in a price, feature, review or test result. The tool can only point at records that fail a rule.

### 3.3 Outputs
- **Machine-readable:** `reports/verification.json` with `{ generatedAt, source, counts, findings: [{ id, check, severity, entityType, entityId, message, field?, suggestion? }], humanReviewQueue: [...] }`.
- **Human-readable:** `reports/verification.md` grouped by severity, then by tool, with links to the admin edit page.
- **Admin dashboard:** a "Needs attention" card (errors and warnings by check), a Verification page listing findings with filters, and the human review queue (records not checked for 30 days, partial pricing).
- **Commands:** `npm run verify:data` (database, offline checks), `npm run verify:links` (network checks, scheduled), `npm run verify:site` (built output, CI). CI fails on **errors**, never on warnings.
- The existing `catalog:report`, `verification-report.mjs` and `affiliate:report` scripts are kept until their output is reproduced by the new reports and compared.
