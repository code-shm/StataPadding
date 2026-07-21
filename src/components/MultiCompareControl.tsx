"use client";

import { useRouter } from "next/navigation";
import type { PlayerLite } from "@/lib/types";
import { PLAYER_COLORS } from "@/lib/metrics";
import PlayerPicker from "./PlayerPicker";
import PlayerPhoto from "./PlayerPhoto";

const MAX = 4;

export default function MultiCompareControl({
  index,
  current,
  compact = false,
}: {
  index: PlayerLite[];
  current: PlayerLite[];
  compact?: boolean;
}) {
  const router = useRouter();

  const hrefFor = (players: PlayerLite[]) => {
    const slugs = players.map((p) => p.slug);
    if (slugs.length < 2) return "/";
    if (slugs.length === 2) return `/compare/${slugs[0]}/${slugs[1]}`;
    return `/compare/multi/${slugs.join("/")}`;
  };

  const remove = (id: string) => router.push(hrefFor(current.filter((p) => p.id !== id)));
  const add = (p: PlayerLite | null) => {
    if (p && current.length < MAX && !current.some((c) => c.id === p.id))
      router.push(hrefFor([...current, p]));
  };

  const available = index.filter((p) => !current.some((c) => c.id === p.id));
  const canAdd = current.length < MAX;

  return (
    <div className="glass p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {!compact && (
          <div className="flex flex-1 flex-wrap gap-2">
            {current.map((p, i) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-2 rounded-lg border py-1 pl-1 pr-2 text-sm"
                style={{ borderColor: `${PLAYER_COLORS[i]}66`, backgroundColor: `${PLAYER_COLORS[i]}12` }}
              >
                <PlayerPhoto
                  src={p.photo}
                  alt={p.name}
                  className="h-6 w-6 rounded object-cover object-top"
                />
                <span className="font-medium text-white">{p.webName}</span>
                {current.length > 2 && (
                  <button
                    onClick={() => remove(p.id)}
                    className="ml-1 text-slate-400 hover:text-white"
                    aria-label={`Remove ${p.webName}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {canAdd ? (
          <div className={compact ? "w-full" : "w-full sm:w-64"}>
            <PlayerPicker
              index={available}
              value={null}
              onSelect={add}
              accent={PLAYER_COLORS[current.length] ?? "#94a3b8"}
              label={compact ? "Add a third player" : `Add player (${current.length}/${MAX})`}
              placeholder="Search to add…"
            />
          </div>
        ) : (
          <span className="text-xs text-slate-500">Maximum of {MAX} players.</span>
        )}
      </div>
    </div>
  );
}
