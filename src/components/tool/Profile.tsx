import Link from "next/link";
import type { ReactNode } from "react";
import type { Tool } from "@/data/tools";
import type { ToolProfile } from "@/data/catalog-types";
import { formatChecked } from "@/lib/dates";
import ToolLogo from "../ToolLogo";

/** A section of the tool page: a small label, a title, an optional one-line lead, then the content. */
export function ProfileSection({ id, eyebrow, title, lead, children }: { id?: string; eyebrow: string; title: ReactNode; lead?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id ? `${id}-title` : undefined} className="section-title mt-3 text-white">
        {title}
      </h2>
      {lead && <p className="mt-3 max-w-2xl text-soft">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

const ICON = "M5 12l4.5 4.5L19 7";

/** Shown on a tool without a researched profile, so the page says what is and is not there. */
export function ProfileNotice({ name, blocked }: { name: string; blocked?: { reason: string; checked: string } }) {
  return (
    <p className="glass rounded-2xl p-4 text-sm text-soft">
      A detailed profile of {name} has not been researched yet. This page shows what its verified record states; nothing has been filled in beyond that.
      {blocked && (
        <>
          {" "}
          <strong className="text-white">Why:</strong> {blocked.reason} (tried {formatChecked(blocked.checked)}).
        </>
      )}
    </p>
  );
}

/** "What can you do with it": a few capability cards with a title and one plain sentence each. */
export function Capabilities({ items, accent }: { items: ToolProfile["capabilities"]; accent: string }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((c, i) => (
        <li key={c.title} className="tile group relative flex gap-4 p-5">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent }} />
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 font-display text-sm font-extrabold text-white">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="font-display text-lg font-bold leading-snug text-white">{c.title}</h3>
            <p className="mt-1.5 text-[0.97rem] text-soft">{c.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Key features: with a researched profile each card explains the feature; without one, the feature names from the record. */
export function FeatureCards({ cards, plain, accent }: { cards?: ToolProfile["featureCards"]; plain: string[]; accent: [string, string] }) {
  const list = cards ?? plain.map((name) => ({ name, text: "" }));
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((f) => (
        <li key={f.name} className="feature-card group relative flex flex-col gap-2 overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-1">
          <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-60" style={{ background: accent[0] }} />
          <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `linear-gradient(135deg, ${accent[0]}55, ${accent[1]}33)` }}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICON} />
            </svg>
          </span>
          <h3 className="font-display text-lg font-bold leading-snug text-white">{f.name}</h3>
          {f.text && <p className="text-[0.95rem] text-soft">{f.text}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Who it is for: one card per audience. Without a profile, the audience labels from the record. */
export function AudienceGrid({ items, plain }: { items?: ToolProfile["audienceDetail"]; plain: string[] }) {
  if (!items) {
    return (
      <ul className="flex flex-wrap gap-2">
        {plain.map((a) => (
          <li key={a} className="chip">
            {a}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => (
        <li key={a.who} className="panel p-5">
          <h3 className="font-display text-lg font-bold text-white">{a.who}</h3>
          <p className="mt-1.5 text-[0.95rem] text-soft">{a.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** Real use cases as a numbered list of short scenarios. */
export function Scenarios({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2">
      {items.map((s, i) => (
        <li key={s.title} className="glass relative rounded-[22px] p-6">
          <span aria-hidden="true" className="font-display text-4xl font-extrabold leading-none text-white/10">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-2 font-display text-lg font-bold text-white">{s.title}</h3>
          <p className="mt-1.5 text-[0.95rem] text-soft">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** How it works: numbered steps joined by a line. */
export function Steps({ items }: { items: ToolProfile["gettingStarted"] }) {
  return (
    <ol className="relative space-y-5">
      <span aria-hidden="true" className="absolute bottom-3 left-[19px] top-3 w-px bg-gradient-to-b from-cyan/60 via-violet/40 to-transparent" />
      {items.map((s, i) => (
        <li key={s.step} className="relative flex gap-4">
          <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cyan/50 bg-[#0d1124] font-display text-sm font-extrabold text-[#a8ecff]">{i + 1}</span>
          <div className="pt-1.5">
            <h3 className="font-display text-lg font-bold text-white">{s.step}</h3>
            <p className="mt-1 text-[0.95rem] text-soft">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Where the profile's explanations come from, with the date they were read. */
export function ProfileSources({ profile }: { profile: ToolProfile }) {
  return (
    <p className="mt-6 text-sm text-muted">
      Explained from the vendor&apos;s own pages, read {formatChecked(profile.researched)}:{" "}
      {profile.sources.map((s, i) => (
        <span key={s.url}>
          {i > 0 ? ", " : ""}
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#9db4d6] underline">
            {s.label} ↗
          </a>
        </span>
      ))}
      . Anything the vendor does not say there is left out.
    </p>
  );
}

/** Related tools: compact cards that link straight to each tool's own page. */
export function RelatedGrid({ tools }: { tools: Tool[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tools.map((t) => (
        <li key={t.id}>
          <Link href={`/tools/${t.id}/`} prefetch={false} className="tile flex h-full flex-col gap-3 p-5 no-underline">
            <ToolLogo id={t.id} name={t.name} hue={t.hue} size={44} />
            <span className="font-display text-lg font-bold leading-tight text-white">{t.name}</span>
            <span className="line-clamp-2 text-sm text-soft">{t.tagline}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
