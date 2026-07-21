"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayerLite } from "@/lib/types";
import PlayerPicker from "./PlayerPicker";

export default function CompareLauncher({
  index,
}: {
  index: PlayerLite[];
}) {
  const router = useRouter();
  const [a, setA] = useState<PlayerLite | null>(null);
  const [b, setB] = useState<PlayerLite | null>(null);
  const ready = a && b && a.id !== b.id;

  const go = () => {
    if (ready) router.push(`/compare/${a!.slug}/${b!.slug}`);
  };

  const randomPair = () => {
    if (index.length < 2) return;
    const i = Math.floor(Math.random() * index.length);
    let j = Math.floor(Math.random() * index.length);
    while (j === i) j = Math.floor(Math.random() * index.length);
    router.push(`/compare/${index[i].slug}/${index[j].slug}`);
  };

  return (
    <div className="glass p-5 sm:p-6" id="compare">
      <div className="grid items-start gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <PlayerPicker
          index={index}
          value={a}
          onSelect={setA}
          accent="#22d3ee"
          label="Player A"
        />
        <div className="hidden select-none pt-8 text-center sm:block">
          <span className="display bg-gradient-to-br from-home to-away bg-clip-text text-2xl text-transparent">
            VS
          </span>
        </div>
        <PlayerPicker
          index={index}
          value={b}
          onSelect={setB}
          accent="#f0559b"
          label="Player B"
        />
      </div>

      <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={go}
          disabled={!ready}
          className="w-full rounded-xl bg-gradient-to-r from-home to-away px-6 py-3 text-sm font-bold text-ink-950 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          Compare players →
        </button>
        <button
          onClick={randomPair}
          className="text-sm font-medium text-slate-400 underline-offset-4 hover:text-white hover:underline"
        >
          Surprise me
        </button>
      </div>
    </div>
  );
}
