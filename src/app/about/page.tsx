import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import LegalPage from "@/components/LegalPage";

export const metadata = pageMeta({
  title: "About AI Tool Picks: our mission and how we choose tools",
  description:
    "AI Tool Picks publishes plain-English guides, comparisons and overviews of AI tools for freelancers and small businesses. Learn how we choose tools and how the site earns money.",
  path: "/about/",
});

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="About"
      title="About AI Tool Picks"
      lead="We help freelancers, students and small business owners choose AI and online tools without wasting money or time."
      path="/about/"
    >
      <h2>Our mission</h2>
      <p>
        There are thousands of AI tools and most reviews are written to sell you something. Our job is the opposite: explain what a
        tool does in plain English, who it suits, who should skip it, and what to try for free first.
      </p>

      <h2>Who this is for</h2>
      <ul>
        <li>Freelancers looking for clients and faster ways to deliver good work.</li>
        <li>Students who want to learn faster and use AI honestly.</li>
        <li>Small business owners who need a simple stack for writing, design, organisation and a website.</li>
      </ul>

      <h2>How we choose and describe tools</h2>
      <ul>
        <li>
          <strong>Free first.</strong> We prefer tools with a free plan so you can try before you pay.
        </li>
        <li>
          <strong>Honest pros and cons.</strong> Every overview includes the downsides.
        </li>
        <li>
          <strong>Verified prices only.</strong> A price appears only after we check the official pricing page. When sources disagree or
          we could not verify a number, we say so and send you to the official site.
        </li>
        <li>
          <strong>Clear about what we did.</strong> Our overviews are based on each product&rsquo;s public documentation and
          well-known behaviour. We do not claim lab testing or long-term trials that we have not done.
        </li>
        <li>
          <strong>Sources for news.</strong> AI news items link to the original announcement and show its publication date.
        </li>
      </ul>

      <h2>How the site earns money</h2>
      <p>
        Some links are affiliate links: if you buy through them we may earn a commission at no extra cost to you. This is how we pay
        for the site. Commissions never decide what we recommend or what we say. Read the full{" "}
        <Link href="/affiliate-disclosure/">affiliate disclosure</Link>.
      </p>

      <h2>Currencies</h2>
      <p>
        Merchant prices are shown in US dollars. If you pick another currency, we show a clearly labelled <em>estimate</em> converted
        from USD with recent exchange rates. Your checkout price may differ.
      </p>

      <h2>Corrections</h2>
      <p>
        Prices and features change quickly. If you spot a mistake, tell us through the <Link href="/contact/">contact page</Link> and we
        will check the official source and fix it.
      </p>
    </LegalPage>
  );
}
