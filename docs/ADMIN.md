# Admin area (platform upgrade, phase 6)

**Status: built and run locally, not deployed.** The admin area is a separate Next.js app in `admin/`. It has never run against a hosted database or a real Supabase project, and no one outside this computer can reach it. The public website is unchanged and still deploys from GitHub Pages.

## Why a separate app

The public site is a static export: it cannot run sign-in, cookies, Server Actions or request-time database reads, and it shares one root layout with the public header and footer. Adding `/admin` to it would have meant moving every public page or weakening the export. `admin/` is its own app that imports the same `src/server` code (database, auth, import, data layer), so the rules are written once. At the hosting phase it can be deployed as its own project, or folded under `/admin` of one app; the code does not change. This differs from the single-app wording of the Phase 2 design.

## Running it on your computer

You need a PostgreSQL database that has been migrated (`npm run db:migrate`), seeded (`npm run auth:seed`) and imported (`npm run migrate:catalogue`), and at least one team member (`npm run auth:bootstrap-owner -- --email=you@example.com`).

```
DATABASE_URL=postgres://...@localhost:5432/yourdb DATABASE_SSL=disable AUTH_DEV_PROVIDER=1 npm run admin:dev
```

Open http://localhost:3100. `AUTH_DEV_PROVIDER=1` turns on a development sign-in that accepts the password shown on the sign-in page for any e-mail address that is on the team. It refuses to start unless `NODE_ENV` is not production **and** the database is on this computer (tested). Without that flag the app uses Supabase Auth and needs `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (see [AUTH.md](AUTH.md)). `npm run admin:build` makes the production build.

## What each section does today

| Section | Today |
| --- | --- |
| Overview | Counts by status for what the role may see, tools without verified pricing, new submissions, database health (owners and admins), recent activity (owners). |
| Tools | List with search, status filter and paging. Detail with plans, sources, categories, review and affiliate status. **Edit** the one-line description, description and key feature; **change status** (draft, in review, published, archived). |
| Categories | List with tool counts; **show or hide** a category. |
| Reviews, Blog, AI News | List and detail (blog shows the HTML source); **change status**. Editing the text is not available yet. |
| Affiliate | Read-only list of programme statuses and stored links. |
| Submissions | Read-only list (empty: the public form still sends submissions to GitHub). |
| Analytics | A statement that analytics are off. |
| Team | List; **invite**, **change role**, **disable**, **enable**. |
| Settings | Read-only: how this deployment is configured, and stored site settings. |
| Audit log | Filterable, read-only list with before and after. |

## Rules that hold on every screen

- Every page and every action calls `requirePage(path, permission)` first (a test checks that none forgets); the database, not a cookie claim, decides what the member may do on each request.
- Every change goes through `src/server/admin/mutations.ts` or `src/server/auth/team.ts`, which check the permission and the row or field scope, change the row, and write the audit row in one transaction.
- Publishing, archiving or unpublishing something that was published calls the deploy hook (`DEPLOY_HOOK_URL`) so the public site can rebuild. A failed or missing hook never undoes the change; the page says which happened.
- Sign-in: per-address and per-source rate limits, generic error text, every success and failure audited, cookies `HttpOnly`, `SameSite=Lax`, `Secure` in production, responses `no-store`, framing denied, robots disallowed.

## Not built yet (deliberately)

- **Creating** tools, reviews, articles and news, and editing **pricing, verification, review method, affiliate data, and article/review/news text**. These are the sensitive changes that need the revision workflow and, when two people can publish, a second approver (design section 5). Offering them before that exists would let one person change what readers trust with no check.
- Media upload and library, site-settings editing, the accept-invitation / set-password page (the invitation link lands on the Supabase-hosted flow until it is built), MFA enrolment screens, analytics charts.
- The refresh redirect always returns to the overview after a fresh sign-in (the layout does not know the deep link).
- Nothing here has been tested against real Supabase Auth; the provider is tested against a fake server only.
