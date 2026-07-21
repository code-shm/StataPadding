"use client";

import { useMemo, useRef, useState } from "react";
import type { PlayerLite } from "@/lib/types";
import { POSITION_COLORS } from "@/lib/metrics";
import PlayerPhoto from "./PlayerPhoto";
import LeagueBadge from "./LeagueBadge";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export default function PlayerPicker({
  index,
  value,
  onSelect,
  accent = "#22d3ee",
  label,
  placeholder = "Search a player…",
}: {
  index: PlayerLite[];
  value: PlayerLite | null;
  onSelect: (p: PlayerLite | null) => void;
  accent?: string;
  label: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return index.slice(0, 40);
    return index
      .filter((p) => norm(`${p.name} ${p.team} ${p.webName}`).includes(q))
      .slice(0, 40);
  }, [query, index]);

  const choose = (p: PlayerLite) => {
    onSelect(p);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <div
        className="mb-1.5 text-xs font-bold uppercase tracking-widest"
        style={{ color: accent }}
      >
        {label}
      </div>

      {value ? (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition hover:bg-white/5"
          style={{ borderColor: `${accent}66`, backgroundColor: `${accent}12` }}
        >
          <PlayerPhoto
            src={value.photo}
            alt={value.name}
            accent={accent}
            className="h-12 w-12 shrink-0 rounded-lg object-cover object-top"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-white">
              {value.name}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <LeagueBadge league={value.league} />
              {value.position} · {value.team}
            </div>
          </div>
          <span className="chip">change</span>
        </button>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown")
                setActive((a) => Math.min(a + 1, results.length - 1));
              else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
              else if (e.key === "Enter" && results[active])
                choose(results[active]);
            }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/15 bg-ink-800/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/40"
          />
          {open && results.length > 0 && (
            <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-white/15 bg-ink-800 p-1 shadow-card">
              {results.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(p)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left ${
                    i === active ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <PlayerPhoto
                    src={p.photo}
                    alt={p.name}
                    accent={POSITION_COLORS[p.position]}
                    className="h-8 w-8 shrink-0 rounded-md object-cover object-top"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{p.name}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <LeagueBadge league={p.league} />
                      <span className="truncate">
                        {p.position} · {p.team}
                      </span>
                    </div>
                  </div>
                  <span className="stat-num text-xs text-slate-500">
                    {p.overall}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
