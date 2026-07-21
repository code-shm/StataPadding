import raw from "@/data/players.json";
import type { Dataset, Player, PlayerLite, Position, LeagueCode } from "./types";

// Bundled at build time (server-side), produced by scripts/etl.mjs.
// The app never touches an external API at runtime.
const data = raw as unknown as Dataset;

export const meta = data.meta;
export const leagues = data.meta.leagues;
export const players: Player[] = data.players;

const byId = new Map<string, Player>(players.map((p) => [p.id, p]));
const bySlug = new Map<string, Player>(players.map((p) => [p.slug, p]));

export function getById(id: string): Player | undefined {
  return byId.get(id);
}

export function resolvePlayer(param: string): Player | undefined {
  return (
    byId.get(param) ??
    bySlug.get(param) ??
    bySlug.get(param.toLowerCase())
  );
}

export function toLite(p: Player): PlayerLite {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    webName: p.webName,
    position: p.position,
    league: p.league,
    team: p.team,
    teamShort: p.teamShort,
    photo: p.photo,
    overall: p.overall,
  };
}

export function searchIndex(): PlayerLite[] {
  return players.map(toLite);
}

export function topPlayers(limit = 12): Player[] {
  return players.slice(0, limit);
}

export function topByPosition(pos: Position, limit = 5): Player[] {
  return players.filter((p) => p.position === pos).slice(0, limit);
}

export function byLeague(league: LeagueCode, limit?: number): Player[] {
  const list = players.filter((p) => p.league === league);
  return limit ? list.slice(0, limit) : list;
}

/** Marquee cross-league head-to-heads for the home page. */
export function featuredMatchups(): Array<[Player, Player]> {
  const find = (needle: string, league?: LeagueCode) =>
    players.find(
      (p) =>
        p.name.toLowerCase().includes(needle) &&
        (!league || p.league === league)
    );
  const wanted: Array<[string, string]> = [
    ["haaland", "mbappe"],
    ["kane", "lautaro"],
    ["salah", "yamal"],
    ["saka", "olise"],
  ];
  const out: Array<[Player, Player]> = [];
  const used = new Set<string>();
  for (const [a, b] of wanted) {
    const pa = find(a);
    const pb = find(b);
    if (pa && pb && pa.id !== pb.id) {
      out.push([pa, pb]);
      used.add(pa.id);
      used.add(pb.id);
    }
  }
  // Fallback: pair up remaining top players if some names are missing.
  if (out.length < 2) {
    const pool = players.filter((p) => !used.has(p.id));
    for (let i = 0; i + 1 < pool.length && out.length < 3; i += 2) {
      out.push([pool[i], pool[i + 1]]);
    }
  }
  return out;
}
