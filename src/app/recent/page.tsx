import { pageMeta } from "@/lib/meta";
import PageHeader from "@/components/PageHeader";
import SavedList from "@/components/SavedList";

export const metadata = pageMeta({
  title: "Recently viewed tools",
  description: "Tools you looked at recently, stored in your own browser. No account needed and nothing is sent anywhere.",
  path: "/recent/",
  noindex: true,
});

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Your browser" title="Recently viewed tools" lead="Tools you looked at recently. Kept only on this device." crumbs={[{ name: "Recently viewed tools", href: "/recent/" }]} />
      <div className="mx-auto max-w-6xl px-5">
        <SavedList mode="recent" />
      </div>
    </>
  );
}
