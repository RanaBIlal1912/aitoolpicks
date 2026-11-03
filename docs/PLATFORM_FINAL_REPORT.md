# Platform upgrade: final report (phase 9)

Branch `feat/platform-architecture`, last commit before this report `55db256`. **Nothing is merged, deployed, bought or signed up for.** `main` is at `4c9dc7b`, untouched. The public website is still the static site on GitHub Pages and, as shown below, builds to the same files it did before this work.

## 1. What exists now

| Phase | Delivered | Commit | Tests after |
| --- | --- | --- | --- |
| 1 Audit | Read-only audit of the existing site and data | n/a | 243 (existing) |
| 2 Architecture | Design documents: architecture (one app on Vercel, public pages static), database, security and access, migration and hosting, costs, analytics and verification | `573c628` | |
| 3 Database | Drizzle schema (39 tables, 25 enums), migrations with rules as constraints and triggers, Row Level Security on every table, environment validation, health checks, test database that needs no Docker, ESLint | `93dc05a`, `bb0f0ca` | 342 |
| 4 Data migration | Repeatable, atomic, non-destructive import of everything the site shows from files (69 tools, 288 plans, 139 sources, 65 companies, 15 categories and 36 subcategories, 17 reviews, 30 articles, 2 comparisons, 17 news items, 6 roundups, 9 models, 15 affiliate programmes, 32 redirects); round-trip verification in file order; backup script | `448167b`, `7ffb91f` | 366 |
| 5 Authentication | Six roles and 43 permissions defined in one file and seeded; session check against the auth server with the member and role read from the database on every request; team rules (no self-change, only an owner grants owner, last owner protected twice); audit writer with redaction; rate limiter | `f8a9451` | 425 |
| 6 Admin | Separate Next.js app in `admin/`: sign-in, overview, tools, categories, reviews, blog, news, affiliate, submissions, verification, analytics, team, settings, audit log; status changes, description edits, team management | `65c0419`, `ef6bbc5` | 455 |
| 7 Analytics, statistics, verification | One statistics service over SQL views, tested equal to the site's own figures; analytics ingest, rollup and retention (off by default, nothing personal stored); data, built-site and link verification with JSON and Markdown reports | `be0a6f3` | 505 |
| 8 Hosting | A second build mode for Vercel, health, events and cron routes, real redirects, security headers, backup and restore-check tools, cutover redirect stub, CI workflow, runbook | `55db256` | 528 |

About 285 tests were added to the 243 that existed.

## 2. Final QA, run from a fresh clone of the pushed branch

All of this ran on code cloned from GitHub into a short folder path and installed with `npm ci`, so it tests what was pushed, not my working folder.

