# Lighthouse results

Lighthouse (npx, latest) in headless Chrome against the static build served locally by `python -m http.server`, one run per page and form factor. Mobile uses
Lighthouse's default simulated slow 4G and 4x CPU slowdown; desktop uses the desktop preset. Single runs vary by several points. Not tested on a physical phone.

## Before and after the redesign (2026-10-30)

"Before" is the build with search, favorites and alternatives but before the redesign; "after" is the redesigned build with the 3D hero.

| Page | Form factor | Performance before | Performance after | Accessibility | Best practices | SEO | LCP after | TBT after |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | mobile | 60 | **92** | 100 | 96 | 100 | 2.3 s | 190 ms |
| Home | desktop | 100 | **73** | 100 | 96 | 100 | 0.6 s | 660 ms |
| Tools | mobile | 88 | 82 | 100 | 100 | 100 | 2.0 s | 490 ms |
| Tools | desktop | 100 | 99 | 100 | 96 | 100 | 0.5 s | 30 ms |
| AI News | mobile | 67 | 63 | 100 | 96 | 100 | 7.4 s | 430 ms |
| AI News | desktop | 94 | 93 | 100 | 96 | 100 | 1.7 s | 50 ms |
| Article | mobile | 96 | 95 | 100 | 96 | 100 | 1.8 s | 190 ms |
| Article | desktop | 99 | 100 | 100 | 96 | 100 | 0.5 s | 30 ms |

Layout shift (CLS) is 0 everywhere.

## Reading the results

- **Home mobile improved from 60 to 92.** The tool cards on the home page are now static server-rendered tiles, so far less JavaScript runs on the phone, and the 3D hero does not load there at all.
- **Home desktop fell from 100 to 73.** This is the cost of the WebGL hero network (about 660 ms of main-thread time after the page is idle). It is loaded only on screens 768px and wider, never with reduced motion or data saver, and the page is
  readable and interactive before it starts. If desktop speed matters more than the effect, remove `HeroVisual` from `src/app/page.tsx`.
- **AI News on mobile is still slow (63, LCP 7.4 s) and was not fixed.** The lead story's image is the largest element and its render waits behind script work from the feed's client components. Making the news cards server components is the next step.
- **Tools mobile dropped 6 points** (88 to 82) with the larger catalog (69 tools) and more filters in the client bundle; within run-to-run variation, but worth watching.
- **Best practices 96** comes from "errors in console": the local test server returns 404 for Next's prefetch files (`__next.*.txt`), which GitHub Pages serves with 200. On the live site the browser console has no errors.

Reproduce: serve `out/` under `/aitoolpicks/` and run `npx lighthouse http://localhost:8123/aitoolpicks/ --preset=desktop --output=json` (omit `--preset` for mobile).
