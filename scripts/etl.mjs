// ETL — Football Player Comparator (Phase 2: multi-league)
//
// Primary source:  Understat getLeagueData/{league}/{season}  (big-5 leagues,
//                  one GET per league — polite, ~5 requests total). Gives a
//                  consistent attacking/creative stat schema for every player.
// Enrichment:      Fantasy Premier League bootstrap-static — adds photos, age,
//                  price and defensive actions for Premier League players,
//                  merged via name-based entity resolution.
//
// Output: src/data/players.json — fully pre-computed. The app never calls an
// external API at runtime.
//
// Run:  npm run etl        (SEASON env overrides the season, default 2025 = 2025/26)

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "src", "data");
const OUT_FILE = join(OUT_DIR, "players.json");

const SEASON = process.env.SEASON || "2025"; // Understat season = starting year
const MIN_MINUTES = 900; // ~10 full matches
const INCLUDE_GK = false; // Understat has no keeper metrics — outfield only for now

const LEAGUES = [
  { code: "EPL", name: "Premier League", country: "England" },
  { code: "La_liga", name: "La Liga", country: "Spain" },
  { code: "Bundesliga", name: "Bundesliga", country: "Germany" },
  { code: "Serie_A", name: "Serie A", country: "Italy" },
  { code: "Ligue_1", name: "Ligue 1", country: "France" },
];

const POSITION_NAMES = { DEF: "Defender", MID: "Midfielder", FWD: "Forward" };
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const num = (v) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const round = (v, d = 2) => {
  const f = 10 ** d;
  return Math.round(num(v) * f) / f;
};
const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const std = (a, m) =>
  a.length < 2 ? 0 : Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length);

