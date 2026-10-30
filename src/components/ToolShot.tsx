import { toolImage } from "@/data/toolImages";
import { withBase } from "@/lib/site";

/** The vendor's own preview image for a product, with credit and a link to the official page it came from. Renders nothing when we have none. */
export default function ToolShot({ id, name, className = "", sizes = "(min-width: 1024px) 700px, 100vw" }: { id: string; name: string; className?: string; sizes?: string }) {
  const img = toolImage(id);
  if (!img) return null;
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#11152A]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBase(img.srcSm)}
          srcSet={`${withBase(img.srcSm)} 640w, ${withBase(img.src)} 1200w`}
          sizes={sizes}
          width={img.width}
          height={img.height}
          alt={`${name}: preview image published on the official website`}
          loading="lazy"
          decoding="async"
          className="h-auto w-full object-cover"
        />
      </div>
      <figcaption className="mt-2 text-xs text-muted">
        Image published by the vendor on{" "}
        <a href={img.page} target="_blank" rel="noopener noreferrer" className="underline">
          {img.credit}
        </a>
        . It identifies the product and is not our own screenshot.
      </figcaption>
    </figure>
  );
}
