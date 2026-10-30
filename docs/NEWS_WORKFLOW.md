# Publishing AI news

AI Tool Picks news is **edited by hand**. Nothing is discovered or published automatically, and the site never claims live updates. If a
discovery script is ever added, it may only produce a list of *candidates* for a person to read; it must not write to `src/data/news.ts`.

## Steps for each story

1. **Read the original.** Open the announcement or report itself, not a summary of it. Only first-party posts and established reporting qualify.
2. **Verify the date.** Use the date the source shows. If the page only shows relative times ("2 hours ago"), read the date from the article
   address and set `dateFromUrl: true`.
3. **Identify the source.** `source` is the publisher's name, `url` the exact page. Never link to an aggregator.
4. **Write an original summary.** One to three sentences in your own words. Do not copy sentences or headlines' phrasing beyond the facts. Do not add facts the source does not state.
5. **Write "why it may matter" (`matters`).** Plain language for people choosing tools. Make clear it is our interpretation. No predictions, no rumours.
6. **Classify it.**
   - `tag` = the topic (Products, Models, Research, Policy & safety, Company news, Open standards).
   - `kind` = what happened (New product, Feature update, Model release, Research, Policy update, Company announcement, Open standard).
     A *new* product or model is not the same as an *update* to an existing one.
   - `importance` = 1 to 3. Use 3 sparingly, for stories that change what readers can do or buy. It decides what leads the page; recency alone does not.
   - `tools` = ids of catalog tools the story concerns (they must exist in `content/tools`).
7. **Pick the image** (see below).
8. **Check before publishing:** `npm run check`. The tests enforce unique slugs, real dates, https sources, existing tool ids and a non-empty `matters`.

## Images

Order of preference:

1. **The vendor's own announcement image** for that story (the `og:image` of the announcing page). Add it to `content/news-images.json` with `imageUrl`,
   `credit`, `page`, a descriptive `alt`, and a short `file` name, then run `npm run news-images`. The site shows the credit and links to the page.
2. **Nothing.** The site then draws an illustration for the story's type, with the logos of the tools involved. It is labelled as an illustration.

Do **not** use: a third-party outlet's photograph, a stock photo that merely looks related, or an image that several unrelated stories share (some vendors use one default
image for all their posts; skip those). Permission is not separately verified for announcement images; they are used with credit and a link for news
reporting. If a rights holder objects, delete the entry from `news-images.json` and the files in `public/images/news`.

## Adding the story

Add an object to `NEWS` in `src/data/news.ts` (newest does not need to be first; pages sort). Choose a stable, lowercase `slug`; never change it later. Update
`NEWS_CHECKED`. The RSS feed (`/news/feed.xml`) and sitemap update on the next build.