| Check | Result |
| --- | --- |
| `npm run typecheck` | clean |
| `npm run lint` | 0 errors, 37 warnings (all in public-site code that existed before; the rules were downgraded so lint can run without rewriting site code) |
| `npm test` | **528 of 528 pass, none skipped** (the 27 tests that read the built site run after `npm run build`) |
| Static export (GitHub Pages) | 329 pages |
| Vercel-mode build | 329 pages, API routes built |
| Admin app build | succeeds, all routes dynamic |
| `drizzle-kit check` | migration history consistent |
| Every operator command in order on a throwaway database (migrate, seed, backup of files, import dry run, import, import again, bootstrap owner, verify data, verify built site, analytics nightly, health, encrypted backup, restore check) | all succeed; second import changes 0 rows; restore: 39 tables, 1,358 rows, health ok |
| Data verification on the real content | 0 errors, 0 warnings, 17 notes (no news source has a recorded human check) |
| Built-site verification (every link, image and sitemap entry of the 329-page build) | 0 errors |
| `npm audit` | **0 vulnerabilities in production dependencies**; 20 moderate advisories, all in development tools (ESLint and its plugins, drizzle-kit's build tool). The offered "fixes" are major downgrades, so none was applied. |
| Tracked files | only `.env.example` among environment files; no backups, build output or `node_modules` tracked; a test scans tracked files for connection strings with passwords, JWT-style keys and private keys |

### The public website is unchanged

I built the site from the commit before this work (`ee74d15`) and from the final branch, both from fresh clones with identical line endings, and compared the two `out/` folders after ignoring only the random build id: **2,380 files in each, 2,379 byte-identical, one different: `robots.txt`**, which now also says `Disallow: /api/` and `Disallow: /admin/`. This check found two problems that I fixed: a word in one of my design documents ("container") made Tailwind generate one unused CSS rule, and the comparison is only valid when both sides use the same line endings. Lesson for the future: Tailwind scans every file in the project, including documents,, so after adding documents re-run this comparison: build both versions from clean checkouts with the same line endings and compare the two `out/` folders file by file.

## 3. Verified, and not verified

**Verified by running it:** the schema and its rules (each rule has a case that must be refused, and three were removed to prove the tests catch them); the importer and its round trip; permissions for every role; sign-in, sign-out, refresh and the admin pages in a real browser against a local database; the Vercel-mode production build with real requests; backup and restore with real `pg_dump` and `pg_restore`; the verification tools against real content; the 12-address link sample.

**Not verified, because it needs an account or the real service:**
- Anything on **Supabase** (Auth, the pooler with prepared statements off, SMTP, MFA) and anything on **Vercel** (function limits, cold starts, cron delivery, the deploy hook, instant rollback). The Supabase provider is tested against a fake server only.
- **TOTP multi-factor cost** (not stated on the pages read; phone MFA is about $75 a month).
- The **GitHub Actions workflow** `platform-ci.yml` has never run.
- The **full link check** of all 226 published addresses (only 12 were requested).
- **Real-browser behaviour** of the report-only Content-Security-Policy and a Lighthouse run of the Vercel build.
- Whether Google accepts a **change of address** from a `github.io` path.

## 4. What is deliberately not built

Creating tools, reviews, articles and news in the admin; editing pricing, verification, review method, affiliate data and text (they need the revision and second-approver workflow); media upload; settings editing; the set-password page for invitations; MFA enrolment screens; storing submissions in the database (the public form still creates GitHub issues); the browser analytics transport and the privacy-page update; scheduler for link checks; uptime and error monitoring; render parity of the public pages built from the database (`CONTENT_SOURCE=db`); the importer's `media_assets` and `site_settings`. Each is listed with its reason in the phase documents.

## 5. Things you should know

- **Two branches.** `feat/platform-architecture` contains everything from `feat/site-improvements` plus the platform work (19 commits ahead of `main`). Merging the platform branch merges both; there is no need to merge them separately.
- **TypeScript version.** To make ESLint work, `typescript` resolves to the 6.x line (`@typescript/typescript6`) because typescript-eslint does not support TypeScript 7 yet. Reverting commit `bb0f0ca` returns to TypeScript 7 without lint.
- **Windows.** The project folder path is long enough that installing `drizzle-kit` needed a workaround (`--ignore-scripts` and a short-path esbuild); a normal short folder or Linux CI does not. Line endings differ between a Windows checkout and Linux; the importer stores article HTML with Unix endings so the database does not depend on the machine.
- **`AGENTS.md`.** Next.js generates an `AGENTS.md` file at the project root when you run it; it is untracked and not part of this work. `admin/AGENTS.md` is ignored.
- **Reports in `reports/`** were produced on throwaway local databases; they are evidence of what ran, not of a live system.

## 6. Decisions still open (from `docs/platform/README.md`)

D-01 rebuild-on-publish (built as the deploy hook, untested on Vercel); D-04 media storage hybrid (not built); D-05 affiliate, settings and audit access (implemented as proposed); D-06 two-person rule (database rule exists, workflow not built); D-07 analytics (built, off; the privacy page needs updating first); D-08 domain (not bought); D-09 error monitoring (none chosen); D-10 SMTP provider (none chosen); D-13 article HTML sanitiser (needed before article text becomes editable); D-14 revision table (exists, unused).

## 7. Cost summary

Nothing has been spent. Minimum production from [platform/05-costs.md](platform/05-costs.md): about **$45 a month** (Vercel Pro $20 + Supabase Pro $25; up to about $65 if the first Vercel developer seat is charged separately) plus a domain. Vercel Hobby is not allowed for a site with affiliate links. Development and previews can run on free plans. Prices are from official pages read on 2026-11-03.

## 8. Recommended order from here

1. Review and merge `feat/platform-architecture` into `main` **only if you want the platform code on `main`**. Because the public build is unchanged and nothing deploys from it except the existing Pages workflow, merging is safe for the live site; I have not done it.
2. Create the Supabase development project and run steps 1 to 5 of [HOSTING.md](HOSTING.md), including the full link check.
3. Build the revision and approval workflow, then creating and editing content in the admin.
4. Decide on a domain, plans and monitoring, then follow the production steps in [HOSTING.md](HOSTING.md).
