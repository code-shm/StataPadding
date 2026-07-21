import Link from "next/link";
import type { Player } from "@/lib/types";
import { POSITION_COLORS, fmt } from "@/lib/metrics";
import PlayerPhoto from "./PlayerPhoto";
import LeagueBadge from "./LeagueBadge";

export default function PlayerResultGrid({
  players,
  statLabel,
  statKey,
}: {
  players: Player[];
  statLabel?: string;
  statKey?: keyof Player["per90"];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {players.map((p) => (
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
          <div className="text-right">
            <div className="stat-num text-base font-black text-white">
              {statKey ? fmt(p.per90[statKey], 2) : p.overall}
            </div>
            {statLabel && (
              <div className="text-[9px] uppercase tracking-wide text-slate-500">
                {statLabel}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
