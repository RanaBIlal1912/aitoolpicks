# Trending tools: status and method

**Status: not shown.** There is no usage data to rank tools by. The site has no analytics (`src/lib/analytics.ts` is a disabled no-op), no accounts, and
favorites and recently viewed lists stay in each visitor's own browser. Page views from GitHub Pages are not available to us. A "Trending" label would therefore be invented,
so the home page shows honest alternatives instead: Editor's picks, Recently added (by the date a record was added to this directory), Free AI tools, and curated best-of guides.

## How trending could be done honestly

1. Enable a privacy-friendly, cookieless analytics service (see `docs/LAUNCH_CHECKLIST.md`) and update `/privacy/` first.
2. Count outbound clicks on each tool's "Visit" button (`data-cta="outbound"` and `data-tool` already exist) and tool-page views, per tool, per 7 days.
3. Export the totals to `content/trending.json` by hand or with a script: `{ "period": { "from": "2026-11-01", "to": "2026-11-07" }, "source": "name of the analytics service", "method": "page views of /tools/<id>/", "items": [{ "id": "claude", "views": 123 }] }`.
4. The home page shows a "Trending" section **only when that file exists**, prints the period, source and method beside it, and ignores items with fewer than 30 views so tiny numbers do not create fake rankings.

`src/lib/trending.ts` implements steps 3 and 4. Until `content/trending.json` exists, `getTrending()` returns `null` and nothing is rendered.
