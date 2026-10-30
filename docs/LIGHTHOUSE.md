# Lighthouse results

Lighthouse (npx, latest) in headless Chrome against the static build served locally by `python -m http.server`; one run per page and form factor, so expect several points of
run-to-run variation. Mobile uses Lighthouse's default simulated slow 4G and 4x CPU slowdown. **No physical phone was tested.**

## Latest runs (2026-10-30, after the real-3D redesign; 3D starts on first interaction or after 10 s)

| Page | Form factor | Performance | Accessibility | Best practices | SEO | LCP | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home | desktop | **93** | 100 | 96 | 100 | 0.5 s | 210 ms |
| Home | mobile | **69** | 100 | 96 | 100 | 2.3 s | 1,570 ms |
| AI News | desktop | **96** | 100 | 96 | 100 | 1.4 s | 30 ms |
| AI News | mobile | **72** | 100 | 96 | 100 | 7.3 s | 180 ms |
| Tools | desktop | **99** | 100 | 96 | 100 | 0.5 s | 100 ms |
| Tools | mobile | **93** | 100 | 100 | 100 | 2.0 s | 220 ms |
| Ecosystem (3D network) | desktop | **100** | 100 | 96 | 100 | 0.5 s | 30 ms |
| Ecosystem (3D network) | mobile | **84** | 100 | 100 | 100 | 2.1 s | 510 ms |

Layout shift (CLS) is 0 everywhere. Accessibility and SEO meet the 95 target on every page; best practices is 96 to 100.

## History on the home page

| Build | Home desktop | Home mobile |
| --- | --- | --- |
| Before the 3D redesign (cards and search, no WebGL) | 100 | 60 |
| Colourful redesign with small 3D hero | 69 | 92 |
| Immersive 3D, loading at idle | 69 (TBT 940 ms) | 67 |
| Immersive 3D, starting on interaction | 93 | 69 |

The first load of the 3D code (about 900 KB, three.js) was the cost; starting it on the first pointer move, scroll, touch or key press (or after 10 s) takes it out of the page-load window. The
engine load itself is deferred, not removed, so a visitor who moves the mouse still pays for it right after.

## Not met

- **Mobile performance 90+ is met only on Tools (93).** Home mobile is 69 and News mobile is 72. On Home the trace shows one ~1.5 s main-thread task in the React runtime chunk around 6 s that I could not attribute; the 3D library itself is not loaded in that trace.
  News mobile has a 7.3 s LCP that persisted through every change I tried (static server-rendered cards, no backdrop blur, no animation library). Next steps: profile with Chrome's performance panel on a real device and split the news feed's client code from its server-rendered top stories.
- Best practices is 96 on most pages because the local test server returns 404 for Next's prefetch files, which GitHub Pages serves with 200.

Reproduce: serve `out/` under `/aitoolpicks/` and run `npx lighthouse http://localhost:8123/aitoolpicks/ --preset=desktop --output=json` (omit `--preset` for mobile).

## Live site re-test, 30 Oct 2026 (https://ranabilal1912.github.io/aitoolpicks/, Lighthouse CLI, single runs unless noted)

| Page | Perf | A11y | Best practices | SEO | LCP | TBT |
| --- | --- | --- | --- | --- | --- | --- |
| Home, desktop | 93 | 100 | 100 | 100 | 0.7 s | 170 ms |
| Home, mobile | 71 (two runs: 71, 71) | 100 | 100 | 100 | 1.8 s | 1.4 to 1.6 s |
| News, mobile | 78 | 100 | 100 | 100 | 2.7 s | 650 ms |
| Tools, mobile | 69, 77, 80 (three runs) | 100 | 100 | 100 | 1.8 s | 0.7 to 2.4 s |
| Reviews, mobile | 85 | 100 | 100 | 100 | 1.4 s | 580 ms |
| Blog, mobile | 80 | 100 | 100 | 100 | 1.7 s | 740 ms |

Mobile performance is below 90 on every page tested. LCP and layout shift are good (CLS 0); the gap is total blocking time. The trace attributes it to the React runtime chunk (hydration of the page) under Lighthouse's 4x/6x CPU slowdown. Repeat runs of the same page differ by up to 11 points, so single numbers are indicative. Not fixed yet.

### After skipping layout for off-screen list items (commit fa3183c), mobile, two runs each

Tools 81 and 84 (was 69 to 80), Blog 92 and 81 (was 80), News 83 and 80 (was 78). Profile of Tools: unthrottled, the main thread was blocked about 230 ms, mostly the first layout (about 210 ms) and one 120 ms script run; hydration tasks were short. The 90 target is met only on some Blog runs. Home mobile (71) has not been profiled separately.
