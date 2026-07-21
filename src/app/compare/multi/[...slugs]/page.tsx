import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Player } from "@/lib/types";
import { resolvePlayer, searchIndex, toLite } from "@/lib/data";
import {
  RADAR_AXES,
  PLAYER_COLORS,
  CORE_STATS,
  statValue,
  styleMatch,
  fmt,
} from "@/lib/metrics";
import RadarMulti from "@/components/RadarMulti";
import MultiCompareControl from "@/components/MultiCompareControl";
import PlayerPhoto from "@/components/PlayerPhoto";
import LeagueBadge from "@/components/LeagueBadge";

interface Params {
  params: { slugs: string[] };
}

function resolveAll(slugs: string[]): Player[] {
  const out: Player[] = [];
  const seen = new Set<string>();
  for (const s of slugs) {
    const p = resolvePlayer(s);
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
    if (out.length === 4) break;
  }
  return out;
}

export function generateMetadata({ params }: Params): Metadata {
  const players = resolveAll(params.slugs);
  if (players.length < 2) return { title: "Compare — PitchRank" };
  const names = players.map((p) => p.webName).join(", ");
  return { title: `${names} — PitchRank`, description: `Multi-player comparison: ${names}.` };
}

export default function MultiComparePage({ params }: Params) {
  const players = resolveAll(params.slugs);
  if (players.length < 2) notFound();
  if (players.length === 2) redirect(`/compare/${players[0].slug}/${players[1].slug}`);

  const colorOf = (i: number) => PLAYER_COLORS[i] ?? "#94a3b8";
  const series = players.map((p, i) => ({
    label: p.webName,
    color: colorOf(i),
    values: RADAR_AXES.map((ax) => p.radar[ax] ?? 0),
  }));

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        ← New comparison
      </Link>

      <MultiCompareControl index={searchIndex()} current={players.map(toLite)} />

      {/* Player header cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}>
        {players.map((p, i) => (
          <Link
            key={p.id}
            href={`/player/${p.slug}`}
            className="glass flex flex-col items-center p-4 text-center transition hover:border-white/25"
          >
            <PlayerPhoto
              src={p.photo}
              alt={p.name}
              accent={colorOf(i)}
              ringColor={colorOf(i)}
              className="h-16 w-16 rounded-xl object-cover object-top"
            />
            <div className="mt-2 truncate text-sm font-bold text-white">{p.webName}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <LeagueBadge league={p.league} />
            </div>
            <div className="stat-num mt-1 text-2xl font-black" style={{ color: colorOf(i) }}>
              {p.overall}
            </div>
          </Link>
        ))}
      </div>

      {/* Radar + legend */}
      <section className="glass flex flex-col items-center p-6">
        <div className="mb-3 flex flex-wrap justify-center gap-3 text-xs">
          {players.map((p, i) => (
            <span key={p.id} className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorOf(i) }} />
              {p.webName}
            </span>
          ))}
        </div>
        <RadarMulti axes={RADAR_AXES} series={series} />
        <p className="mt-3 text-center text-[11px] text-slate-500">
          Percentile rank vs positional peers across the big-5 (0–100).
        </p>
      </section>

      {/* Stat table (N columns) */}
      <section className="glass overflow-x-auto p-6">
        <h2 className="display mb-4 text-lg text-white">Per 90 minutes</h2>
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr>
              <th className="pb-3 text-left text-[11px] uppercase tracking-wide text-slate-500">Metric</th>
              {players.map((p, i) => (
                <th key={p.id} className="pb-3 text-right text-sm font-bold" style={{ color: colorOf(i) }}>
                  {p.webName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CORE_STATS.map((def) => {
              const vals = players.map((p) => statValue(p, def) ?? 0);
              const max = Math.max(...vals);
              return (
                <tr key={def.key} className="border-t border-white/5">
                  <td className="py-2.5 text-[11px] uppercase tracking-wide text-slate-400">{def.label}</td>
                  {players.map((p, i) => (
                    <td
                      key={p.id}
                      className="stat-num py-2.5 text-right text-sm font-bold"
                      style={{ color: vals[i] === max && max > 0 ? colorOf(i) : "#cbd5e1" }}
                    >
                      {fmt(vals[i], def.dp ?? 2)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Style-similarity matrix */}
      <section className="glass overflow-x-auto p-6">
        <h2 className="display mb-1 text-lg text-white">Style-match matrix</h2>
        <p className="mb-4 text-sm text-slate-400">How similar each pair is in playing style (%).</p>
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2"></th>
              {players.map((p, i) => (
                <th key={p.id} className="p-2 text-xs font-bold" style={{ color: colorOf(i) }}>
                  {p.webName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((row, ri) => (
              <tr key={row.id}>
                <td className="p-2 text-right text-xs font-bold" style={{ color: colorOf(ri) }}>
                  {row.webName}
                </td>
                {players.map((col, ci) => {
                  if (ri === ci)
                    return (
                      <td key={col.id} className="p-2 text-center text-slate-600">
                        —
                      </td>
                    );
                  const m = styleMatch(row, col);
                  return (
                    <td key={col.id} className="p-1.5 text-center">
                      <span
                        className="stat-num inline-block w-14 rounded-md py-1.5 font-bold"
                        style={{ backgroundColor: `rgba(34,211,238,${(m / 100) * 0.35 + 0.05})`, color: "#e2e8f0" }}
                      >
                        {m}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
