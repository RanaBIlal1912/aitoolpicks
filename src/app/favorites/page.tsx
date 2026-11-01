import { pageMeta } from "@/lib/meta";
import PageHeader from "@/components/PageHeader";
import SavedList from "@/components/SavedList";

export const metadata = pageMeta({
  title: "Saved tools",
  description: "Your saved AI tools, stored in your own browser. No account needed and nothing is sent anywhere.",
  path: "/favorites/",
  noindex: true,
});

export default function Page() {
  return (
    <>
      <PageHeader variant="studio" eyebrow="Your browser" title="Saved tools" lead="Your saved AI tools. Kept only on this device." crumbs={[{ name: "Saved tools", href: "/favorites/" }]} />
      <div className="mx-auto max-w-7xl px-5">
        <SavedList mode="favorites" />
      </div>
    </>
  );
}
