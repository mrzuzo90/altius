"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState, useCallback } from "react";
import { StatementTabs } from "@/components/statement-tabs";
import { FinancialOverviewChart } from "@/components/financial-overview-chart";
import type { StatementBundle } from "@/lib/sec/statements";
import type { Frequency, LineSeries } from "@/lib/sec/normalize";

export function FinancialsClient({
  bundle,
  ticker,
  frequency,
}: {
  bundle: StatementBundle;
  ticker: string;
  frequency: Frequency;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [customLines, setCustomLines] = useState<LineSeries[]>([]);

  const handleToggleLine = useCallback((line: LineSeries) => {
    setCustomLines((prev) => {
      const exists = prev.some((l) => l.line.id === line.line.id);
      if (exists) {
        return prev.filter((l) => l.line.id !== line.line.id);
      }
      return [...prev, line];
    });

    const chartEl = document.getElementById("financial-overview-chart");
    if (chartEl) {
      chartEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className={pendiente ? "pointer-events-none opacity-60 transition-opacity" : undefined}>
      <FinancialOverviewChart
        id="financial-overview-chart"
        bundle={bundle}
        ticker={ticker}
        frequency={frequency}
        customLines={customLines}
        onToggleLine={handleToggleLine}
      />
      <StatementTabs
        bundle={bundle}
        frequency={frequency}
        onSelectLine={handleToggleLine}
        selectedLineIds={customLines.map((l) => l.line.id)}
        onFrequencyChange={(f) =>
          startTransition(() => {
            router.push(`/ticker/${ticker}/financials?freq=${f}`, { scroll: false });
          })
        }
      />
    </div>
  );
}
