import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <div className="display bg-gradient-to-r from-home to-away bg-clip-text text-7xl text-transparent">
        404
      </div>
      <p className="mt-3 text-slate-400">
        That player isn&apos;t in our squad — try another search.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-gradient-to-r from-home to-away px-6 py-3 text-sm font-bold text-ink-950 hover:brightness-110"
      >
        Back to compare
      </Link>
    </div>
  );
}
