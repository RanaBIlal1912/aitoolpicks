import { ContentList } from "../../../components/content.tsx";
import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const member = await requirePage("/blog", "blog:read");
  return <ContentList kind="blog" path="/blog" member={member} sp={await searchParams} />;
}
