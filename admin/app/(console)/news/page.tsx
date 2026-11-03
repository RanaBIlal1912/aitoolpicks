import { ContentList } from "../../../components/content.tsx";
import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "AI News" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const member = await requirePage("/news", "news:read");
  return <ContentList kind="news" path="/news" member={member} sp={await searchParams} />;
}
