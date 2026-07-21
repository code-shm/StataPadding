# PitchRank

A football player comparator. Pick any two players from Europe's big-five
leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1) and get a
head-to-head screen: radar profiles, per-90 stats, a style-match score, an AI
scout verdict, similar-player discovery, plain-English search, and a shareable
comparison card. Built entirely on free data.

## How it works

**Data.** A single ETL script (`scripts/etl.mjs`) pulls two free sources:
- **Understat** — attacking/creative stats (goals, xG, npxG, shots, xA, key
  passes, xG chain, xG build-up) for every big-5 player. One request per league.
- **Fantasy Premier League** — enriches Premier League players with photos, age,
  price and defensive actions, matched to Understat by name (entity resolution).

It computes everything up front and writes one file, `src/data/players.json`.
The app only ever reads that file, so **no external API is called at request
time** — re-run the ETL to refresh the data.

**Metrics.**
- Every stat is normalised **per 90 minutes** (players with ≥900 minutes).
- Each per-90 rate is turned into a **percentile within the player's position**,
  pooled across all big-5 leagues → the six radar axes.
- A **z-scored style vector** per player drives **cosine similarity**, which
  powers the style-match % and the "similar players" lists.

**Features.**
- **Compare** (`/compare/[a]/[b]`) — radar, mirrored head-to-head bars, per-90
  table, and a scout verdict written from the computed numbers.
- **Scout** — deterministic and free by default; if `ANTHROPIC_API_KEY` is set
  it upgrades to a Claude-written report (cached per pair).
- **Search** (`/search`) — plain-English queries ("creative La Liga midfielders",
  "players like Pedri") parsed into league/position/style filters + similarity.
- **Share card** — `/api/card/[a]/[b]` renders an SVG card that the compare page
  exports to PNG.

**Stack.** Next.js 14 (App Router) · TypeScript · Tailwind · a hand-rolled SVG
radar · Node ETL using the built-in `fetch` (no runtime dependencies).

```
scripts/etl.mjs           data pipeline
src/data/players.json     generated dataset (run npm run etl to refresh)
src/lib/                  data, metrics, similarity, scout, search
src/components/           radar, bars, stat table, pickers, cards
src/app/                  home, compare, player, players, search routes
```

## How to run

```bash
npm install
npm run etl      # fetch data → src/data/players.json
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

Optional: put `ANTHROPIC_API_KEY=...` in `.env.local` to enable Claude-written
scout reports. Refresh the dataset any time with `npm run etl`.
