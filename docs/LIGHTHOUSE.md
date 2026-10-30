# Lighthouse results

Run on 2026-10-30 with Lighthouse (npx, latest) in headless Chrome
against the static build served locally by `python -m http.server` (not the live GitHub Pages host), one run per page and form factor.
Mobile uses Lighthouse's default simulated slow-4G and 4x CPU slowdown; desktop uses the desktop preset. Single runs vary by several points.

| Page | Form factor | Performance | Accessibility | Best practices | SEO | LCP | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home | mobile | 66 | 100 | 96 | 100 | 2.6 s | 1,630 ms |
| Home | desktop | 100 | 100 | 96 | 100 | 0.6 s | 50 ms |
| Tools | mobile | 72 | 100 | 100 | 100 | 2.2 s | 1,140 ms |
| Tools | desktop | 98 | 100 | 96 | 100 | 0.6 s | 80 ms |
| AI News | mobile | 48 | 100 | 96 | 100 | 5.9 s | 1,530 ms |
| AI News | desktop | 92 | 100 | 96 | 100 | 1.6 s | 110 ms |
| Article (coding assistants) | mobile | 88 | 100 | 96 | 100 | 1.9 s | 380 ms |
| Article (coding assistants) | desktop | 100 | 100 | 96 | 100 | 0.5 s | 60 ms |

Layout shift (CLS) was 0 on every page.

## What the numbers say

- **Mobile performance is the weak spot** on pages with many client-rendered cards (Home, Tools, News). The cost is JavaScript on the main thread: React's runtime plus
  hydrating the card components (the tool catalog is bundled for the client-side directory). The article page, which is mostly static HTML, scores 88.
- **News on mobile** also has a 5.9 s LCP: the lead story's image is the largest element and its render waits behind the script work above.
- **Best practices 96** comes from "errors in console": the local test server returns 404 for Next's prefetch files (`__next.*.txt`), which GitHub Pages serves with 200.
  The live site has no console errors in the browser check.

## Done so far

The global WebGL scene, film-grain overlays, smooth-scroll library and Framer Motion were removed; the news/guide covers are CSS-drawn, so no large cover renders load.

## Next steps (not done)

1. Make `ToolCard` and the news cards server components, loading only the tilt/compare behaviour on the client.
2. Load the full catalog index only on `/tools/`, and pass the home page just the six featured tools.
3. Re-run Lighthouse against the deployed URL after each change; real-device testing has not been done.

Reproduce: serve `out/` under `/aitoolpicks/` and run
`npx lighthouse http://localhost:8123/aitoolpicks/ --preset=desktop --output=json` (omit `--preset` for mobile).
