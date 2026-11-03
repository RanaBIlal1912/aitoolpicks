import { ContentList } from "../../../components/content.tsx";
import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const member = await requirePage("/reviews", "reviews:read");
  return <ContentList kind="reviews" path="/reviews" member={member} sp={await searchParams} />;
}