function percentileRank(sortedAsc, v) {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  let lo = 0,
    hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedAsc[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return round((lo / n) * 100, 1);
}

function ageFrom(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

// Classify an Understat compound position ("D F M S", alphabetical) into a group.
function understatGroup(p) {
  const pos = p.position || "";
  if (pos.includes("GK")) return "GKP";
  const tokens = pos.split(/\s+/).filter((t) => t && t !== "S");
  const groups = new Set(
    tokens
      .map((t) => (t[0] === "D" ? "DEF" : t[0] === "F" ? "FWD" : t[0] === "M" ? "MID" : null))
      .filter(Boolean)
  );
  if (groups.size === 1) return [...groups][0];
  // compound / unknown → infer from output profile
  const t90 = num(p.time) / 90 || 1;
  const shots90 = num(p.shots) / t90;
  const goals90 = num(p.goals) / t90;
  const kp90 = num(p.key_passes) / t90;
  if (groups.has("FWD") && (goals90 >= 0.25 || shots90 >= 1.8)) return "FWD";
  if (groups.has("DEF") && shots90 < 0.8 && kp90 < 1.0 && goals90 < 0.12) return "DEF";
  if (groups.has("MID")) return "MID";
  if (groups.has("FWD")) return "FWD";
  if (groups.has("DEF")) return "DEF";
  return shots90 >= 1.8 ? "FWD" : "MID";
}

// Display-name overrides for players commonly known by a first name / nickname
// rather than their last token (matched against the accent-stripped full name).
const NAME_OVERRIDES = [
  [/\bmbappe\b/, "Mbappé"],
  [/vinicius junior/, "Vinícius"],
  [/\braphinha\b|raphael dias/, "Raphinha"],
  [/\brodrygo\b/, "Rodrygo"],
  [/rafael leao|raphael leao/, "Leão"],
  [/\bendrick\b/, "Endrick"],
  [/gabriel jesus/, "Jesus"],
  [/gabriel martinelli/, "Martinelli"],
  [/gabriel magalhaes/, "Gabriel"],
  [/bruno guimaraes/, "Guimarães"],
  [/\bjoelinton\b/, "Joelinton"],
  [/\bricharlison\b/, "Richarlison"],
  [/\bpedri\b/, "Pedri"],
  [/\bgavi\b/, "Gavi"],
  [/fermin lopez/, "Fermín"],
  [/dani olmo/, "Olmo"],
  [/\bmalick fofana\b/, "M. Fofana"],
];

function shortName(fullName, fpl) {
  const n = norm(fullName);
  for (const [re, label] of NAME_OVERRIDES) if (re.test(n)) return label;
  if (fpl) return fpl.webName;
  const words = (fullName || "").trim().split(/\s+/).filter(Boolean);
  return words[words.length - 1] || fullName;
}

const FPL_TEAM_TO_UNDERSTAT = {
  "Man City": "Manchester City",
  "Man Utd": "Manchester United",
  Newcastle: "Newcastle United",
  "Nott'm Forest": "Nottingham Forest",
  Spurs: "Tottenham",
  Wolves: "Wolverhampton Wanderers",
};

async function fetchJSON(url, referer) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json, text/javascript, */*; q=0.01",
      Referer: referer || "https://understat.com/",
    },
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

// ---- FPL enrichment index ----
async function buildFplIndex() {
  console.log("→ Fetching FPL bootstrap-static (enrichment) …");
  const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`FPL → HTTP ${res.status}`);
  const data = await res.json();
  const teams = {};
  for (const t of data.teams) teams[t.id] = { name: t.name, short: t.short_name };
  const POS = { 1: "GKP", 2: "DEF", 3: "MID", 4: "FWD" };

  const list = data.elements
    .filter((e) => num(e.minutes) > 0)
    .map((e) => {
      const minutes = num(e.minutes);
      const p90 = minutes / 90;
      const per = (t) => (p90 > 0 ? round(num(t) / p90) : 0);
      const full = `${e.first_name} ${e.second_name}`.trim();
      return {
        fplId: e.id,
        code: e.code,
        webName: e.web_name,
        fullNorm: norm(full),
        webNorm: norm(e.web_name),
        tokens: norm(full).split(" ").filter(Boolean),
        position: POS[e.element_type],
        teamName: teams[e.team]?.name ?? "",
        teamShort: teams[e.team]?.short ?? "",
        teamUnderstat: FPL_TEAM_TO_UNDERSTAT[teams[e.team]?.name] ?? teams[e.team]?.name ?? "",
        age: ageFrom(e.birth_date),
        price: round(num(e.now_cost) / 10, 1),
        minutes,
        photo: `https://resources.premierleague.com/premierleague/photos/players/250x250/p${e.code}.png`,
        form: round(e.form, 1),
        ict: round(e.ict_index, 1),
        per90: {
          influence: per(e.influence),
          threat: per(e.threat),
          creativity: per(e.creativity),
          defcon: per(e.defensive_contribution),
          tackles: per(e.tackles),
          cbi: per(e.clearances_blocks_interceptions),
          recoveries: per(e.recoveries),
        },
      };
    });

  const byToken = new Map(); // token -> fpl players containing it
  for (const p of list) {
    for (const tk of p.tokens) {
      if (!byToken.has(tk)) byToken.set(tk, []);
      byToken.get(tk).push(p);
    }
  }
  return { list, byToken };
}

// Match an Understat EPL player to an FPL record by name (+ team tiebreak).
function matchFpl(u, fplIndex) {
  const uNorm = norm(u.player_name);
  const uTokens = uNorm.split(" ").filter(Boolean);
  if (!uTokens.length) return null;

  // candidate pool: any FPL player sharing at least the surname token
  const surname = uTokens[uTokens.length - 1];
  const pool = fplIndex.byToken.get(surname) || [];
  const scored = [];
  for (const f of pool) {
    const fset = new Set(f.tokens);
    const uset = new Set(uTokens);
    const uInF = uTokens.every((t) => fset.has(t));
    const fInU = f.tokens.every((t) => uset.has(t));
    const inter = uTokens.filter((t) => fset.has(t)).length;
    let score = 0;
    if (uNorm === f.fullNorm) score = 100;
    else if (uInF || fInU) score = 80 + inter;
    else if (uTokens[0] === f.tokens[0]) score = 60 + inter; // same first + surname
    else score = 40 + inter;
    // team agreement bonus
    if (u.team_title && f.teamUnderstat && u.team_title.includes(f.teamUnderstat))
      score += 15;
    scored.push({ f, score });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  // require a reasonable match
  return scored[0].score >= 61 ? scored[0].f : null;
}

async function main() {
  const fplIndex = await buildFplIndex();
  console.log(`  FPL players with minutes: ${fplIndex.list.length}`);

  // ---- Fetch Understat leagues ----
  const rows = [];
  for (const lg of LEAGUES) {
    process.stdout.write(`→ Understat ${lg.code} ${SEASON} … `);
    const d = await fetchJSON(
      `https://understat.com/getLeagueData/${lg.code}/${SEASON}`,
      `https://understat.com/league/${lg.code}/${SEASON}`
    );
    console.log(`${d.players.length} players`);
    for (const p of d.players) {
      p._league = lg.code;
      p._leagueName = lg.name;
      rows.push(p);
    }
  }

  // Dedupe by Understat id (players who switched leagues appear twice) → keep max minutes
  const byId = new Map();
  for (const p of rows) {
    const prev = byId.get(p.id);
    if (!prev || num(p.time) > num(prev.time)) byId.set(p.id, p);
  }
  const deduped = [...byId.values()];

  // ---- Build unified records ----
  let matched = 0;
  const built = [];
  for (const u of deduped) {
    const group = understatGroup(u);
    if (!INCLUDE_GK && group === "GKP") continue;

    const minutes = num(u.time);
    const p90 = minutes > 0 ? minutes / 90 : 0;
    const per = (t) => (p90 > 0 ? round(num(t) / p90) : 0);

    const isEPL = u._league === "EPL";
    const fpl = isEPL ? matchFpl(u, fplIndex) : null;
    if (fpl) matched++;

    const position = fpl ? fpl.position : group;
    // "Team A,Team B" (a transfer) → current team = last segment
    const teamRaw = (u.team_title || "").split(",").map((s) => s.trim());
    const team = fpl ? fpl.teamName : teamRaw[teamRaw.length - 1] || teamRaw[0] || "—";
    const teamShort = fpl ? fpl.teamShort : team.slice(0, 3).toUpperCase();

    const goals = num(u.goals);
    const assists = num(u.assists);

    built.push({
      id: `u${u.id}`,
      understatId: u.id,
      fplId: fpl?.fplId ?? null,
      name: u.player_name,
      webName: shortName(u.player_name, fpl),
      slug: `${norm(u.player_name).replace(/\s+/g, "-")}-${u.id}`,
      league: u._league,
      leagueName: u._leagueName,
      position: position === "GKP" ? "MID" : position, // safety (GK excluded)
      positionName: POSITION_NAMES[position] || "Midfielder",
      team,
      teamShort,
      photo: fpl?.photo ?? null,
      age: fpl?.age ?? null,
      price: fpl?.price ?? null,
      minutes,
      games: num(u.games),
      totals: {
        goals,
        assists,
        goalInvolvements: goals + assists,
        xG: round(u.xG),
        xA: round(u.xA),
        npxG: round(u.npxG),
        shots: num(u.shots),
        keyPasses: num(u.key_passes),
        xGChain: round(u.xGChain),
        xGBuildup: round(u.xGBuildup),
        yellow: num(u.yellow_cards),
        red: num(u.red_cards),
      },
      per90: {
        goals: per(goals),
        assists: per(assists),
        goalInvolvements: per(goals + assists),
        xG: per(u.xG),
        xA: per(u.xA),
        npxG: per(u.npxG),
        shots: per(u.shots),
        keyPasses: per(u.key_passes),
        xGChain: per(u.xGChain),
        xGBuildup: per(u.xGBuildup),
      },
      fpl: fpl
        ? { form: fpl.form, ict: fpl.ict, per90: fpl.per90 }
        : null,
    });
  }

  const qualified = built.filter((p) => p.minutes >= MIN_MINUTES);
  console.log(
    `→ ${built.length} outfield players; ${qualified.length} qualified (≥${MIN_MINUTES} mins)`
  );
  console.log(
    `→ Entity resolution: ${matched} EPL players matched to FPL (photos/defensive stats)`
  );

  // ---- Percentiles within position group (pooled across all leagues) ----
  const PCT = [
    "goals",
    "assists",
    "goalInvolvements",
    "xG",
    "xA",
    "npxG",
    "shots",
    "keyPasses",
    "xGChain",
    "xGBuildup",
  ];
  const byPos = {};
  for (const p of qualified) (byPos[p.position] ||= []).push(p);
  const sortedByPos = {};
  for (const pos of Object.keys(byPos)) {
    sortedByPos[pos] = {};
    for (const m of PCT)
      sortedByPos[pos][m] = byPos[pos].map((p) => p.per90[m]).sort((a, b) => a - b);
  }
  const pct = (p, m) => percentileRank(sortedByPos[p.position][m], p.per90[m]);
  const avg = (...xs) => round(mean(xs), 0);

  for (const p of qualified) {
    const P = {};
    for (const m of PCT) P[m] = pct(p, m);
    p.percentiles = P;
    p.radar = {
      Goals: P.goals,
      Assists: P.assists,
      "Shot Threat": avg(P.npxG, P.shots),
      "Chance Creation": avg(P.xA, P.keyPasses),
      "Build-up": P.xGBuildup,
      Involvement: P.xGChain,
    };
    const r = p.radar;
    const W = {
      FWD: { Goals: 3, "Shot Threat": 2, Assists: 1, "Chance Creation": 1, Involvement: 1, "Build-up": 0.5 },
      MID: { "Chance Creation": 2, Assists: 2, Involvement: 2, "Build-up": 1.5, Goals: 1.5, "Shot Threat": 1 },
      DEF: { "Build-up": 2.5, Involvement: 1.5, Assists: 1, "Chance Creation": 1, "Shot Threat": 0.5, Goals: 0.5 },
    }[p.position];
    let ws = 0,
      acc = 0;
    for (const [ax, w] of Object.entries(W)) {
      acc += (r[ax] ?? 0) * w;
      ws += w;
    }
    p.overall = ws ? Math.round(acc / ws) : 0;
  }

  // ---- z-scored style vectors (cosine similarity) ----
  const STYLE_DIMS = [
    "goals",
    "assists",
    "xG",
    "xA",
    "npxG",
    "shots",
    "keyPasses",
    "xGChain",
    "xGBuildup",
  ];
  const stats = {};
  for (const d of STYLE_DIMS) {
    const vals = qualified.map((p) => p.per90[d]);
    const m = mean(vals);
    stats[d] = { m, s: std(vals, m) || 1 };
  }
  for (const p of qualified)
    p.style = STYLE_DIMS.map((d) => round((p.per90[d] - stats[d].m) / stats[d].s, 3));

  // ---- assemble ----
  const players = qualified.sort((a, b) => b.overall - a.overall);
  const leagueCounts = {};
  for (const p of players) leagueCounts[p.league] = (leagueCounts[p.league] || 0) + 1;

  const out = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: "Understat (big-5 leagues) + Fantasy Premier League enrichment",
      season: `${SEASON}/${(Number(SEASON) + 1) % 100}`,
      minutesThreshold: MIN_MINUTES,
      qualifiedCount: players.length,
      matchedFpl: matched,
      leagues: LEAGUES,
      leagueCounts,
      styleDims: STYLE_DIMS,
      radarAxes: ["Goals", "Assists", "Shot Threat", "Chance Creation", "Build-up", "Involvement"],
    },
    players,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(out), "utf8");
  const kb = Math.round((JSON.stringify(out).length / 1024) * 10) / 10;
  console.log(`✓ Wrote ${players.length} players → ${OUT_FILE} (${kb} KB)`);
  console.log("  League counts:", JSON.stringify(leagueCounts));
}

main().catch((err) => {
  console.error("✗ ETL failed:", err.message);
  process.exit(1);
});
