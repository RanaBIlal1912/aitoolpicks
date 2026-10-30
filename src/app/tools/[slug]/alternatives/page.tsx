import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOOLS, getTool } from "@/data/tools";
import { alternativesFor } from "@/lib/alternatives";
import { pageMeta } from "@/lib/meta";
import PageHeader from "@/components/PageHeader";
import AlternativeList from "@/components/AlternativeList";

export const dynamicParams = false;
export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.id }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getTool(slug);
  if (!t) return {};
  return pageMeta({ title: `${t.name} alternatives`, description: `Alternatives to ${t.name}, with the reasons each is relevant and the differences we can state from our records.`, path: `/tools/${slug}/alternatives/` });
}

export default async function AlternativesPage({ params }: Props) {
  const { slug } = await params;
  const t = getTool(slug);
  if (!t) notFound();
  const items = alternativesFor(t.id, 12);
  return (
    <>
      <PageHeader
        eyebrow="Alternatives"
        title={`Alternatives to ${t.name}`}
        lead={`Tools that overlap with ${t.name}, chosen by category, audience and our own curated links. Overlap does not mean they are identical; check the differences and the full tool pages.`}
        crumbs={[
          { name: "Tools", href: "/tools/" },
          { name: t.name, href: `/tools/${t.id}/` },
          { name: "Alternatives", href: `/tools/${t.id}/alternatives/` },
        ]}
      />
      <div className="mx-auto max-w-6xl px-5">
        {items.length === 0 ? (
          <div className="glass rounded-[22px] p-10 text-center">
            <p className="text-lg font-semibold text-white">We have no close alternatives for {t.name} in the catalog yet.</p>
            <Link href="/tools/" className="btn-primary btn-sm mt-4">
              Search the directory
            </Link>
          </div>
        ) : (
          <AlternativeList baseId={t.id} baseName={t.name} items={items} />
        )}
        <p className="mt-8 text-sm text-muted">
          <Link href={`/tools/${t.id}/`} className="underline">
            Back to {t.name}
          </Link>{" "}
          · Missing a tool?{" "}
          <Link href="/submit/" className="underline">
            Suggest it
          </Link>
          .
        </p>
      </div>
    </>
  );
}
