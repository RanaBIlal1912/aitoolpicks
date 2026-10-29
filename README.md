# AI Tool Picks

Honest reviews, comparisons and guides to AI tools for freelancers and small businesses.
Live site: https://ranabilal1912.github.io/aitoolpicks/

Built with **Next.js 16 (static export), React 19, TypeScript, Tailwind CSS 4, Framer Motion and React Three Fiber / Three.js**.
Every page is pre-rendered to plain HTML for SEO and speed. The 3D hero loads only after the page has finished loading.

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
| Affiliate links (empty until a programme approves you) | `src/lib/affiliate.ts` |
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

### Adding an affiliate link

Open `src/lib/affiliate.ts` and paste the official link your programme gave you, for example `grammarly: "https://..."`.
Only `https` links are accepted. Until a link is set, the button goes to the tool's official site (no commission, no `sponsored` tag).
Changing the display currency never changes a link; a link can optionally differ by country (`{ default: "...", GB: "..." }`).

### Rules the site follows

- Never invent prices, reviews, ratings, features or affiliate links. A price is added only after checking the official page.
- Merchant prices stay in USD. Converted amounts are labelled as estimates, with the rate date.
- News items need a real publication date and a link to the original source.

## The 3D look

- There is exactly **one** WebGL scene. `src/components/scene/SceneBackdrop.tsx` keeps it fixed behind every page; the chip in
  `src/lib/scene/chip.ts` turns and drifts as you scroll. It loads after the page is idle, renders at a capped frame rate, pauses
  when the tab is hidden, dims behind reading, and is skipped for reduced motion (one still frame), data saver or no WebGL.
- Page images are 3D renders made for this site. To regenerate them: `npm run covers`, then open
  `http://localhost:8124/scripts/covers/index.html` (add `?only=chip,rack` for a subset). The images are written to
  `public/images/covers/`. Nothing is downloaded; every texture is generated in code.
- Pages that show a render say it is an illustration, not a photo of a real product.

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
2. Add an empty slot for it in `src/lib/affiliate.ts` (a real affiliate link only when a programme has approved you).
3. Run `npm run check`. It validates the record, regenerates `src/data/generated/*.json` and builds the site.

### Re-check prices

`npm run catalog:report` lists records that are not fully verified and any pricing older than 90 days. Update the file, set the new
`checked` date and run `npm run check`. Nothing here updates by itself; records change when a person rechecks the source.

### News

Add items to `src/data/news.ts` only after reading the original source: a real date, a link, a tag and a short summary.

## Tests

`npm test` checks currency maths and rate parsing, affiliate-link rules, every article and internal link, the catalog validator
(including negative cases), that unverified tools never show a price, news data, navigation, covers and that generated files are up to date.

## Known limits

- The contact form has no server: it opens an email app (if `NEXT_PUBLIC_CONTACT_EMAIL` is set) or a prefilled public GitHub issue.
- Overviews are written from public documentation; they are not hands-on lab tests and say so on the page.
- Exchange rates come from free public APIs (no key). If both fail, approximate fallback rates are used and labelled.
