import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { TOOLS } from "@/data/tools";
import LegalPage from "@/components/LegalPage";

export const metadata = pageMeta({
  title: "Methodology: how we verify tools, prices and news",
  description:
    "How AI Tool Picks collects tool records, verifies pricing from official pages, labels unverified data, handles currency estimates, tracks changes and chooses news items.",
  path: "/methodology/",
});

export default function MethodologyPage() {
  const v = TOOLS.filter((t) => t.pricingStatus === "verified").length;
  const p = TOOLS.filter((t) => t.pricingStatus === "partial").length;
  const u = TOOLS.filter((t) => t.pricingStatus === "unverified").length;
  return (
    <LegalPage
      eyebrow="Methodology"
      title="How we verify tools, prices and news"
      lead="What each label on this site means, and the rules we follow so a number is never invented."
      path="/methodology/"
      updated="29 October 2026"
    >
      <h2>Where tool information comes from</h2>
      <p>
        Every tool has one record with a vendor, a category, features, use cases, strengths, limitations, plans, and a list of source links. Features and
        limits are taken from the vendor&rsquo;s own pricing and product pages. When a page does not say something, the record says it was not stated rather
        than filling the gap from memory.
      </p>

      <h2>What the pricing labels mean</h2>
      <ul>
        <li>
          <strong>Pricing verified</strong> ({v} tools): every plan we list was read from the official pricing page on the date shown, with its own plan names.
          Some details can still be missing, such as an annual price, and those are marked.
        </li>
        <li>
          <strong>Pricing partly verified</strong> ({p} tools): at least one price, billing period or currency was missing or ambiguous on the page, or the page showed
          prices localised to a country.
        </li>
        <li>
          <strong>Pricing not verified</strong> ({u} tools): the official page refused automated access or showed nothing readable. We show no prices for these and
          link to the official page.
        </li>
      </ul>
      <p>
        Plans are never forced into one template. A product&rsquo;s own names (Free, Pro, Max, Credits, Core, Team and so on) are shown as published, and usage-based,
        custom and region-dependent prices are labelled as such. Subscriptions and API prices are shown separately.
      </p>

      <h2>Currencies and estimates</h2>
      <p>
        Official prices are shown in the merchant&rsquo;s own currency and are never converted in place. If you pick another display currency, we show a separate
        estimate marked &ldquo;≈&rdquo;, calculated from public exchange rates (or a fallback table that is labelled when live rates are unavailable). A currency
        selector does not mean a merchant accepts that currency.
      </p>

      <h2>Dates, changes and stale records</h2>
      <p>
        Each record and each pricing section carries a last-checked date. Records are meant to be rechecked at least every 90 days; our validation tools flag any
        pricing that has gone stale, and vendors that rename, merge or withdraw a product are noted in the record rather than silently removed. We do not claim
        daily or automatic updates: records change when a person rechecks the source and edits the file.
      </p>

      <h2>Reviews, guides and comparisons</h2>
      <p>
        Overviews and best-of guides are editorial summaries of public documentation and the facts in each record. We do not present them as hands-on lab tests,
        and we do not publish star ratings. Guides group tools by who they suit instead of ranking them.
      </p>

      <h2>AI news</h2>
      <p>
        News items link to the original source and carry the date that source shows (or, for some publications, the date in the article address, which we say).
        Summaries stay close to the source, and we skip rumours and unsourced reports.
      </p>

      <h2>Images</h2>
      <p>
        Cover images are 3D renders made for this site, and pages say so. We do not use vendor logos or product screenshots without permission, so tool cards use a
        simple letter mark.
      </p>

      <h2>Affiliate links</h2>
      <p>
        Affiliate links are kept in a single file and are empty until a programme approves us. Until then, every button goes to the official site. See the{" "}
        <Link href="/affiliate-disclosure/">affiliate disclosure</Link>.
      </p>

      <h2>Corrections</h2>
      <p>
        Spot a wrong price or a missing plan? Use the <Link href="/contact/">contact page</Link> with a link to the official source.
      </p>
    </LegalPage>
  );
}
