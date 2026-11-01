# Launch, domain, Search Console and analytics checklist

Nothing below is enabled yet. Affiliate links are empty, analytics is off, and there is no custom domain.

## 1. Affiliate programmes (you must do these)

- Apply to each programme with the site's real URL. Do not describe approval anywhere until you have it.
- When a programme approves you, paste the tracking URL into `src/lib/affiliate.ts` for that tool id. The button then switches to a `rel="sponsored nofollow"` link automatically.
- Keep `/affiliate-disclosure/` accurate. It already says links may be affiliate links; update the list of programmes only when real.

## 2. Custom domain migration

1. Buy the domain (for example at Namecheap or Hostinger; both are in the directory).
2. GitHub repo → Settings → Pages → Custom domain; add the domain. Add the DNS records GitHub lists (A/AAAA for an apex domain, or a CNAME for `www`). Wait for the certificate, then tick **Enforce HTTPS**.
3. In `.github/workflows/*.yml`, add an `env:` block to the build step with `NEXT_PUBLIC_SITE_URL: https://your-domain` and `NEXT_PUBLIC_BASE_PATH: ""` (empty, because the site now lives at the root). Without these the build uses the `/aitoolpicks` base path.
4. Redeploy. Check that `/brand/og.png`, `/logos/claude.svg`, `/sitemap.xml` and `/robots.txt` load on the new domain, and that canonical URLs show the new domain.
5. Keep the old `github.io` address for a while; GitHub redirects it to the custom domain.
6. Update the property in Search Console (below).

## 3. Search Console

1. Go to search.google.com/search-console and add a property. Use the URL-prefix type with `https://ranabilal1912.github.io/aitoolpicks/` (or your domain).
2. Verify: HTML-tag method (add the meta tag in `src/app/layout.tsx` metadata `verification`) or DNS TXT for a custom domain.
3. Submit `sitemap.xml` (it lists every route). `robots.txt` already points to it.
4. After a few days, check Coverage for pages "Discovered, not indexed" and the Core Web Vitals report.

## 4. Analytics (Google Analytics 4, consent first, off by default)

`src/lib/analytics.ts` and `src/components/ConsentBanner.tsx` implement GA4 behind a consent banner. It is **off** until `NEXT_PUBLIC_GA_ID` is set at build time; with it unset there is no banner, no script, no cookie and no request.

- **GA property:** "AI Tool Picks", measurement ID `G-K80FTMJB15`, in the Analytics account "Default Account for Firebase" (shared with the unrelated "Prime Tech" property; never use that property's ID here). In GA, data retention is 2 months for event data and 14 months for user data; Google signals and user-provided data collection are off. If you change those, update `/privacy/` (the "How long it is kept" line).
- **To switch it on:** add `env: NEXT_PUBLIC_GA_ID: G-K80FTMJB15` to the `npm run build` step in `.github/workflows/deploy.yml` only. Do not set it for the whole job: `npm test` expects it unset. Deploy only after you have reviewed the banner and `/privacy/` (both change with the variable).
- **How it behaves:** nothing from Google loads until the visitor presses Allow; No thanks, or a Global Privacy Control / Do Not Track signal, keeps it off; withdrawing consent reloads the page and clears Google's cookies for this site's path only. The choice is asked again after 13 months. Page views are sent on each route change by `pageView()`.
- **Custom events:** `track()` sends `outbound_click` with `tool`, `kind` and `placement`. To report on them, register those as event-scoped custom dimensions in GA (Admin, Custom definitions).
- **Testing without polluting GA:** a local build with the ID sends real hits. Block `google-analytics.com/g/collect` in your test tool, or leave the ID unset.
- **GA stream settings the site depends on (Admin, Data streams, Enhanced measurement):** only Page views, Scrolls and Outbound clicks are on; site search, form interactions, video engagement and file downloads are off, and "Page changes based on browser history events" is off because the site sends its own page views. If you turn any of these back on, update `/privacy/` (and turn the history setting back on only if you remove `pageView()`, or every page change is counted twice).
- **What counts as a page view:** a change of path. A change that only alters the query string (filters, the compare page adding `?ids=`) is the same page and is not counted again. Two path changes within 120 ms count only the last.
- **Owner actions before enabling analytics (not done, and not something the code can do):**
  1. In GA, Admin, Account details: accept the **Data Processing Terms**. They show as **not accepted** on the account. The account also holds the unrelated "Prime Tech" property, so decide this for the whole account.
  2. Decide who is named as the operator on `/privacy/` and give a private way to contact them. The text currently names no one and the contact page is a public GitHub issue.
  3. Have `/privacy/` reviewed by someone qualified in the law of the countries your visitors come from.
  4. Check the other Data Sharing Settings on that account page (Google products and services, modeling, technical support, recommendations) and set them as you want.
  5. Test traffic from `localhost` is already in the property; ignore or filter hostname `localhost` in reports.
- **Before using a custom domain:** nothing to change in the code (cookie paths and domains are handled), but re-check the GA data stream URL.

## 5. Contact

The contact page opens an email or a public GitHub issue; it does not send a message by itself. To receive private messages, set `NEXT_PUBLIC_CONTACT_EMAIL`
to a real address you read, or add a form service, and update `/contact/` and `/privacy/` to say what happens to the data.

## 6. Before sharing the site widely

- Run `npm run check` and the Lighthouse commands in the README or `docs/LIGHTHOUSE.md`.
- Re-verify any pricing older than 90 days (`npm run catalog:report` lists stale records).
