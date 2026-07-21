"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PlayerLite, LeagueCode, Position } from "@/lib/types";
import { LEAGUE_META, POSITION_COLORS } from "@/lib/metrics";
import PlayerPhoto from "./PlayerPhoto";
import LeagueBadge from "./LeagueBadge";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

const LEAGUES = Object.keys(LEAGUE_META) as LeagueCode[];
const POSITIONS: Position[] = ["FWD", "MID", "DEF"];
const PAGE = 48;

export default function PlayersBrowser({ index }: { index: PlayerLite[] }) {
  const [query, setQuery] = useState("");
  const [league, setLeague] = useState<LeagueCode | "ALL">("ALL");
  const [pos, setPos] = useState<Position | "ALL">("ALL");
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return index
      .filter(
        (p) =>
          (league === "ALL" || p.league === league) &&
          (pos === "ALL" || p.position === pos) &&
          (!q || norm(`${p.name} ${p.team}`).includes(q))
      )
      .sort((a, b) => b.overall - a.overall);
  }, [index, query, league, pos]);

  const shown = filtered.slice(0, limit);

  const Pill = ({
    active,
    onClick,
    children,
    color,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    color?: string;
  }) => (
    <button
      onClick={() => {
        onClick();
        setLimit(PAGE);
      }}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-transparent text-ink-950"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
      }`}
      style={active ? { backgroundColor: color ?? "#22d3ee" } : undefined}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="glass space-y-3 p-4">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Search by name or club…"
          className="w-full rounded-xl border border-white/15 bg-ink-800/80 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/40"
        />
        <div className="flex flex-wrap gap-1.5">
          <Pill active={league === "ALL"} onClick={() => setLeague("ALL")}>
            All leagues
          </Pill>
          {LEAGUES.map((l) => (
            <Pill
              key={l}
              active={league === l}
              onClick={() => setLeague(l)}
              color={LEAGUE_META[l].color}
            >
              {LEAGUE_META[l].name}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill active={pos === "ALL"} onClick={() => setPos("ALL")}>
            All positions
          </Pill>
          {POSITIONS.map((p) => (
            <Pill
              key={p}
              active={pos === p}
              onClick={() => setPos(p)}
              color={POSITION_COLORS[p]}
            >
              {p}
            </Pill>
          ))}
        </div>
      </div>

      <div className="text-sm text-slate-400">
        {filtered.length} player{filtered.length === 1 ? "" : "s"}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((p) => (
          <Link
            key={p.id}
            href={`/player/${p.slug}`}
            className="group glass flex items-center gap-3 p-3 transition hover:border-white/25"
          >
            <PlayerPhoto
              src={p.photo}
              alt={p.name}
              accent={POSITION_COLORS[p.position]}
              className="h-11 w-11 shrink-0 rounded-lg object-cover object-top"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{p.webName}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <LeagueBadge league={p.league} />
                <span className="truncate">{p.teamShort}</span>
              </div>
            </div>
            <span className="stat-num text-base font-black text-white">{p.overall}</span>
          </Link>
        ))}
      </div>

      {shown.length < filtered.length && (
        <div className="text-center">
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Show more ({filtered.length - shown.length} left)
          </button>
        </div>
      )}
    </div>
  );
}
