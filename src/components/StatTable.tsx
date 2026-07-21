import type { Player } from "@/lib/types";
import { fmt, statValue, CORE_STATS, DEF_STATS, type StatDef } from "@/lib/metrics";

function Row({
  def,
  a,
  b,
  colorA,
  colorB,
}: {
  def: StatDef;
  a: Player;
  b: Player;
  colorA: string;
  colorB: string;
}) {
  const av = statValue(a, def) ?? 0;
  const bv = statValue(b, def) ?? 0;
  const dp = def.dp ?? 2;
  const max = Math.max(av, bv, 0.0001);
  const aWins = av > bv;
  const bWins = bv > av;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5">
      <div className="flex items-center justify-end gap-2">
        <span
          className="stat-num text-sm font-bold"
          style={{ color: aWins ? colorA : "#cbd5e1" }}
        >
          {fmt(av, dp)}
        </span>
        <div className="hidden h-1.5 w-24 justify-end overflow-hidden rounded-full bg-white/5 sm:flex">
          <div
            className="h-full rounded-full"
            style={{ width: `${(av / max) * 100}%`, backgroundColor: colorA, opacity: aWins ? 1 : 0.5 }}
          />
        </div>
      </div>
      <div className="min-w-[120px] text-center text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:min-w-[180px]">
        {def.label}
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/5 sm:flex">
          <div
            className="h-full rounded-full"
            style={{ width: `${(bv / max) * 100}%`, backgroundColor: colorB, opacity: bWins ? 1 : 0.5 }}
          />
        </div>
        <span
          className="stat-num text-sm font-bold"
          style={{ color: bWins ? colorB : "#cbd5e1" }}
        >
          {fmt(bv, dp)}
        </span>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-3 pb-1 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">
      {children}
    </div>
  );
}

export default function StatTable({
  a,
  b,
  colorA = "#22d3ee",
  colorB = "#f0559b",
}: {
  a: Player;
  b: Player;
  colorA?: string;
  colorB?: string;
}) {
  const showDef = !!a.fpl && !!b.fpl;
  return (
    <div>
      <SectionLabel>Attacking &amp; creative · per 90</SectionLabel>
      <div className="divide-y divide-white/5">
        {CORE_STATS.map((def) => (
          <Row key={def.key} def={def} a={a} b={b} colorA={colorA} colorB={colorB} />
        ))}
      </div>
      {showDef && (
        <>
          <SectionLabel>Defensive · per 90 · Premier League data</SectionLabel>
          <div className="divide-y divide-white/5">
            {DEF_STATS.map((def) => (
              <Row key={def.key} def={def} a={a} b={b} colorA={colorA} colorB={colorB} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
