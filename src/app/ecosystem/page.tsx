import Link from "next/link";
import { COMPANIES, MODELS } from "@/data/companies";
import { TOOLS, getTool } from "@/data/tools";
import { getNews } from "@/data/news";
import { pageMeta } from "@/lib/meta";
import PageHeader from "@/components/PageHeader";
import EcosystemNetwork from "@/components/universe/EcosystemNetwork";
import ToolLogo from "@/components/ToolLogo";
import { formatDate } from "@/components/NewsCard";

export const metadata = pageMeta({
  title: "AI ecosystem: companies, models and open-source projects",
  description: "Explore the companies behind the AI tools in our catalog, the models we have verified, and open-source projects, with sources and the relationships our records state.",
  path: "/ecosystem/",
});

export default function EcosystemPage() {
  const open = TOOLS.filter((t) => t.openSource && t.openSource !== "proprietary");
  return (
    <>
      <PageHeader variant="lab"
        eyebrow="Ecosystem"
        title="Who makes what in AI"
        lead="Companies, models and open-source projects, linked only where our records or an official source state the relationship. This is a small, verified map, not a complete one."
        crumbs={[{ name: "Ecosystem", href: "/ecosystem/" }]}
      />
      <div className="mx-auto max-w-7xl px-5">
        <EcosystemNetwork />
        <div className="mt-16" />
        <section aria-labelledby="models-title">
          <h2 id="models-title" className="section-title text-white">
            Models we have verified
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">Each model has a source. We add one only after reading the vendor&rsquo;s or host&rsquo;s own announcement.</p>
          <ul className="mt-5 grid gap-5 md:grid-cols-2">
            {MODELS.map((m) => {
              const story = m.news ? getNews(m.news) : undefined;
              return (
                <li key={m.id} className="glass flex flex-col gap-3 rounded-[22px] p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-white">{m.name}</h3>
                    <span className="byline">
                      {m.company}{m.released ? ` · announced ${formatDate(m.released)}` : ""}
                    </span>
                  </div>
                  <p className="text-soft">{m.summary}</p>
                  <p className="text-sm text-muted">
                    <strong className="text-soft">Licence:</strong> {m.licence}
                  </p>
                  {m.details && (
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted">
                      {m.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Tools in the catalog connected to it</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {m.tools.map((id) => {
                        const t = getTool(id);
                        return t ? (
                          <li key={id}>
                            <Link href={`/tools/${id}/`} className="chip inline-flex items-center gap-2">
                              <ToolLogo id={id} name={t.name} hue={t.hue} size={20} /> {t.name}
                            </Link>
                          </li>
                        ) : null;
                      })}
                    </ul>
                    <p className="mt-2 text-xs text-muted">{m.toolNote}</p>
                  </div>
                  <p className="mt-auto text-sm">
                    {story && (
                      <Link href={`/news/${story.slug}/`} className="underline">
                        Read the news story
                      </Link>
                    )}
                    {m.sources.map((s) => (
                      <span key={s.url}>
                        {" · "}
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                          {s.label} ↗
                        </a>
                      </span>
                    ))}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted">These models come from the vendors' own model pages or announcements. We add more as we verify them; there are no placeholder entries.</p>
        </section>

        <section className="mt-16" aria-labelledby="co-title">
          <h2 id="co-title" className="section-title text-white">
            Companies and makers
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Each is the maker named on its products&rsquo; official pages. Open one to see its products, related news and licences.
          </p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMPANIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/ecosystem/companies/${c.slug}/`} className="glass flex h-full flex-col gap-3 rounded-2xl p-5 no-underline transition-colors hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">
                  <span className="flex -space-x-2" aria-hidden="true">
                    {c.tools.slice(0, 4).map((t) => (
                      <span key={t.id} className="rounded-xl ring-2 ring-[#11152a]">
                        <ToolLogo id={t.id} name={t.name} hue={t.hue} size={36} />
                      </span>
                    ))}
                  </span>
                  <span className="font-bold text-white">{c.name}</span>
                  <span className="text-sm text-muted">
                    {c.tools.map((t) => t.name).join(", ")}
                    {c.models.length ? ` · ${c.models.length} verified model` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="os-title">
          <h2 id="os-title" className="section-title text-white">
            Open-source and source-available projects
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">Licence status is read from the official repository. Source-available is not the same as open source.</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((t) => (
              <li key={t.id}>
                <Link href={`/tools/${t.id}/`} className="glass flex items-center gap-3 rounded-2xl p-4 no-underline hover:border-white/25">
                  <ToolLogo id={t.id} name={t.name} hue={t.hue} size={40} />
                  <span className="min-w-0">
                    <span className="block font-bold text-white">{t.name}</span>
                    <span className="block text-xs text-muted">{t.openSource}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass mt-16 rounded-[22px] p-6 md:p-8" aria-labelledby="gap-title">
          <h2 id="gap-title" className="text-lg font-bold text-white">
            What is not here yet
          </h2>
          <p className="mt-2 max-w-3xl text-soft">
            Most model-to-model, funding and ownership relationships are missing on purpose: we add them only with a source. Each company page lists its catalog products; the full plan and
            data needed are in <code>docs/ECOSYSTEM.md</code>.
          </p>
        </section>
      </div>
    </>
  );
}
