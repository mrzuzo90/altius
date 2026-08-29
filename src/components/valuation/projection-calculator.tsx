"use client";

import { useState, useMemo } from "react";
import { calculateImpliedExpectations, calculateProjection } from "@/lib/valuation";
import { formatValue } from "@/lib/format";
import type { HistoricalPeSeries } from "@/lib/valuation/historical-pe";
import type { HistoricalMetricCoverage, ValuationMetrics, ProjectionInputs } from "@/lib/valuation/types";
import { AlertTriangle } from "lucide-react";

export function ProjectionCalculator({
  metrics,
  historicalPe,
}: {
  metrics: ValuationMetrics;
  historicalPe: HistoricalPeSeries;
}) {
  const [revenueGrowth, setRevenueGrowth] = useState<number>(() => {
    return clamp(Math.round(metrics.historicalRevenueGrowth ?? 8), -10, 40);
  });
  const [targetEbitMargin, setTargetEbitMargin] = useState<number>(() => {
    return clamp(Math.round(metrics.historicalEbitMargin ?? 25), 0, 60);
  });
  const [targetMultiple, setTargetMultiple] = useState<number>(() => {
    if (historicalPe.median20Y && historicalPe.median20Y > 0) {
      return clamp(Math.round(historicalPe.median20Y), 5, 60);
    }
    return 20;
  });
  const [targetMultipleType, setTargetMultipleType] = useState<"PE" | "EV_FCF" | "EV_EBITDA">("PE");
  const [taxRate, setTaxRate] = useState<number>(() => {
    return clamp(Math.round(metrics.historicalTaxRate ?? 21), 10, 35);
  });

  const inputs: ProjectionInputs = useMemo(
    () => ({
      revenueGrowth,
      targetEbitMargin,
      targetMultiple,
      targetMultipleType,
      taxRate,
      sharesGrowth: 0,
    }),
    [revenueGrowth, targetEbitMargin, targetMultiple, targetMultipleType, taxRate],
  );

  const projection = useMemo(() => calculateProjection(metrics, inputs), [metrics, inputs]);
  const implied = useMemo(() => calculateImpliedExpectations(metrics, inputs), [metrics, inputs]);

  const precioActual = metrics.price !== null && metrics.price > 0 ? metrics.price : null;
  const targetPrice = projection.targetPrice5Y;
  const margenSeguridad = projection.marginOfSafety;
  const cagr = projection.cagr5Y;

  const currentMultiple = useMemo(() => {
    if (targetMultipleType === "PE") return metrics.pe;
    if (targetMultipleType === "EV_FCF") return metrics.evFcf;
    if (targetMultipleType === "EV_EBITDA") return metrics.evEbitda;
    return null;
  }, [metrics, targetMultipleType]);

  return (
    <div className="space-y-8">
      <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-gunmetal pb-4">
          <div>
            <h3 className="font-display text-pure-white text-[20px] font-medium tracking-tight">
              Modelo de Proyección a 5 Años y Precio Objetivo
            </h3>
            <p className="text-frost mt-1 text-[13px]">
              Ajusta las hipótesis de crecimiento, rentabilidad operativa y múltiplo objetivo de salida.
            </p>
            <p className="text-amber-300 mt-2 inline-flex items-center gap-1.5 text-[12px]">
              <AlertTriangle className="size-3.5" />
              Todos los controles son supuestos editables, no estimaciones publicadas por la empresa.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-steel text-[12px]">Múltiplo de salida:</span>
            <div className="bg-void-black border-gunmetal inline-flex rounded-full p-1 border">
              {(
                [
                  { id: "PE", label: "PER" },
                  { id: "EV_FCF", label: "EV/FCF" },
                  { id: "EV_EBITDA", label: "EV/EBITDA" },
                ] as const
              ).map((tipo) => (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => setTargetMultipleType(tipo.id)}
                  className={`rounded-full px-3 py-1 text-[12px] font-display transition-colors ${
                    targetMultipleType === tipo.id
                      ? "bg-gunmetal text-pure-white"
                      : "text-muted-steel hover:text-frost"
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-steel">Crecimiento ventas (YoY)</span>
              <span className="font-display text-pure-white font-semibold tabular">{revenueGrowth} %</span>
            </div>
            <input
              type="range"
              min="-10"
              max="40"
              step="1"
              value={revenueGrowth}
              onChange={(e) => setRevenueGrowth(Number(e.target.value))}
              className="accent-periwinkle-glow mt-2.5 w-full cursor-pointer"
            />
            <ReferenceValue
              label="Mediana últimos 20 años"
              value={metrics.historicalRevenueGrowth}
              suffix="%"
              coverage={metrics.historicalRevenueGrowthCoverage}
            />
          </div>

          <div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-steel">Margen EBIT (Año 5)</span>
              <span className="font-display text-pure-white font-semibold tabular">{targetEbitMargin} %</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="0.5"
              value={targetEbitMargin}
              onChange={(e) => setTargetEbitMargin(Number(e.target.value))}
              className="accent-periwinkle-glow mt-2.5 w-full cursor-pointer"
            />
            <ReferenceValue
              label="Mediana últimos 20 años"
              value={metrics.historicalEbitMargin}
              suffix="%"
              coverage={metrics.historicalEbitMarginCoverage}
            />
          </div>

          <div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-steel">Múltiplo objetivo</span>
              <span className="font-display text-pure-white font-semibold tabular">{targetMultiple}x</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="0.5"
              value={targetMultiple}
              onChange={(e) => setTargetMultiple(Number(e.target.value))}
              className="accent-periwinkle-glow mt-2.5 w-full cursor-pointer"
            />
            <span className="text-muted-steel/70 text-[11px]">
              {targetMultipleType === "PE"
                ? historicalPe.median20Y !== null
                  ? `Mediana últimos 20 años: ~${historicalPe.median20Y.toFixed(1)}x · ${coverageLabel(historicalPe.observations20Y, historicalPe.startFiscalYear20Y, historicalPe.endFiscalYear20Y)}`
                  : historicalPe.observations20Y > 0
                    ? `Mediana 20 años no disponible · ${coverageLabel(historicalPe.observations20Y, historicalPe.startFiscalYear20Y, historicalPe.endFiscalYear20Y)}`
                    : "Mediana 20 años no disponible · sin observaciones"
                : currentMultiple !== null
                  ? `Actual ${targetMultipleType}: ~${currentMultiple.toFixed(1)}x`
                  : "Ajusta tu estimación"}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-steel">Tasa impositiva (Tax Rate)</span>
              <span className="font-display text-pure-white font-semibold tabular">{taxRate} %</span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              step="1"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="accent-periwinkle-glow mt-2.5 w-full cursor-pointer"
            />
            <ReferenceValue
              label="Mediana efectiva · 20 años"
              value={metrics.historicalTaxRate}
              suffix="%"
              coverage={metrics.historicalTaxRateCoverage}
            />
          </div>
        </div>

        {/* Panel de Resultados Clave de la Proyección */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3 border-t border-gunmetal pt-6">
          <div className="bg-void-black rounded-xl p-5 border border-gunmetal">
            <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider">
              Precio Objetivo (Año 5)
            </span>
            <div className="font-display text-pure-white mt-1.5 text-[32px] font-medium tracking-tight tabular">
              {targetPrice !== null ? formatMoney(targetPrice, metrics.currency) : "—"}
            </div>
            <p className="text-muted-steel text-[12px] mt-1">
              Cotización actual: {precioActual !== null ? formatMoney(precioActual, metrics.currency) : "— (sin cotización)"}
            </p>
          </div>

          <div className="bg-void-black rounded-xl p-5 border border-gunmetal">
            <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider">
              Margen de Seguridad
            </span>
            <div
              className={`font-display mt-1.5 text-[32px] font-medium tracking-tight tabular ${
                margenSeguridad === null
                  ? "text-muted-steel"
                  : margenSeguridad >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatProjectedPercent(margenSeguridad)}
            </div>
            <p className="text-muted-steel text-[12px] mt-1">
              Potencial frente al precio de mercado
            </p>
          </div>

          <div className="bg-void-black rounded-xl p-5 border border-gunmetal">
            <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider">
              Retorno Anualizado (CAGR)
            </span>
            <div
              className={`font-display mt-1.5 text-[32px] font-medium tracking-tight tabular ${
                cagr === null
                  ? "text-muted-steel"
                  : cagr >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatProjectedPercent(cagr)}
            </div>
            <p className="text-muted-steel text-[12px] mt-1">
              Rentabilidad anual estimada 5 años
            </p>
          </div>
        </div>

        <div className="border-periwinkle-glow/30 bg-void-black mt-6 rounded-xl border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-periwinkle-glow font-mono text-[11px] uppercase tracking-wider">
                Valoración inversa · expectativa implícita
              </span>
              <p className="text-frost mt-1 max-w-2xl text-[13px] leading-relaxed">
                Crecimiento anual de ventas necesario para que, con los supuestos elegidos, el precio
                objetivo dentro de cinco años sea igual a la cotización de hoy.
              </p>
            </div>
            <div className="text-right">
              <div className="font-display text-pure-white text-[30px] tabular">
                {implied.revenueGrowth !== null ? `${implied.revenueGrowth.toFixed(1)} % anual` : "—"}
              </div>
              <span className="text-muted-steel text-[11px]">Resultado matemático según estos supuestos</span>
            </div>
          </div>
          {implied.reason ? <p className="text-amber-300 mt-3 text-[12px]">{implied.reason}</p> : null}
        </div>
      </div>

      {projection.unavailableReason ? (
        <div className="border-amber-800/60 bg-amber-950/20 text-amber-200 flex items-start gap-2 rounded-xl border px-4 py-3 text-[13px]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{projection.unavailableReason} Altius no sustituye los datos ausentes por cifras ficticias.</p>
        </div>
      ) : null}

      {/* Tabla detallada de la proyección año a año */}
      {projection.years.length > 0 ? <div className="border-gunmetal bg-carbon-surface relative overflow-x-auto rounded-2xl border">
        <table className="tabular w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-gunmetal border-b bg-void-black">
              <th scope="col" className="text-muted-steel font-mono uppercase px-4 py-3 text-left text-[12px] font-medium tracking-wider">
                Línea Proyectada (M {metrics.currency})
              </th>
              {projection.years.map((y) => (
                <th key={y.label} scope="col" className="text-muted-steel font-mono uppercase px-4 py-3 text-right text-[12px] font-medium tracking-wider">
                  {y.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <FilaTabla
              concepto="Ventas proyectadas"
              valores={projection.years.map((y) => formatValue(y.revenue, "USD", "millions"))}
            />
            <FilaTabla
              concepto="Resultado de explotación (EBIT)"
              valores={projection.years.map((y) => formatValue(y.ebit, "USD", "millions"))}
            />
            <FilaTabla
              concepto="Resultado neto estimado"
              valores={projection.years.map((y) => formatValue(y.netIncome, "USD", "millions"))}
            />
            <FilaTabla
              concepto="Flujo de caja libre (FCF)"
              valores={projection.years.map((y) => y.fcf !== null ? formatValue(y.fcf, "USD", "millions") : "—")}
            />
            <FilaTabla
              concepto="Capitalización objetivo"
              valores={projection.years.map((y) => y.targetMarketCap !== null ? formatValue(y.targetMarketCap, "USD", "millions") : "—")}
              total
            />
            <FilaTabla
              concepto={`Precio por acción objetivo (${metrics.currency})`}
              valores={projection.years.map((y) => y.targetPrice !== null ? formatMoney(y.targetPrice, metrics.currency) : "—")}
              total
            />
          </tbody>
        </table>
      </div> : null}
    </div>
  );
}

function ReferenceValue({
  label,
  value,
  suffix,
  coverage,
}: {
  label: string;
  value: number | null;
  suffix: string;
  coverage: HistoricalMetricCoverage;
}) {
  return (
    <span className="text-muted-steel/70 text-[11px]">
      {label}: {value !== null
        ? `~${value.toFixed(1)}${suffix} · ${coverageLabel(coverage.observations, coverage.startFiscalYear, coverage.endFiscalYear)}`
        : coverage.observations > 0
          ? `— histórico insuficiente · ${coverageLabel(coverage.observations, coverage.startFiscalYear, coverage.endFiscalYear)}`
          : "— (sin observaciones históricas)"}
    </span>
  );
}

function coverageLabel(observations: number, startYear?: number | null, endYear?: number | null): string {
  const count = observations === 1 ? "1 observación" : `${observations} observaciones`;
  return startYear !== null && startYear !== undefined && endYear !== null && endYear !== undefined
    ? `${count} · ${startYear === endYear ? `FY ${startYear}` : `FY ${startYear}–${endYear}`}`
    : count;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatProjectedPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)} %`;
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function FilaTabla({
  concepto,
  valores,
  total = false,
}: {
  concepto: string;
  valores: string[];
  total?: boolean;
}) {
  return (
    <tr className={`border-gunmetal/60 border-b last:border-0 hover:bg-gunmetal/40 transition-colors ${total ? "bg-gunmetal/20 font-medium" : ""}`}>
      <th scope="row" className="text-pure-white px-4 py-2.5 text-left text-[14px] font-normal">
        {concepto}
      </th>
      {valores.map((v, i) => (
        <td key={i} className={`px-4 py-2.5 text-right tabular ${total ? "font-semibold text-periwinkle-glow" : "text-frost"}`}>
          {v}
        </td>
      ))}
    </tr>
  );
}
