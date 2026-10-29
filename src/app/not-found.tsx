import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-28 text-center">
      <p className="gradient-text text-8xl font-extrabold tracking-tight">404</p>
      <h1 className="mt-4 text-3xl font-extrabold text-white">That page wandered off</h1>
      <p className="mt-3 text-soft">The page you wanted does not exist, or it moved when we rebuilt the site.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/blog/" className="btn-ghost">
          Browse the guides
        </Link>
        <Link href="/tools/" className="btn-ghost">
          Browse the tools
        </Link>
      </div>
    </div>
  );
}
