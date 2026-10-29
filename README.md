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
| Verified USD prices and their official source | `src/lib/prices.ts` |
| Currencies, rate sources and fallback rates | `src/lib/currency.ts` |
| Tool directory | `src/data/tools.ts` |
| Tool overviews (pros, cons, use cases) | `src/data/reviews.ts` |
| Comparison tables | `src/data/compare.ts` |
| AI news (dated, with source links) | `src/data/news.ts` |
| Guides (HTML bodies + metadata) | `content/articles/*.html`, `content/articles.json` |
| Public contact email (optional) | `NEXT_PUBLIC_CONTACT_EMAIL` (see `.env.example`) |

### Adding an affiliate link

Open `src/lib/affiliate.ts` and paste the official link your programme gave you, for example `grammarly: "https://..."`.
Only `https` links are accepted. Until a link is set, the button goes to the tool's official site (no commission, no `sponsored` tag).
Changing the display currency never changes a link; a link can optionally differ by country (`{ default: "...", GB: "..." }`).

### Rules the site follows

- Never invent prices, reviews, ratings, features or affiliate links. A price is added only after checking the official page.
- Merchant prices stay in USD. Converted amounts are labelled as estimates, with the rate date.
- News items need a real publication date and a link to the original source.

## Tests

`npm test` runs checks for currency maths and rate parsing, affiliate-link rules, every article and internal link,
price and news data, and that no fabricated affiliate links exist.

## Known limits

- The contact form has no server: it opens an email app (if `NEXT_PUBLIC_CONTACT_EMAIL` is set) or a prefilled public GitHub issue.
- Overviews are written from public documentation; they are not hands-on lab tests and say so on the page.
- Exchange rates come from free public APIs (no key). If both fail, approximate fallback rates are used and labelled.
