import Link from "next/link";
import type { Review } from "@/data/reviews";
import type { Tool } from "@/data/tools";
import { METHOD_LABEL, reviewerOf } from "@/lib/review-trust";
import { formatChecked } from "@/lib/dates";

/** The small label that tells a visitor how a review was made. Used on the list and on the page. */
export function MethodBadge({ method }: { method: Review["method"] }) {
  const tested = method === "hands-on";
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${tested ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-cyan/30 bg-cyan/10 text-cyan"}`}>
      {METHOD_LABEL[method]}
    </span>
  );
}

/** Who made the page, how, and when the facts were last checked. Documentation-based pages say plainly that nobody tested the product. */
export default function ReviewMethod({ r, tool }: { r: Review; tool: Tool }) {
  const t = r.testing;
  return (
    <section aria-labelledby="method-title" className="glass rounded-[22px] p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="method-title" className="text-lg font-bold text-white">
          How this page was made
        </h2>
        <MethodBadge method={r.method} />
      </div>
      <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">{r.method === "hands-on" ? "Tested by" : "Written by"}</dt>
          <dd className="text-soft">
            {reviewerOf(r)}
            {t ? `, ${t.role}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Facts last checked against official pages</dt>
          <dd className="text-soft">{tool.verified ? formatChecked(tool.verified) : "Not recorded"}</dd>
        </div>
        {t && (
          <>
            <div>
              <dt className="text-muted">Tested between</dt>
              <dd className="text-soft">
                {formatChecked(t.testedFrom)} and {formatChecked(t.testedTo)}
                {t.hours ? `, about ${t.hours} hours` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Plan and region</dt>
              <dd className="text-soft">
                {t.plan}, account in {t.region}
              </dd>
            </div>
          </>
        )}
      </dl>
      {r.method === "documentation" ? (
        <p className="mt-4 text-soft">
          This is editorial research. We read the vendor&rsquo;s official pages and compare them with other public sources. No one ran the product for this page, so statements about quality or speed are not test results, and there is no score. Prices come from the{" "}
          <Link href={`/tools/${tool.id}/`} className="underline">
            {tool.name} tool page
          </Link>
          , which lists each source and the date it was checked. See the{" "}
          <Link href="/methodology/" className="underline">
            methodology
          </Link>
          .
        </p>
      ) : (
        t && (
          <div className="mt-4 space-y-4 text-sm text-soft">
            <div>
              <h3 className="font-bold text-white">Tasks run</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {t.tasks.map((x) => (
                  <li key={x.task}>
                    <strong>{x.task}:</strong> {x.result}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="font-bold text-white">What worked</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {t.worked.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white">What failed or needed fixing</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {t.failed.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
            {t.notReproduced && t.notReproduced.length > 0 && (
              <div>
                <h3 className="font-bold text-white">Vendor claims we could not reproduce</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {t.notReproduced.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            <p>
              <strong className="text-white">Conflicts of interest:</strong> {t.conflicts}
            </p>
            <div>
              <h3 className="font-bold text-white">Evidence</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {t.evidence.map((e) => (
                  <li key={e.label}>
                    {e.url ? (
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline">
                        {e.label} ↗
                      </a>
                    ) : (
                      e.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {t.screenshots.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {t.screenshots.map((s) => (
                  <figure key={s.src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/aitoolpicks${s.src}`} alt={s.alt} loading="lazy" className="w-full rounded-xl border border-white/10" />
                    <figcaption className="mt-1 text-xs text-muted">{s.caption} (tester&rsquo;s own screenshot)</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </section>
  );
}
