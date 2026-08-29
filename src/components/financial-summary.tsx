"use client";

import { useState } from "react";
import { Activity, ArrowRight, CircleDollarSign, Landmark, ShieldCheck } from "lucide-react";
import { MetricDirectionBadge } from "@/components/metric-direction";
import { Sparkline } from "@/components/sparkline";
import { StatementSeriesDialog, buildStatementChartData } from "@/components/statement-series-dialog";
import { changeIsFavorable, getMetricSemantics } from "@/lib/financials/metric-semantics";
import { formatPct, formatValue, pctChange, type Scale } from "@/lib/format";
import type { LineSeries, Period } from "@/lib/sec/normalize";
import type { StatementBundle, StatementBlock } from "@/lib/sec/statements";
import type { StatementId } from "@/lib/sec/taxonomy";
import { cn } from "@/lib/utils";

type SummaryGroupId = "performance" | "balance" | "cash";

type SummarySpec = {
  id: string;
  blockId: StatementId;
  lineId: string;
  group: SummaryGroupId;
};

const SUMMARY_SPECS: SummarySpec[] = [
  { id: "revenue", blockId: "income", lineId: "revenue", group: "performance" },
  { id: "operatingIncome", blockId: "income", lineId: "operatingIncome", group: "performance" },
  { id: "netIncome", blockId: "income", lineId: "netIncome", group: "performance" },
  { id: "cash", blockId: "balance", lineId: "cash", group: "balance" },
  { id: "longTermDebt", blockId: "balance", lineId: "longTermDebt", group: "balance" },
  { id: "equity", blockId: "balance", lineId: "equity", group: "balance" },
  { id: "operatingCashFlow", blockId: "cashflow", lineId: "operatingCashFlow", group: "cash" },
  { id: "freeCashFlow", blockId: "cashflow", lineId: "freeCashFlow", group: "cash" },
  { id: "roic", blockId: "ratios", lineId: "roic", group: "cash" },
];

const GROUPS: Array<{
  id: SummaryGroupId;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Activity;
}> = [
  {
    id: "performance",
    eyebrow: "01 · Resultados",
    title: "¿Crece y gana dinero?",
    description: "Ventas, beneficio operativo y resultado final.",
    icon: Activity,
  },
  {
    id: "balance",
    eyebrow: "02 · Balance",
    title: "¿Es financieramente resistente?",
    description: "Liquidez, deuda y colchón patrimonial.",
    icon: ShieldCheck,
  },
  {
    id: "cash",
    eyebrow: "03 · Caja y calidad",
    title: "¿Convierte el negocio en caja?",
    description: "Caja operativa, caja libre y retorno del capital.",
    icon: CircleDollarSign,
  },
];

export type FinancialSummaryItem = {
  id: string;
  group: SummaryGroupId;
  row: LineSeries;
  periods: Period[];
};

export function buildFinancialSummaryItems(bundle: StatementBundle): FinancialSummaryItem[] {
  return SUMMARY_SPECS.flatMap((spec) => {
    const block = bundle.blocks.find((candidate) => candidate.id === spec.blockId);
    const row = block?.rows.find((candidate) => candidate.line.id === spec.lineId);
    return block && row ? [{ id: spec.id, group: spec.group, row, periods: block.periods }] : [];
  });
}

