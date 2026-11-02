import { withBase } from "@/lib/site";

/**
 * Search box for the home page. A plain GET form to the directory, so it works without JavaScript and the directory reads ?q=.
 */
export default function HeroSearch() {
  return (
    <div className="mt-5 max-w-xl md:mt-9">
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
          className="h-12 w-full rounded-2xl border border-white/15 bg-[#11152A]/80 pl-13 pr-28 text-base md:h-14 md:pr-32 text-white placeholder:text-muted focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
          style={{ paddingLeft: "3.25rem" }}
        />
        <button type="submit" className="btn-primary btn-sm absolute right-2 top-1/2 -translate-y-1/2">
          Search
        </button>
      </form>
    </div>
  );
}
