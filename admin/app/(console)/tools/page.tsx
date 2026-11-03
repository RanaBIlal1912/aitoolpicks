import { ContentList } from "../../../components/content.tsx";
import { requirePage } from "../../../lib/session.ts";

export const metadata = { title: "Tools" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const member = await requirePage("/tools", "tools:read");
  return <ContentList kind="tools" path="/tools" member={member} sp={await searchParams} />;
}
