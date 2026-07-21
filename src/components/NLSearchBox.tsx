"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SEARCH_EXAMPLES } from "@/lib/nlsearch";

export default function NLSearchBox({
  initial = "",
  autoFocus = false,
}: {
  initial?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  const go = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            ⌕
          </span>
          <input
            value={q}
            autoFocus={autoFocus}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Describe a player… e.g. creative La Liga midfielders"
            className="w-full rounded-xl border border-white/15 bg-ink-800/80 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/40"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-home to-away px-5 py-3 text-sm font-bold text-ink-950 transition hover:brightness-110"
        >
          Search
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SEARCH_EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setQ(ex);
              go(ex);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
