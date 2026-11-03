# 3. Security, authentication and team access

Design only. Facts about Next.js come from the 16.4.3 documentation shipped in `node_modules`; facts about Supabase and Vercel come from their official pages fetched on 2026-11-03 and are marked. Anything not verified is labelled so.

## 1. Who can sign in

Only internal team accounts. **Public sign-up is switched off.** The OWNER invites people by email; an invitation creates a `team_members` row (`status = invited`) and a Supabase Auth user through the server-side admin API using the service-role key (never in the browser). There are no customer accounts, no visitor accounts and no public registration endpoint.

- **Auth provider:** Supabase Auth (decision D-03). If it ever has to be replaced, only `src/server/auth/` changes, because roles, permissions and members live in our own tables.
- **Invitation email:** Supabase's built-in sender is limited to **2 emails per hour per project** (official rate-limit page), so a custom SMTP provider is required before inviting a team (D-10).
- **Auth endpoint limits** (official, defaults): sign-in, sign-up, recovery, magic link and OTP 30 requests per 5 minutes per IP; token refresh 150 per 5 minutes per IP.
- **Multi-factor authentication:** recommended for OWNER and ADMIN. Supabase support for it and its cost **have not been verified yet**; this is a Phase 5 research item, not an assumption.

## 2. Session handling

- Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax`, set by the server, with short-lived access tokens and refresh handled server-side.
- Next.js's authentication guide recommends a **Data Access Layer** and says Proxy should only do optimistic checks. We follow that:
  1. `src/proxy.ts` (matcher: `/admin/:path*`) redirects visitors with no session cookie to the login page. This is a convenience, **not** the security boundary.
  2. Every admin page, Server Action and Route Handler calls `requireMember(permission)` from a `server-only` module. It validates the session with the auth server (not just by reading the cookie), loads the member and role from the database, rejects `disabled` members, and checks the permission. A request without a valid session gets 401; without the permission 403.
- A disabled member loses access on the next request (the check hits the database every time, not a cached token claim).
- Idle timeout and absolute lifetime values will be chosen in Phase 5 and written into settings.

## 3. Roles and permissions

Permission keys are `resource:action`. The matrix is stored in `roles`, `permissions` and `role_permissions`, seeded from one file in code, and tested.

| Permission | OWNER | ADMIN | EDITOR | REVIEWER | ANALYST | CONTRIBUTOR |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| `tools:read` | yes | yes | yes | yes | no | yes |
| `tools:create`, `tools:update` | yes | yes | yes | no | no | drafts only |
| `tools:publish`, `tools:archive` | yes | yes | yes (non-sensitive fields) | no | no | no |
| `tools:delete` (hard) | yes | no | no | no | no | no |
| `categories:*` (create, update, assign, visibility) | yes | yes | yes | no | no | no |
| `reviews:read` | yes | yes | yes | yes | no | yes |
| `reviews:create`, `reviews:update` | yes | yes | no | yes | no | drafts only |
| `reviews:publish` | yes | yes | no | yes (needs a second approver, see section 5) | no | no |
| `verification:write` (human verification records) | yes | yes | no | yes | no | no |
| `blog:*`, `news:*` (create, update) | yes | yes | yes | no | no | drafts only |
| `blog:publish`, `news:publish`, `*:archive` | yes | yes | yes | no | no | no |
| `affiliate:read` | yes | yes | yes | no | no | no |
| `affiliate:write` | yes | yes | no | no | no | no |
| `submissions:read`, `submissions:decide` | yes | yes | no | no | no | no |
| `media:upload` | yes | yes | yes | yes | no | yes (to own drafts) |
| `media:delete` | yes | yes | no | no | no | no |
| `analytics:read` | yes | yes | yes | no | yes | no |
| `team:read` | yes | yes | no | no | no | no |
| `team:invite`, `team:role`, `team:disable` | yes | no | no | no | no | no |
| `settings:read` | yes | yes | no | no | no | no |
| `settings:write` | yes | no | no | no | no | no |
| `audit:read` | yes | no | no | no | no | no |
| `system:health` | yes | yes | no | no | no | no |

Decisions flagged for you (D-05): the affiliate, settings and audit rows are my proposal because your spec did not assign them.

Rules that are not in the matrix:
- Nobody can change their own role or disable themselves; the last active OWNER can never be demoted or disabled.
- Only an OWNER can grant OWNER. An ADMIN cannot create, edit or see OWNER-only data.
- A CONTRIBUTOR can only edit rows they created while those rows are `draft` or `in_review` (checked in the repository function, not in the form).
- A role change takes effect on the next request and is written to the audit log.

## 4. Enforcement points (defence in depth)

| Layer | Control |
| --- | --- |
| Browser | Buttons hidden when not permitted (convenience only). |
| Proxy | Redirects unauthenticated visitors away from `/admin`. Optimistic only. |
| Data access layer | `requireMember(permission)` on every read and write. All repository functions take the member as an argument; none can be called without one. |
| Input | Zod schema for every Server Action and Route Handler; unknown fields rejected. |
| Database | Row Level Security enabled on every table with **no** policy for `anon` or `authenticated`, so Supabase's automatic data API cannot read or write anything even if its keys leak. The application connects with a dedicated `app` role that has only the grants it needs (no `DROP`, no superuser, `INSERT` and `SELECT` only on `audit_logs`). The service-role key stays server-side and is used only for Auth admin calls and Storage uploads. |
| Audit | Every mutation writes an `audit_logs` row in the same transaction. |

## 5. Approval of important changes (decision D-06)

"Sensitive" fields: `pricing_*` and plans, `verification_*`, review `method` and testing data, `affiliate_programs.status` and links. Changing them creates a `content_revisions` row in `submitted` state. When two or more people hold the publish permission, a **different** person must approve it before it can go live (the database check `approved_by <> created_by`). With a single publisher the change is allowed but flagged "single approver" in the audit log. Automated checks (URL reachable, image loads) never change a verification status; only a human can.

## 6. Rate limiting

| Target | Control |
| --- | --- |
| `/api/events`, `/api/submissions`, login | **Vercel WAF rate-limit rule** (fixed window, keyed on IP; available on all plans: 1 rule on Hobby, 40 on Pro per the official page; counters are tracked per region, so treat limits as approximate) |
| Login per email, submissions per IP hash, admin mutations per member | App-level limiter in `rate_limit_hits` (per-account limits the WAF cannot express) |
| Auth endpoints | Supabase's own limits (section 1) |
| Abuse of public forms | Honeypot field (already in the submit form), server-side Zod validation, duplicate detection, body size limit, optional challenge later if needed |

Prices of the WAF rate-limit rule on Pro are stated as "regional / usage-based" on the page and are **not verified numerically**.

## 7. CSRF, XSS, injection

- **CSRF:** Next.js Server Actions only accept `POST` and compare the `Origin` header with the `Host` (documented in the data-security guide); we do not add `allowedOrigins` unless a proxy requires it. Custom Route Handlers that change data check `Origin` against `NEXT_PUBLIC_SITE_URL`, require `Content-Type: application/json`, and need the session cookie plus a per-session CSRF token header.
- **XSS:** React escapes by default. Article HTML is the one place that renders raw HTML (`ProseHtml`). Today it is trusted repository content. Once it can be edited in a dashboard it must be sanitised on write and on read with an allow-list that keeps `data-aff` and `data-price` (D-13). Contributors never submit raw HTML directly into published content because publishing needs a higher role.
- **Content Security Policy:** added in Phase 8 with `headers()` (possible once the site is no longer a static export); the 3D scene needs `worker-src` and `blob:` allowances.
- **SQL injection:** only Drizzle's parameterised queries; no string-built SQL; raw SQL helpers are linted against.
- **Uploads:** type allow-list (png, jpg, webp, svg), size cap, dimensions read, SVG sanitised or rejected, random storage names, `sha256` stored.
- **Secrets:** `import "server-only"` on every module that reads a secret; no secret is prefixed `NEXT_PUBLIC_`; `.env*` is git-ignored; CI scans the diff for key patterns; a leaked service-role key is rotated in Supabase and Vercel (runbook in Phase 5).

## 8. Audit log

Every mutation: who, when, action, entity, before and after (secrets, passwords and tokens are never stored), request id, hashed IP. The OWNER can filter by member, action and date; entries cannot be edited or deleted by the application role. Login, logout, failed logins, invitations, role changes, disabling, publishing, deleting and settings changes are all logged. Retention is indefinite at this size (tens of rows per day).

## 9. Threat model summary

| Threat | Mitigation | Residual risk |
| --- | --- | --- |
| Stolen team password | Optional MFA (to verify), per-IP and per-email limits, session revocation, audit trail | Phishing of a legitimate member |
| Privilege escalation through the API | Server permission checks, last-owner rule, no self-role-change, tests that call every action as every role | A bug in a single action; covered by the permission test matrix |
| Direct database access with the public anon key | RLS on, no policies | Misconfiguration; a migration test asserts RLS is enabled on every table |
| Service-role key leak | Server-only, never in the bundle (build check), rotatable | Leak from a developer machine |
| Stored XSS through article HTML | Sanitiser allow-list, role gate on publishing | Sanitiser bypass; keep the library updated |
| Spam or abuse of public endpoints | WAF rule, app limiter, honeypot, validation | Distributed abuse; add a challenge if it happens |
| Database outage or pause | Public site is static and keeps serving; admin shows a clear error | Publishing impossible until restored |
| Accidental deletion | Soft delete, restrict foreign keys, daily backups, audit log | Backup gap of up to 24 hours on the base plan |
| Fake "hands-on" labels | Database and Zod rules from `review-trust.ts`; tests | None beyond the editors' honesty |
