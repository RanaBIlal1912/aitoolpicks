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

## 4. Analytics (evaluation only)

`src/lib/analytics.ts` is a disabled no-op hook and outbound buttons carry `data-cta` attributes. To enable something:

- Prefer a cookieless, privacy-friendly tool (for example Plausible, Umami or Cloudflare Web Analytics) over cookie-based analytics.
- Update `/privacy/` first: name the provider, what is collected and why. If you use cookies or identifiers where the law requires consent, add a consent notice.
- Then set `ANALYTICS_ENABLED = true` and wire the provider in `track()`.

## 5. Contact

The contact page opens an email or a public GitHub issue; it does not send a message by itself. To receive private messages, set `NEXT_PUBLIC_CONTACT_EMAIL`
to a real address you read, or add a form service, and update `/contact/` and `/privacy/` to say what happens to the data.

## 6. Before sharing the site widely

- Run `npm run check` and the Lighthouse commands in the README or `docs/LIGHTHOUSE.md`.
- Re-verify any pricing older than 90 days (`npm run catalog:report` lists stale records).
