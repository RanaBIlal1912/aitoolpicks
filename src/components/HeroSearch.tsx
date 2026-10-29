import { withBase } from "@/lib/site";

/**
 * Search box for the home page. A plain GET form to the directory, so it works without JavaScript and the directory reads ?q=.
 */
export default function HeroSearch({ suggestions }: { suggestions: { label: string; q: string }[] }) {
  return (
    <div className="mt-9 max-w-xl">
      <form action={withBase("/tools/")} method="get" role="search" className="relative">
        <label htmlFor="hero-q" className="sr-only">
          Search AI tools
        </label>
        <svg className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          id="hero-q"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Search tools: video editor, coding agent, transcription"
          className="h-14 w-full rounded-2xl border border-white/15 bg-[#0a0e18]/80 pl-13 pr-32 text-base text-white placeholder:text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
          style={{ paddingLeft: "3.25rem" }}
        />
        <button type="submit" className="btn-primary btn-sm absolute right-2 top-1/2 -translate-y-1/2">
          Search
        </button>
      </form>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>Popular:</span>
        {suggestions.map((s) => (
          <a key={s.q} href={withBase(`/tools/?q=${encodeURIComponent(s.q)}`)} className="chip !py-1 !text-[0.85rem]">
            {s.label}
          </a>
        ))}
      </p>
    </div>
  );
}
