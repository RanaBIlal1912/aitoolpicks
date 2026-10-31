import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import PageHeader from "@/components/PageHeader";
import SubmitForm from "@/components/SubmitForm";

export const metadata = pageMeta({
  title: "Submit an AI tool",
  description: "Suggest an AI product for the directory. Submissions are reviewed by a person against official sources; nothing is published automatically.",
  path: "/submit/",
});

export default function SubmitPage() {
  return (
    <>
      <PageHeader variant="studio"
        eyebrow="Submit"
        title="Suggest an AI tool"
        lead="Know a useful AI product that is missing? Tell us about it. A person checks every suggestion against the product's official website and pricing page before anything is added."
        crumbs={[{ name: "Submit a tool", href: "/submit/" }]}
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[1.6fr_1fr]">
        <SubmitForm />
        <aside className="space-y-5 text-sm text-soft" aria-label="How submissions work">
          <div className="glass rounded-[22px] p-6">
            <h2 className="text-lg font-bold text-white">How it works</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>You fill in this form. We check it for obvious mistakes and for tools already listed.</li>
              <li>It opens a pre-filled issue in our public GitHub repository. You press &ldquo;Submit new issue&rdquo; there.</li>
              <li>An editor reads it, visits the official site and pricing page, and decides. We may ask questions on the issue.</li>
              <li>If it is added, it gets a record with sources and a checked date. There is no promise of a listing, and no payment buys one.</li>
            </ol>
          </div>
          <div className="glass rounded-[22px] p-6">
            <h2 className="text-lg font-bold text-white">Privacy</h2>
            <p className="mt-2 text-muted">
              Submissions are public GitHub issues, subject to GitHub&rsquo;s own privacy policy. This site stores nothing you type. Do not include private information; the email is optional for
              that reason. See our <Link href="/privacy/" className="underline">privacy policy</Link>.
            </p>
          </div>
          <div className="glass rounded-[22px] p-6">
            <h2 className="text-lg font-bold text-white">Why GitHub?</h2>
            <p className="mt-2 text-muted">
              This site is static and has no server or database, so it cannot receive a form directly. Using GitHub issues means a submission is never silently lost, and you can see its status.
              Private submissions would need a form backend, which is not set up.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
