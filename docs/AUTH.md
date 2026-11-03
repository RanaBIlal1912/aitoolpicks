# Authentication and access (platform upgrade, phase 5)

**Status: server-side library, tested, not connected to anything.** There is no login page, no admin area and no Supabase project yet, and the public site is still the static export on GitHub Pages. This phase builds and proves the rules the admin area (phase 6) will stand on. Design: [docs/platform/03-security-and-access.md](platform/03-security-and-access.md).

## What exists

| Path | Purpose |
| --- | --- |
| `src/server/auth/permissions.ts` | The one definition of roles, permissions and scopes. Everything else is derived from it. |
| `src/server/auth/seed.ts` | Makes the `roles`, `permissions` and `role_permissions` tables equal to that file (add what is missing, remove what is not in the file, audit the change). |
| `src/server/auth/provider.ts` | The sign-in provider interface and the Supabase implementation. It uses `fetch` only; no Supabase library is installed. |
| `src/server/auth/authorize.ts` | `requireMember(deps, token, permission)`: the gate for every admin page, Server Action and Route Handler. Also `canActOnRow` and `canChangeFields` for scoped grants. |
| `src/server/auth/team.ts` | Invite, change role, disable, enable, each with its rules and an audit row in the same transaction. |
| `src/server/auth/audit.ts` | Audit writer: secrets redacted, IP stored only as a salted hash. |
| `src/server/auth/rate-limit.ts` | Fixed-window limiter in `rate_limit_hits`; keys are hashed. |
| `src/server/auth/server.ts` | The entry for Next.js code (`server-only`). Builds the dependencies from the environment. |
| `scripts/auth/seed-access.ts`, `bootstrap-owner.ts` | Operator commands (below). |

## How a request is checked

1. The token comes from the session cookie (phase 6 sets it).
2. `provider.verifyAccessToken` asks the auth server whether it is valid **right now**. A forged or expired token is `401`. If the auth server cannot be reached the answer is `503`, never a pass.
3. The member and role are read from **our database on every request**, so a disabled member or a changed role takes effect immediately, not when the token expires.
4. An invited member becomes active the first time their **confirmed** e-mail address signs in; an unconfirmed address or an address already linked to someone else is refused.
5. The permission is looked up in `role_permissions` (`403` if missing). Scoped grants are checked where the row is known: a contributor changes only their own drafts (`canActOnRow`); an editor publishing a tool may not touch pricing, verification, method or affiliate fields (`canChangeFields`).
6. When `AUTH_REQUIRE_MFA=true`, owners and admins must hold an `aal2` session (`403 mfa_required` otherwise).

## Rules beyond the permission matrix

Nobody changes their own role or disables themselves. Only an owner grants or changes the owner role. The last active owner cannot be demoted or disabled: checked in `team.ts` and, independently, by a database trigger (tested with a caller whose view is out of date). A failed invitation e-mail rolls the new member back, so nobody is left half-invited. Disabling is decided by the database row; the block at the auth server is best effort and the answer says if it failed.

## Commands

| Command | What it does |
| --- | --- |
| `npm run auth:seed` | Sync roles, permissions and grants from `permissions.ts`. Run after every migration and whenever `permissions.ts` changes. Safe to repeat. |
| `npm run auth:bootstrap-owner -- --email=you@example.com` | Add the first owner (status `invited`). Refuses if an owner exists. Does not contact the auth server. A database that is not on this computer needs `--confirm=<host>`. |

## Setting up the Supabase side (not done; needs your approval and an account)

1. Create a **development** project first. Do not use production for tests.
2. Authentication > Sign In / Providers: **turn off "Allow new users to sign up"**. This is a dashboard setting the code cannot check. As a second line of defence, an address that is not an invited team member never becomes one.
3. Authentication > SMTP: add a custom SMTP provider. The built-in sender is limited to 2 e-mails per hour per project (official rate-limit page), so invitations will fail without one.
4. Authentication > URL configuration: add the redirect URL(s) of the admin area once phase 6/8 define them.
5. Put the project URL, anon key and service-role key in `.env.local` (names in `.env.example`). The service-role key is only ever read in `src/server/env.ts`, `src/server/auth/provider.ts` and `src/server/auth/server.ts` (a test enforces this) and is never prefixed `NEXT_PUBLIC_`.
6. Run `npm run db:migrate`, `npm run auth:seed`, then `npm run auth:bootstrap-owner -- --email=...` against that project's database, then invite or create that same address in Authentication > Users and sign in.

## What was verified about Supabase (official pages, fetched 2026-11-03)

- Multi-factor authentication supports an authenticator app (TOTP) and phone messaging. The pages I read do not say whether TOTP is free on every plan or whether it carries a charge; **that is not verified**. Phone MFA is a paid add-on at $0.1027 per hour (about $75 per month for the first project) plus the SMS provider's charges, not covered by the spend cap.
- Limiting session lifetime (time-box and inactivity timeout) is **Pro plan and up**; neither takes effect until the next token refresh. The default access token lifetime is 1 hour. Refresh tokens do not expire but can be used once.
- Consequence for the design: on the Free plan a team session cannot be time-boxed, so the application keeps the check against our database on every request, which means a disabled member loses access at once regardless.

## Not done in this phase

No login or logout routes and no cookie handling (a static export cannot run them; they arrive with the hosting change). No MFA enrolment screens. No invitation e-mail has been sent and no Supabase project, key or account exists. The rate limiter is built and tested but not attached to any route yet.
