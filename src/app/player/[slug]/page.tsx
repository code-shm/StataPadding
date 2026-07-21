import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolvePlayer } from "@/lib/data";
import { RADAR_AXES, findSimilar, POSITION_COLORS, fmt, fmtInt } from "@/lib/metrics";
import Radar from "@/components/Radar";
import SimilarList from "@/components/SimilarList";
import PlayerPhoto from "@/components/PlayerPhoto";
import LeagueBadge from "@/components/LeagueBadge";
import CountUp from "@/components/CountUp";
import TrajectoryChart from "@/components/TrajectoryChart";

interface Params {
  params: { slug: string };
}

export function generateMetadata({ params }: Params): Metadata {
  const p = resolvePlayer(params.slug);
  if (!p) return { title: "Player — PitchRank" };
  return {
    title: `${p.name} — profile & similar players | PitchRank`,
    description: `${p.name} (${p.positionName}, ${p.team}, ${p.leagueName}) — radar profile, per-90 stats and stylistically similar players across the big-5 leagues.`,
  };
}

function Stat({
  label,
  value,
  dp = 0,
  accent = "#e2e8f0",
  big = false,
}: {
  label: string;
  value: number;
  dp?: number;
  accent?: string;
  big?: boolean;
}) {
  return (
    <div className="text-center sm:text-left">
      <div className={`stat-num font-black ${big ? "text-3xl" : "text-xl"}`} style={{ color: accent }}>
        {big ? <CountUp value={value} dp={dp} /> : fmt(value, dp)}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

export default function PlayerPage({ params }: Params) {
  const p = resolvePlayer(params.slug);
  if (!p) notFound();

  const accent = POSITION_COLORS[p.position];
  const radarRows = RADAR_AXES.map((axis) => ({ axis, a: p.radar[axis] ?? 0, b: 0 }));
  const similar = findSimilar(p, { limit: 8 });

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        ← Home
      </Link>

      {/* Header */}
      <section className="glass p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <PlayerPhoto
            src={p.photo}
            alt={p.name}
            accent={accent}
            ringColor={accent}
            className="h-28 w-28 rounded-2xl object-cover object-top"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <LeagueBadge league={p.league} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
                {p.positionName} · {p.team}
              </span>
            </div>
            <h1 className="display mt-1 text-3xl text-white sm:text-4xl">{p.name}</h1>
            <div className="mt-1 text-sm text-slate-400">
              {p.age ? `${p.age} years · ` : ""}
              {p.price != null ? `£${fmt(p.price, 1)}m · ` : ""}
              {fmtInt(p.minutes)} mins · {p.games} games
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-4 sm:justify-start">
              <Stat label="Role rating" value={p.overall} accent={accent} big />
              <Stat label="Goals" value={p.totals.goals} />
              <Stat label="Assists" value={p.totals.assists} />
              <Stat label="xG" value={p.totals.xG} dp={1} />
              <Stat label="xA" value={p.totals.xA} dp={1} />
              <Stat label="Shots" value={p.totals.shots} />
            </div>
          </div>
        </div>
      </section>

      {/* Radar + percentile bars */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass flex flex-col items-center p-6">
          <h2 className="display mb-2 self-start text-lg text-white">Style profile</h2>
          <Radar rows={radarRows} colorA={accent} showB={false} />
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Percentile rank vs {p.positionName.toLowerCase()}s across the big-5.
          </p>
        </div>

        <div className="glass p-6">
          <h2 className="display mb-4 text-lg text-white">Percentile ranks</h2>
          <div className="space-y-3">
            {radarRows.map((r, i) => (
              <div key={r.axis} className="reveal" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wide text-slate-400">{r.axis}</span>
                  <span className="stat-num font-bold text-white">{Math.round(r.a)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full origin-left animate-fill-bar rounded-full"
                    style={{ width: `${r.a}%`, backgroundColor: accent }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career trajectory */}
      {p.history.length >= 2 && (
        <section className="glass p-6">
          <h2 className="display text-lg text-white">Career trajectory</h2>
          <p className="mb-4 text-sm text-slate-400">
            Goal involvements vs expected (xG + xA) per 90, across the last{" "}
            {p.history.length} seasons — league shown beneath each point.
          </p>
          <TrajectoryChart history={p.history} accent={accent} />
        </section>
      )}

      {/* Similar players */}
      <section>
        <h2 className="display mb-1 text-xl text-white">Players like {p.webName}</h2>
        <p className="mb-4 text-sm text-slate-400">
          Ranked by playing-style similarity across all big-5 leagues. Tap any
          player for a full head-to-head.
        </p>
        <SimilarList items={similar} compareWith={p.slug} />
      </section>
    </div>
  );
}
