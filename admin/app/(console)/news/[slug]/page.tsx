import { ItemDetail } from "../../../../components/detail.tsx";
import { requirePage } from "../../../../lib/session.ts";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const path = `/news/${slug}`;
  const member = await requirePage(path, "news:read");
  return <ItemDetail kind="news" slug={slug} path={path} member={member} sp={await searchParams} />;
}
