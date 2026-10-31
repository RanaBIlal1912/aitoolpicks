import Link from "next/link";
import type { ReactNode } from "react";
import { pageMeta } from "@/lib/meta";
import PageHeader from "@/components/PageHeader";
import JsonLd from "@/components/JsonLd";
import { absUrl } from "@/lib/site";

export const metadata = pageMeta({
  title: "About AI Tool Picks: our mission and how we choose tools",
  description:
    "AI Tool Picks is an independent directory and magazine for AI tools, with official prices, comparisons and dated news. Learn how we choose tools and how the site earns money.",
  path: "/about/",
});

const ICON = (d: string) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const PILLARS: { title: string; body: ReactNode; icon: string; c: [string, string] }[] = [
  { title: "Free first.", body: "We prefer tools with a free plan so you can try before you pay.", icon: "M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z", c: ["#16a34a", "#065f46"] },
  { title: "Honest pros and cons.", body: "Every overview includes the downsides.", icon: "M12 3v18M5 7l7-4 7 4M5 7l-3 8a4 4 0 006 0zM19 7l-3 8a4 4 0 006 0z", c: ["#d97706", "#7c2d12"] },
  { title: "Verified prices only.", body: "A price appears only after we check the official pricing page. When sources disagree or we could not verify a number, we say so and send you to the official site.", icon: "M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6zM9 12l2.2 2.2L15.5 10", c: ["#2563eb", "#1e3a8a"] },
  { title: "Clear about what we did.", body: "Our overviews are based on each product’s public documentation and well-known behaviour. We do not claim lab testing or long-term trials that we have not done.", icon: "M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM16 16l5 5", c: ["#7c3aed", "#4c1d95"] },
  { title: "Sources for news.", body: "AI news items link to the original announcement and show its publication date.", icon: "M4 5h13v14H6a2 2 0 01-2-2zM17 9h3v8a2 2 0 01-2 2M8 9h6M8 13h6", c: ["#0ea5e9", "#164e63"] },
];

const AUDIENCE = [
  "Creators and freelancers who want faster ways to deliver good work.",
  "Developers and researchers comparing coding tools, models and infrastructure.",
  "Professionals and business owners who need a sensible stack for writing, design, meetings, automation and a website.",
  "Everyday users and students who want to try AI tools without overpaying.",
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="About AI Tool Picks"
        lead="We help creators, developers, professionals and businesses choose AI tools without wasting money or time."
        crumbs={[{ name: "About AI Tool Picks", href: "/about/" }]}
      />
      <div className="mx-auto max-w-7xl space-y-14 px-5">
        <section className="panel grid gap-8 p-8 md:grid-cols-[1fr_1.4fr] md:p-12" aria-labelledby="mission">
          <div>
            <span className="eyebrow">Our mission</span>
            <h2 id="mission" className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
              Explain tools plainly. <span className="gradient-text">Never sell you one.</span>
            </h2>
          </div>
          <p className="self-center text-lg text-soft">
            There are thousands of AI tools and most reviews are written to sell you something. Our job is the opposite: explain what a tool does in plain English, who it suits, who should skip it, and what to try for free first.
          </p>
        </section>

        <section aria-labelledby="who">
          <h2 id="who" className="section-title mb-6 text-white">
            Who this is for
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCE.map((a, i) => (
              <li key={a} className="feature-card flex gap-3 text-soft">
                <span className="font-display text-2xl font-extrabold text-cyan/70">{String(i + 1).padStart(2, "0")}</span>
                {a}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how">
          <h2 id="how" className="section-title mb-6 text-white">
            How we choose and describe tools
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <li key={p.title} className="panel card-lift flex flex-col gap-3 p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: `linear-gradient(150deg, ${p.c[0]}, ${p.c[1]})`, boxShadow: `0 0 26px -6px ${p.c[0]}` }}>
                  {ICON(p.icon)}
                </span>
                <h3 className="font-display text-xl font-bold text-white">{p.title}</h3>
                <p className="text-soft">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="panel p-6">
            <h2 className="font-display text-xl font-bold text-white">How the site earns money</h2>
            <p className="mt-3 text-soft">
              Some links are affiliate links: if you buy through them we may earn a commission at no extra cost to you. This is how we pay for the site. Commissions never decide what we recommend or what we say. Read the full{" "}
              <Link href="/affiliate-disclosure/" className="text-cyan underline">
                affiliate disclosure
              </Link>
              .
            </p>
          </div>
          <div className="panel p-6">
            <h2 className="font-display text-xl font-bold text-white">Currencies</h2>
            <p className="mt-3 text-soft">
              Merchant prices are shown in US dollars. If you pick another currency, we show a clearly labelled <em>estimate</em> converted from USD with recent exchange rates. Your checkout price may differ.
            </p>
          </div>
          <div className="panel p-6">
            <h2 className="font-display text-xl font-bold text-white">Corrections</h2>
            <p className="mt-3 text-soft">
              Prices and features change quickly. If you spot a mistake, tell us through the{" "}
              <Link href="/contact/" className="text-cyan underline">
                contact page
              </Link>{" "}
              and we will check the official source and fix it.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 pb-4">
          <Link href="/methodology/" className="btn-primary">
            Read the methodology
          </Link>
          <Link href="/verification/" className="btn-ghost">
            See the verification log
          </Link>
          <Link href="/tools/" className="btn-ghost">
            Browse the directory
          </Link>
        </div>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "AboutPage", name: "About AI Tool Picks", url: absUrl("/about/") }} />
    </>
  );
}
