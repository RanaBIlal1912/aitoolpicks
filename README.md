# AI Tool Picks

Honest reviews, comparisons and guides to AI tools for freelancers and small businesses.
Live site: https://ranabilal1912.github.io/aitoolpicks/

Built with **Next.js 16 (static export), React 19, TypeScript, Tailwind CSS 4 and Three.js (with React Three Fiber on one page)**.
Every page is pre-rendered to plain HTML for SEO and speed. Two things use WebGL, both loaded after the page: the home hero's 3D robot (drawn by a Web Worker) and the Ecosystem page's 3D network. See [`docs/3D.md`](docs/3D.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # type check + tests + production build (output in ./out)
```

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and publishes the site whenever `main` changes.

1. In the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions** (one time).
2. Merge this branch into `main` (or push to `main`). The workflow runs the type check, the tests and the build, then deploys `out/`.
3. Old addresses such as `/best-ai-writing-tools.html` keep working: the build writes small redirect pages for them.

Using a custom domain later: set `NEXT_PUBLIC_SITE_URL` (for example `https://example.com`) and `NEXT_PUBLIC_BASE_PATH` to an empty string in the workflow's build step.

## Where things live

| What | File |
| --- | --- |
| Affiliate status and links (the only place; nothing is approved yet) | `content/affiliate.json` (read by `src/lib/affiliate.ts`) |
| Headline reference prices (generated from the tool records) | `src/data/generated/price-refs.json` |
| Currencies, rate sources and fallback rates | `src/lib/currency.ts` |
| Tool records (one JSON file per tool) | `content/tools/*.json` |
| Categories | `content/categories.json` |
| Tool overviews (pros, cons, use cases) | `src/data/reviews.ts` |
| Best-of guides | `src/data/roundups.ts` |
| Comparison tables for the two long-form comparisons | `src/data/compare.ts` |
| AI news (dated, with source links) | `src/data/news.ts` |
| Guides (HTML bodies + metadata) | `content/articles/*.html`, `content/articles.json` |
| Blog topics and their covers | `src/data/topics.ts` |
| Cover images (3D renders) | `public/images/covers/`, `src/data/covers.ts` |
| Public contact email (optional) | `NEXT_PUBLIC_CONTACT_EMAIL` (see `.env.example`) |

### Affiliate links and approval workflow

Everything about affiliates lives in `content/affiliate.json`. `src/lib/affiliate.ts` only reads it; do not paste links into code.

Each tool has one status, and a tool with no entry is **ordinary** (no affiliate relationship):

| Status | Meaning | Does the button use an affiliate link? |
| --- | --- | --- |
| `approved` | A programme approved you and gave you an official link (put it in `link`) | Yes: "Try <tool>", `rel="sponsored nofollow"`, marked as an affiliate link |
| `pending` | You applied and are waiting | No, the official site |
| `unavailable` | The programme's own page says you cannot join (give the reason and source) | No, the official site |
| `ordinary` | No relationship, or a programme exists but nobody has applied (optional `programme` block with the apply page) | No, the official site |

1. Apply on the programme's own page (the apply pages and research are in `docs/AFFILIATE_PROGRAMS.md`). Set the tool to `pending` once you have applied.
2. Only when the programme approves you: set `"status": "approved"` and paste the official link into `link`. A `link` on any other status is rejected by `tests/affiliate.test.ts`, so a link typed early can never go live.
3. Only `https` links are accepted. A link can differ by country: `"link": { "default": "https://...", "GB": "https://..." }`. Changing the display currency never changes a link.
4. Update the first-ever approval test in `tests/affiliate.test.ts` (it asserts that nothing is approved today) and keep `/affiliate-disclosure/` accurate.
5. Run `npm run affiliate:report` to regenerate `docs/AFFILIATE_STATUS.md` (approved, pending, unavailable, and the programmes still needing an application).

Until a tool is `approved`, its button goes to the tool's official site with no commission and no `sponsored` tag. Outbound clicks fire a browser event (`aitp:outbound`) and send nothing anywhere while analytics is off (`src/lib/analytics.ts`).

### Rules the site follows

- Never invent prices, reviews, ratings, features or affiliate links. A price is added only after checking the official page.
- Merchant prices stay in USD. Converted amounts are labelled as estimates, with the rate date.
- News items need a real publication date and a link to the original source.

## Images and 3D

- **3D:** WebGL is used in two places only, the home hero robot (`RobotHero` + `robot.worker.ts`, OffscreenCanvas in a worker, flat SVG robot as the fallback) and the Ecosystem network
  (`EcosystemNetwork`, lazy-loaded when scrolled to). Reduced motion and data saving keep both off until the visitor opts in. Full detail, triggers and fallbacks: [`docs/3D.md`](docs/3D.md).
  `src/lib/scene` and `npm run covers` are for offline cover renders only; no page imports them.
- **Tool logos:** `npm run logos` downloads each product's own icon from its official website into `public/logos/` and records source, format, size and review status in
  `content/logos.json` (`--curl` uses the system curl for sites that refuse Node; `--fallback` tries a favicon service and flags the result `needs-review`). Components call
  `logoFor()` in `src/data/logos.ts`; never hard-code a logo path.
- **News images:** vendor announcement images are listed in `content/news-images.json` and built by `npm run news-images`. See `docs/NEWS_WORKFLOW.md`.
- **Brand:** `public/brand/mark.svg` is the site mark; `npm run brand` renders the favicon, app icons and social image from it.
- **Guide and best-of covers** are generated from topic colours and the logos of the tools involved (`ArticleCover`, `BestCover`).
- `npm run assets:report` writes `docs/ASSETS_REPORT.md` (unresolved and low-resolution assets).

## The tool catalog

Every tool is **one JSON file** in `content/tools/`, so the catalog can grow to hundreds of entries without touching code.
A record holds the vendor, category, features, use cases, audience, strengths, limitations, alternatives, source links with a
checked date, and a `pricing` block with the vendor's own plan names, monthly and annual prices in the merchant's currency,
free-plan and trial details, separate API pricing, regional notes and a verification status
(`verified`, `partial` or `unverified`).

Rules the validator enforces (`npm run catalog`):

- Prices come only from an official page. A tool whose page could not be read is `unverified`, carries no prices and says why.
- Plans keep the product's own names. Usage-based, custom and region-dependent prices are labelled as such.
- Every record has at least one https source and a checked date; alternatives must exist; no placeholder text.

### Add a tool

1. Copy a similar file in `content/tools/`, rename it to the new id and fill it in from the vendor's pages. Do not guess.
2. Nothing to add for affiliates: a tool with no entry in `content/affiliate.json` is an ordinary link. Add an entry only to record a programme (see above).
3. Run `npm run check`. It validates the record, regenerates `src/data/generated/*.json` and builds the site.

### Re-check prices

`npm run catalog:report` lists records that are not fully verified and any pricing older than 90 days. Update the file, set the new
`checked` date and run `npm run check`. Nothing here updates by itself; records change when a person rechecks the source.

### News

Add items to `src/data/news.ts` only after reading the original source. The full process (date, source, summary, "why it matters", type, importance, image) is in
`docs/NEWS_WORKFLOW.md`. News is edited by hand; the RSS feed at `/news/feed.xml` is built from the same data.

### Docs

`docs/NEWS_WORKFLOW.md`, `docs/REVIEW_TEMPLATE.md` (documentation-based vs hands-on reviews), `docs/LAUNCH_CHECKLIST.md` (affiliate, custom domain, Search Console, analytics),
`docs/ASSETS_REPORT.md` and `docs/LIGHTHOUSE.md`.

## Tests

`npm test` checks currency maths and rate parsing, the affiliate registry rules (no link unless approved), review-trust rules, every article and internal link, the catalog validator
(including negative cases), that unverified tools never show a price, news data, navigation, covers and that generated files are up to date.

## Known limits

- The contact form has no server: it opens an email app (if `NEXT_PUBLIC_CONTACT_EMAIL` is set) or a prefilled public GitHub issue.
- Overviews are written from public documentation; they are not hands-on lab tests and say so on the page.
- Exchange rates come from free public APIs (no key). If both fail, approximate fallback rates are used and labelled.
