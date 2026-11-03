import { ItemDetail } from "../../../../components/detail.tsx";
import { requirePage } from "../../../../lib/session.ts";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const path = `/blog/${slug}`;
  const member = await requirePage(path, "blog:read");
  return <ItemDetail kind="blog" slug={slug} path={path} member={member} sp={await searchParams} />;
}
