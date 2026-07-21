import { LEAGUE_META } from "@/lib/metrics";
import type { LeagueCode } from "@/lib/types";

export default function LeagueBadge({
  league,
  className = "",
}: {
  league: LeagueCode;
  className?: string;
}) {
  const m = LEAGUE_META[league];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}
      style={{ backgroundColor: `${m.color}22`, color: m.color }}
      title={m.name}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: m.color }}
      />
      {m.short}
    </span>
  );
}
