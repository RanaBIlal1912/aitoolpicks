import { COVERS, COVER_SIZES, coverPath, type CoverId } from "@/data/covers";
import { withBase } from "@/lib/site";

/** A cover render with a small and a full-size file, so cards download the small one. */
export default function Cover({
  id,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  id: CoverId;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={withBase(coverPath(id, "sm"))}
      srcSet={`${withBase(coverPath(id, "sm"))} 640w, ${withBase(coverPath(id))} 1600w`}
      sizes={sizes}
      width={COVER_SIZES.sm.w}
      height={COVER_SIZES.sm.h}
      alt={COVERS[id].alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
