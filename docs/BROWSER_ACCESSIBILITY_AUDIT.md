# Cross-browser and accessibility audit

One audit pass on `feature/futuristic-full-website-redesign`, starting from `960a2fd`. All runs used the local preview of the static export.

## Browsers actually run

| Engine | Version | How |
| --- | --- | --- |
| Google Chrome (Blink) | 156.0.8078.73 | Real browser, driven over DevTools (puppeteer-core), headless and headed |
| Microsoft Edge (Blink) | 156.0.4314.58 | Real browser, started directly and attached over DevTools |

Edge and Chrome share the Blink engine, so they mainly confirm each other; Edge is not an independent rendering engine.

**Not run:** Firefox (Gecko), Safari or Playwright WebKit. None is installed and the download was declined. Nothing in this document claims they were tested. For them there is only a static support lookup (caniuse data for the features the site uses), listed at the end. Touch, phone and tablet sizes are viewport and touch emulation in Chrome and Edge, not physical devices.

## Results

- **axe-core 4.14** (WCAG 2.0, 2.1 and 2.2 A and AA, plus best-practice rules) on all 324 routes: Chrome desktop 0 violations, Chrome phone-size 0, Chrome with reduced motion 0, Edge desktop 0 (after the fixes below). axe could not decide colour contrast over gradients, so contrast was measured separately.
- **Contrast, measured from rendered pixels** (all text transparent, then the background under every text box sampled): 8,357 text elements on 18 page types at 1280 and 390 px. Seven remaining reports are measurement artefacts (the text box includes a logo, a dot or a checkbox); no real failures.
- **Lighthouse accessibility, best practices, SEO** on 10 page types: accessibility 100, best practices 100, SEO 92. The 92 is Lighthouse's `robots.txt` check, which looks at the host root; this project site lives under `/aitoolpicks/`, so crawlers would read the root `robots.txt` of `ranabilal1912.github.io`, not ours (see limits).
- **Keyboard only** (Chrome and Edge, desktop and phone size, 12 page types, up to 260 Tab stops each): a skip link is the first stop, no keyboard traps, no positive tabindex, no hidden focus. Card links show their focus on the whole card (a cyan outline); the dropdown, mobile menu and filter chips work with Enter, Space and Escape, and Escape returns focus to the button.
- **Zoom** 80, 90, 100, 125, 150, 200, 300 and 400 percent on 1366x768, 1920x1080 and 1280x1024 windows (effective widths 320 to 2400 px) on 31 page types: no horizontal scroll, clipped text or off-screen content, including 320 CSS px at 400 percent.
- **Reduced motion:** with `prefers-reduced-motion: reduce` no animation or transition runs, tilt cards stay flat, all text is visible and the 3D hero is not started.
- **Forced colours** (Windows high contrast): the header, buttons, cards and forms are drawn with system colours and stay usable; the logo tiles were invisible and are fixed.
- **3D hero:** in both browsers (real GPU, desktop and a 390 px emulated phone) the worker starts, the canvas is ready and the flat robot fades out with no errors. The flat robot stays, with no errors, when OffscreenCanvas is missing, Workers are missing, WebGL is disabled (`--disable-3d-apis`), Save-Data is on, reduced motion is on or JavaScript is off.
- **Forms:** all fields have labels; empty submits show `role="alert"` messages, `aria-invalid` and (submit form) move focus to the first bad field.
- **Interactions:** the earlier route, interaction and responsive checks were re-run on the final build (324 routes x 24 sizes, 0 horizontal overflow).

## Issues found and fixed

| Area | Problem | Fix |
| --- | --- | --- |
| Colour contrast | White text on the primary button and active chips was 2.0 to 3.7:1 over the bright gradient (needs 4.5:1). | A deeper gradient (`--grad-neon-ink`) in the same hues, 4.8 to 5.9:1; count text in active chips is white; the eyebrow, photo credit, category tile and PhotoBand overlays and header link colours were brightened or darkened a step. |
| Keyboard focus | Shift+Tab left focused links under the sticky header (up to 16 of 90 stops on the pricing page); forward Tab could put focus behind the compare bar. | `scroll-padding-top: 5.5rem` and `scroll-padding-bottom: 6rem` on `html`. 0 obscured stops after. |
| Label in name | The home link, the news "original" links and the category map nodes had accessible names that did not contain their visible text. | Names now include the visible text. |
| Names | 69 identical "Official pricing" links, 24 identical "Visit site" links, repeated "View details" and "Compare" checkboxes. | Hidden text and labels add the tool name. |
| Table semantics | Two comparison tables had an empty header cell. A wide table that scrolled sideways could not be scrolled by keyboard. | Hidden "Detail" label; the table box is a focusable, named region. |
| Forms | Submit form fields without a hint pointed `aria-describedby` at a missing id. The contact form left focus on the button after an error. | Hints referenced only where present; focus goes to the message box. |
| Structure | A `div` with `aria-label` and no role; an h3 under the h1 on Recently viewed. | `role="group"`; hidden h2. |
| High contrast | Tool logos vanished (dark logo on forced black). | `forced-color-adjust: none` on the logo tile. |
| Text size | The large-screen root size was set in px, ignoring a visitor's own default font size. | Percentages (106.25% to 150%). |
| Long lines | Paragraphs in cards reached 150 characters per line on wide screens. | Paragraphs in `main` stop at 90 characters (utilities still win). |
| Hero 3D | If bitmap creation failed (older Safari), the 3D hero was left half-started. | The flat robot stays and the start is abandoned cleanly. |

## Performance (Lighthouse, this machine, simulated throttling)

Results move a lot with the machine's CPU speed (the benchmark index ranged from 439 to 1236 during these runs). Mobile, runs with benchmark index above 800: Home 77 to 82 (6 runs, median 78, TBT about 0.75 s); Pricing 80 to 90 (median 85 of 7 runs, TBT 330 to 780 ms). Desktop: Home 89 and 97, Pricing 99 and 100. The earlier worry about Pricing came from noisy runs; on a quiet machine it matches the directory page. No change was made to Pricing and no improvement is claimed. A batch of Home runs at benchmark 439 to 769 scored 54 to 65 and is not comparable.

## Limits

- Firefox, Safari and WebKit were not run. Static support lookup from caniuse data for what the site uses: cascade layers (Safari 15.4, Firefox 97), `text-wrap: balance` (Safari 17.5, Firefox 121), `content-visibility` (Safari 18, Firefox 125; ignored elsewhere), OffscreenCanvas with WebGL and `createImageBitmap` from a canvas (Safari 17, Firefox 105 and 98), `requestIdleCallback` (missing in Safari; the code has a fallback), `backdrop-filter` (Safari 9 and Firefox 103). Browsers without OffscreenCanvas WebGL keep the flat robot. This lookup is not a test.
- Real phones, tablets and screen readers (NVDA, JAWS, VoiceOver, TalkBack) were not used. The accessibility tree, names and landmarks were checked through DevTools and axe only.
- On GitHub Pages a project site cannot serve `/robots.txt` at the host root; the sitemap is at `/aitoolpicks/sitemap.xml` and can be submitted in the search consoles.
- Text-only zoom and a changed browser default font size were not tested separately (the layout is rem-based and the large-screen scaling now respects it).
