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

## After the visual redesign (live site, 30 Oct 2026)

Measured on https://ranabilal1912.github.io/aitoolpicks/ with the Lighthouse CLI, single runs. The redesign added a larger home page (logo ribbon, rails, more sections), two web fonts and a richer 3D network, and it cost performance.

| Page | Perf | A11y | BP | SEO | LCP | TBT |
| --- | --- | --- | --- | --- | --- | --- |
| Home, desktop | 78 | 97 | 100 | 100 | 0.9 s | 370 ms |
| Home, mobile | 67 | 97 | 100 | 100 | 2.0 s | 1.8 s |
| News, mobile | 76 | 100 | 100 | 100 | 2.1 s | 860 ms |
| Tools, mobile | 71 | 100 | 100 | 100 | 1.9 s | 1.5 s |
| Tool detail, mobile | 71 | 100 | 100 | 100 | 2.4 s | 1.1 s |
| Reviews, mobile | 74 | 96 | 100 | 100 | 1.6 s | 1.2 s |

Before the redesign: Home desktop 93, Home mobile 71. Fixes made along the way: the 3D map waits for the first interaction again (loading it on scroll-into-view cost 30 points), repaint-heavy effects were removed, off-screen sections skip layout. None of the tested pages reaches 90 on mobile. Accessibility on home was 97 because of small topic chips; fixed after this run.

## Live site, 2026-10-31 (commit 6bab5d4 + earlier), fresh runs, machine benchmarkIndex 780-1110 (valid)

Lighthouse 12 default throttling, run against https://ranabilal1912.github.io/aitoolpicks/. Accessibility, Best Practices and SEO were 100 on every page tested.

| Page | Device | Performance | LCP | TBT |
| --- | --- | --- | --- | --- |
| Home | desktop | 77 / 65 | 1.7 s / 1.7 s | 290 / 590 ms |
| Home | mobile | 68 / 69 | 2.0 s / 1.9 s | 1.93 / 1.80 s |
| News | mobile | 84 | 1.7 s | 560 ms |
| Blog | mobile | 72 | 4.2 s | 470 ms |
| Tool page (Runway) | mobile | 83 | 2.0 s | 570 ms |

Effect of the photographs (same build, `--blocked-url-patterns=*images/photo*`, home page): blocking photos gave mobile LCP 2.0-2.1 s and desktop 0.8-0.9 s; with photos the first attempt gave mobile LCP 4.0-4.3 s because a faded hero backdrop photo was the largest paint. That backdrop was removed; after the fix mobile LCP is 1.9-2.0 s, so photos now cost about nothing on mobile LCP. On desktop the framed hero photos add about 0.8 s to LCP (1.7 s vs 0.9 s) and still pass. Total-blocking-time differences between runs (290-850 ms desktop) were within run-to-run noise.

Effect of 3D: Lighthouse never loads it (it needs a scroll to the map), so it does not appear in these scores. Measured in a real browser on the live site: scrolling to the map starts the 3D canvas about 1.3 s later and costs about 0.9 s of long tasks over the next 8 s (before the hero fix, the hero WebGL also started on that scroll and the total was about 4.0 s).

Earlier valid live numbers from before the redesign: home about 62-63 on desktop and mobile. Remaining main cost is script evaluation and hydration of the home page (main-thread script work about 4 s under mobile throttling).


## 2026-10-31 (final polish): three mobile runs per page, live

Lighthouse 13 (Chrome headless), default mobile profile (simulated slow 4G, 4x CPU), against https://ranabilal1912.github.io/aitoolpicks/ with a
fresh query string on every run, after deploying commit 4809633. Only runs with a benchmark index of 700 or more are kept (bench shown); runs on this machine
below that were discarded and repeated (four early runs scored 39 to 50 with a benchmark index near 250). Accessibility, Best Practices and SEO were 100 in every run.
Later commits changed only the hero WebGL scene, which Lighthouse never loads (it needs a pointer or scroll), so these numbers still apply.
INP cannot be measured in a lab run without interaction, so TBT is the interaction proxy.

| Page | Run | Performance | LCP | TBT | CLS | FCP | Bench | LCP element |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | 1 | 67 | 2.1 s | 2,324 ms | 0 | 2.1 s | 963 | hero lead paragraph (text) |
| Home | 2 | 73 | 1.9 s | 1,269 ms | 0 | 1.9 s | 929 | hero lead paragraph (text) |
| Home | 3 | 70 | 2.3 s | 1,207 ms | 0.002 | 2.3 s | 895 | hero lead paragraph (text) |
| **Home median** | | **70** | **2.1 s** | **1,269 ms** | 0 | 2.1 s | | |
| Blog | 1 | 66 | 4.3 s | 712 ms | 0 | 1.7 s | 840 | featured cover photo (notebook-pen-md.webp) |
| Blog | 2 | 69 | 4.1 s | 643 ms | 0 | 1.7 s | 806 | same |
| Blog | 3 | 71 | 4.2 s | 495 ms | 0 | 1.9 s | 894 | same |
| **Blog median** | | **69** | **4.2 s** | **643 ms** | 0 | 1.7 s | | |
| News | 1 | 83 | 2.0 s | 561 ms | 0 | 2.0 s | 877 | lead paragraph (text) |
| News | 2 | 84 | 1.9 s | 539 ms | 0 | 1.9 s | 901 | same |
| News | 3 | 82 | 2.0 s | 617 ms | 0 | 2.0 s | 1138 | same |
| **News median** | | **83** | **2.0 s** | **561 ms** | 0 | 2.0 s | | |
| Tool (Claude) | 1 | 83 | 2.0 s | 541 ms | 0 | 2.0 s | 906 | lead paragraph (text) |
| Tool (Claude) | 2 | 84 | 2.0 s | 493 ms | 0 | 2.0 s | 917 | same |
| Tool (Claude) | 3 | 85 | 2.2 s | 450 ms | 0 | 2.2 s | 1062 | same |
| **Tool median** | | **84** | **2.0 s** | **493 ms** | 0 | 2.0 s | | |

Before this round (live, commit 3de6b85, same method, valid runs only): Home 68/73/69 (median 69, TBT median 1,987 ms), Blog 72/72/68 (median 72,
LCP median 4.1 s), News 95/85/82 (median 85), Tool 82/86/87 (median 86). Earlier single-run figures in this file were 68 to 69 (Home), 72 (Blog), 84 (News), 83 (Tool).

Reading: nothing reached 90 and none of the four pages moved by more than run-to-run noise (a few points) except a probable small drop in Home TBT.
Blog LCP is still 4.2 s. See `docs/PERFORMANCE_INVESTIGATION.md` for the cause and for what was tried.
