import type { Player, LeagueCode, Position } from "./types";
import { players } from "./data";
import { cosine, LEAGUE_META } from "./metrics";

export interface Interpretation {
  raw: string;
  league?: LeagueCode;
  position?: Position;
  ageMax?: number;
  ageIgnored?: boolean;
  sort: "overall" | "goals" | "creation" | "shots";
  like?: { name: string; slug: string; id: string };
  wingerHint?: boolean;
}

export interface SearchResult {
  interpretation: Interpretation;
  explanation: string;
  results: Player[];
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

const LEAGUE_KWS: Array<[RegExp, LeagueCode]> = [
  [/\b(premier|epl|england|english|prem)\b/, "EPL"],
  [/\b(la ?liga|spain|spanish|espanyol|españa)\b/, "La_liga"],
  [/\b(bundesliga|germany|german|bundes)\b/, "Bundesliga"],
  [/\b(serie ?a|italy|italian|calcio)\b/, "Serie_A"],
  [/\b(ligue ?1|france|french|ligue)\b/, "Ligue_1"],
];

const POS_KWS: Array<[RegExp, Position]> = [
  [/\b(strik(er)?s?|forwards?|attackers?|number ?9|no\.? ?9|cf|finishers?|poachers?|goal ?scorers?)\b/, "FWD"],
  [/\b(midfielders?|midfield|playmakers?|cm|dm|am|box-to-box|regista|engine)\b/, "MID"],
  [/\b(defenders?|defence|defense|centre-?backs?|center-?backs?|cb|full-?backs?|wing-?backs?|rb|lb)\b/, "DEF"],
];

function findByName(name: string): Player | undefined {
  const q = norm(name).trim();
  if (q.length < 2) return undefined;
  const hits = players.filter((p) => norm(p.name).includes(q) || norm(p.webName).includes(q));
  if (!hits.length) return undefined;
  // Prefer the most prominent (highest overall) match.
  return hits.sort((a, b) => b.overall - a.overall)[0];
}

export function parseQuery(raw: string): Interpretation {
  const q = " " + norm(raw) + " ";
  const interp: Interpretation = { raw, sort: "overall" };

  for (const [re, code] of LEAGUE_KWS) if (re.test(q)) { interp.league = code; break; }
  for (const [re, pos] of POS_KWS) if (re.test(q)) { interp.position = pos; break; }
  if (/\bwing(er|ers|s)?\b/.test(q)) {
    interp.wingerHint = true;
    if (!interp.position) interp.position = "FWD";
  }

  // age
  const under = q.match(/\b(?:under|younger than|u\.?\s?)(\d{2})\b/);
  if (under) interp.ageMax = parseInt(under[1], 10);
  else if (/\b(young|youngsters?|wonderkids?|prospects?|teenagers?|kids?)\b/.test(q))
    interp.ageMax = 21;

  // sort emphasis
  if (/\b(prolific|clinical|goal ?scor\w*|scorers?|finishers?|poachers?|lethal|sharp)\b/.test(q))
    interp.sort = "goals";
  else if (/\b(creative|creators?|playmak\w*|assist\w*|chances?|providers?|vision|chance ?creators?)\b/.test(q))
    interp.sort = "creation";
  else if (/\b(shot|shooters?|volume|trigger)\b/.test(q)) interp.sort = "shots";

  // "like X" / "similar to X"
  const like = raw.match(/\b(?:like|similar to|comparable to|in the mould of)\s+([A-Za-zÀ-ÿ'’.\- ]{2,40})$/i);
  if (like) {
    const player = findByName(like[1]);
    if (player) interp.like = { name: player.name, slug: player.slug, id: player.id };
  }

  return interp;
}

export function runSearch(raw: string): SearchResult {
  const interpretation = parseQuery(raw);
  let pool = players;
  if (interpretation.league) pool = pool.filter((p) => p.league === interpretation.league);
  if (interpretation.position) pool = pool.filter((p) => p.position === interpretation.position);
  if (interpretation.ageMax != null) {
    // Age (birth date) exists only for Premier League players. If this pool has
    // too little age data to be meaningful, skip the filter rather than return
    // nothing — and flag it so the UI can explain why.
    const withAge = pool.filter((p) => p.age != null).length;
    if (withAge >= 5)
      pool = pool.filter((p) => p.age != null && p.age <= interpretation.ageMax!);
    else interpretation.ageIgnored = true;
  }

  let results: Player[];
  if (interpretation.like) {
    const target = players.find((p) => p.id === interpretation.like!.id);
    const style = target?.style ?? [];
    results = pool
      .filter((p) => p.id !== interpretation.like!.id)
      .map((p) => ({ p, s: cosine(style, p.style) }))
      .sort((x, y) => y.s - x.s)
      .slice(0, 24)
      .map((x) => x.p);
  } else {
    const s = interpretation.sort;
    results = [...pool]
      .sort((a, b) => {
        if (s === "goals") return b.per90.goals - a.per90.goals;
        if (s === "creation")
          return b.per90.xA + b.per90.keyPasses - (a.per90.xA + a.per90.keyPasses);
        if (s === "shots") return b.per90.shots - a.per90.shots;
        return b.overall - a.overall;
      })
      .slice(0, 24);
  }

  return { interpretation, explanation: explain(interpretation, results.length), results };
}

function explain(i: Interpretation, count: number): string {
  const bits: string[] = [];
  if (i.ageMax != null && !i.ageIgnored) bits.push(i.ageMax <= 21 ? "young" : `under-${i.ageMax}`);
  if (i.league) bits.push(LEAGUE_META[i.league].name);
  bits.push(
    i.position
      ? { FWD: "forwards", MID: "midfielders", DEF: "defenders" }[i.position]
      : "players"
  );
  let s = `Showing ${bits.join(" ")}`;
  if (i.like) s += ` most similar in style to ${i.like.name}`;
  else if (i.sort === "goals") s += ", ranked by goals per 90";
  else if (i.sort === "creation") s += ", ranked by chance creation";
  else if (i.sort === "shots") s += ", ranked by shot volume";
  else s += ", ranked by role rating";
  s += ` · ${count} result${count === 1 ? "" : "s"}`;
  if (i.ageIgnored)
    s += " · age filter skipped (birth dates are only in the free data for the Premier League)";
  return s;
}

export const SEARCH_EXAMPLES = [
  "creative La Liga midfielders",
  "prolific Serie A strikers",
  "players like Pedri",
  "young Bundesliga forwards",
  "clinical finishers in Ligue 1",
];
