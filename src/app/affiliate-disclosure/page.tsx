import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import LegalPage from "@/components/LegalPage";

export const metadata = pageMeta({
  title: "Affiliate Disclosure",
  description:
    "AI Tool Picks may earn a commission when you buy through some links. Read how affiliate links work on this site and how we keep our recommendations independent.",
  path: "/affiliate-disclosure/",
});

export default function DisclosurePage() {
  return (
    <LegalPage
      eyebrow="Transparency"
      title="Affiliate disclosure"
      lead="Some links on this site are affiliate links. Here is exactly what that means."
      path="/affiliate-disclosure/"
      updated="29 October 2026"
    >
      <h2>What an affiliate link is</h2>
      <p>
        If you click an affiliate link and then buy or sign up, the company may pay us a commission. It does not cost you anything
        extra and does not change the price you pay.
      </p>

      <h2>How you can tell</h2>
      <ul>
        <li>Pages that contain affiliate links say so near the top.</li>
        <li>Affiliate links are marked with the <code>sponsored</code> link attribute, and our buttons say when a link opens in a new tab.</li>
        <li>
          Where we do not have an affiliate arrangement with a company, the button goes straight to that company&rsquo;s official site and
          we earn nothing. That is the case for any tool whose affiliate link has not been added yet.
        </li>
      </ul>

      <h2>Independence</h2>
      <ul>
        <li>Commissions never decide which tools we cover or what we say about them.</li>
        <li>We include cons and who should skip a tool, including for tools we may earn from.</li>
        <li>We do not accept payment to change a review, comparison or news item.</li>
        <li>We do not invent reviews, ratings, prices or features. Prices come from official pages and are labelled with the date checked.</li>
      </ul>

      <h2>Programmes we may join</h2>
      <p>
        We may apply to affiliate programmes run by software companies, either directly or through affiliate networks. Joining a
        programme does not mean we endorse everything the company does. If we ever receive a free account, product or other
        benefit, we will say so on the relevant page.
      </p>

      <h2>Prices and currency estimates</h2>
      <p>
        Merchant prices are shown in US dollars. Other currencies are <em>estimates</em> converted from USD with exchange rates and
        may differ from your checkout price. Changing the display currency never changes an affiliate link.
      </p>

      <h2>Questions</h2>
      <p>
        Ask us anything through the <Link href="/contact/">contact page</Link>.
      </p>
    </LegalPage>
  );
}
