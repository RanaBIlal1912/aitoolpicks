import Photo from "../Photo";
import ToolLogo from "../ToolLogo";
import { getTool } from "@/data/tools";

/** The photographic side of the home hero: two licensed photographs framed like a magazine cover, with a real count and real logos on glass cards. Large screens only. */
export default function HeroFrame({ total, verified }: { total: number; verified: number }) {
  const logos = ["claude", "runway", "elevenlabs", "cursor"].map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => !!t);
  return (
    <div className="relative hidden aspect-[4/5] w-full max-w-[470px] justify-self-end lg:block" aria-hidden="true">
      <div className="absolute inset-0 bottom-[12%] left-[10%] overflow-hidden rounded-[36px] border border-white/15 shadow-[0_40px_90px_-30px_rgba(117,75,255,.55)]">
        <Photo id="light-dark-room" decorative sizes="470px" width={1920} height={1280} className="object-[40%_50%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090B18]/80 via-transparent to-[#090B18]/20" />
        <p className="absolute bottom-5 left-[52%] right-5 font-serif text-lg italic leading-snug text-white/90">Every price read from the vendor&rsquo;s own page.</p>
      </div>
      <div className="absolute bottom-0 left-0 w-[48%] overflow-hidden rounded-3xl border-4 border-[#090B18] shadow-2xl shadow-black/60">
        <div className="aspect-[4/3]">
          <Photo id="server-aisle" decorative sizes="230px" width={1920} height={1280} />
        </div>
      </div>
      <div className="absolute right-[-4%] top-[8%] rounded-2xl border border-white/15 bg-[#0d1024]/75 px-5 py-4 backdrop-blur-md">
        <p className="font-display text-4xl font-extrabold leading-none text-white">{total}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-soft">tools indexed</p>
        <p className="mt-2 text-xs text-muted">{verified} with fully verified prices</p>
      </div>
      <div className="absolute left-0 top-[34%] flex -space-x-2 rounded-2xl border border-white/15 bg-[#0d1024]/75 p-2.5 backdrop-blur-md">
        {logos.map((t) => (
          <span key={t.id} className="rounded-xl ring-2 ring-[#0d1024]">
            <ToolLogo id={t.id} name={t.name} hue={t.hue} size={40} />
          </span>
        ))}
      </div>
      <p className="absolute -bottom-6 right-0 text-[0.65rem] text-muted">Photos: Denny Müller, İsmail Enes Ayhan / Unsplash</p>
    </div>
  );
}
