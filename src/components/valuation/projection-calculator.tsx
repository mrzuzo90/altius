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

  return (
    <div className="space-y-8">
      <div className="bg-ash card-asymmetric p-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-mist/80 pb-4">
          <div>
            <h3 className="font-display text-graphite text-[20px] tracking-[-0.02em]">
              Modelo de Proyección a 5 Años y Precio Objetivo
            </h3>
            <p className="text-steel mt-1 text-[13px]">
              Ajusta las hipótesis de crecimiento, rentabilidad operativa y múltiplo objetivo de salida.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate text-[12px]">Múltiplo de salida:</span>
            <div className="bg-fog inline-flex rounded-full p-0.5 border border-mist">
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
                      ? "bg-canvas-white text-graphite shadow-sm"
                      : "text-slate hover:text-graphite"
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
              <span className="text-slate">Crecimiento ventas (YoY)</span>
              <span className="font-display text-graphite font-semibold">{revenueGrowth} %</span>
            </div>
            <input
              type="range"
              min="-10"
              max="40"
              step="1"
              value={revenueGrowth}
              onChange={(e) => setRevenueGrowth(Number(e.target.value))}
              className="accent-graphite mt-2.5 w-full cursor-pointer"
            />
            <span className="text-slate/70 text-[11px]">Histórico: ~{metrics.historicalRevenueGrowth?.toFixed(1) ?? "—"}%</span>
          </div>

          <div>
            <div className="flex justify-between text-[13px]">
              <span className="text-slate">Margen EBIT objetivo</span>
              <span className="font-display text-graphite font-semibold">{targetEbitMargin} %</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={targetEbitMargin}
              onChange={(e) => setTargetEbitMargin(Number(e.target.value))}
              className="accent-graphite mt-2.5 w-full cursor-pointer"
            />
            <span className="text-slate/70 text-[11px]">Histórico: ~{metrics.historicalEbitMargin?.toFixed(1) ?? "—"}%</span>
          </div>

          <div>
            <div className="flex justify-between text-[13px]">
              <span className="text-slate">Múltiplo objetivo</span>
              <span className="font-display text-graphite font-semibold">{targetMultiple}x</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={targetMultiple}
              onChange={(e) => setTargetMultiple(Number(e.target.value))}
              className="accent-graphite mt-2.5 w-full cursor-pointer"
            />
            <span className="text-slate/70 text-[11px]">Actual LTM: ~{metrics.pe?.toFixed(1) ?? "—"}x</span>
          </div>

          <div>
            <div className="flex justify-between text-[13px]">
              <span className="text-slate">Tasa impositiva</span>
              <span className="font-display text-graphite font-semibold">{taxRate} %</span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              step="1"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="accent-graphite mt-2.5 w-full cursor-pointer"
            />
            <span className="text-slate/70 text-[11px]">Efectivo: ~{metrics.historicalTaxRate?.toFixed(1) ?? "21"}%</span>
          </div>
        </div>

        {/* Panel de Resultados Clave de la Proyección */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3 border-t border-mist/80 pt-6">
          <div className="bg-fog card-asymmetric p-5 border border-mist/60">
            <span className="text-slate font-display text-[12px] uppercase tracking-wider">
              Precio Objetivo (Año 5)
            </span>
            <div className="font-display text-graphite mt-1.5 text-[32px] tracking-[-0.03em]">
              ${targetPrice.toFixed(2)}
            </div>
            <p className="text-steel text-[12px] mt-1">
              Cotización actual: ${precioActual.toFixed(2)}
            </p>
          </div>

          <div className="bg-fog card-asymmetric p-5 border border-mist/60">
            <span className="text-slate font-display text-[12px] uppercase tracking-wider">
              Margen de Seguridad
            </span>
            <div
              className={`font-display mt-1.5 text-[32px] tracking-[-0.03em] ${
                margenSeguridad >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
              }`}
            >
              {margenSeguridad >= 0 ? "+" : ""}{margenSeguridad.toFixed(1)} %
            </div>
            <p className="text-steel text-[12px] mt-1">
              Potencial frente al precio de mercado
            </p>
          </div>

          <div className="bg-fog card-asymmetric p-5 border border-mist/60">
            <span className="text-slate font-display text-[12px] uppercase tracking-wider">
              Retorno Anualizado (CAGR)
            </span>
            <div
              className={`font-display mt-1.5 text-[32px] tracking-[-0.03em] ${
                cagr >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
              }`}
            >
              {cagr >= 0 ? "+" : ""}{cagr.toFixed(1)} % / año
            </div>
            <p className="text-steel text-[12px] mt-1">
              Tasa de rentabilidad compuesta esperada
            </p>
          </div>
        </div>
      </div>

      {/* Tabla detallada de la proyección año a año */}
      <div className="border-mist bg-canvas-white relative overflow-x-auto rounded-[20px] border">
        <table className="tabular w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-mist border-b bg-ash">
              <th scope="col" className="text-steel px-4 py-3 text-left text-[12px] font-medium">
                Línea Proyectada (M$)
              </th>
              {projection.years.map((y) => (
                <th key={y.label} scope="col" className="text-steel font-display px-4 py-3 text-right text-[13px]">
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
    <tr className={`border-mist border-b last:border-0 hover:bg-fog/50 transition-colors ${total ? "bg-fog/40 font-medium" : ""}`}>
      <th scope="row" className="text-graphite px-4 py-2.5 text-left text-[14px] font-normal">
        {concepto}
      </th>
      {valores.map((v, i) => (
        <td key={i} className={`px-4 py-2.5 text-right font-display ${total ? "font-semibold text-graphite" : "text-steel"}`}>
          {v}
        </td>
      ))}
    </tr>
  );
}
