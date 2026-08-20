"use client";

import { useState, useMemo } from "react";
import { calculateProjection } from "@/lib/valuation";
import { formatValue } from "@/lib/format";
import type { ValuationMetrics, ProjectionInputs } from "@/lib/valuation/types";

export function ProjectionCalculator({ metrics }: { metrics: ValuationMetrics }) {
  const [revenueGrowth, setRevenueGrowth] = useState<number>(() => {
    return Math.round(metrics.historicalRevenueGrowth ?? 10);
  });
  const [targetEbitMargin, setTargetEbitMargin] = useState<number>(() => {
    return Math.round(metrics.historicalEbitMargin ?? 25);
  });
  const [targetMultiple, setTargetMultiple] = useState<number>(() => {
    if (metrics.pe && metrics.pe > 5 && metrics.pe < 60) return Math.round(metrics.pe);
    return 20;
  });
  const [targetMultipleType, setTargetMultipleType] = useState<"PE" | "EV_FCF" | "EV_EBITDA">("PE");
  const [taxRate, setTaxRate] = useState<number>(() => {
    return Math.round(metrics.historicalTaxRate ?? 21);
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

  const precioActual = metrics.price > 0 ? metrics.price : 0;
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
            <span className="text-muted-steel/70 text-[11px]">Histórico LTM: ~{metrics.historicalRevenueGrowth?.toFixed(1) ?? "8"}%</span>
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
            <span className="text-muted-steel/70 text-[11px]">Histórico LTM: ~{metrics.historicalEbitMargin?.toFixed(1) ?? "25"}%</span>
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
              {currentMultiple !== null ? `Actual ${targetMultipleType}: ~${currentMultiple.toFixed(1)}x` : "Ajusta tu estimación"}
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
            <span className="text-muted-steel/70 text-[11px]">Efectivo: ~{metrics.historicalTaxRate?.toFixed(1) ?? "21"}%</span>
          </div>
        </div>

        {/* Panel de Resultados Clave de la Proyección */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3 border-t border-gunmetal pt-6">
          <div className="bg-void-black rounded-xl p-5 border border-gunmetal">
            <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider">
              Precio Objetivo (Año 5)
            </span>
            <div className="font-display text-pure-white mt-1.5 text-[32px] font-medium tracking-tight tabular">
              ${targetPrice.toFixed(2)}
            </div>
            <p className="text-muted-steel text-[12px] mt-1">
              Cotización actual: ${precioActual.toFixed(2)}
            </p>
          </div>

          <div className="bg-void-black rounded-xl p-5 border border-gunmetal">
            <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider">
              Margen de Seguridad
            </span>
            <div
              className={`font-display mt-1.5 text-[32px] font-medium tracking-tight tabular ${
                margenSeguridad >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {margenSeguridad >= 0 ? "+" : ""}{margenSeguridad.toFixed(1)} %
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
                cagr >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {cagr >= 0 ? "+" : ""}{cagr.toFixed(1)} %
            </div>
            <p className="text-muted-steel text-[12px] mt-1">
              Rentabilidad anual estimada 5 años
            </p>
          </div>
        </div>
      </div>

      {/* Tabla detallada de la proyección año a año */}
      <div className="border-gunmetal bg-carbon-surface relative overflow-x-auto rounded-2xl border">
        <table className="tabular w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-gunmetal border-b bg-void-black">
              <th scope="col" className="text-muted-steel font-mono uppercase px-4 py-3 text-left text-[12px] font-medium tracking-wider">
                Línea Proyectada (M$)
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
              valores={projection.years.map((y) => formatValue(y.fcf, "USD", "millions"))}
            />
            <FilaTabla
              concepto="Capitalización objetivo"
              valores={projection.years.map((y) => formatValue(y.targetMarketCap, "USD", "millions"))}
              total
            />
            <FilaTabla
              concepto="Precio por acción objetivo ($)"
              valores={projection.years.map((y) => `$${y.targetPrice.toFixed(2)}`)}
              total
            />
          </tbody>
        </table>
      </div>
    </div>
  );
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
