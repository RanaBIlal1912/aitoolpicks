import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: `${SITE.basePath}/`,
    scope: `${SITE.basePath}/`,
    display: "browser",
    background_color: "#05070d",
    theme_color: "#05070d",
    icons: [{ src: `${SITE.basePath}/brand/mark.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
