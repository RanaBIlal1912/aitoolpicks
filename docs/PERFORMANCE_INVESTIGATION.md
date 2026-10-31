# Performance investigation: Blog LCP, Home TBT, 3D (2026-10-31)

Everything here was measured, not assumed. "Local" means the production build served from this machine through a small gzip server and tested
with the same Lighthouse mobile profile as the live site; the live results are in `docs/LIGHTHOUSE.md`. This machine's benchmark index is
about 800 to 1200, and single runs vary by 10 points or more, so changes were judged on several runs and by what the trace shows.

## Blog LCP (mobile, was about 4.2 to 5.1 s)

The LCP element is the featured guide's cover photograph. Lighthouse's own breakdown for it (live, one run):
time to first byte 0.5 s, resource load delay 0.03 s, resource load 0.6 s, **element render delay 0.84 s**. The image is discoverable in
the HTML, preloaded, `fetchpriority=high` and not lazy, so none of the usual image mistakes apply. The delay is the main thread being busy
before it can paint.

Experiments on a copy of the built page (Lighthouse mobile, local, one run each unless stated):

| Change | LCP | Reading |
| --- | --- | --- |
| Current page | 5.1 s and 4.8 s | baseline |
| Featured photo served as the 640 px file only (22 KB instead of 105 KB) | 5.0 s | image size is not the bottleneck |
| `mix-blend-mode` removed | 4.8 s | not the blend |
| `backdrop-filter` removed | 4.8 s | not the glass effect |
| All animations, filters and shadows removed | 4.8 s | not decoration |
| All `<script>` tags removed | 2.6 s | JavaScript is what delays it |
| Only inline scripts (the 44 KB page data) kept | 2.8 s | |
| Only external scripts (framework, about 200 KB gzip) kept | 3.5 s | |

A Chrome trace at 4x CPU slowdown shows a first layout of 0.5 to 0.6 s before the first paint (it hardly changes when whole sections are hidden,
so it is mostly a fixed cost on this machine) and the framework's hydration after it. So the blog's LCP is set by how much JavaScript the page
carries and runs, not by the picture. Fonts (two preloaded woff2 files, about 100 KB) share the same link and were checked: blocking them did not change layout time.

What was changed because of this:

* The guide grid is now rendered on the server and only filtered in the browser (`BlogList` toggles `hidden`), so about 30 cards are no longer
  rebuilt by JavaScript. Search, topic filter, `?topic=` and the empty message were tested after the change.
* A 960 px photo size (`-md`) between the 640 px and 1920 px files, so phones stop downloading the 1920 px file for card images
  (laptop-desk: 105 KB to about 45 KB).
* The footer uses `content-visibility: auto` so its layout waits until it is near the viewport.

What did not help and was reverted: wrapping page sections in `<Suspense>` boundaries (Home TBT 580 and 630 ms against 480 and 570 ms without).

## Home TBT (mobile)

A JavaScript CPU profile at 4x slowdown puts about 1 s of the time in scripts (React, the router and `next/link` account for most of it) and
about 2 s in "program" work: style, layout, paint and parsing a 410 KB document (190 KB of markup plus a 220 KB inline copy of the page for hydration).
Hydration is the largest post-paint task. Lighthouse sometimes sees it as one 1.4 s task and sometimes as pieces of 100 to 200 ms, which is why
a single run of Home TBT ranges from about 500 ms to over 2 s on the same build. Conclusions drawn only from three or more runs.

Changes made: the hero WebGL scene no longer starts or keeps running when the hero is not on screen (it used to start on the first scroll even
if the visitor had jumped past it), and the 3D changes below. The page's component tree was not rewritten, so Home's hydration cost is
essentially unchanged; this is stated in the report rather than hidden.

## 3D

* Both scenes now use `frameloop="never"` while their box is off screen. Measured draw calls per second on the live site (headless Chrome with
  software GL, so the absolute numbers are only a comparison): at the footer 0, with the map on screen several hundred.
* The hero scene is removed after four seconds out of view and comes back when the hero returns, so the map is the only scene that animates
  while a visitor is looking at it.
* One geometry and one material are shared by all tool dots (about 100 meshes) instead of a pair per dot.
* Bug found and fixed: the opening camera animation always ended at the desktop distance, so on a phone the map was cropped at both sides.
  The resting distance now follows the shape of the box. Checked on a 375 px viewport.
* Not changed: node count, sphere detail, pixel ratio caps (1 on phones, 1.5 on desktop) and antialiasing (off on phones), because they were
  already conservative and the visual quality was to stay as it is.
