import { buildContentIndex } from "@/lib/search-index";
import GlobalSearch from "./GlobalSearch";

/**
 * Search box for the home page: tools, blog articles and AI news in one place (see GlobalSearch). The article and news index is built
 * here on the server at build time and handed to the client search.
 */
export default function HeroSearch() {
  return (
    <div className="mt-5 max-w-xl md:mt-9">
      <GlobalSearch docs={buildContentIndex()} />
    </div>
  );
}
