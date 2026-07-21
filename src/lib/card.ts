import type { Player } from "./types";
import { LEAGUE_META, styleMatch, fmt } from "./metrics";

const A = "#22d3ee";
const B = "#f0559b";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function initials(name: string): string {
  const t = name.trim().split(/\s+/).filter(Boolean);
  if (!t.length) return "?";
  return ((t[0][0] ?? "") + (t.length > 1 ? t[t.length - 1][0] ?? "" : "")).toUpperCase();
}
function hue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

async function dataUri(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await r.arrayBuffer());
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function avatar(p: Player, uri: string | null, cx: number, cy: number, r: number, id: string) {
  if (uri) {
    return `
      <clipPath id="clip${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
      <image href="${uri}" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}"
             clip-path="url(#clip${id})" preserveAspectRatio="xMidYMin slice"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${id === "a" ? A : B}" stroke-width="4"/>`;
  }
  const h = hue(p.name);
  return `
    <defs><linearGradient id="grad${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${h} 55% 42%)"/>
      <stop offset="100%" stop-color="hsl(${(h + 40) % 360} 60% 24%)"/>
    </linearGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#grad${id})" stroke="${id === "a" ? A : B}" stroke-width="4"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
          font-size="${r}" font-weight="800" fill="rgba(255,255,255,0.92)">${esc(initials(p.name))}</text>`;
}

function statRow(label: string, av: number, bv: number, dp: number, y: number) {
  const max = Math.max(av, bv, 0.0001);
  const aw = (av / max) * 150;
  const bw = (bv / max) * 150;
  const aWins = av > bv;
  return `
    <text x="455" y="${y + 6}" text-anchor="end" font-size="26" font-weight="800" fill="${aWins ? A : "#cbd5e1"}">${fmt(av, dp)}</text>
    <rect x="470" y="${y - 8}" width="150" height="10" rx="5" fill="rgba(255,255,255,0.06)"/>
    <rect x="${620 - aw}" y="${y - 8}" width="${aw}" height="10" rx="5" fill="${A}" opacity="${aWins ? 1 : 0.55}"/>
    <text x="600" y="${y - 20}" text-anchor="middle" font-size="17" font-weight="700" fill="#94a3b8" letter-spacing="1">${esc(label)}</text>
    <rect x="580" y="${y - 8}" width="150" height="10" rx="5" fill="rgba(255,255,255,0.06)"/>
    <rect x="580" y="${y - 8}" width="${bw}" height="10" rx="5" fill="${B}" opacity="${!aWins ? 1 : 0.55}"/>
    <text x="745" y="${y + 6}" text-anchor="start" font-size="26" font-weight="800" fill="${!aWins ? B : "#cbd5e1"}">${fmt(bv, dp)}</text>`;
}

function block(p: Player, uri: string | null, cx: number, side: "a" | "b") {
  const color = side === "a" ? A : B;
  const lm = LEAGUE_META[p.league];
  return `
    ${avatar(p, uri, cx, 175, 74, side)}
    <text x="${cx}" y="290" text-anchor="middle" font-size="40" font-weight="800" fill="#ffffff">${esc(p.webName)}</text>
    <text x="${cx}" y="322" text-anchor="middle" font-size="21" fill="#94a3b8">${esc(p.positionName)} · ${esc(p.team)}</text>
    <text x="${cx}" y="352" text-anchor="middle" font-size="18" font-weight="700" fill="${lm.color}" letter-spacing="1">${esc(lm.name.toUpperCase())}</text>
    <text x="${cx}" y="418" text-anchor="middle" font-size="60" font-weight="800" fill="${color}">${p.overall}</text>
    <text x="${cx}" y="442" text-anchor="middle" font-size="15" fill="#64748b" letter-spacing="2">ROLE RATING</text>`;
}

export async function buildCardSVG(a: Player, b: Player): Promise<string> {
  const [ua, ub] = await Promise.all([dataUri(a.photo), dataUri(b.photo)]);
  const match = styleMatch(a, b);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="'Segoe UI', system-ui, -apple-system, sans-serif">
  <defs>
    <radialGradient id="bg" cx="50%" cy="0%" r="90%">
      <stop offset="0%" stop-color="#141a30"/><stop offset="60%" stop-color="#0a0c16"/><stop offset="100%" stop-color="#070810"/>
    </radialGradient>
    <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${A}"/><stop offset="100%" stop-color="${B}"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="1" y="1" width="1198" height="628" rx="24" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>

  <!-- header -->
  <rect x="56" y="46" width="34" height="34" rx="8" fill="url(#mg)"/>
  <text x="80" y="71" text-anchor="middle" font-size="19" font-weight="800" fill="#070810">PR</text>
  <text x="104" y="72" font-size="26" font-weight="800" fill="#ffffff">Pitch<tspan fill="${A}">Rank</tspan></text>
  <text x="1144" y="72" text-anchor="end" font-size="18" font-weight="700" fill="#64748b" letter-spacing="1">2025/26 · BIG-5</text>

  ${block(a, ua, 300, "a")}
  ${block(b, ub, 900, "b")}

  <!-- centre: style match -->
  <text x="600" y="150" text-anchor="middle" font-size="22" font-weight="800" fill="#475569" letter-spacing="2">VS</text>
  <circle cx="600" cy="235" r="58" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="9"/>
  <circle cx="600" cy="235" r="58" fill="none" stroke="url(#mg)" stroke-width="9" stroke-linecap="round"
          stroke-dasharray="${(match / 100) * 364.4} 364.4" transform="rotate(-90 600 235)"/>
  <text x="600" y="248" text-anchor="middle" font-size="42" font-weight="800" fill="#ffffff">${match}%</text>
  <text x="600" y="330" text-anchor="middle" font-size="15" fill="#64748b" letter-spacing="2">STYLE MATCH</text>

  <!-- stat rows -->
  <line x1="60" y1="480" x2="1140" y2="480" stroke="rgba(255,255,255,0.08)"/>
  ${statRow("GOALS / 90", a.per90.goals, b.per90.goals, 2, 522)}
  ${statRow("EXPECTED GOALS / 90", a.per90.xG, b.per90.xG, 2, 562)}
  ${statRow("EXPECTED ASSISTS / 90", a.per90.xA, b.per90.xA, 2, 602)}
</svg>`;
}
