import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Player } from "@/lib/types";
import { resolvePlayer, searchIndex, toLite } from "@/lib/data";
import {
  radarRows,
  styleMatch,
  comparisonCaveat,
  findSimilar,
  fmt,
} from "@/lib/metrics";
import MultiCompareControl from "@/components/MultiCompareControl";
import { getScoutReport } from "@/lib/scout";
import Radar from "@/components/Radar";
import CompareBars from "@/components/CompareBars";
import StatTable from "@/components/StatTable";
import ScoutReportView from "@/components/ScoutReportView";
import SimilarList from "@/components/SimilarList";
import PlayerPhoto from "@/components/PlayerPhoto";
import LeagueBadge from "@/components/LeagueBadge";
import CountUp from "@/components/CountUp";
import ShareCard from "@/components/ShareCard";

const A = "#22d3ee";
const B = "#f0559b";

interface Params {
  params: { a: string; b: string };
}

export function generateMetadata({ params }: Params): Metadata {
  const a = resolvePlayer(params.a);
  const b = resolvePlayer(params.b);
  if (!a || !b) return { title: "Comparison — PitchRank" };
  const image = `/api/card/${a.slug}/${b.slug}`;
  const title = `${a.webName} vs ${b.webName} — PitchRank`;
  const description = `Head-to-head: ${a.name} (${a.team}) vs ${b.name} (${b.team}). Radar, per-90 stats, style match and an AI scout verdict.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

function QuickStat({ label, value, dp = 0 }: { label: string; value: number; dp?: number }) {
  return (
    <div>
      <div className="stat-num text-lg font-bold text-white">{fmt(value, dp)}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function PlayerHeader({ p, accent, side }: { p: Player; accent: string; side: "a" | "b" }) {
  const rev = side === "b";
  return (
    <div className={`flex items-center gap-4 ${rev ? "sm:flex-row-reverse sm:text-right" : ""}`}>
      <PlayerPhoto
        src={p.photo}
        alt={p.name}
        accent={accent}
        ringColor={accent}
        className="h-24 w-24 shrink-0 rounded-2xl object-cover object-top"
      />
      <div className={rev ? "sm:flex sm:flex-col sm:items-end" : ""}>
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
          {p.positionName}
        </div>
        <h1 className="display text-2xl leading-tight text-white sm:text-3xl">{p.webName}</h1>
        <div className={`mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-400 ${rev ? "sm:justify-end" : ""}`}>
          <LeagueBadge league={p.league} />
          <span>
            {p.team}
            {p.age ? ` · ${p.age}y` : ""}
            {p.price != null ? ` · £${fmt(p.price, 1)}m` : ""}
          </span>
        </div>
        <div className={`mt-2 flex items-center gap-3 ${rev ? "sm:justify-end" : ""}`}>
          <div>
            <div className="stat-num text-3xl font-black" style={{ color: accent }}>
              <CountUp value={p.overall} />
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Role rating</div>
          </div>
          <div className="flex gap-3 text-center text-slate-300">
            <QuickStat label="Goals" value={p.totals.goals} />
            <QuickStat label="Assists" value={p.totals.assists} />
            <QuickStat label="xG" value={p.totals.xG} dp={1} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-300">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export default async function ComparePage({ params }: Params) {
  const a = resolvePlayer(params.a);
  const b = resolvePlayer(params.b);
  if (!a || !b) notFound();
  if (a.id === b.id) notFound();

  const rows = radarRows(a, b);
  const match = styleMatch(a, b);
  const caveat = comparisonCaveat(a, b);
  const report = await getScoutReport(a, b);
  const similarToA = findSimilar(a, { limit: 4 });
  const similarToB = findSimilar(b, { limit: 4 });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          ← New comparison
        </Link>
        <ShareCard aSlug={a.slug} bSlug={b.slug} aName={a.webName} bName={b.webName} />
      </div>

      {/* VS header */}
      <section className="glass relative overflow-hidden p-6">
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
          <PlayerHeader p={a} accent={A} side="a" />

          <div className="flex flex-col items-center">
            <div className="relative grid h-24 w-24 place-items-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="url(#matchGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(match / 100) * 276.5} 276.5`}
                />
                <defs>
                  <linearGradient id="matchGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={A} />
                    <stop offset="100%" stopColor={B} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="stat-num text-2xl font-black text-white">
                <CountUp value={match} suffix="%" />
              </div>
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">Style match</div>
          </div>

          <PlayerHeader p={b} accent={B} side="b" />
        </div>

        {caveat && (
          <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs text-gold">
            ⚠ {caveat}
          </div>
        )}
      </section>

      {/* Add a third player → multi-compare */}
      <MultiCompareControl index={searchIndex()} current={[a, b].map(toLite)} compact />

      {/* Radar + bars */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass flex flex-col items-center p-6">
          <div className="mb-2 flex items-center gap-4 text-xs">
            <Legend color={A} label={a.webName} />
            <Legend color={B} label={b.webName} />
          </div>
          <Radar rows={rows} colorA={A} colorB={B} />
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Percentile rank vs positional peers across the big-5 (0–100).
          </p>
        </div>

        <div className="glass p-6">
          <h2 className="display mb-4 text-lg text-white">Head-to-head index</h2>
          <CompareBars rows={rows} colorA={A} colorB={B} />
        </div>
      </section>

      {/* Scout report */}
      <ScoutReportView report={report} />

      {/* Per-90 stat table */}
      <section className="glass p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="display text-lg text-white">The numbers</h2>
          <div className="flex items-center gap-4 text-xs">
            <Legend color={A} label={a.webName} />
            <Legend color={B} label={b.webName} />
          </div>
        </div>
        <StatTable a={a} b={b} colorA={A} colorB={B} />
      </section>

      {/* Swap in similar players */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">
            Similar to <span className="text-home">{a.webName}</span>{" "}
            <span className="text-slate-500">— tap to swap in</span>
          </h3>
          <SimilarList items={similarToA} compareWith={b.slug} />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">
            Similar to <span className="text-away">{b.webName}</span>{" "}
            <span className="text-slate-500">— tap to swap in</span>
          </h3>
          <SimilarList items={similarToB} compareWith={a.slug} />
        </div>
      </section>
    </div>
  );
}
