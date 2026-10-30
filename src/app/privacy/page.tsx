import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import LegalPage from "@/components/LegalPage";

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
      updated="30 October 2026"
    >
      <h2>Summary</h2>
      <ul>
        <li>No accounts, no sign-up and no advertising networks.</li>
        <li>We do not currently run analytics or tracking scripts.</li>
        <li>Your currency choice, saved tools and recently viewed tools are stored only in your own browser, never on our servers.</li>
      </ul>

      <h2>What is stored in your browser</h2>
      <p>
        We use your browser&rsquo;s local storage (not cookies) for four things: the currency you picked, a short-lived copy of
        recent exchange rates so we do not fetch them on every page, the tools you choose to save (heart button), and the tool pages you recently viewed (up to 12). The saved and recent lists never leave your device: there are no accounts and nothing is synchronised. Clear them on the Saved tools and Recently viewed pages, or in your browser settings. You can clear this at any time in your browser settings. The
        site works without it.
      </p>

      <h2>Third parties your browser contacts</h2>
      <ul>
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
        If we add analytics, advertising or anything else that collects data, we will update this page first and explain what and why.
      </p>
    </LegalPage>
  );
}
