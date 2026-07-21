"use client";

import { useId, useState } from "react";

function initials(name: string): string {
  const t = name.trim().split(/\s+/).filter(Boolean);
  if (!t.length) return "?";
  const first = t[0][0] ?? "";
  const last = t.length > 1 ? t[t.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

function hue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default function PlayerPhoto({
  src,
  alt,
  className = "",
  accent = "#22d3ee",
  ringColor,
}: {
  src: string | null;
  alt: string;
  className?: string;
  accent?: string;
  ringColor?: string;
}) {
  const [failed, setFailed] = useState(false);
  const gid = useId().replace(/:/g, "");
  const style = ringColor ? { boxShadow: `0 0 0 2px ${ringColor}` } : undefined;

  if (!src || failed) {
    const h = hue(alt);
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        role="img"
        aria-label={alt}
      >
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${h} 55% 42%)`} />
            <stop offset="100%" stopColor={`hsl(${(h + 40) % 360} 60% 24%)`} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#g${gid})`} />
        <text
          x="50"
          y="52"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="40"
          fontWeight="800"
          fill="rgba(255,255,255,0.92)"
          fontFamily="Segoe UI, system-ui, sans-serif"
        >
          {initials(alt)}
        </text>
      </svg>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
      style={style}
    />
  );
}
