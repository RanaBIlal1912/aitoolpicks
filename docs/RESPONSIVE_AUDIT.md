# Responsive audit

Browser viewport emulation in headless Chrome (puppeteer-core) plus the Browser pane for the 3D hero. No physical device was used. Findings and fixes from one audit pass on `feature/futuristic-full-website-redesign`.

## What was tested

- **Routes:** every built route, 324 in all (323 pages plus the 404 page).
- **Key screen sizes (46):** phones portrait 320x568, 320x640, 360x640, 360x800, 375x667, 375x812, 390x844, 393x852, 412x915, 414x896, 430x932, 480x854; phones landscape 568x320, 667x375, 740x360, 812x375, 844x390, 915x412, 932x430; tablets 600x960, 768x1024, 800x1280, 834x1194, 900x1200 (portrait) and 960x600, 1024x768, 1112x834, 1194x834, 1280x800 (landscape); laptops 1024x600, 1152x720, 1280x720, 1366x768, 1440x900, plus short 1366x600 and 1280x600; desktops 1536x864, 1600x900, 1680x1050, 1920x1080, 1920x900; large 2560x1440, 2560x1080 (21:9), 3440x1440 (21:9), 3840x2160, 3840x1600.
- **All routes** at a 24-size subset of those (7,776 checks per run), **representative page types** (31) at all 46 sizes, and a **continuous sweep** of the same 31 pages at 283 widths from 320 to 3840 px (every 4 px up to 1100, every 32 px above), with a height suited to each width (8,773 checks).
- **Per check:** horizontal scroll (`scrollWidth - clientWidth`), elements past the viewport edge that nothing clips, text clipped by an overflow-hidden parent, text or controls overlapping each other, decorative picture blocks sitting on text, distorted images, very long text lines, header height and wrapping, tap-target and font-size counts on small screens.
- **Interactions** at 375, 667, 768 (touch) and 1024, 1440, 2560, 3440 (mouse): menus, directory search, filter chips, sort, compare bar, compare matrix, pricing filters, forms, 404.
- **Visual inspection** of captures at phone, tablet, laptop and 1920 to 3840 px for the home, directory, tool, compare, pricing, news, blog, ecosystem, company, form and legal pages.
- **3D hero** in the Browser pane (real GPU) at 768x1024, 844x390, 1024x768, 1920x1080, 3440x1440 and 3840x2160.

## Issues found and fixed

| Where | Problem | Fix |
| --- | --- | --- |
| Company pages (`/ecosystem/companies/*`) at 320 to 430 px; category pages at 320 and 360 px | A grid column grew to its widest unbreakable line (a truncated tagline), so the page was up to 141 px wider than the screen. | A base-layer rule lets grid items shrink: `.grid > * { min-width: 0 }`. |
| Desktop "More" menu, all widths from 1024 | `.glass { position: relative }` (unlayered) overrode Tailwind's `absolute`, so the dropdown sat in the header flow, was cut off above the top of the page, and at exactly 1024 px pushed the header 107 px past the screen. | The position rule moved into `@layer components`, so utility classes win again. The menu also gets a backdrop blur so page text does not show through. |
| Page-header logo (tool and category pages), 1100 px and wider | An offset based on `100vw` kept growing, so on wide monitors the logo drifted into the headline. | The offset is capped at 6rem. The logo is now shown from 1024 px up (it overlapped the text between 768 and 1023 px). |
| Home hero 3D scene, 768 to 1023 px and landscape phones | The desktop 3D scene and canvas offsets were used on a single-column layout, so the 3D logos and robot overlapped the paragraph. | Below 1024 px the compact scene and phone offsets are used. |
| Home hero 3D, touch devices | The worker effect depended on the `logos` array identity. If the parent re-rendered (the router does this on prefetch), the effect re-ran, ended the worker and then failed with `InvalidStateError` on the already-transferred canvas, leaving a frozen scene and a console error. | The effect depends only on `gl`, reads the logos from a ref, and refuses to transfer a canvas twice. |
| Large monitors, TVs, ultrawide (1920 px and up) | The interface stayed a 1280 px column in the middle of the screen (one third of a 3840 px display). | The root font size steps up at 1920 (17px), 2400 (19px), 3000 (22px) and 3600 px (24px); everything is in rem, so the container, type and spacing scale together. Body text moved from `17px` to `1.0625rem`. Fixed-pixel cards in the category and guide rails are now rem, so they scale with the text. |
| Verification log, 1064 px and wider | Notes ran 1198 px wide (about 170 characters per line). | Capped at `max-w-3xl`. |

## Remaining items and limits

- Reading width on a few long paragraphs (reviews, news summaries, best-of notes) reaches about 1400 px at 1920 to 3840 px. This is body copy inside cards, not stretched article text, and was left alone.
- The overlap check reports many false positives on the home page: rails, tilted cards and scroll-linked effects move elements, so the numbers are not a defect count. Home was checked visually down the whole page at 430 and 768 px instead.
- The compare matrix with three tools is wider than a phone and scrolls inside its own box. This is by design.
- Headless Chrome uses a software renderer, so the 3D hero was checked in the Browser pane, not in the automated runs.
- Safari, Firefox and physical devices were not tested.
