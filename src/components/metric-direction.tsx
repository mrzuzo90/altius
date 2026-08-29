import { ArrowDownRight, ArrowUpRight, CircleDotDashed } from "lucide-react";
import type { MetricSemantics } from "@/lib/financials/metric-semantics";
import { cn } from "@/lib/utils";

export function MetricDirectionBadge({
  semantics,
  compact = false,
}: {
  semantics: MetricSemantics;
  compact?: boolean;
}) {
  const Icon = semantics.direction === "higher"
    ? ArrowUpRight
    : semantics.direction === "lower"
      ? ArrowDownRight
      : CircleDotDashed;

  return (
    <span
      className={cn(
        "font-display inline-flex w-fit items-center rounded-full border font-medium",
        compact ? "gap-1 px-2 py-1 text-[10px]" : "gap-1.5 px-3 py-1.5 text-[12px]",
        semantics.direction === "higher" && "border-emerald-400/25 bg-emerald-400/8 text-emerald-300",
        semantics.direction === "lower" && "border-sky-400/25 bg-sky-400/8 text-sky-300",
        semantics.direction === "contextual" && "border-gunmetal bg-gunmetal/35 text-muted-steel",
      )}
    >
      <Icon aria-hidden="true" className={compact ? "size-3" : "size-3.5"} />
      {semantics.label}
    </span>
  );
}

export function MetricDirectionNotice({ semantics }: { semantics: MetricSemantics }) {
  return (
    <div className="border-gunmetal bg-gunmetal/20 mx-3 mt-5 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:mx-6 sm:flex-row sm:items-center">
      <MetricDirectionBadge semantics={semantics} />
      <p className="text-muted-steel text-[12px] leading-relaxed sm:text-[13px]">
        {semantics.explanation}
      </p>
    </div>
  );
}
