import type { SeasonRecord } from "@/lib/types";
import { LEAGUE_META } from "@/lib/metrics";

// Two-line SVG trajectory: actual goal involvements vs expected (xG+xA), per 90,
// across seasons. Pure server-rendered SVG.
export default function TrajectoryChart({
  history,
  accent = "#22d3ee",
}: {
  history: SeasonRecord[];
  accent?: string;
}) {
  const W = 640;
  const H = 270;
  const padL = 34;
  const padR = 16;
  const padT = 24;
  const padB = 60;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const pts = history.map((s) => ({
    ...s,
    actual: s.per90.goalInvolvements,
    expected: Math.round((s.per90.xG + s.per90.xA) * 100) / 100,
  }));
  const n = pts.length;

  const maxY = Math.max(0.5, ...pts.map((p) => Math.max(p.actual, p.expected))) * 1.15;
  const xFor = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yFor = (v: number) => padT + (1 - v / maxY) * plotH;

  const line = (key: "actual" | "expected") =>
    pts.map((p, i) => `${xFor(i)},${yFor(p[key])}`).join(" ");

  const gridVals = [0, maxY / 2, maxY].map((v) => Math.round(v * 10) / 10);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full animate-pop-in" role="img" aria-label="Career trajectory">
      {/* gridlines + y labels */}
      {gridVals.map((v, i) => {
        const y = yFor(v);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.07)" />
            <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-500 text-[10px]">
              {v.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* expected (dashed) */}
      <polyline
        points={line("expected")}
        fill="none"
        stroke="#94a3b8"
        strokeWidth={2}
        strokeDasharray="5 4"
        strokeLinejoin="round"
      />
      {/* actual (accent) */}
      <polyline
        points={line("actual")}
        fill="none"
        stroke={accent}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* points + x labels */}
      {pts.map((p, i) => {
        const lm = LEAGUE_META[p.league];
        return (
          <g key={i}>
            <circle cx={xFor(i)} cy={yFor(p.expected)} r={3} fill="#94a3b8" />
            <circle cx={xFor(i)} cy={yFor(p.actual)} r={4} fill={accent}>
              <title>{`${p.season} · ${p.team}: ${p.actual.toFixed(2)} G+A/90 (xGI ${p.expected.toFixed(2)})`}</title>
            </circle>
            <text x={xFor(i)} y={H - padB + 20} textAnchor="middle" className="fill-slate-300 text-[11px] font-semibold">
              {p.season.replace(/^20/, "")}
            </text>
            <text x={xFor(i)} y={H - padB + 36} textAnchor="middle" className="text-[9px] font-bold" fill={lm.color}>
              {lm.short}
            </text>
            <text x={xFor(i)} y={H - padB + 49} textAnchor="middle" className="fill-slate-500 text-[9px]">
              {p.team.length > 12 ? p.team.slice(0, 11) + "…" : p.team}
            </text>
          </g>
        );
      })}

      {/* legend */}
      <g>
        <line x1={padL} y1={12} x2={padL + 18} y2={12} stroke={accent} strokeWidth={2.5} />
        <text x={padL + 24} y={15} className="fill-slate-300 text-[10px]">Goal involvements /90</text>
        <line x1={padL + 190} y1={12} x2={padL + 208} y2={12} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" />
        <text x={padL + 214} y={15} className="fill-slate-300 text-[10px]">Expected (xG+xA) /90</text>
      </g>
    </svg>
  );
}
