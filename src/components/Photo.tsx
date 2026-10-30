import { PHOTOS, photoPath, type PhotoId } from "@/data/photos";
import { withBase } from "@/lib/site";

/** A licensed stock photograph with a small and a large file. Decorative uses pass `decorative` so screen readers skip it. */
export default function Photo({
  id,
  className = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  decorative = false,
  small = false,
  width = 1920,
  height = 1080,
}: {
  id: PhotoId;
  className?: string;
  sizes?: string;
  priority?: boolean;
  decorative?: boolean;
  /** Only ever use the 640 px file (for faded backdrops). */
  small?: boolean;
  width?: number;
  height?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={withBase(photoPath(id, "sm"))}
      srcSet={small ? undefined : `${withBase(photoPath(id, "sm"))} 640w, ${withBase(photoPath(id))} 1920w`}
      sizes={sizes}
      width={width}
      height={height}
      alt={decorative ? "" : PHOTOS[id].alt}
      aria-hidden={decorative ? true : undefined}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
