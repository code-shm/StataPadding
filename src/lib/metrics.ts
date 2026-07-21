import type { Player, RadarAxis, LeagueCode, Position } from "./types";
import { players } from "./data";

export const RADAR_AXES: RadarAxis[] = [
  "Goals",
  "Assists",
  "Shot Threat",
  "Chance Creation",
  "Build-up",
  "Involvement",
];

export const LEAGUE_META: Record<
  LeagueCode,
  { name: string; short: string; color: string }
> = {
  EPL: { name: "Premier League", short: "PL", color: "#a855f7" },
  La_liga: { name: "La Liga", short: "LaLiga", color: "#f97316" },
  Bundesliga: { name: "Bundesliga", short: "BL", color: "#ef4444" },
  Serie_A: { name: "Serie A", short: "SA", color: "#3b82f6" },
  Ligue_1: { name: "Ligue 1", short: "L1", color: "#22c55e" },
};

export const POSITION_COLORS: Record<Position, string> = {
  DEF: "#4ade80",
  MID: "#22d3ee",
  FWD: "#f0559b",
};

// ---- Similarity (playing style) ----

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
const magnitude = (a: number[]) => Math.sqrt(dot(a, a));

export function cosine(a: number[], b: number[]): number {
  const m = magnitude(a) * magnitude(b);
  return m === 0 ? 0 : dot(a, b) / m;
}

export function styleMatch(a: Player, b: Player): number {
  return Math.round(Math.max(0, cosine(a.style, b.style)) * 100);
}

export interface SimilarPlayer {
  player: Player;
  match: number;
}

export function findSimilar(
  target: Player,
  opts: {
    limit?: number;
    samePositionOnly?: boolean;
    sameLeagueOnly?: boolean;
  } = {}
): SimilarPlayer[] {
  const { limit = 6, samePositionOnly = false, sameLeagueOnly = false } = opts;
  return players
    .filter(
      (p) =>
        p.id !== target.id &&
        (!samePositionOnly || p.position === target.position) &&
        (!sameLeagueOnly || p.league === target.league)
    )
    .map((p) => ({
      player: p,
      match: Math.round(Math.max(0, cosine(target.style, p.style)) * 100),
    }))
    .sort((x, y) => y.match - x.match)
    .slice(0, limit);
}

// ---- Radar comparison ----

export interface RadarRow {
  axis: RadarAxis;
  a: number;
  b: number;
}

export function radarRows(a: Player, b: Player): RadarRow[] {
  return RADAR_AXES.map((axis) => ({
    axis,
    a: a.radar[axis] ?? 0,
    b: b.radar[axis] ?? 0,
  }));
}

// ---- Per-90 stat table ----

export interface StatDef {
  key: string;
  label: string;
  dp?: number;
  /** where to read the value from */
  from: "per90" | "fpl";
}

// Core attacking/creative stats — available for every player (Understat).
export const CORE_STATS: StatDef[] = [
  { key: "goals", label: "Goals", from: "per90" },
  { key: "npxG", label: "Non-penalty xG", from: "per90" },
  { key: "shots", label: "Shots", from: "per90" },
  { key: "assists", label: "Assists", from: "per90" },
  { key: "xA", label: "Expected assists (xA)", from: "per90" },
  { key: "keyPasses", label: "Key passes", from: "per90" },
  { key: "xGChain", label: "xG chain", from: "per90" },
  { key: "xGBuildup", label: "xG build-up", from: "per90" },
];

// Defensive stats — Premier League only (FPL), shown when both players have them.
export const DEF_STATS: StatDef[] = [
  { key: "defcon", label: "Defensive actions", dp: 1, from: "fpl" },
  { key: "tackles", label: "Tackles", from: "fpl" },
  { key: "cbi", label: "Clearances, blocks & int.", from: "fpl" },
  { key: "recoveries", label: "Ball recoveries", from: "fpl" },
];

export function statValue(p: Player, def: StatDef): number | null {
  if (def.from === "per90")
    return (p.per90 as unknown as Record<string, number>)[def.key] ?? 0;
  if (!p.fpl) return null;
  return (p.fpl.per90 as unknown as Record<string, number>)[def.key] ?? 0;
}

/** Stat rows for a pair — core always; defensive only when both have FPL data. */
export function statRowsFor(a: Player, b: Player): StatDef[] {
  const bothFpl = !!a.fpl && !!b.fpl;
  return bothFpl ? [...CORE_STATS, ...DEF_STATS] : CORE_STATS;
}

// ---- Formatting ----

export function fmt(n: number, dp = 2): string {
  return n.toLocaleString("en-GB", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function fmtInt(n: number): string {
  return n.toLocaleString("en-GB");
}

/** Cross-comparison caveats. */
export function comparisonCaveat(a: Player, b: Player): string | null {
  const bits: string[] = [];
  if (a.position !== b.position) {
    bits.push(
      `different positions (${a.positionName} vs ${b.positionName}) — each radar axis is a percentile vs that player's own position, so shapes describe role, not a direct winner`
    );
  }
  if (a.league !== b.league) {
    bits.push(
      `different leagues (${a.leagueName} vs ${b.leagueName}) — percentiles pool all big-5 players by position, but league strength still varies`
    );
  }
  if (!bits.length) return null;
  return `Comparing across ${bits.join("; and ")}.`;
}
