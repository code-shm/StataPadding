import type { Metadata } from "next";
import { searchIndex, meta } from "@/lib/data";
import PlayersBrowser from "@/components/PlayersBrowser";

export const metadata: Metadata = {
  title: "Browse players — PitchRank",
  description:
    "Browse and filter every player across the big-5 European leagues by league and position.",
};

export default function PlayersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl text-white">Browse players</h1>
        <p className="mt-1 text-sm text-slate-400">
          {meta.qualifiedCount} players · {meta.leagues.length} leagues ·{" "}
          {meta.season} · ranked by role rating
        </p>
      </div>
      <PlayersBrowser index={searchIndex()} />
    </div>
  );
}
