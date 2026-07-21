import Link from "next/link";
import type { SimilarPlayer } from "@/lib/metrics";
import { POSITION_COLORS } from "@/lib/metrics";
import PlayerPhoto from "./PlayerPhoto";
import LeagueBadge from "./LeagueBadge";

export default function SimilarList({
  items,
  compareWith,
}: {
  items: SimilarPlayer[];
  /** If set, each row links to a head-to-head with this slug. */
  compareWith?: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map(({ player, match }, i) => {
        const href = compareWith
          ? `/compare/${compareWith}/${player.slug}`
          : `/player/${player.slug}`;
        return (
          <Link
            key={player.id}
            href={href}
            className="group reveal flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition hover:border-white/25 hover:bg-white/[0.06]"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <PlayerPhoto
              src={player.photo}
              alt={player.name}
              accent={POSITION_COLORS[player.position]}
              className="h-11 w-11 shrink-0 rounded-lg object-cover object-top"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {player.webName}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <LeagueBadge league={player.league} />
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: POSITION_COLORS[player.position] }}
                />
                {player.position} · {player.teamShort}
              </div>
            </div>
            <div className="text-right">
              <div className="stat-num text-base font-black text-home">
                {match}%
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                match
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
