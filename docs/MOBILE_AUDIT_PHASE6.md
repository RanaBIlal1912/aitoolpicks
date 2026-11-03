# Phase 6: mobile responsiveness, mobile 3D and functional audit

Run on 2026-11-03 against the production static build (`npm run build`, served locally with gzip), branch `feat/site-improvements`.

**What this is and is not.** Real Chrome (headless, `puppeteer-core`) with viewport emulation, touch input and a device pixel ratio of 3 for phone widths. The computer used has a real GPU (Intel integrated, Direct3D 11), so the 3D tests ran on hardware WebGL; a software renderer was tested separately with SwiftShader. **No physical phone or tablet was used**, so real phone GPU memory, thermal throttling and iOS Safari behaviour are not covered.

## 1. Responsive audit: 11 routes x 7 widths

Routes: home, tools directory, tool page (ChatGPT), compare (3 tools), pricing, reviews list, review page, submit, ecosystem, blog article, AI News.
Widths: 320, 375, 390, 430, 768, 1024, 1440 px (77 page loads, each scrolled through to draw lazy content, then measured and screenshotted).

| Check | Result |
| --- | --- |
| Page returns 200 | 77 of 77 |
| Horizontal scroll | 0 |
| Console errors, uncaught exceptions, failed or 4xx requests (aborted router prefetches excluded) | 0 |
| Exactly one `h1` | 77 of 77 |
| Footer present | 77 of 77 |
| Broken images | 0 |
| Text cut off by an overflow clip | 0 |
| Header wrapped or taller than 69 px | 0 (69 px at every width) |
| Undersized tap targets (under 32 px high or 24 px wide) at 320 to 768 px | 0 of 55 checks |
| Text under 11.5 px at 320 to 768 px | 0 of 55 checks |

A second harness (31 routes x the same 7 widths = 217 checks) found 0 elements past the viewport edge, 0 distorted images and 0 over-long lines. It also reports "overlap", "decoration over text" and "text clipped" findings; all were inspected and are measurement artefacts: the visually hidden header row of the stacked pricing table, intentional category badges drawn on top of card images, and rows skipped by `content-visibility` that the harness measures as zero-sized. Real rendering of the pricing rows was checked by measuring their boxes (0 overlaps) and by screenshot.

Screenshots (final build): `docs/screenshots/phase6/routes_390.jpg`, `home_all_widths.jpg`, `tool_all_widths.jpg`, `3d_phone.jpg`.

### Found and fixed in this phase

| Where | Problem | Fix |
| --- | --- | --- |
| Ecosystem 3D view on a phone | The 3D library and the orbit controls set `touch-action: none`, so a vertical swipe that started on the 3D view could not scroll the page (the view is about 380 px of an 844 px screen). Reproduced: scroll position stayed at 476 px. | `.eco-scene` forces `touch-action: pan-y`; vertical swipes scroll (476 to 701 px in the test), horizontal drags still rotate. |
| Ecosystem 3D off screen | By code reading: the scene used the library's default `frameloop="always"` and had no visibility check, so it kept drawing after being scrolled away. (The draw rate before the fix was not measured.) | `frameloop` is `"never"` while the section is off screen: 0 draw calls over 2 s measured after the fix (about 7,700 per second while on screen), and drawing resumes on return. |
| Ecosystem 3D failure | No handling for a failed or lost graphics context; an error could take the page down. | Error boundary plus a `webglcontextlost` listener: a message and a retry button; verified by losing the context on purpose. |
| Ecosystem 3D without WebGL | Said "loads as you scroll" forever. | Says plainly that WebGL is unavailable. |
| Ecosystem frame height | Chosen in JavaScript after hydration (560 px, then 380 px on phones): a layout shift. | Height set in CSS. |
| Home hero 3D robot, lost context | No handling: a lost context left a blank canvas with the flat robot already faded out. | The worker reports `lost`; the flat robot returns at once and the 3D robot comes back after restore (about 1.4 s in the test). |
| Home hero 3D robot, sharpness | On a phone the robot was drawn at pixel ratio 1.5 at most. | Up to 2 for a phone-sized canvas (worker reported 736 x 828 for a 368 x 414 canvas); the adaptive loop still drops to 1 on a slow device. |
| Micro labels | 17 labels at 10.4 to 11.2 px. | Raised to 11.5 px (0.72 rem). |
| Small links | Source links in captions and price notes, "Official source", and very short product names ("v0", "Hex") were under 32 px. | Larger touch areas on touch screens. |
| Home search hint | The placeholder was cut off on phones and also at 768 to 1440 px. | Four lengths chosen by width; measured to fit at all 14 widths from 320 to 1440 px. |
| Mobile pricing table and tool pages | Long pages with 70 or so stacked blocks. | `content-visibility: auto` on rows and lower tool-page sections. Controlled A/B in one browser at 4x CPU slowdown: layout and style time 2.9 s to 1.8 s (tool page), 2.0 s to 1.2 s (pricing). |

