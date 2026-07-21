import type { RadarAxis } from "@/lib/types";

export interface RadarSeries {
  label: string;
  color: string;
  values: number[]; // aligned to `axes`
}

// Pure-SVG radar overlaying N series (2–4 players).
export default function RadarMulti({
  axes,
  series,
  size = 360,
}: {
  axes: RadarAxis[];
  series: RadarSeries[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 52;
  const n = axes.length;

  const angleFor = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);
  const point = (i: number, value: number) => {
    const r = (Math.max(0, Math.min(100, value)) / 100) * R;
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const rings = [25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: "visible" }}
      className="h-auto w-full max-w-[380px] animate-pop-in"
      role="img"
      aria-label="Multi-player radar"
    >
      {rings.map((pct) => (
        <polygon
          key={pct}
          points={axes.map((_, i) => point(i, pct).join(",")).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
        />
      ))}

      {axes.map((axis, i) => {
        const [ex, ey] = point(i, 100);
        const [lx, ly] = point(i, 114);
        const anchor = Math.abs(lx - cx) < 6 ? "middle" : lx > cx ? "start" : "end";
        return (
          <g key={axis}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(255,255,255,0.08)" />
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-slate-300 text-[11px] font-semibold"
            >
              {axis}
            </text>
          </g>
        );
      })}

      {series.map((s) => (
        <polygon
          key={s.label}
          points={axes.map((_, i) => point(i, s.values[i]).join(",")).join(" ")}
          fill={s.color}
          fillOpacity={0.1}
          stroke={s.color}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}

      {series.map((s) =>
        axes.map((_, i) => {
          const [x, y] = point(i, s.values[i]);
          return <circle key={`${s.label}-${i}`} cx={x} cy={y} r={2.5} fill={s.color} />;
        })
      )}
    </svg>
  );
}
