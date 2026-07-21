import type { ScoutReport } from "@/lib/scout";

export default function ScoutReportView({ report }: { report: ScoutReport }) {
  return (
    <div className="glass relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-home/20 to-away/20 blur-2xl" />
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-home to-away text-xs font-black text-ink-950">
          AI
        </span>
        <h2 className="display text-lg text-white">Scout&apos;s verdict</h2>
        <span className="chip ml-auto">
          {report.generatedBy === "llm" ? "Claude Haiku" : "PitchRank engine"}
        </span>
      </div>

      <p className="mb-3 text-base font-semibold text-white">
        {report.headline}
      </p>

      <div className="space-y-3 text-sm leading-relaxed text-slate-300">
        {report.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
        <span className="mr-2 font-bold uppercase tracking-wide text-gold">
          Verdict
        </span>
        <span className="text-slate-200">{report.verdict}</span>
      </div>
    </div>
  );
}
