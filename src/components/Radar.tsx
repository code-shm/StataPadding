import type { RadarRow } from "@/lib/metrics";

interface Props {
  rows: RadarRow[];
  colorA?: string;
  colorB?: string;
  size?: number;
  showB?: boolean;
}

// Pure-SVG radar. Server-rendered; the draw-in is handled by CSS.
export default function Radar({
  rows,
  colorA = "#22d3ee",
  colorB = "#f0559b",
  size = 340,
  showB = true,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 46; // leave room for labels
  const n = rows.length;

  const angleFor = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);
  const point = (i: number, value: number) => {
    const r = (Math.max(0, Math.min(100, value)) / 100) * R;
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const polygon = (key: "a" | "b") =>
    rows.map((row, i) => point(i, row[key]).join(",")).join(" ");

  const rings = [25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: "visible" }}
      className="h-auto w-full max-w-[360px] animate-pop-in"
      role="img"
      aria-label="Radar comparison chart"
    >
      {/* grid rings */}
      {rings.map((pct) => (
        <polygon
          key={pct}
          points={rows
            .map((_, i) => point(i, pct).join(","))
            .join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}

      {/* spokes + labels */}
      {rows.map((row, i) => {
        const [ex, ey] = point(i, 100);
        const [lx, ly] = point(i, 113);
        const anchor =
          Math.abs(lx - cx) < 6 ? "middle" : lx > cx ? "start" : "end";
        return (
          <g key={row.axis}>
            <line
              x1={cx}
              y1={cy}
              x2={ex}
              y2={ey}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-slate-300 text-[11px] font-semibold"
            >
              {row.axis}
            </text>
          </g>
        );
      })}

      {/* player B first (under A) */}
      {showB && (
        <polygon
          points={polygon("b")}
          fill={colorB}
          fillOpacity={0.16}
          stroke={colorB}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}
      {/* player A */}
      <polygon
        points={polygon("a")}
        fill={colorA}
        fillOpacity={0.18}
        stroke={colorA}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* vertices */}
      {rows.map((row, i) => {
        const [ax, ay] = point(i, row.a);
        const [bx, by] = point(i, row.b);
        return (
          <g key={`v${i}`}>
            {showB && <circle cx={bx} cy={by} r={3} fill={colorB} />}
            <circle cx={ax} cy={ay} r={3} fill={colorA} />
          </g>
        );
      })}
    </svg>
  );
}
