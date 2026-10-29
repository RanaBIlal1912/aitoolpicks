import { pageMeta } from "@/lib/meta";
import { TOOLS } from "@/data/tools";
import PageHeader from "@/components/PageHeader";
import PricingHub from "@/components/PricingHub";

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
        lead={`Prices for ${TOOLS.length} tools, read from the vendors' own pricing pages. ${v} are fully verified, ${p} are partly verified and ${u} could not be read automatically. We never fill a gap with a guess.`}
        crumbs={[{ name: "Pricing", href: "/pricing/" }]}
      />
      <PricingHub />
    </>
  );
}
