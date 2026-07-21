import type { Metadata } from "next";
import type { Player } from "@/lib/types";
import { runSearch } from "@/lib/nlsearch";
import { LEAGUE_META } from "@/lib/metrics";
import NLSearchBox from "@/components/NLSearchBox";
import PlayerResultGrid from "@/components/PlayerResultGrid";

export const metadata: Metadata = {
  title: "Search players — PitchRank",
  description: "Describe the player you're looking for in plain English.",
};

function Chip({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: color ? `${color}22` : "rgba(255,255,255,0.06)",
        color: color ?? "#cbd5e1",
      }}
    >
      {children}
    </span>
  );
}

const POS_LABEL = { FWD: "Forwards", MID: "Midfielders", DEF: "Defenders" };
const SORT_LABEL: Record<string, string> = {
  goals: "Goalscoring",
  creation: "Chance creation",
  shots: "Shot volume",
  overall: "Role rating",
};
const SORT_STAT: Record<string, { key: keyof Player["per90"]; label: string } | null> = {
  goals: { key: "goals", label: "G/90" },
  creation: { key: "xA", label: "xA/90" },
  shots: { key: "shots", label: "Sh/90" },
  overall: null,
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").toString();
  const search = q ? runSearch(q) : null;
  const i = search?.interpretation;
  const stat = i && !i.like ? SORT_STAT[i.sort] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl text-white">Search in plain English</h1>
        <p className="mt-1 text-sm text-slate-400">
          Describe the profile — league, position, style — and PitchRank
          interprets it.
        </p>
      </div>

      <NLSearchBox initial={q} autoFocus={!q} />

      {search && (
        <>
          {/* interpretation chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500">
              Understood as
            </span>
            {i?.ageMax != null && !i.ageIgnored && (
              <Chip>{i.ageMax <= 21 ? "Young" : `Under ${i.ageMax}`}</Chip>
            )}
            {i?.league && (
              <Chip color={LEAGUE_META[i.league].color}>{LEAGUE_META[i.league].name}</Chip>
            )}
            {i?.position && <Chip>{POS_LABEL[i.position]}</Chip>}
            {i?.like ? (
              <Chip color="#22d3ee">similar to {i.like.name}</Chip>
            ) : (
              <Chip color="#ffd75e">by {SORT_LABEL[i!.sort]}</Chip>
            )}
          </div>

          <p className="text-sm text-slate-400">{search.explanation}</p>

          {search.results.length > 0 ? (
            <PlayerResultGrid
              players={search.results}
              statKey={stat?.key}
              statLabel={stat?.label}
            />
          ) : (
            <div className="glass p-8 text-center text-slate-400">
              No players matched that. Try broadening it — note that age filters
              only apply to Premier League players (the only league with birth
              dates in the free data).
            </div>
          )}
        </>
      )}
    </div>
  );
}
