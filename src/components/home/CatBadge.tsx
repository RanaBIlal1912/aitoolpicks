import { CAT } from "./Neon";

/** Large glowing category icon used in a category page banner. */
export function CatBadge({ slug }: { slug: string }) {
  const k = CAT[slug] ?? CAT.assistants;
  return (
    <span className="grid h-40 w-40 place-items-center rounded-[36px] border border-white/25" style={{ background: `linear-gradient(150deg, ${k.c1}, ${k.c2})`, boxShadow: `0 0 70px -6px ${k.c1}, inset 0 1px 0 rgba(255,255,255,.35)` }}>
      <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={k.d} />
      </svg>
    </span>
  );
}
