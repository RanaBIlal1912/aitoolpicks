import { pageMeta } from "@/lib/meta";
import PageHeader from "@/components/PageHeader";
import Photo from "@/components/Photo";
import { PHOTOS, type PhotoId } from "@/data/photos";

export const metadata = pageMeta({
  title: "Photo credits",
  description: "The stock photographs used on AI Tool Picks, with the photographer, the original page and the licence for each.",
  path: "/credits/",
});

export default function CreditsPage() {
  const ids = Object.keys(PHOTOS) as PhotoId[];
  return (
    <>
      <PageHeader
        variant="lab"
        eyebrow="Credits"
        title="Photo credits"
        lead="Background and cover photographs are stock images downloaded from their original Unsplash pages. They are not product screenshots and do not show or endorse any tool."
        crumbs={[{ name: "Credits", href: "/credits/" }]}
      />
      <div className="mx-auto max-w-7xl px-5">
        <p className="text-soft">
          Licence: <a className="underline" href="https://unsplash.com/license" rel="noopener noreferrer">Unsplash License</a>, which allows free commercial use without permission. Credit is given anyway.
          Tool logos are the property of their owners and are used only to identify the product.
        </p>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ids.map((id) => (
            <li key={id} className="tile overflow-hidden">
              <div className="aspect-[16/9]">
                <Photo id={id} sizes="(min-width: 1024px) 360px, 50vw" />
              </div>
              <p className="p-4 text-sm text-soft">
                {PHOTOS[id].alt}. Photo by {PHOTOS[id].by} on{" "}
                <a className="underline" href={PHOTOS[id].page} rel="noopener noreferrer">
                  Unsplash
                </a>
                .
              </p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
