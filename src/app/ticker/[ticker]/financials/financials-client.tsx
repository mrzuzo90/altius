"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useCallback, useMemo, Suspense } from "react";
import { StatementTabs } from "@/components/statement-tabs";
import { FinancialOverviewChart } from "@/components/financial-overview-chart";
import { StatementSeriesDialog } from "@/components/statement-series-dialog";
import type { StatementBundle } from "@/lib/sec/statements";
import type { Frequency, LineSeries, Period } from "@/lib/sec/normalize";
import type { Scale } from "@/lib/format";

function findRowInBundle(bundle: StatementBundle, query: string): { row: LineSeries; periods: Period[] } | null {
  const clean = query.trim().toLowerCase().replace(/[-_\s]/g, "");
  for (const block of bundle.blocks) {
    const found = block.rows.find((r) => {
      const idClean = r.line.id.toLowerCase().replace(/[-_\s]/g, "");
      const labelClean = r.line.label.toLowerCase().replace(/[-_\s]/g, "");
      return idClean === clean || labelClean === clean;
    });
    if (found) return { row: found, periods: block.periods };
  }
  if (clean === "fcf" || clean === "freecashflow") {
    for (const block of bundle.blocks) {
      const found = block.rows.find((r) => r.line.id === "freeCashFlow");
      if (found) return { row: found, periods: block.periods };
    }
  }
  if (clean === "revenue" || clean === "ingresos") {
    for (const block of bundle.blocks) {
      const found = block.rows.find((r) => r.line.id === "revenue");
      if (found) return { row: found, periods: block.periods };
    }
  }
  if (clean === "fcfmargin" || clean === "margenfcf") {
    for (const block of bundle.blocks) {
      const found = block.rows.find((r) => r.line.id === "fcfMargin");
      if (found) return { row: found, periods: block.periods };
    }
  }
  return null;
}

export function FinancialsClient({
  bundle,
  ticker,
  frequency,
}: {
  bundle: StatementBundle;
  ticker: string;
  frequency: Frequency;
}) {
  return (
    <Suspense fallback={null}>
      <FinancialsClientInner bundle={bundle} ticker={ticker} frequency={frequency} />
    </Suspense>
  );
}

function FinancialsClientInner({
  bundle,
  ticker,
  frequency,
}: {
  bundle: StatementBundle;
  ticker: string;
  frequency: Frequency;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seriesParam = searchParams ? (searchParams.get("series") || searchParams.get("dialog")) : null;

  const [pendiente, startTransition] = useTransition();
  const [closedParam, setClosedParam] = useState<string | null>(null);
  const [customLines, setCustomLines] = useState<LineSeries[]>([]);
  const [scale, setScale] = useState<Scale>("millions");
  const [dialogItem, setDialogItem] = useState<{ row: LineSeries; periods: Period[] } | null>(null);

  const activeDialogItem = useMemo(() => {
    if (seriesParam && seriesParam !== closedParam) {
      return findRowInBundle(bundle, seriesParam);
    }
    return dialogItem;
  }, [bundle, seriesParam, closedParam, dialogItem]);

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
        scale={scale}
        onScaleChange={setScale}
      />
      <StatementTabs
        bundle={bundle}
        frequency={frequency}
        scale={scale}
        onScaleChange={setScale}
        onSelectLine={handleToggleLine}
        selectedLineIds={customLines.map((l) => l.line.id)}
        onFrequencyChange={(f) =>
          startTransition(() => {
            router.push(`/ticker/${ticker}/financials?freq=${f}`, { scroll: false });
          })
        }
      />
      <StatementSeriesDialog
        row={activeDialogItem?.row ?? null}
        periods={activeDialogItem?.periods ?? []}
        scale={scale}
        currency={bundle.currency ?? "USD"}
        open={activeDialogItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogItem(null);
            if (seriesParam) {
              setClosedParam(seriesParam);
            }
          }
        }}
      />
    </div>
  );
}

