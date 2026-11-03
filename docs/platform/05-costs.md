# 5. Costs and infrastructure

All prices below were read from the vendors' official pages on **2026-11-03** and can change. Nothing here has been purchased, activated or signed up for. "Unverified" means I did not find the number on an official page.

## 1. Vercel (hosting)

| | Hobby | Pro |
| --- | --- | --- |
| Price | $0 | **$20 per month** (the page also lists a developer seat at $20 per month; whether the first seat is included in the $20 is **not stated on the page**, so the real minimum is $20 or $40) |
| Fast Data Transfer | 100 GB per month | 1 TB per month, then from $0.15 per GB |
| Function invocations | 1,000,000 per month | pay as you go from $0.60 per million |
| Build minutes | "basic machines" included (amount not stated) | Basic machine $0.007 per minute (included amount not stated) |
| ISR reads and writes | 1M and 200k per month | from $0.40 per million and $4 per million |
| Included credit | none | $20 |
| WAF rate-limit rules | 1 per project | 40 per project (usage priced regionally; amount unverified) |
| Log drains | not available | available |
| **Commercial use** | **Not allowed** | allowed |

**Why Hobby is not an option for production.** Vercel's Fair Use Guidelines say Hobby is "restricted to non-commercial personal use only" and list "Affiliate linking is the primary purpose of the site" and "advertisements" among the commercial uses. AI Tool Picks has affiliate disclosures and an affiliate programme registry. Whether a site with zero approved affiliate links yet counts is Vercel's call; if in doubt Vercel tells you to contact their support. The safe plan is **Pro for production**, Hobby only for development previews.

Team members who use the admin dashboard are **application users in our database, not Vercel seats**. Only people who deploy or manage the Vercel project need a seat.

## 2. Supabase (database, auth, storage)

| | Free | Pro |
| --- | --- | --- |
| Price | $0 | **from $25 per month** |
| Database | 500 MB per project, shared CPU | 8 GB disk per project |
| File storage | 1 GB | 100 GB |
| Egress | 5 GB | 250 GB, then $0.09 per GB |
| Auth monthly active users | 50,000 | 100,000, then $0.00325 each |
| Projects | 2 active | not stated on the page |
| Inactivity | **paused after 1 week** | not paused |
| Backups | **none** | daily, kept 7 days |
| Point-in-time recovery | no | add-on, $100 per month per 7 days of retention |
| Compute | shared | $10 per month of compute credit (one Micro instance, 1 GB RAM); larger instances at full price (for example Small $15 per month) |
| Spend cap | not applicable | on by default |

Auth email: the built-in sender allows 2 emails per hour per project, so a custom SMTP provider is needed (below).

## 3. Other services (all optional or small)

| Service | Plan | Price | Notes |
| --- | --- | --- | --- |
| Resend (invitation and alert email) | Free | $0: 3,000 emails per month, 100 per day, 3 domains | Pro is $20 per month for 50,000. Needed only for team invitations and alerts. |
| Sentry (error monitoring) | Developer (free) | $0: 5k errors (period not stated on the page), 1 user, 30-day look-back | Team plan $29 per month ($26 billed annually) for 50k errors. Optional (D-09). |
| Domain name | registrar | **unverified** | Yearly fee; not purchased. |
| Uptime monitor | various | **unverified** | A free tier is likely enough; I have not checked a provider. |

## 4. Scenarios

| Scenario | Monthly | Notes |
| --- | --- | --- |
| **Development and preview** | **$0** | Supabase Free, Vercel Hobby (previews only, no real traffic), local Postgres. Preview projects may pause after a week of inactivity. |
| **Production, minimum** | **about $45** ($20 Vercel Pro + $25 Supabase Pro), up to about $65 if Vercel charges the first developer seat separately | Plus the domain yearly fee. Email and monitoring on free plans. |
| Production, with Sentry Team | add $29 | Only if the free 5k errors is too low. |
| Production, with point-in-time recovery | add $100 | Not recommended at launch. |

At today's size (1 MB of content, 14.7 MB of media, a few hundred pages) usage is far below every included allowance: the database would use well under 1% of 8 GB; static pages are served from Vercel's CDN. Possible scaling costs later: Supabase egress ($0.09 per GB beyond 250 GB), a larger compute instance (from $15 per month), Vercel bandwidth beyond 1 TB (from $0.15 per GB), more Vercel developer seats ($20 each).

## 5. Storage and backup costs
- Database content is tiny, so provider backups (included in Pro) and a weekly self-hosted dump cost essentially nothing in storage.
- New media goes to Supabase Storage (100 GB included on Pro).
- Existing media stays in the repository and is served by Vercel's CDN, which counts toward the 1 TB transfer.

## 6. What needs your approval before any spend
Vercel Pro, Supabase Pro, a domain, an email provider plan (the free plan may be enough), Sentry. **I will not subscribe to or buy anything**; all of it is dashboard actions that only you can approve. Phases 3 to 7 need none of it (Phase 3 onward can run on local Postgres and a free Supabase development project).

## 7. Alternatives if cost or terms are a problem
If Vercel's commercial-use rule or price is unacceptable: Cloudflare Pages/Workers via OpenNext (option D in the architecture doc) or a self-managed host. I have not verified their pricing or terms and have not compared them in detail; this would be a Phase 2 revision, not an assumption.
