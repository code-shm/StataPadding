"use client";

import { useState } from "react";

export default function ShareCard({
  aSlug,
  bSlug,
  aName,
  bName,
}: {
  aSlug: string;
  bSlug: string;
  aName: string;
  bName: string;
}) {
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  const [copied, setCopied] = useState(false);

  const cardUrl = `/api/card/${aSlug}/${bSlug}`;
  const fileName = `${aName}-vs-${bName}`.replace(/[^a-z0-9]+/gi, "-");

  async function download() {
    setState("working");
    try {
      const res = await fetch(cardUrl);
      const svgText = await res.text();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const png: Blob = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const scale = 2; // retina-crisp export
          const canvas = document.createElement("canvas");
          canvas.width = 1200 * scale;
          canvas.height = 630 * scale;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("no ctx"));
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, 1200, 630);
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
        };
        img.onerror = () => reject(new Error("img load failed"));
        img.src = url;
      });

      URL.revokeObjectURL(url);
      const dl = URL.createObjectURL(png);
      const link = document.createElement("a");
      link.href = dl;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(dl);
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // Fallback: just open the SVG card in a new tab.
      window.open(cardUrl, "_blank");
      setState("idle");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyLink}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
      >
        {copied ? "✓ Link copied" : "Copy link"}
      </button>
      <button
        onClick={download}
        disabled={state === "working"}
        className="rounded-lg bg-gradient-to-r from-home to-away px-3 py-1.5 text-xs font-bold text-ink-950 transition hover:brightness-110 disabled:opacity-60"
      >
        {state === "working" ? "Generating…" : state === "done" ? "✓ Downloaded" : "↓ Share card"}
      </button>
    </div>
  );
}
