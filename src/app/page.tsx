import Link from "next/link";
import {
  searchIndex,
  featuredMatchups,
  topByPosition,
  meta,
} from "@/lib/data";
import type { Player, Position } from "@/lib/types";
import { POSITION_COLORS } from "@/lib/metrics";
import CompareLauncher from "@/components/CompareLauncher";
import NLSearchBox from "@/components/NLSearchBox";
import PlayerPhoto from "@/components/PlayerPhoto";
import LeagueBadge from "@/components/LeagueBadge";

const POS_TITLES: Record<Position, string> = {
  FWD: "Forwards",
  MID: "Midfielders",
  DEF: "Defenders",
};

function TopColumn({ pos }: { pos: Position }) {
  const list = topByPosition(pos, 5);
  return (
    <div className="glass p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: POSITION_COLORS[pos] }}
        />
        <h3 className="font-semibold text-white">{POS_TITLES[pos]}</h3>
      </div>
      <div className="space-y-1.5">
        {list.map((p, i) => (
          <Link
            key={p.id}
            href={`/player/${p.slug}`}
            className="group flex items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-white/5"
          >
            <span className="stat-num w-4 text-center text-xs font-bold text-slate-600">
              {i + 1}
            </span>
            <PlayerPhoto
              src={p.photo}
              alt={p.name}
              accent={POSITION_COLORS[pos]}
              className="h-9 w-9 shrink-0 rounded-md object-cover object-top"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {p.webName}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <LeagueBadge league={p.league} />
                <span className="truncate">{p.team}</span>
              </div>
            </div>
            <span className="stat-num text-base font-black text-white">
              {p.overall}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({ a, b }: { a: Player; b: Player }) {
  return (
    <Link
      href={`/compare/${a.slug}/${b.slug}`}
      className="group glass flex items-center justify-between p-4 transition hover:border-white/25"
    >
      <div className="flex min-w-0 items-center gap-3">
        <PlayerPhoto
          src={a.photo}
          alt={a.name}
          accent="#22d3ee"
          ringColor="#22d3ee66"
          className="h-14 w-14 shrink-0 rounded-xl object-cover object-top"
        />
        <div className="min-w-0">
          <div className="truncate font-semibold text-white">{a.webName}</div>
          <LeagueBadge league={a.league} />
        </div>
      </div>
      <span className="display px-2 text-sm text-slate-500 transition group-hover:text-white">
        VS
      </span>
      <div className="flex min-w-0 items-center justify-end gap-3 text-right">
        <div className="min-w-0">
          <div className="truncate font-semibold text-white">{b.webName}</div>
          <LeagueBadge league={b.league} />
        </div>
        <PlayerPhoto
          src={b.photo}
          alt={b.name}
          accent="#f0559b"
          ringColor="#f0559b66"
          className="h-14 w-14 shrink-0 rounded-xl object-cover object-top"
        />
      </div>
    </Link>
  );
}

export default function Home() {
  const index = searchIndex();
  const featured = featuredMatchups();

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="pt-6 text-center">
        <div className="reveal mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-home" />
          {meta.season} · {meta.leagues.length} leagues ·{" "}
          {meta.qualifiedCount} players
        </div>
        <h1 className="reveal display mx-auto max-w-3xl text-4xl leading-tight text-white sm:text-6xl">
          Settle the debate.
          <br />
          <span className="bg-gradient-to-r from-home via-white to-away bg-clip-text text-transparent">
            Compare players across Europe.
          </span>
        </h1>
        <p
          className="reveal mx-auto mt-4 max-w-xl text-balance text-slate-400"
          style={{ animationDelay: "80ms" }}
        >
          Radar profiles, per-90 stats, style-match scores and an AI scout
          verdict — across the Premier League, La Liga, Bundesliga, Serie A and
          Ligue 1. Free data, no paywalls.
        </p>
      </section>

      {/* Compare launcher */}
      <section
        className="reveal mx-auto max-w-3xl"
        style={{ animationDelay: "140ms" }}
      >
        <CompareLauncher index={index} />
      </section>

      {/* Natural-language search */}
      <section
        className="reveal mx-auto -mt-6 max-w-3xl"
        style={{ animationDelay: "180ms" }}
      >
        <div className="glass p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-home to-away text-xs font-black text-ink-950">
              AI
            </span>
            <h2 className="font-semibold text-white">
              Or describe who you&apos;re looking for
            </h2>
          </div>
          <NLSearchBox />
        </div>
      </section>

      {/* Featured matchups */}
      {featured.length > 0 && (
        <section>
          <h2 className="display mb-4 text-xl text-white">
            Featured cross-league matchups
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {featured.map(([a, b]) => (
              <FeaturedCard key={`${a.id}-${b.id}`} a={a} b={b} />
            ))}
          </div>
        </section>
      )}

      {/* Top by position */}
      <section id="top">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="display text-xl text-white">Top rated by position</h2>
          <Link
            href="/players"
            className="text-sm font-medium text-home hover:underline"
          >
            Browse all {meta.qualifiedCount} players →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <TopColumn pos="FWD" />
          <TopColumn pos="MID" />
          <TopColumn pos="DEF" />
        </div>
        <p className="mt-3 text-center text-[11px] text-slate-500">
          Overall is a role rating — percentile output vs peers in the same
          position across the big-5 leagues.
        </p>
      </section>
    </div>
  );
}
