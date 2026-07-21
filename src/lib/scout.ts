import type { Player, RadarAxis } from "./types";
import { RADAR_AXES, radarRows, styleMatch, fmt } from "./metrics";

export interface ScoutReport {
  headline: string;
  paragraphs: string[];
  verdict: string;
  generatedBy: "rules" | "llm";
}

const AXIS_PHRASE: Record<RadarAxis, string> = {
  Goals: "goalscoring",
  Assists: "assists",
  "Shot Threat": "shot threat",
  "Chance Creation": "chance creation",
  "Build-up": "build-up play",
  Involvement: "attacking involvement",
};

// Index-aligned with the ETL style vector dims:
// [goals, assists, xG, xA, npxG, shots, keyPasses, xGChain, xGBuildup]
const STYLE_PHRASES = [
  "goalscoring",
  "creating for others",
  "getting into scoring positions",
  "creating high-quality chances",
  "open-play goal threat",
  "shot volume",
  "picking out team-mates",
  "involvement in attacking moves",
  "deep build-up play",
];

function tier(pct: number): string {
  if (pct >= 90) return "elite";
  if (pct >= 75) return "excellent";
  if (pct >= 60) return "strong";
  if (pct >= 40) return "solid";
  if (pct >= 25) return "modest";
  return "limited";
}

// Strengths from the z-scored style vector (ranked vs the whole big-5 pool), so
// identity reads honestly across positions and leagues.
function strengths(p: Player): string[] {
  const ranked = p.style
    .map((z, i) => ({ z, phrase: STYLE_PHRASES[i] }))
    .filter((d) => d.phrase && d.z > 0.35)
    .sort((a, b) => b.z - a.z);
  const out: string[] = [];
  for (const d of ranked) {
    if (!out.includes(d.phrase)) out.push(d.phrase);
    if (out.length === 2) break;
  }
  return out;
}

function finishingNote(p: Player): string | null {
  const diff = p.totals.goals - p.totals.xG;
  if (p.totals.xG < 2) return null;
  if (diff >= 3)
    return `${p.webName} is finishing above expectation (${p.totals.goals} goals from ${fmt(p.totals.xG, 1)} xG) — clinical, or riding a hot streak.`;
  if (diff <= -3)
    return `${p.webName} is underperforming their xG (${p.totals.goals} goals from ${fmt(p.totals.xG, 1)} xG), pointing to wasteful finishing or a run of bad luck.`;
  return null;
}

