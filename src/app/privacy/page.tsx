import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import LegalPage from "@/components/LegalPage";
import { ANALYTICS_ENABLED } from "@/lib/analytics";
import { SITE } from "@/lib/site";

export const metadata = pageMeta({
  title: "Privacy Policy",
  description:
    "What data AI Tool Picks collects (very little), what is stored in your browser, which third parties your browser contacts, and how affiliate links work.",
  path: "/privacy/",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      lead="We collect as little as possible. This page explains what that means in practice."
      path="/privacy/"
      updated="1 November 2026"
    >
      <h2>Summary</h2>
      <ul>
        <li>No accounts, no sign-up and no advertising networks.</li>
        {ANALYTICS_ENABLED ? (
          <li>We use Google Analytics to count visits, but only if you say yes. It stays off until you choose, and &ldquo;No thanks&rdquo; keeps it off.</li>
        ) : (
          <li>We do not currently run analytics or tracking scripts.</li>
        )}
        <li>Your currency choice, saved tools and recently viewed tools are stored only in your own browser, never on our servers.</li>
      </ul>

      <h2>What is stored in your browser</h2>
      <p>
        We use your browser&rsquo;s local storage (not cookies) for four things: the currency you picked, a short-lived copy of
        recent exchange rates so we do not fetch them on every page, the tools you choose to save (heart button), and the tool pages you recently viewed (up to 12). The saved and recent lists never leave your device: there are no accounts and nothing is synchronised. Clear them on the Saved tools and Recently viewed pages, or in your browser settings. You can clear this at any time in your browser settings. The
        site works without it.
      </p>

      {ANALYTICS_ENABLED && (
        <>
          <p>
            Apart from those four things, the only other things stored on your device are your analytics choice (in local storage) and, only if you allow analytics, Google&rsquo;s cookies. Both are described below.
          </p>
          <h2>Analytics (only with your consent)</h2>
          <p>
            The first time you visit, a notice asks whether we may use Google Analytics 4 to measure visits. Until you press &ldquo;Allow analytics&rdquo;, nothing from Google is loaded and nothing is sent. If you press
            &ldquo;No thanks&rdquo;, or your browser sends a Global Privacy Control or Do Not Track signal, it stays off and we do not ask again. Your choice is kept in your browser&rsquo;s local storage for up to 13 months, and then we ask again.
          </p>
          <p>
            <strong>Legal basis:</strong> your consent (Article 6(1)(a) of the GDPR, and the equivalent in similar laws). Saying no, or withdrawing consent later, has no effect on how you can use the site.
          </p>
          <ul>
            <li>
              <strong>What is measured:</strong> pages viewed, how you arrived (for example a search engine or another site), which outbound tool links you click, scroll depth, approximate location (country or city, from your IP
              address, which Google does not store), and the kind of device and browser.
            </li>
            <li>
              <strong>Cookies:</strong> if you allow analytics, Google sets first-party cookies (<code>_ga</code> and one starting <code>_ga_</code>) that give your browser a random ID so repeat visits can be told apart. They last up to two years.
            </li>
            <li>
              <strong>Not used:</strong> advertising features, Google signals and ad personalisation are switched off, and we do not link analytics to any account, because there are none.
            </li>
            <li>
              <strong>Who processes it:</strong> Google LLC (and its group companies) processes it for us. Google can process the data outside your country, including in the United States, and describes the safeguards it uses for such transfers in its
              own privacy policy and data processing terms.
            </li>
            <li>
              <strong>How long it is kept:</strong> Google Analytics deletes event-level data after 2 months and data tied to a browser ID after 14 months. Totals and trends in aggregated reports are kept.
            </li>
            <li>
              <strong>Your rights:</strong> under the GDPR and similar laws you can ask to see, correct, delete, restrict or take a copy of data about you, object to its use, and complain to your local data-protection authority. Analytics uses a random browser ID, not your name, so we can only
              find your data if you tell us the ID in your <code>_ga</code> cookie. To ask, open a request on the <Link href="/contact/">contact page</Link> without any private details, say it is a privacy request, and we will arrange a private way to answer.
            </li>
            <li>
              <strong>Changing your mind:</strong> use &ldquo;Analytics settings&rdquo; in the footer, or clear this site&rsquo;s data and cookies in your browser. Turning it off stops new data being sent and removes the Google cookies from this site.
            </li>
          </ul>
        </>
      )}

      <h2>Third parties your browser contacts</h2>
      <ul>
        {ANALYTICS_ENABLED && (
          <li>
            <strong>Google Analytics (only if you allow it).</strong> Your browser then contacts <code>www.googletagmanager.com</code> and <code>www.google-analytics.com</code>. Those requests carry your IP address and browser details, as with any
            website. See the analytics section above.
          </li>
        )}
        <li>
          <strong>Exchange-rate services.</strong> To show currency estimates, your browser requests rates from{" "}
          <code>open.er-api.com</code> and, if that fails, <code>cdn.jsdelivr.net</code>. Those services can see your IP address and
          browser details like any website you visit. We do not send them anything about you. We guess your likely currency from your
          browser language and time zone, on your device only, not from your IP address.
        </li>
        <li>
          <strong>Hosting.</strong> The site is served as static files. Our host may keep ordinary server logs (such as IP address and
          pages requested) for security and operations. See your host&rsquo;s privacy policy for details.
        </li>
        <li>
          <strong>Links to other sites.</strong> When you click a link to a tool&rsquo;s website, including an affiliate link, that
          company and any affiliate network will collect data under their own privacy policies, and may set their own cookies. We do
          not control this.
        </li>
      </ul>

      <h2>Who runs this site</h2>
      <p>
        AI Tool Picks is an independent site run by its owner, who decides why and how any data described here is used. The source code and public issue tracker are at{" "}
        <a href={SITE.repo} target="_blank" rel="noopener noreferrer">
          github.com/RanaBIlal1912/aitoolpicks
        </a>
        .
      </p>

      <h2>Contacting us</h2>
      <p>
        If you use the contact form, it opens your email app or a public GitHub issue with your message. Anything you post on GitHub is
        public, so never include private information. We use messages only to reply and to fix mistakes.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Clear local storage to remove your saved currency and cached rates.</li>
        <li>Use your browser&rsquo;s privacy features or extensions to block third-party requests.</li>
        <li>Ask us about data we may hold via the <Link href="/contact/">contact page</Link>.</li>
      </ul>

      <h2>Children</h2>
      <p>This site is not directed at children under 13 and we do not knowingly collect their personal information.</p>

      <h2>Changes</h2>
      <p>
        If we add advertising or anything else that collects data, we will update this page first and explain what and why.
      </p>
    </LegalPage>
  );
}
