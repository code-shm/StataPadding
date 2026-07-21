import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { meta } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pitch Rank — Football Player Comparator",
  description:
    "Compare Premier League players by stats, playing style and form — with radar charts, style-match scores and an AI scout verdict. Built on free FPL data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="group flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-home to-away text-sm font-black text-ink-950">
                PR
              </span>
              <span className="display text-lg text-white">
                Pitch<span className="text-home">Rank</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-400">
              <Link href="/#compare" className="hover:text-white">
                Compare
              </Link>
              <Link href="/search" className="hover:text-white">
                Search
              </Link>
              <Link href="/players" className="hover:text-white">
                Browse
              </Link>
              <span className="hidden chip sm:inline-flex">
                Big-5 · {meta.qualifiedCount} players
              </span>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">{children}</main>

        <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-6xl px-4">
            <p>
              {meta.season} season · data: {meta.source}. Per-90 rates over
              players with ≥{meta.minutesThreshold} minutes; percentiles are
              ranked within position across the big-5 leagues. Not affiliated
              with Understat, the Premier League or FPL.
            </p>
            <p className="mt-2">
              Generated {new Date(meta.generatedAt).toLocaleDateString("en-GB")}{" "}
              · PitchRank is an independent analytics demo.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
