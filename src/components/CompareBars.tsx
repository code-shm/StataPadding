import type { RadarRow } from "@/lib/metrics";

// Mirrored percentile bars: player A grows left (cyan), B grows right (magenta).
export default function CompareBars({
  rows,
  colorA = "#22d3ee",
  colorB = "#f0559b",
}: {
  rows: RadarRow[];
  colorA?: string;
  colorB?: string;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, i) => {
        const aWins = row.a > row.b;
        const bWins = row.b > row.a;
        return (
          <div
            key={row.axis}
            className="reveal"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span
                className="stat-num font-bold"
                style={{ color: aWins ? colorA : "#94a3b8" }}
              >
                {Math.round(row.a)}
              </span>
              <span className="font-semibold uppercase tracking-wide text-slate-400">
                {row.axis}
              </span>
              <span
                className="stat-num font-bold"
                style={{ color: bWins ? colorB : "#94a3b8" }}
              >
                {Math.round(row.b)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex h-2.5 flex-1 justify-end overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full origin-right animate-fill-bar rounded-full"
                  style={{
                    width: `${row.a}%`,
                    backgroundColor: colorA,
                    opacity: aWins ? 1 : 0.55,
                  }}
                />
              </div>
              <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full origin-left animate-fill-bar rounded-full"
                  style={{
                    width: `${row.b}%`,
                    backgroundColor: colorB,
                    opacity: bWins ? 1 : 0.55,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