export function buildScoutReport(a: Player, b: Player): ScoutReport {
  const match = styleMatch(a, b);
  const rows = radarRows(a, b);
  const crossPos = a.position !== b.position;

  const aEdges = rows
    .map((r) => ({ axis: r.axis, gap: r.a - r.b }))
    .sort((x, y) => y.gap - x.gap);
  const topA = aEdges[0];
  const topB = [...aEdges].reverse()[0];

  const headline =
    match >= 80
      ? "Two players cut from remarkably similar cloth"
      : match >= 55
        ? "Overlapping profiles with distinct edges"
        : match >= 30
          ? "Different tools for different jobs"
          : "A study in contrasts";

  const paragraphs: string[] = [];

  const aStr = strengths(a);
  const bStr = strengths(b);
  const tag = (p: Player) =>
    `${p.positionName}, ${p.team}${p.age ? `, ${p.age}` : ""}`;
  paragraphs.push(
    `${a.name} (${tag(a)}) profiles as ${aStr.length ? `a player whose game is built on ${aStr.join(" and ")}` : "a squad contributor"}, rating ${tier(a.overall)} against ${a.leagueName} peers in his position. ${b.name} (${tag(b)}) leans on ${bStr.length ? bStr.join(" and ") : "steady, unspectacular output"}.`
  );

  const contrastBits: string[] = [];
  if (topA && topA.gap >= 10)
    contrastBits.push(
      `${a.webName} holds a clear advantage in ${AXIS_PHRASE[topA.axis]} (${Math.round(topA.gap)} percentile points clear)`
    );
  if (topB && topB.gap >= 10)
    contrastBits.push(`${b.webName} pulls ahead for ${AXIS_PHRASE[topB.axis]}`);
  if (contrastBits.length) {
    paragraphs.push(
      `${contrastBits.join(", while ")}. Their styles are a ${match}% match, meaning ${
        match >= 70
          ? "you are largely choosing between two versions of the same role"
          : match >= 40
            ? "there is real overlap, but each brings something the other doesn't"
            : "they solve different problems on the pitch and rarely substitute for one another"
      }.`
    );
  } else {
    paragraphs.push(
      `Judged against their positional peers both post similar percentile shapes, yet their output profiles are only a ${match}% match — they reach that level in different ways, with ${a.webName} leaning on ${AXIS_PHRASE[topA.axis]} and ${b.webName} on ${AXIS_PHRASE[topB.axis]}.`
    );
  }

  const notes = [finishingNote(a), finishingNote(b)].filter(Boolean) as string[];
  if (notes.length) paragraphs.push(notes.join(" "));

  let verdict: string;
  if (crossPos) {
    verdict = `Different roles — ${a.webName} is judged as a ${a.positionName.toLowerCase()} and ${b.webName} as a ${b.positionName.toLowerCase()}, so this is about fit rather than a single winner: ${a.webName} for ${AXIS_PHRASE[topA.axis]}, ${b.webName} for ${AXIS_PHRASE[topB.axis]}.`;
  } else if (Math.abs(a.overall - b.overall) <= 3) {
    verdict = `It's close: pick ${a.webName} if you want ${AXIS_PHRASE[topA.axis]}, ${b.webName} if ${AXIS_PHRASE[topB.axis]} is the priority.`;
  } else if (a.overall > b.overall) {
    verdict = `On balance ${a.webName} is the more rounded option here (${a.overall} vs ${b.overall} for their position), but ${b.webName} is the better call when ${AXIS_PHRASE[topB.axis]} is what you need.`;
  } else {
    verdict = `On balance ${b.webName} edges it (${b.overall} vs ${a.overall} for their position), though ${a.webName} is the pick if ${AXIS_PHRASE[topA.axis]} tops your list.`;
  }

  return { headline, paragraphs, verdict, generatedBy: "rules" };
}

// Cache reports by ordered player pair. In-memory per server instance — enough
// to make repeat views instant and, when the LLM path is on, to generate each
// pair's report only once. Swap for a KV/DB store to persist across deploys.
const scoutCache = new Map<string, ScoutReport>();

/**
 * Cached scout report. Uses Claude when ANTHROPIC_API_KEY is set, otherwise the
 * deterministic rule-based report — so the app is free and functional by default.
 */
export async function getScoutReport(a: Player, b: Player): Promise<ScoutReport> {
  const cacheKey = `${a.id}|${b.id}`;
  const cached = scoutCache.get(cacheKey);
  if (cached) return cached;
  const report = await generateScoutReport(a, b);
  scoutCache.set(cacheKey, report);
  return report;
}

async function generateScoutReport(a: Player, b: Player): Promise<ScoutReport> {
  const key = process.env.ANTHROPIC_API_KEY;
  const rules = buildScoutReport(a, b);
  if (!key) return rules;

  try {
    const facts = {
      styleMatchPct: styleMatch(a, b),
      players: [a, b].map((p) => ({
        name: p.name,
        position: p.positionName,
        team: p.team,
        league: p.leagueName,
        age: p.age,
        per90: p.per90,
        radarPercentiles: p.radar,
      })),
    };
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system:
          "You are a concise, insightful football scout. Given two players' percentiles and per-90 stats, write a punchy comparison. Return STRICT JSON: {headline, paragraphs:[string,string], verdict}. No markdown. Percentiles are within each player's position across the big-5 leagues; stats are attacking/creative (Understat).",
        messages: [{ role: "user", content: JSON.stringify(facts) }],
      }),
    });
    if (!res.ok) return rules;
    const json = await res.json();
    const text: string = json?.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text);
    if (parsed?.headline && Array.isArray(parsed?.paragraphs) && parsed?.verdict) {
      return { ...parsed, generatedBy: "llm" };
    }
    return rules;
  } catch {
    return rules;
  }
}
