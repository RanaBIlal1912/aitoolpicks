"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CATEGORIES, TOOLS } from "@/data/tools";
import { SITE } from "@/lib/site";

type Values = {
  name: string;
  website: string;
  company: string;
  category: string;
  description: string;
  features: string;
  pricingUrl: string;
  email: string;
  submitter: string;
  extra: string;
};
const EMPTY: Values = { name: "", website: "", company: "", category: CATEGORIES[0].slug, description: "", features: "", pricingUrl: "", email: "", submitter: "", extra: "" };

export function hostOf(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Returns field errors; empty when the submission can go ahead. Exported so the rules are tested. */
export function validate(v: Values): Partial<Record<keyof Values, string>> {
  const e: Partial<Record<keyof Values, string>> = {};
  if (v.name.trim().length < 2) e.name = "Enter the tool's official name.";
  if (!hostOf(v.website) || !/^https:\/\//i.test(v.website.trim())) e.website = "Enter the official website as a full https:// address.";
  if (v.company.trim().length < 2) e.company = "Enter the company or maker.";
  if (v.description.trim().length < 30) e.description = "Describe what it does in at least a sentence (30 characters).";
  if (v.features.trim().length < 10) e.features = "List the main features.";
  if (!hostOf(v.pricingUrl) || !/^https:\/\//i.test(v.pricingUrl.trim())) e.pricingUrl = "Enter the official pricing page as a full https:// address.";
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "That email address does not look right.";
  return e;
}

/** An existing catalog tool with the same website host or the same name, if any. */
export function findDuplicate(v: Pick<Values, "name" | "website">) {
  const host = hostOf(v.website);
  const name = v.name.trim().toLowerCase();
  return TOOLS.find((t) => (host && hostOf(t.officialUrl) === host) || (name.length > 1 && t.name.toLowerCase() === name));
}

export function issueUrl(v: Values): string {
  const cat = CATEGORIES.find((c) => c.slug === v.category)?.label ?? v.category;
  const q = new URLSearchParams({
    template: "submit-tool.yml",
    title: `Tool submission: ${v.name.trim()}`,
    "tool-name": v.name.trim(),
    website: v.website.trim(),
    company: v.company.trim(),
    category: cat,
    description: v.description.trim(),
    features: v.features.trim(),
    pricing: v.pricingUrl.trim(),
    submitter: v.submitter.trim(),
    contact: v.email.trim(),
    extra: v.extra.trim().slice(0, 1500),
  });
  return `${SITE.repo}/issues/new?${q.toString()}`;
}

const input = "h-12 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-white focus:border-violet focus:outline-none";
const area = "w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-white focus:border-violet focus:outline-none";

function Field({ id, label, hint, error, children, required = true }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-soft">
        {label} {required ? <span className="text-amber" aria-hidden="true">*</span> : <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-amber">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * A static site has no server, so a submission cannot be stored here. This form validates what you enter and opens a pre-filled GitHub issue in
 * the project's repository. Nothing is sent until you press "Submit new issue" on GitHub, and every submission is reviewed by a person before any tool is added.
 */
export default function SubmitForm() {
  const [v, setV] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [trap, setTrap] = useState("");
  const [opened, setOpened] = useState<string | null>(null);
  const dup = findDuplicate(v);
  const set = (k: keyof Values) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    if (trap) return; // a bot filled the hidden field
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = document.querySelector<HTMLElement>(`#sub-${Object.keys(found)[0]}`);
      first?.focus();
      return;
    }
    if (dup) return;
    const url = issueUrl(v);
    setOpened(url);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const err = (k: keyof Values) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `sub-${k}-err` : `sub-${k}-hint` }) as const;

  return (
    <form onSubmit={submit} noValidate className="glass rounded-[26px] p-6 md:p-8" aria-labelledby="submit-title">
      <h2 id="submit-title" className="text-xl font-bold text-white">
        Tool details
      </h2>
      <p className="mt-1 text-sm text-muted">Fields marked * are required.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Field id="sub-name" label="Tool name" error={errors.name}>
          <input id="sub-name" className={input} value={v.name} onChange={set("name")} {...err("name")} />
        </Field>
        <Field id="sub-company" label="Company or maker" error={errors.company}>
          <input id="sub-company" className={input} value={v.company} onChange={set("company")} {...err("company")} />
        </Field>
        <Field id="sub-website" label="Official website" hint="https://…" error={errors.website}>
          <input id="sub-website" type="url" inputMode="url" className={input} value={v.website} onChange={set("website")} placeholder="https://" {...err("website")} />
        </Field>
        <Field id="sub-pricingUrl" label="Official pricing page" hint="The vendor's own pricing page." error={errors.pricingUrl}>
          <input id="sub-pricingUrl" type="url" inputMode="url" className={input} value={v.pricingUrl} onChange={set("pricingUrl")} placeholder="https://" {...err("pricingUrl")} />
        </Field>
        <Field id="sub-category" label="Category" required>
          <select id="sub-category" className="cur !w-full" value={v.category} onChange={set("category")}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="sub-submitter" label="Your name" required={false}>
          <input id="sub-submitter" className={input} value={v.submitter} onChange={set("submitter")} autoComplete="name" />
        </Field>
      </div>
      <div className="mt-5 grid gap-5">
        <Field id="sub-description" label="Short description" hint="What does it do and who is it for?" error={errors.description}>
          <textarea id="sub-description" rows={3} className={area} value={v.description} onChange={set("description")} {...err("description")} />
        </Field>
        <Field id="sub-features" label="Main features" hint="A few lines, one per feature." error={errors.features}>
          <textarea id="sub-features" rows={3} className={area} value={v.features} onChange={set("features")} {...err("features")} />
        </Field>
        <Field id="sub-extra" label="Anything else we should know" required={false}>
          <textarea id="sub-extra" rows={3} className={area} value={v.extra} onChange={set("extra")} />
        </Field>
        <Field id="sub-email" label="Contact email" required={false} hint="Optional. The submission is a public GitHub issue, so an email you enter here becomes public. Leave it blank and we will reply on the issue." error={errors.email}>
          <input id="sub-email" type="email" className={input} value={v.email} onChange={set("email")} autoComplete="email" {...err("email")} />
        </Field>
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Leave this empty
            <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
          </label>
        </div>
      </div>

      {dup && (
        <p role="alert" className="mt-5 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">
          {dup.name} is already in the directory.{" "}
          <Link href={`/tools/${dup.id}/`} className="underline">
            View it
          </Link>
          . If something on its page is wrong, report it on the{" "}
          <Link href="/contact/" className="underline">
            contact page
          </Link>{" "}
          instead.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary" disabled={!!dup}>
          Open pre-filled GitHub issue
        </button>
        <p className="text-sm text-muted">Needs a free GitHub account. Nothing is sent until you press &ldquo;Submit new issue&rdquo; on GitHub.</p>
      </div>

      {opened && (
        <p role="status" className="mt-5 rounded-xl border border-cyan/25 bg-cyan/5 px-4 py-3 text-sm text-[#c3e3ea]">
          A GitHub tab should have opened with your details filled in. Your submission is <strong>not</strong> sent yet: press &ldquo;Submit new issue&rdquo; there. If no tab
          opened,{" "}
          <a href={opened} target="_blank" rel="noopener noreferrer" className="underline">
            open the pre-filled issue
          </a>
          .
        </p>
      )}
    </form>
  );
}
