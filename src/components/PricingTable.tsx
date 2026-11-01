"use client";

import type { Plan, Pricing } from "@/data/catalog-types";
import { PRICING_MODEL_LABEL } from "@/data/tools";
import { convertBetween, format } from "@/lib/currency";
import { formatChecked } from "@/lib/dates";
import { useCurrency } from "./CurrencyProvider";

const AUDIENCE: Record<string, string> = { individual: "Individual", team: "Team", business: "Business", enterprise: "Enterprise", api: "Usage-based" };

function unitText(unit: string): string {
  return unit === "per month" ? "per month" : unit;
}

function Money({ amount, plan, cur, rates, live }: { amount: number; plan: Plan; cur: ReturnType<typeof useCurrency>["currency"]; rates: ReturnType<typeof useCurrency>["rates"]; live: boolean }) {
  const est = cur !== plan.currency && amount > 0 ? format(convertBetween(amount, plan.currency, cur, rates), cur) : null;
  return (
    <>
      <span className="text-2xl font-extrabold tracking-tight text-white">{format(amount, plan.currency)}</span>
      {est && (
        <span className="ml-2 text-sm text-muted">
          ≈ {est} <span className="text-xs">({live ? "estimate" : "approx. estimate"})</span>
        </span>
      )}
    </>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const { currency, rates, meta } = useCurrency();
  const free = plan.monthly === 0 && plan.annual === undefined;
  const priced = plan.monthly !== undefined || plan.annual !== undefined;
  return (
    <li className="glass plan-card flex h-full flex-col rounded-[22px] p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">{AUDIENCE[plan.audience]}</span>
      </div>

      <div className="mt-3 space-y-2">
        {free && <p className="text-2xl font-extrabold text-white">Free</p>}
        {!free && plan.monthly !== undefined && (
          <p>
            <Money amount={plan.monthly} plan={plan} cur={currency} rates={rates} live={meta.live} />
            <span className="ml-1 text-sm text-muted">{unitText(plan.unit)}, billed monthly</span>
          </p>
        )}
        {!free && plan.annual !== undefined && (
          <p>
            <Money amount={plan.annual} plan={plan} cur={currency} rates={rates} live={meta.live} />
            <span className="ml-1 text-sm text-muted">
              {unitText(plan.unit)}, billed annually{plan.annualTotal !== undefined ? ` (${format(plan.annualTotal, plan.currency)} per year)` : ""}
            </span>
          </p>
        )}
        {!free && !priced && plan.annualTotal !== undefined && (
          <p>
            <Money amount={plan.annualTotal} plan={plan} cur={currency} rates={rates} live={meta.live} />
            <span className="ml-1 text-sm text-muted">per year</span>
          </p>
        )}
        {!free && !priced && plan.annualTotal === undefined && (
          <p className="text-lg font-bold text-white">{plan.custom ? "Custom pricing" : "Price not captured"}</p>
        )}
        {!free && plan.custom && priced && <p className="text-sm text-muted">Larger or custom options available on request.</p>}
        <p className="text-xs text-muted">Merchant currency: {plan.currency}</p>
      </div>

      {plan.billing && <p className="mt-2 text-sm text-soft">{plan.billing}</p>}
      {plan.highlights && plan.highlights.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm text-soft">
          {plan.highlights.map((h) => (
            <li key={h} className="flex gap-2">
              <span aria-hidden="true" className="text-emerald-300">
                ✓
              </span>
              {h}
            </li>
          ))}
        </ul>
      )}
      {plan.limits && plan.limits.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm text-soft">
          {plan.limits.map((h) => (
            <li key={h} className="flex gap-2">
              <span aria-hidden="true" className="text-amber">
                !
              </span>
              {h}
            </li>
          ))}
        </ul>
      )}
      {plan.note && <p className="mt-3 border-t border-white/10 pt-3 text-xs text-muted">{plan.note}</p>}
    </li>
  );
}