## 2. Mobile 3D: what was tested (30 checks, all passing)

Device emulation: 390 x 844, pixel ratio 3, touch. Home hero and Ecosystem tested separately.

| Question | Result |
| --- | --- |
| Software renderer (SwiftShader) | Hero keeps the flat robot, canvas removed, no errors. `?robot=3d` forces 3D on it (test switch). |
| Hardware renderer | 3D robot appears about 4 to 6.5 s after load (2.7 s idle delay plus worker start); the flat robot fades out; no console errors. |
| No `OffscreenCanvas`, no `Worker`, WebGL disabled | Flat robot, no canvas, no button, no errors, no overflow. |
| Reduced motion, Save-Data | Flat robot plus a "Turn on 3D animation" button; pressing it starts 3D. Same for the Ecosystem ("Show the 3D network"). |
| Touch | Leftward drag over the hero: no errors, scene keeps drawing. Vertical swipe over the Ecosystem 3D view scrolls the page. |
| Off screen | Hero worker frame counter: 0 frames over 2 s while scrolled away, resumes on return. Ecosystem: 0 draw calls off screen. |
| Context loss | Hero: flat robot returns, 3D recovers. Ecosystem: message and retry button; retry restores the scene. |
| Canvas size and clipping | Hero canvas 368 x 414 inside a 390 px screen; Ecosystem canvas 348 x 378; neither is clipped. |
| Weak device | A 6x CPU slowdown only throttles the page's main thread, not the worker, so it does not test the worker's adaptive frame rate. That logic (full, 30 fps, 15 fps, still) is covered by code reading, not by a measurement on a slow GPU. |

One test artefact worth knowing: a rightward swipe starting at the left of the page triggers the browser's own "go back" gesture in this emulation and left the page; the touch test therefore swipes leftward.

## 3. Functional journeys (31 checks, desktop 1440 and phone 390, all passing)

Search for a tool, a guide and a news item (each opens the exact page); directory search, empty state and clearing; `?category=` and `?q=` deep links; pricing category and status filters and sort, and resetting them; open a tool, browser back (search kept) and forward; pick three tools, the fourth is blocked, "Compare now" opens a 3-column compare page, changing a tool updates the address and a reload keeps it; save a tool and remove it on `/favorites/`; currency switching to PKR changes prices and survives navigation and reload; the outbound button is an official, non-affiliate link (`data-affiliate="false"`, no `sponsored`) and fires the click event, including middle-click; submit form validation summary, duplicate detection, `https://` added to a bare address, the GitHub issue address, and the next-step panel; 11 deep links open directly with a 200 and a heading; the phone menu opens by tap and navigates; no console errors.

By design the `/tools/` page shows only the search box, so category and pricing filters are exercised on `/pricing/` and through `/tools/?category=`.

## 4. Not covered

- Real phones, real mobile GPUs, iOS Safari and Firefox (only Chrome was run).
- The worker's behaviour under real GPU memory pressure (simulated with a deliberate context loss).
- Horizontal touch rotation of the Ecosystem network (vertical scrolling was verified; rotation relies on standard pointer events).
- The very long mobile pages remain long: pricing is about 34,900 px tall at 390 px, a tool page about 14,700 px. Lengthening came from larger tap areas (the tool page grew from about 13,600 to 14,700 px). Shortening them means collapsing content, which was deliberately not done.
