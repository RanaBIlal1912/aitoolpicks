# Hosting migration runbook (platform upgrade, phase 8)

**Status: the repository is ready to be deployed; nothing has been deployed, bought or signed up for.** The public site is still served from GitHub Pages by the unchanged "Deploy to GitHub Pages" workflow (runs only on `main`). No Vercel or Supabase account, project, domain, key or e-mail provider exists. Every step below that touches one of them is yours to approve and, for accounts and purchases, yours to do. Costs: [platform/05-costs.md](platform/05-costs.md). Architecture: [platform/01-architecture.md](platform/01-architecture.md).

## 1. What this phase added

| Piece | What it is | Tested |
| --- | --- | --- |
| Two build modes (`next.config.mjs`) | **Pages** (default): static export under `/aitoolpicks`, exactly as before. **Vercel** (`VERCEL=1` or `DEPLOY_TARGET=vercel`): the same pages, still generated at build time, served from the root of a domain, plus server-only files, real redirects and security headers. | Both build; `tests/hosting.test.ts` checks each mode's configuration. The Vercel build was started with `next start` and exercised with real requests (below). |
| `src/app/api/**/route.vercel.ts` | `/api/health` (liveness), `/api/health/db` (database health, needs `HEALTH_SECRET`), `/api/events` (analytics, answers 204 and does nothing unless `ANALYTICS_ENABLED=true`), `/api/cron/nightly` (needs `CRON_SECRET`). The `.vercel.ts` name means a Pages build ignores them. | Requests against the production build, with and without secrets. |
| Redirects | The 32 old `.html` addresses become real permanent (308) redirects. One mapping is shared by the importer, the Vercel config and the Pages stub, and a test keeps them equal. | Yes |
| Security headers | `X-Frame-Options`, `nosniff`, referrer policy, permissions policy, HSTS (one year, no preload) and a **report-only** Content-Security-Policy. Switch the policy to enforcing only after a week without reports; the 3D scene needs `blob:` workers. | Header values asserted and seen on a live response |
| `robots.txt` | Disallows `/api/` and `/admin/`. | Yes |
| `vercel.json` | One cron: the nightly job once a day. | Parsed by a test |
| `npm run db:backup`, `db:restore-check` | `pg_dump` plus a manifest (every table's row count, a checksum), optional AES-256-GCM encryption (`BACKUP_PASSPHRASE`), and a restore into a scratch database that compares every table and runs the health checks. | Real dump and restore, with and without encryption, including damaged-file and wrong-passphrase cases |
| `scripts/hosting/make-redirect-stub.mjs` | For the cutover: one redirect page per old address (320 pages plus 32 legacy), pointing at the new domain. | Run against the real build |
| `.github/workflows/platform-ci.yml` | Typecheck, lint, tests, migration check, and all three builds on `feat/**` branches and pull requests. Deploys nothing, uses no secrets. | **Not run**: it has never executed on GitHub. |

## 2. Settings

Set in the Vercel project (never in the repository, never with a `NEXT_PUBLIC_` prefix unless it is public):

| Name | For | Secret |
| --- | --- | --- |
| `DATABASE_URL` | Runtime queries; Supabase transaction pooler (port 6543) as role `app` | yes |
| `DATABASE_DIRECT_URL` | Migrations, import, backup; session pooler or direct (port 5432) | yes |
| `NEXT_PUBLIC_SITE_URL` | The new domain, `https://...`, no trailing path | no |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Admin sign-in | the service-role key is very sensitive |
| `HEALTH_SECRET`, `CRON_SECRET` | 16+ characters each; without them the routes answer 404 | yes |
| `ANALYTICS_ENABLED`, `ANALYTICS_SALT`, `ANALYTICS_VISITOR_HASH` | Analytics; leave off | salt: yes |
| `AUDIT_IP_SALT`, `RATE_LIMIT_SALT` | Hashing for audit and limits | yes |
| `AUTH_REQUIRE_MFA` | Second factor for owners and admins | no |
| `DEPLOY_HOOK_URL` (admin app) | Called after publishing so the public site rebuilds | yes |
| `BACKUP_PASSPHRASE` (your computer or scheduler, not Vercel) | Encrypts backups | yes |

Vercel sets `VERCEL=1` itself, so no build setting is needed for the server mode.

## 3. What was run against the Vercel-mode production build

On this computer, `next start` against a throwaway database (analytics first off, then on): `/api/health` 200; `/api/health/db` 401 without or with a wrong secret and 200 with the right one (all checks ok); `/api/cron/nightly` 401 then 200; `/api/events` GET 405, POST 204 with analytics off and nothing stored; with analytics on: valid events stored, an extra field, an unknown tool and a bot dropped, a wrong origin 403, broken JSON 400; `/best-ai-writing-tools.html` and `/chatgpt-vs-grammarly.html` answer 308 to the new addresses; an unknown tool is 404; the security headers are present; `robots.txt` has the new rules; tool pages are prerendered. **Not verified:** anything on Vercel itself (function limits, cold starts, cron delivery, the deploy hook), Supabase's pooler with `prepare: false` under load, and real-browser behaviour of the report-only CSP.

## 4. Cutover plan

Each numbered step needs your explicit go-ahead; nothing here happens by itself. Steps marked **you** need an account, a payment or a dashboard only you can use.

1. **you** Create a Supabase **development** project (Free plan). Turn off public sign-ups; add custom SMTP before inviting anyone (the built-in sender allows 2 e-mails per hour). See [AUTH.md](AUTH.md).
2. Run against it: `npm run db:migrate`, `npm run auth:seed`, `npm run migrate:backup`, `npm run migrate:catalogue -- --dry-run` then without `--dry-run` (each needs `--confirm=<host>`), `npm run auth:bootstrap-owner -- --email=...`. Keep `reports/migration-verification.md` as evidence.
3. **you** Create a Vercel project from this repository, **Preview only** (Hobby is allowed for previews; production must be Pro because of its commercial-use rule, see the cost document). Add the settings above for the development project.
4. Deploy a preview on a `*.vercel.app` address. Check: every page from the sitemap, the 308 redirects, `/api/health`, `/api/health/db`, the headers, the mobile audit, Lighthouse. Run `npm run verify:site` and `verify:links` (full) against it.
5. Deploy the admin app as a second Vercel project (root directory `admin/`), also preview only. Sign in with the invited owner and walk through the sections.
6. **you** Production: a Supabase **Pro** project (backups), a Vercel **Pro** project, a domain. Run step 2 against the production database, then `npm run db:backup` and `npm run db:restore-check` on that first backup.
7. Point the domain at Vercel (DNS change at your registrar; lower the record's TTL a day before). Add the domain in Google Search Console as a new property and submit the new sitemap. The old property's sitemap currently shows "could not fetch", so little is lost by moving now.
8. Only when the new site has run cleanly for as long as you choose: `npm run build`, then `node scripts/hosting/make-redirect-stub.mjs --to=https://your-domain`, and publish the `redirect-stub/` folder as the GitHub Pages site. Old links and search results then land on the same pages on the new domain (a `canonical` link plus an instant refresh; GitHub Pages cannot send a real 301, and whether Google accepts a formal change of address from a `github.io` path is **not verified**).
9. Switching the public pages to read from the database (`CONTENT_SOURCE=db`) is a **separate** later decision. Until then the build reads the JSON files, which stay in the repository.

## 5. Rollback

- **Before step 7:** do nothing; the live site is untouched.
- **After step 7:** point the DNS record back at GitHub Pages (keep the old site published until you are satisfied; if the stub is already live, re-run the normal Pages deployment from `main`). Vercel keeps earlier deployments; promoting a previous one is a dashboard action (availability on your plan is **not verified**).
- **Content:** the originals in `content/` and `src/data/` are never removed by any step.
- **Database:** restore the last backup (section 6), or set `CONTENT_SOURCE=json` once that switch exists.

## 6. Backup and restore

```
BACKUP_PASSPHRASE=<12+ characters> npm run db:backup                       # needs pg_dump; reads DATABASE_DIRECT_URL
BACKUP_PASSPHRASE=... npm run db:restore-check -- --file=backups/db/<file>.dump --into=postgres://user@localhost:5432/postgres
```

- A backup is a dump plus `<file>.manifest.json`. The dump holds **everything**, including team e-mail addresses and the audit log: keep it private and encrypted, and keep the passphrase somewhere other than next to the file. `backups/` is git-ignored.
- `db:restore-check` restores into a scratch database on a **local** PostgreSQL (it refuses any other server), compares every table with the manifest, runs the health checks and drops the scratch database. Run it after every first backup of a new environment and then regularly (weekly is proposed). A backup that has not been restored is not a backup.
- To restore for real: create an empty database, run `npm run db:migrate` so the roles exist, then `pg_restore --no-owner --clean --if-exists --dbname=<url> <file>` (decrypt first with the same passphrase; the helper functions are in `src/server/db/backup.ts`). Supabase Pro also keeps daily backups for 7 days (official pricing page); the Free plan keeps none.
- Where the weekly dump is stored, and the scheduler that runs it, are **your decisions and are not set up**.
- **If the last owner is locked out:** the bootstrap command refuses once an owner exists. A database administrator can run `update team_members set status = 'active' where email = '...'` for a disabled owner, or insert a new owner row with `status = 'invited'` and sign in with that confirmed address; either is an audit gap to note by hand.
- **Rotating the service-role key:** create the new key in Supabase, update it in Vercel, redeploy the admin project, then revoke the old one.

## 7. Not done, and why

The scheduler for the link check (Vercel Hobby cron allows once a day, Pro once a minute; a full link check takes minutes and would need its own job); the browser transport for analytics and the privacy page update; submissions stored in the database (the public form still uses GitHub issues); uptime monitoring and error monitoring (no provider chosen; free tiers unverified); the CI workflow has never run.
