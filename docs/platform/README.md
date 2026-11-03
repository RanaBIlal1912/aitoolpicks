# AI Tool Picks platform upgrade: architecture (Phase 2)

Status: **design only**. No code, dependency, configuration, migration or deployment has been added by this phase. Everything here is proposed work until you approve it.

Branch: `feat/platform-architecture` (from `feat/site-improvements` at `ee74d15`). Phase 1 audit findings are summarised in [01-architecture.md](01-architecture.md#1-starting-point-facts-from-the-phase-1-audit).

| Document | What it covers |
| --- | --- |
| [01-architecture.md](01-architecture.md) | Final architecture, why Option B, publish flow, rendering per route, config changes, environment variables, monitoring, errors, health checks |
| [02-database.md](02-database.md) | ER diagram, every table, constraints and indexes, state model, mapping from today's JSON and TypeScript data |
| [03-security-and-access.md](03-security-and-access.md) | Authentication, roles and permission matrix, enforcement, Row Level Security, rate limiting, audit log, threat model |
| [04-migration-and-hosting.md](04-migration-and-hosting.md) | Data migration, verification, rollback, hosting migration, SEO and sitemap, deployment and rollback |
| [05-costs.md](05-costs.md) | Prices and limits from official pages (fetched 2026-11-03), scenarios, what is still unverified |
| [06-analytics-statistics-verification.md](06-analytics-statistics-verification.md) | Event tracking, privacy, the one statistics service, the data verification workflow |

## Decisions that need your answer before Phase 3

| # | Decision | My recommendation | Why |
| --- | --- | --- | --- |
| D-01 | How public pages refresh after an edit | **Rebuild on publish** (a deploy hook), not on-demand ISR | Keeps the public site fully static, so it keeps working if the database is down or paused, and reuses today's synchronous data code. Publishing takes a build plus a deploy (a few minutes; not yet measured on Vercel). ISR can be added later. |
| D-02 | What happens to `content/*.json` after the migration | Keep them untouched as the original seed and as a last-known-good fallback; regenerate nothing into them | You asked that originals are never deleted or overwritten. |
| D-03 | Authentication provider | Supabase Auth, invitations only, public sign-up off | Matches your preferred stack; roles and permissions stay in our own tables so we are not locked in. |
| D-04 | Media storage | **Hybrid**: existing 351 files stay in `public/` (metadata imported); new uploads go to Supabase Storage | Moves no existing image, so no risk to today's pages. |
| D-05 | Affiliate, settings and audit access | OWNER and ADMIN manage affiliate; only OWNER edits settings and reads the audit log; ADMIN can read settings | Your spec gave no role for these. |
| D-06 | Approval of important changes | **Two-person rule** for sensitive fields (prices, verification status, review method, affiliate status) once there are two or more people who can publish | You asked that important public changes need human approval. |
| D-07 | Analytics | Built but **off by default**; privacy-first (no cookies, no IP stored); turning it on is a separate decision | Matches today's disabled behaviour. |
| D-08 | Domain | Buy a custom domain **before** the hosting move | The site is not indexed yet, so moving now costs little; later costs more. I will not buy it. |
| D-09 | Error monitoring | Sentry free plan to start (5k errors, 1 user), or Vercel logs only | See [05-costs.md](05-costs.md). |
| D-10 | Email for invitations | A custom SMTP provider (Resend free plan is enough to start) | Supabase's built-in sender allows 2 emails per hour. |
| D-11 | Lint | Add ESLint as a dev dependency in Phase 3 | The project has none today. |
| D-12 | Test database | Local Postgres in Docker (needs Docker Desktop started) or PGlite | The Docker engine is not running on this computer right now. |
| D-13 | Article HTML safety | Add an allow-list HTML sanitizer when admins can edit article HTML | Today the HTML is trusted repository content; once edited in a dashboard it is a stored-XSS risk. |
| D-14 | Revision history table | Include it (small) so "preview before publishing" and the approval rule can show a diff | Optional; can be dropped. |

Nothing in this folder buys, activates or installs anything. The Mermaid diagrams are text and were **not rendered** here; view them on GitHub or in a Mermaid-aware editor and tell me if one fails to draw.
