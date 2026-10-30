import Link from "next/link";
import { RECORDS } from "@/lib/catalog";
import { pageMeta } from "@/lib/meta";
import PageHeader from "@/components/PageHeader";
import { formatChecked } from "@/lib/dates";
import { VERIFICATION_CLASS, VERIFICATION_LABEL } from "@/lib/verification";

export const metadata = pageMeta({
  title: "Tool verification log",
  description: "For every tool in the catalog: when we opened its official site and pricing page in a browser, what we confirmed, and what is still uncertain.",
  path: "/verification/",
});

export default function VerificationPage() {
  const rows = [...RECORDS].sort((a, b) => a.name.localeCompare(b.name));
  const count = (s: string) => rows.filter((r) => r.verification.status === s).length;
  return (
    <>
      <PageHeader
        eyebrow="Verification"
        title="Tool verification log"
        lead="Each record was checked by opening the vendor's own site and pricing page in a browser. Where a page hid a price, or a toggle could not be read, the record says so instead of guessing."
        crumbs={[{ name: "Verification", href: "/verification/" }]}
      />
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-soft">
          {rows.length} tools checked: {count("verified")} verified, {count("partial")} partially verified. Prices are shown in the currency the vendor displayed, and the billing period is
          stated only when the page states it. See the{" "}
          <Link href="/methodology/" className="underline">
            methodology
          </Link>
          .
        </p>
        <ul className="mt-8 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <Link href={`/tools/${r.id}/`} className="text-lg font-bold text-white underline-offset-4 hover:underline">
                  {r.name}
                </Link>
                <span className={`text-sm font-semibold ${VERIFICATION_CLASS[r.verification.status]}`}>{VERIFICATION_LABEL[r.verification.status]}</span>
                <span className="text-xs text-muted">checked {formatChecked(r.verification.checked)}</span>
              </div>
              <p className="mt-2 text-sm text-soft">{r.verification.notes}</p>
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <a href={r.verification.officialUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Official site ↗
                </a>
                <a href={r.verification.pricingUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Pricing source ↗
                </a>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