const STATUS_COPY = {
  verified: { label: "Pricing verified", tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100", text: "Plans and prices below were read from the official pricing page on" },
  partial: { label: "Pricing partly verified", tone: "border-amber/30 bg-amber/10 text-amber", text: "Some details below could not be read or were ambiguous on the official pricing page we checked on" },
  unverified: { label: "Pricing not verified", tone: "border-white/20 bg-white/5 text-soft", text: "We could not read the official pricing page when we checked on" },
} as const;

export default function PricingTable({ pricing, name }: { pricing: Pricing; name: string }) {
  const s = STATUS_COPY[pricing.status];
  const consumer = pricing.plans.filter((p) => p.audience !== "api");
  const usage = pricing.plans.filter((p) => p.audience === "api");
  return (
    <div>
      <div className={`rounded-2xl border px-5 py-4 ${s.tone}`}>
        <p className="font-bold">{s.label}</p>
        <p className="mt-1 text-sm opacity-90">
          {s.text} {formatChecked(pricing.checked)}. Pricing model: {PRICING_MODEL_LABEL[pricing.model]}.{" "}
          <a href={pricing.source} target="_blank" rel="noopener noreferrer" className="underline">
            Open the official pricing page
          </a>
          .
        </p>
        {pricing.blockedReason && <p className="mt-2 text-sm opacity-90">{pricing.blockedReason}</p>}
      </div>

      {(pricing.free || pricing.trial) && (
        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          {pricing.free && (
            <div className="glass rounded-2xl p-5">
              <dt className="kicker">Free plan</dt>
              <dd className="mt-1 text-soft">{pricing.free.details ?? (pricing.free.available ? "A free plan is available." : "No free plan.")}</dd>
            </div>
          )}
          {pricing.trial && (
            <div className="glass rounded-2xl p-5">
              <dt className="kicker">Free trial</dt>
              <dd className="mt-1 text-soft">{pricing.trial}</dd>
            </div>
          )}
        </dl>
      )}
      {!pricing.free && pricing.status !== "unverified" && (
        <p className="mt-5 text-sm text-muted">Whether {name} has a free plan is not stated on the page we read.</p>
      )}

      {consumer.length > 0 && (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2">
          {consumer.map((p) => (
            <PlanCard key={p.name} plan={p} />
          ))}
        </ul>
      )}
      {usage.length > 0 && (
        <>
          <h3 className="mt-8 text-lg font-bold text-white">Usage-based pricing</h3>
          <ul className="mt-3 grid gap-5 md:grid-cols-2">
            {usage.map((p) => (
              <PlanCard key={p.name} plan={p} />
            ))}
          </ul>
        </>
      )}

      {pricing.api && (
        <div className="glass mt-6 rounded-2xl p-5">
          <h3 className="kicker">API and usage-based pricing (separate from subscriptions)</h3>
          <p className="mt-2 text-soft">{pricing.api.summary}</p>
          <a href={pricing.api.source} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-[#9db4d6] underline">
            Official source
          </a>
        </div>
      )}

      {(pricing.regional || (pricing.notes && pricing.notes.length > 0)) && (
        <div className="mt-6 space-y-2 text-sm text-muted">
          {pricing.regional && (
            <p>
              <strong className="text-soft">Regional and tax notes:</strong> {pricing.regional}
            </p>
          )}
          {pricing.notes?.map((n) => (
            <p key={n}>
              <strong className="text-soft">Note:</strong> {n}
            </p>
          ))}
        </div>
      )}

      <p className="mt-6 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-muted">
        Prices are shown in each merchant&rsquo;s own currency. Amounts marked &ldquo;≈&rdquo; are estimates converted with public exchange rates and are
        not offers: a merchant may not accept the currency you selected, may charge in another currency and may add tax. Plans and prices change, and
        availability differs by country.
      </p>
    </div>
  );
}
