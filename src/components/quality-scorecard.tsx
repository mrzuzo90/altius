"use client";

import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import type { QualityScorecardResult, QualityItemStatus } from "@/lib/sec/quality";

export function QualityScorecard({ scorecard }: { scorecard: QualityScorecardResult }) {
  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-8 space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-gunmetal pb-5">
        <div>
          <span className="text-periwinkle-glow font-display text-[12px] uppercase tracking-wider font-semibold">
            Checklist Fundamental
          </span>
          <h2 className="font-display text-pure-white text-[24px] leading-[1.15] tracking-tight mt-1 font-medium">
            Calidad del Negocio
          </h2>
          <p className="text-frost mt-1 text-[13px]">
            {scorecard.verdictDescription}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-display text-pure-white text-[32px] font-medium tracking-tight">
            {scorecard.score}
            <span className="text-muted-steel text-[20px] font-normal">/{scorecard.maxScore}</span>
          </span>
          <span className="border-gunmetal bg-void-black text-periwinkle-glow font-display rounded-full border px-3.5 py-1 text-[12px] font-medium tracking-tight">
            {scorecard.verdict}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scorecard.items.map((item) => (
          <CheckCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function CheckCard({
  item,
}: {
  item: QualityScorecardResult["items"][number];
}) {
  return (
    <div className="bg-void-black border-gunmetal rounded-xl border p-5 flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-steel text-[11px] uppercase tracking-wider font-mono">
            {item.category}
          </span>
          <StatusBadge status={item.status} />
        </div>
        <h3 className="font-display text-pure-white font-medium text-[15px] mt-1.5 tracking-tight">
          {item.name}
        </h3>
      </div>

      <div className="border-gunmetal border-t pt-2.5 flex items-baseline justify-between text-[13px]">
        <span className="font-display text-pure-white font-semibold text-[15px] tabular">
          {item.valueFormatted}
        </span>
        <span className="text-muted-steel text-[11px]">Obj: {item.threshold}</span>
      </div>

      <p className="text-frost text-[12px] leading-relaxed">
        {item.description}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: QualityItemStatus }) {
  if (status === "pass") {
    return (
      <span className="text-emerald-400 inline-flex items-center gap-1 text-[11px] font-medium font-mono">
        <CheckCircle2 className="size-3.5" />
        <span>PASA</span>
      </span>
    );
  }
  if (status === "warn") {
    return (
      <span className="text-amber-400 inline-flex items-center gap-1 text-[11px] font-medium font-mono">
        <AlertCircle className="size-3.5" />
        <span>REVISAR</span>
      </span>
    );
  }
  return (
    <span className="text-rose-400 inline-flex items-center gap-1 text-[11px] font-medium font-mono">
      <XCircle className="size-3.5" />
      <span>NO CUMPLE</span>
    </span>
  );
}
