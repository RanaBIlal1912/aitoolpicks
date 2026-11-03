# Analytics, statistics and data verification (platform upgrade, phase 7)

**Status: built and tested against a local database; nothing is switched on.** The public site collects nothing and still shows the numbers it computes from its JSON files. Design: [platform/06-analytics-statistics-verification.md](platform/06-analytics-statistics-verification.md).

## 1. Statistics (one place for every number)

`src/server/stats/index.ts` is the only code that reads the four SQL views `v_stats_catalog`, `v_stats_content`, `v_stats_affiliate` and `v_stats_submissions` (migration `0004`). They count what the site shows: published, not soft-deleted rows. `getAllStats(sql)` returns everything; `getCategoryStats(sql, slug)` mirrors the category pages.

Adding a statistic means adding a column to a view (a new migration) and to the type in that file. `tests/stats-db.db.test.ts` proves the database numbers equal the site's own `STATS` and `categoryStats()` for the whole catalogue and all 15 category pages, equal a recount of the files for content, and move correctly when a tool is archived, a category hidden or a submission added. The views are readable by the application role only (`security_invoker`, no grant to the public API roles).

The public site keeps computing its figures from the JSON files for now; the snapshot step that would feed it from these views belongs to the hosting phase.

## 2. Analytics: built, dormant

| Piece | What it does |
| --- | --- |
| `src/server/analytics/ingest.ts` | Validates one event with a strict schema, drops bots and unknown ids, rate limits per hashed address, stores only coarse facts. With `enabled` false it reads and stores nothing. |
| `src/server/analytics/handler.ts` | The request rules for a future `/api/events`: POST only, JSON or text, 2 KB cap, same-origin check, always answers 204 for accepted or dropped events so the sender learns nothing. It cannot be mounted in a static export, so it waits for the hosting phase. |
| `src/server/analytics/rollup.ts` | Nightly: rebuild daily totals for days that still have raw events, then delete raw events older than 90 days that are already rolled up (whole days only; nothing unrolled is ever deleted). `npm run analytics:nightly`. |
| `src/server/analytics/summary.ts` | What the admin page reads: totals, top tools with official and affiliate clicks, category visits, sections, submissions per week. Daily table only, never raw rows. |

**Collected only when switched on:** event name, section, tool or category, search length and result count (never the text), button placement, device class (mobile, tablet or desktop), two-letter country. **Never stored:** names, e-mail addresses, IP addresses, user-agent strings, search text, cookies or any browser identifier. A test checks the table has no column that could hold them and that none of the request appears in a stored value. An optional daily-rotating, salted, one-way visitor hash (`ANALYTICS_VISITOR_HASH`, decision D-07) is off by default.

Settings: `ANALYTICS_ENABLED` (default false), `ANALYTICS_SALT`, `ANALYTICS_VISITOR_HASH`. The browser side (`src/lib/analytics.ts`) is unchanged and still sends nothing. **Before switching it on** the privacy page must be updated and, where your visitors' countries require it, consent asked first.

## 3. Data verification

| Command | Needs | Checks |
| --- | --- | --- |
| `npm run verify:data` | database | Missing text; invalid addresses (https, no credentials, no spaces); duplicate names and websites; tools without a category or primary category; pricing marked verified with no plan, pricing older than 90 days, pricing and verification status disagreeing; review method rules; affiliate links on programmes that are not approved, approved programmes with no link; news with a future date or no source address; and a list of what is **waiting for a person**. |
| `npm run verify:site` | `npm run build` first, plus the database | Every internal link and image in the built pages exists; the sitemap lists exactly the published tool, alternatives, category, review, comparison, guide, news and roundup pages. |
| `npm run verify:links` | network | Are the published addresses still reachable, and do they still lead to the same site. One request at a time per host, short timeout, `--limit=N` for a sample. Run on a schedule, never at build. |

Each writes `reports/verification-<kind>.json` and `.md` (findings with a stable id, severity, record, field, message and suggestion, grouped by check) and exits 1 only on **errors**, never on warnings. `--record` also stores the findings as automated rows in the verification history.

**Trust rules, enforced by code and tests:** a finding only points at a record that breaks a rule. An automated row copies the tool's current human-recorded status unchanged, names nobody (the database refuses an automated row with a person), and the tools table is never written. Nothing fills in a price, feature or review. A reachable address does not make a tool "verified". The Verification page in the admin area (permission `verification:read`: owner, admin, editor, reviewer) shows the live data checks and the queue; the front page shows a "needs attention" card.

## 4. What was run

On a throwaway local database with the real imported content and the real built site (329 pages): `verify:data` found 0 errors and 0 warnings and 17 notes (none of the 17 news sources has a recorded human check); `verify:site` found 0 errors across every link, image and sitemap entry; `verify:links --limit=12` made 12 real requests: 6 reachable, 6 refused automated checks (HTTP 403), none broken. **The full link check of all 226 addresses has not been run.** Each check type also has a test that plants a defect and must see it.

## 5. Not done

No scheduled job exists (nightly rollup and link check need a scheduler; availability on the chosen hosting plan is still to be verified in the hosting phase). The event endpoint and the browser transport are not connected. The "Needs attention" figures are computed on each page load, not stored.
