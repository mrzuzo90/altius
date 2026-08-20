"use client";

import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import type { QualityScorecardResult, QualityItemStatus } from "@/lib/sec/quality";

export function QualityScorecard({ scorecard }: { scorecard: QualityScorecardResult }) {
  return (
    <div className="bg-ash card-asymmetric p-8 space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-mist/80 pb-5">
        <div>
          <span className="text-brass font-display text-[12px] uppercase tracking-wider">
            Checklist Fundamental
          </span>
          <h2 className="font-display text-graphite text-[24px] leading-[1.15] tracking-[-0.48px] mt-1">
            Calidad del Negocio
          </h2>
          <p className="text-steel mt-1 text-[13px]">
            {scorecard.verdictDescription}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-display text-graphite text-[32px] tracking-[-0.03em]">
            {scorecard.score}
            <span className="text-slate text-[20px] font-normal">/{scorecard.maxScore}</span>
          </span>
          <span className="border-brass/40 bg-canvas-white text-brass font-display rounded-[20px] border px-3 py-1 text-[12px] tracking-[-0.02em]">
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
    <div className="bg-canvas-white border-mist/80 rounded-[14px] border p-5 flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate text-[11px] uppercase tracking-wider font-display">
            {item.category}
          </span>
          <StatusBadge status={item.status} />
        </div>
        <h3 className="font-display text-graphite font-medium text-[15px] mt-1.5">
          {item.name}
        </h3>
      </div>

      <div className="border-mist/60 border-t pt-2.5 flex items-baseline justify-between text-[13px]">
        <span className="font-display text-graphite font-semibold text-[15px]">
          {item.valueFormatted}
        </span>
        <span className="text-slate text-[11px]">Obj: {item.threshold}</span>
      </div>

      <p className="text-steel text-[12px] leading-relaxed">
        {item.description}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: QualityItemStatus }) {
  if (status === "pass") {
    return (
      <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 text-[11px] font-display">
        <CheckCircle2 className="size-3.5" />
        <span>Pasa</span>
      </span>
    );
  }
  if (status === "warn") {
    return (
      <span className="text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 text-[11px] font-display">
        <AlertCircle className="size-3.5" />
        <span>Revisar</span>
      </span>
    );
  }
  return (
    <span className="text-red-700 dark:text-red-400 inline-flex items-center gap-1 text-[11px] font-display">
      <XCircle className="size-3.5" />
      <span>No cumple</span>
    </span>
  );
}