export function FinancialSummary({
  bundle,
  scale,
}: {
  bundle: StatementBundle;
  scale: Scale;
}) {
  const items = buildFinancialSummaryItems(bundle);
  const [selected, setSelected] = useState<FinancialSummaryItem | null>(null);

  return (
    <>
      <section className="space-y-5" aria-labelledby="financial-summary-title">
        <div className="border-gunmetal from-carbon-surface to-gunmetal/20 relative overflow-hidden rounded-2xl border bg-linear-to-br p-5 sm:p-6">
          <div className="pointer-events-none absolute -top-16 -right-16 size-52 rounded-full bg-periwinkle-glow/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-periwinkle-glow font-mono text-[10px] font-medium uppercase tracking-[0.2em]">
                Lectura esencial
              </p>
              <h3 id="financial-summary-title" className="font-display text-pure-white mt-2 text-[24px] tracking-tight sm:text-[28px]">
                La empresa, de un vistazo
              </h3>
              <p className="text-muted-steel mt-2 max-w-2xl text-[13px] leading-relaxed">
                Nueve cifras para entender crecimiento, fortaleza financiera y generación de caja. Pulsa cualquiera para ver todo su histórico con Alti.
              </p>
            </div>
            <div className="border-gunmetal bg-carbon-surface/75 flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-[11px] text-muted-steel">
              <Landmark aria-hidden="true" className="text-periwinkle-glow size-3.5" />
              {bundle.frequency === "annual" ? "Vista anual" : "Vista trimestral"}
            </div>
          </div>
        </div>

        {GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const groupItems = items.filter((item) => item.group === group.id);
          return (
            <section key={group.id} className="space-y-3" aria-labelledby={`summary-${group.id}`}>
              <div className="flex items-start gap-3 px-1">
                <span className="border-gunmetal bg-carbon-surface text-periwinkle-glow flex size-9 shrink-0 items-center justify-center rounded-xl border">
                  <GroupIcon aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <p className="text-muted-steel font-mono text-[9px] uppercase tracking-[0.18em]">{group.eyebrow}</p>
                  <h4 id={`summary-${group.id}`} className="font-display text-pure-white mt-0.5 text-[17px] tracking-tight">{group.title}</h4>
                  <p className="text-muted-steel mt-0.5 text-[12px]">{group.description}</p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {groupItems.map((item) => (
                  <SummaryCard
                    key={item.id}
                    item={item}
                    scale={scale}
                    onOpen={() => setSelected(item)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </section>

      <StatementSeriesDialog
        row={selected?.row ?? null}
        periods={selected?.periods ?? []}
        scale={scale}
        currency={bundle.currency ?? "USD"}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}

function SummaryCard({
  item,
  scale,
  onOpen,
}: {
  item: FinancialSummaryItem;
  scale: Scale;
  onOpen: () => void;
}) {
  const { row, periods } = item;
  const data = buildStatementChartData(periods, row);
  const latest = data.at(-1) ?? null;
  const previous = comparablePrior(data);
  const change = pctChange(latest?.value ?? null, previous?.value ?? null);
  const semantics = getMetricSemantics(row.line);
  const favorable = changeIsFavorable(change, semantics);
  const values = periods.map((period) => row.cells[period.key]?.value ?? null);
  const hasHistory = data.length > 0;

  return (
    <button
      type="button"
      disabled={!hasHistory}
      onClick={onOpen}
      aria-label={hasHistory ? `Abrir histórico resumido de ${row.line.label}` : `${row.line.label} sin datos`}
      className={cn(
        "border-gunmetal bg-carbon-surface group relative min-h-[190px] overflow-hidden rounded-2xl border p-5 text-left transition-all",
        hasHistory
          ? "hover:border-periwinkle-glow/40 hover:bg-gunmetal/35 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
          : "cursor-default opacity-55",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-steel font-mono text-[9px] uppercase tracking-[0.16em]">Último dato</p>
          <h5 className="font-display text-frost mt-1 text-[14px] font-medium tracking-tight">{row.line.label}</h5>
        </div>
        <span className="border-gunmetal bg-gunmetal/30 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors group-hover:border-periwinkle-glow/30">
          <ArrowRight aria-hidden="true" className="text-muted-steel size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:text-periwinkle-glow" />
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="tabular font-display text-pure-white text-[27px] leading-none tracking-[-0.03em]">
            {formatValue(latest?.value, row.line.unit, scale)}
          </p>
          <p className="text-muted-steel mt-2 text-[11px]">{latest?.label ?? "Sin datos disponibles"}</p>
        </div>
        <div className="border-gunmetal/70 bg-gunmetal/20 rounded-lg border px-2 py-1.5">
          <Sparkline values={values} reverse color={favorable === true ? "#34d399" : favorable === false ? "#fb7185" : "#98a4f7"} />
        </div>
      </div>

      <div className="border-gunmetal/70 mt-4 flex items-center justify-between gap-3 border-t pt-3">
        <MetricDirectionBadge semantics={semantics} compact />
        <span className={cn(
          "tabular text-[11px] font-medium",
          favorable === true && "text-emerald-300",
          favorable === false && "text-rose-300",
          favorable === null && "text-muted-steel",
        )}>
          {formatPct(change)} {previous ? `vs ${previous.label}` : ""}
        </span>
      </div>
    </button>
  );
}

function comparablePrior(data: ReturnType<typeof buildStatementChartData>) {
  const latest = data.at(-1);
  if (!latest) return null;
  return [...data].reverse().find((point) => {
    if (point.key === latest.key) return false;
    if (latest.key.startsWith("FY")) return true;
    return point.key.endsWith(latest.key.slice(-2));
  }) ?? null;
}

export function summaryBlockForCopy(bundle: StatementBundle): StatementBlock | null {
  const items = buildFinancialSummaryItems(bundle);
  if (items.length === 0) return null;
  const periods = items[0].periods;
  return {
    id: "income",
    label: "Resumen financiero",
    periods,
    rows: items.map((item) => item.row),
  };
}
