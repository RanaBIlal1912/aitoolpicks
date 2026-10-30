import { pageMeta } from "@/lib/meta";
import { TOOLS } from "@/data/tools";
import PageHeader from "@/components/PageHeader";
import PricingHub from "@/components/PricingHub";
import { RECORDS } from "@/lib/catalog";
import Link from "next/link";

export const metadata = pageMeta({
  title: "AI tool pricing compared: plans, free tiers and what is verified",
  description:
    "One table of AI tool plans and prices, in each merchant's own currency, with free-plan details, verification status, last-checked dates and links to the official pricing pages.",
  path: "/pricing/",
});

export default function PricingPage() {
  const v = TOOLS.filter((t) => t.pricingStatus === "verified").length;
  const p = TOOLS.filter((t) => t.pricingStatus === "partial").length;
  const u = TOOLS.filter((t) => t.pricingStatus === "unverified").length;
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title={
          <>
            What AI tools really cost, <span className="gradient-text">side by side</span>
          </>
        }
        lead={`Prices for ${TOOLS.length} tools, read from the vendors' own pricing pages. ${v} are fully verified, ${p} are partly verified${u ? ` and ${u} could not be read` : ""}. We never fill a gap with a guess.`}
        crumbs={[{ name: "Pricing", href: "/pricing/" }]}
      />
      <PricingHub />
      <section className="mx-auto mt-16 max-w-6xl px-5" aria-labelledby="incomplete-title">
        <h2 id="incomplete-title" className="section-title text-white">
          Incomplete pricing records ({RECORDS.filter((r) => r.pricing.status !== "verified").length})
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">These tools are partly verified. Each note says what the vendor&rsquo;s page did not make clear. Full log on the{" "}
          <Link href="/verification/" className="underline">verification page</Link>.</p>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {RECORDS.filter((r) => r.pricing.status !== "verified").map((r) => (
            <li key={r.id} className="glass rounded-2xl p-4 text-sm">
              <Link href={`/tools/${r.id}/`} className="font-bold text-white underline-offset-4 hover:underline">{r.name}</Link>
              <p className="mt-1 text-muted">{r.verification.notes}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
