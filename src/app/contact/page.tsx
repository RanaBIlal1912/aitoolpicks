import { pageMeta } from "@/lib/meta";
import { SITE } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/components/ContactForm";

export const metadata = pageMeta({
  title: "Contact AI Tool Picks",
  description: "Ask a question, report a mistake or suggest a tool for us to cover. Contact AI Tool Picks by email or GitHub.",
  path: "/contact/",
});

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Tell us what we got wrong, or what to cover next"
        lead="We read every message. Corrections to prices or facts are the most useful thing you can send."
        crumbs={[{ name: "Contact", href: "/contact/" }]}
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-5 lg:grid-cols-[1.4fr_1fr]">
        <ContactForm />
        <aside className="space-y-5" aria-label="Other ways to reach us">
          <div className="glass rounded-[22px] p-6">
            <h2 className="text-lg font-bold text-white">GitHub</h2>
            <p className="mt-2 text-soft">
              The site&rsquo;s code is public. You can open an issue to report a mistake or suggest an improvement.
            </p>
            <a href={`${SITE.repo}/issues`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm mt-4">
              Open GitHub issues ↗
            </a>
          </div>
          {SITE.contactEmail && (
            <div className="glass rounded-[22px] p-6">
              <h2 className="text-lg font-bold text-white">Email</h2>
              <a className="mt-2 inline-block text-[#9db4d6] underline" href={`mailto:${SITE.contactEmail}`}>
                {SITE.contactEmail}
              </a>
            </div>
          )}
          <div className="glass rounded-[22px] p-6">
            <h2 className="text-lg font-bold text-white">What to expect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-soft">
              <li>Fact and price corrections are checked against the official source.</li>
              <li>We do not accept payment to change a review.</li>
              <li>We cannot give personal tax, legal or financial advice.</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
