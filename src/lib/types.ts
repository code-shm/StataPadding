// Shared types mirroring the shape written by scripts/etl.mjs (Phase 2)

export type Position = "DEF" | "MID" | "FWD";

export type LeagueCode = "EPL" | "La_liga" | "Bundesliga" | "Serie_A" | "Ligue_1";

export type RadarAxis =
  | "Goals"
  | "Assists"
  | "Shot Threat"
  | "Chance Creation"
  | "Build-up"
  | "Involvement";

export interface Totals {
  goals: number;
  assists: number;
  goalInvolvements: number;
  xG: number;
  xA: number;
  npxG: number;
  shots: number;
  keyPasses: number;
  xGChain: number;
  xGBuildup: number;
  yellow: number;
  red: number;
}

export interface Per90 {
  goals: number;
  assists: number;
  goalInvolvements: number;
  xG: number;
  xA: number;
  npxG: number;
  shots: number;
  keyPasses: number;
  xGChain: number;
  xGBuildup: number;
}

/** One past/current season in a player's career trajectory. */
export interface SeasonRecord {
  season: string;
  league: LeagueCode;
  team: string;
  minutes: number;
  per90: {
    goals: number;
    xG: number;
    assists: number;
    xA: number;
    npxG: number;
    goalInvolvements: number;
  };
  totals: { goals: number; assists: number; xG: number };
}

/** Premier League-only enrichment from FPL (null for other leagues). */
export interface FplEnrich {
  form: number;
  ict: number;
  per90: {
    influence: number;
    threat: number;
    creativity: number;
    defcon: number;
    tackles: number;
    cbi: number;
    recoveries: number;
  };
}

export interface Player {
  id: string;
  understatId: string;
  fplId: number | null;
  name: string;
  webName: string;
  slug: string;
  league: LeagueCode;
  leagueName: string;
  position: Position;
  positionName: string;
  team: string;
  teamShort: string;
  photo: string | null;
  age: number | null;
  price: number | null;
  minutes: number;
  games: number;
  overall: number;
  history: SeasonRecord[];
  totals: Totals;
  per90: Per90;
  fpl: FplEnrich | null;
  percentiles: Record<string, number>;
  radar: Record<RadarAxis, number>;
  style: number[];
}

export interface League {
  code: LeagueCode;
  name: string;
  country: string;
}

export interface Dataset {
  meta: {
    generatedAt: string;
    source: string;
    season: string;
    minutesThreshold: number;
    qualifiedCount: number;
    matchedFpl: number;
    leagues: League[];
    leagueCounts: Record<string, number>;
    styleDims: string[];
    radarAxes: RadarAxis[];
    historySeasons: string[];
  };
  players: Player[];
}

/** Slim record safe to send to client components (no style vector / percentiles). */
export interface PlayerLite {
  id: string;
  slug: string;
  name: string;
  webName: string;
  position: Position;
  league: LeagueCode;
  team: string;
  teamShort: string;
  photo: string | null;
  overall: number;
}
