import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import LegalPage from "@/components/LegalPage";

export const metadata = pageMeta({
  title: "Terms of Use",
  description: "The terms for using AI Tool Picks: information only, no professional advice, third-party links and limits of liability.",
  path: "/terms/",
});

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of use"
      lead="By using this site you agree to these simple terms."
      path="/terms/"
      updated="29 October 2026"
    >
      <h2>Information only</h2>
      <p>
        AI Tool Picks publishes general information and opinion about software tools. It is not legal, tax, financial or professional
        advice. Make your own decisions and check important details with the tool&rsquo;s official site or a qualified professional.
      </p>

      <h2>Accuracy</h2>
      <p>
        We work to keep prices, features and news accurate, but products change quickly and mistakes happen. Prices and currency
        conversions are for guidance only. Always confirm the current price and terms with the seller before you buy. If you find an
        error, please <Link href="/contact/">tell us</Link>.
      </p>

      <h2>Third-party sites and affiliate links</h2>
      <p>
        We link to other websites that we do not control. We are not responsible for their content, products, prices or privacy
        practices. Some links are affiliate links, explained in our <Link href="/affiliate-disclosure/">affiliate disclosure</Link>.
        Any purchase is a contract between you and the seller.
      </p>

      <h2>Product names</h2>
      <p>
        Product and company names belong to their owners and are used only to identify the products we discuss. We are not affiliated
        with, sponsored by or endorsed by those companies unless a page says so.
      </p>

      <h2>Our content</h2>
      <p>
        You may quote short extracts with a link back to the page. Please do not copy whole pages or republish our content as your own
        without permission.
      </p>

      <h2>Acceptable use</h2>
      <p>Do not misuse the site: no attempts to disrupt it, scrape it aggressively or use it to break the law.</p>

      <h2>No warranty and limit of liability</h2>
      <p>
        The site is provided &ldquo;as is&rdquo;, without warranties of any kind. To the fullest extent the law allows, we are not
        liable for losses arising from your use of the site or from decisions you make based on its content.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows the latest version. Continued use means you accept the updated terms.</p>
    </LegalPage>
  );
}
