# 4. Data migration and hosting migration

Design only. The public site stays on GitHub Pages and is not touched until you approve Phase 8.

## 1. Data migration strategy (Phase 4)

### 1.1 Principles
- **Repeatable.** The import can be run many times against an empty or existing database; rows are matched by `slug` and updated, not duplicated. A `--dry-run` flag prints what would change and writes nothing.
- **Non-destructive.** The original files in `content/` and `src/data/` are only read. Nothing is deleted or overwritten.
- **Verified before anything switches.** The build can read either source (`CONTENT_SOURCE=json|db`); the two must produce identical output before the database becomes the default.

### 1.2 Steps
| Step | What happens | Output |
| --- | --- | --- |
| 0 Backup | Git tag `pre-platform-migration`; a copy of `content/` and the TypeScript data files outside the repository with a SHA-256 manifest | `backups/<date>/MANIFEST.sha256` |
| 1 Inventory | The read-only inventory script from Phase 1 (counts and integrity checks) is turned into `scripts/migrate/inventory.mjs` and run again | `reports/migration-inventory.json` and `.md` |
| 2 Parse | News, roundups, comparisons, topics and the 5 inline reviews are read from TypeScript by a typed loader (these are the only sources that are not JSON) | in memory |
| 3 Validate | Every record goes through the Zod schemas (ported from `catalog-lib.mjs` and `review-trust.ts`); the import stops on the first schema error | error list |
| 4 Import | One transaction per entity group, in dependency order: companies, categories, tools, tool_categories, plans, sources, alternatives, media, reviews, authors, blog, comparisons, news, roundups, models, affiliate, redirects, settings | rows plus `migration_runs` log |
| 5 Verify | See 1.3 | `reports/migration-verification.json` and `.md` |
| 6 Switch (separate approval) | `CONTENT_SOURCE=db` in a preview deployment first | |

### 1.3 Verification report (all must pass)
1. **Counts** match the inventory: 69 tools, 288 plans, 139 sources, 15 categories, 36 subcategories, 113 tool-category links, 65 companies, 17 reviews, 30 articles, 2 comparisons, 17 news items, 6 roundups with 29 picks, 9 models, 15 affiliate entries, 351 media files catalogued, 32 legacy redirects.
2. **Round trip:** export the database back to the original JSON shape and compare it with the original files field by field (normalised for key order); the difference must be empty.
3. **Relationships:** no orphan row, every foreign key resolves, exactly one primary category per tool.
4. **Slugs and URLs:** the 320-URL list produced from the database snapshot equals the current `sitemap.xml` as a set.
5. **Review rules:** every review is `documentation`, none has a testing row; the Zod rules reject a deliberately bad hands-on record.
6. **Affiliate:** statuses equal `affiliate.json`; no `affiliate_links` row exists; nothing is approved.
7. **Render parity:** build the site from JSON and from the database and compare the text of all 320 generated pages; run the 243 existing tests against both.
8. **Idempotence:** run the import twice; the second run changes zero rows.

### 1.4 Rollback
- Before cutover: do nothing; the JSON source is still the default. Drop the schema or `truncate` and re-import.
- After cutover: set `CONTENT_SOURCE=json` and redeploy (the original files are still in the repository); restore the database from the last backup if its contents are the problem.
- Originals are removed from the repository only after a separate, explicit approval from you.

## 2. Current deployment limitations (summary)
See [01-architecture.md](01-architecture.md#1-starting-point-facts-from-the-phase-1-audit). In short: a static export cannot run cookies, Route Handlers that read the request, Server Actions, redirects, headers, Proxy or ISR; GitHub Pages cannot send real redirects; the site sits under the `/aitoolpicks` path of `ranabilal1912.github.io`.

## 3. Hosting migration plan (Phase 8)

### 3.1 Routes affected
- **Unchanged paths** (every public URL keeps its path and trailing slash). Only the host changes (from `ranabilal1912.github.io/aitoolpicks` to the new domain), because the base path is removed.
- **New:** `/admin/**`, `/api/events`, `/api/submissions`, `/api/health`, `/api/health/db`.
- **Changed behaviour:** the 32 legacy `.html` pages become real redirects; `robots.txt` adds `Disallow` for `/admin/` and `/api/`.

### 3.2 SEO and sitemap implications
- Every canonical URL, Open Graph URL, JSON-LD id, sitemap entry, RSS link and `manifest` start URL changes because `SITE.url` changes. They are all generated from `SITE.url`, so one environment variable moves them.
- GitHub Pages cannot send a 301. The old site would be replaced by a small stub deployment: one page per old URL with `rel="canonical"` and an immediate redirect to the new URL (the same technique `legacy-redirects.mjs` uses today), generated from the 320-URL sitemap.
- Google Search Console: the site is not indexed yet (the sitemap still shows "Couldn't fetch" for the old property), so the cost of moving now is small. Add the new domain as a new property, submit the new sitemap, keep the old property for the stub period. Whether a formal "change of address" is possible for a `github.io` path is **not verified** and is not assumed.
- `lastmod` in the sitemap comes from each row's real `updated_at`.
- **Recommendation:** buy the domain first (D-08), then do the move.

### 3.3 Deployment sequence
1. Create the Vercel project from the repository with the Preview environment only; point it at a **development** Supabase project.
2. Run the data migration against that project; run the verification report.
3. Preview deployment on a `*.vercel.app` address (noindex) and run the full QA: type checks, tests, route check of all 320 URLs, mobile audit (the Phase 6 harness), permissions tests, Lighthouse.
4. Create the production Supabase project (paid plan, see doc 05), run the migration, take a first backup.
5. Production Vercel deployment on the new domain (DNS change at the registrar, which you control).
6. Only then replace the GitHub Pages site with the redirect stub.

### 3.4 Rollback strategy
- Vercel keeps previous deployments; "Instant Rollback" to the prior production deployment is a dashboard action. (Plan availability of this feature is **not verified**.)
- DNS: keep the old Pages site untouched until the new site has run cleanly for a period you choose; rolling back is switching DNS back (the domain's TTL is set low before the cutover).
- Database: backup restore (below); content rollback by `CONTENT_SOURCE=json`.

## 4. Continuous integration
`deploy.yml` keeps running typecheck, tests and the catalog report on every push; the deploy job to Pages is removed at cutover. ESLint is added (D-11) and runs in the same workflow. A migration check job applies all migrations to an empty Postgres and asserts RLS is on for every table.

## 5. Environments
| Environment | Database | Purpose |
| --- | --- | --- |
| Local | Postgres in Docker, or PGlite (D-12) | development and automated tests |
| Preview | Supabase development project (free plan) | QA of migration and admin; may be paused after a week of inactivity |
| Production | Supabase production project (paid plan) | the live site |

Preview and production never share a database, keys or deploy hooks.

## 6. Backup and recovery
- **Provider backups:** Supabase Pro includes daily backups kept for 7 days (official pricing page). Point-in-time recovery is a separate add-on ($100 per month per 7 days of retention) and is not recommended at launch. The Free plan includes no backups.
- **Our own export:** a scheduled `pg_dump` (via the direct connection) written to storage outside Supabase and Vercel, encrypted, with a weekly restore test into a scratch database. The data is tiny (about 1 MB of content), so cost is negligible; where the dump is stored is a Phase 3 decision.
- **Recovery targets (proposed):** restore the content database within a working day; data loss window up to 24 hours with provider backups only, near zero if you choose to pay for point-in-time recovery.
- **Runbook** (Phase 3 deliverable): how to restore, how to rotate keys, how to switch the build to `CONTENT_SOURCE=json`, how to roll back a deployment.
