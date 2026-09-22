"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Coins, Flame, Info, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { FredPoint } from "@/lib/fred/client";
import {
  calculatePurchasingPower,
  PURCHASING_POWER_RANGES,
  type PurchasingPowerRange,
} from "@/lib/macro/purchasing-power";

type RegionMode = "europe" | "us" | "compare";

export function PurchasingPowerCard({
  europeRawPoints,
  usRawPoints,
}: {
  europeRawPoints: FredPoint[];
  usRawPoints: FredPoint[];
}) {
  const [range, setRange] = useState<PurchasingPowerRange>("5y");
  const [regionMode, setRegionMode] = useState<RegionMode>("europe");

  const europeResult = useMemo(() => {
    return calculatePurchasingPower(europeRawPoints, range);
  }, [europeRawPoints, range]);

  const usResult = useMemo(() => {
    return calculatePurchasingPower(usRawPoints, range);
  }, [usRawPoints, range]);

  const activeResult = regionMode === "us" ? usResult : europeResult;
  const currencySymbol = regionMode === "us" ? "$" : "€";

type PurchasingPowerChartPoint = {
  date: string;
  valor?: number;
  lossPct?: number;
  valorEuropa?: number;
  lossEuropa?: number;
  valorUS?: number | null;
};

  // Datos combinados para modo comparativa
  const chartData: PurchasingPowerChartPoint[] = useMemo(() => {
    if (regionMode !== "compare") {
      return (
        activeResult?.series.map((p) => ({
          date: p.date,
          valor: p.value,
          lossPct: p.lossPct,
        })) ?? []
      );
    }

    if (!europeResult || !usResult) return [];
    // Mapeo por fecha común
    const usMap = new Map(usResult.series.map((p) => [p.date.slice(0, 7), p.value]));
    return europeResult.series.map((p) => {
      const ym = p.date.slice(0, 7);
      return {
        date: p.date,
        valorEuropa: p.value,
        lossEuropa: p.lossPct,
        valorUS: usMap.get(ym) ?? null,
      };
    });
  }, [activeResult, europeResult, usResult, regionMode]);

  return (
    <section className="bg-carbon-surface border-gunmetal rounded-3xl border p-6 sm:p-8 shadow-xl mt-12">
      {/* Cabecera del bloque */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gunmetal/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[12px] font-medium text-rose-300 mb-2">
            <TrendingDown className="size-3.5" />
            <span>Erosión de poder adquisitivo acumulada</span>
          </div>
          <h2 className="font-display text-pure-white text-[24px] sm:text-[30px] font-bold tracking-tight">
            ¿Cuánto vale tu dinero?
          </h2>
          <p className="text-frost text-[14px] sm:text-[15px] mt-1 max-w-2xl leading-relaxed">
            Evolución del poder de compra real de un billete de 100 {currencySymbol} según la inflación oficial de los precios de consumo.
          </p>
        </div>

        {/* Selector de región */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={regionMode === "europe"}
            onClick={() => setRegionMode("europe")}
            className={cn(
              "font-display inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer",
              regionMode === "europe"
                ? "bg-periwinkle-glow text-void-black border-transparent font-semibold shadow-sm"
                : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
            )}
          >
            <span>🇪🇺</span>
            <span>Zona Euro (100 €)</span>
          </button>
          <button
            type="button"
            aria-pressed={regionMode === "us"}
            onClick={() => setRegionMode("us")}
            className={cn(
              "font-display inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer",
              regionMode === "us"
                ? "bg-periwinkle-glow text-void-black border-transparent font-semibold shadow-sm"
                : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
            )}
          >
            <span>🇺🇸</span>
            <span>EE.UU. (100 $)</span>
          </button>
          <button
            type="button"
            aria-pressed={regionMode === "compare"}
            onClick={() => setRegionMode("compare")}
            className={cn(
              "font-display inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer",
              regionMode === "compare"
                ? "bg-periwinkle-glow text-void-black border-transparent font-semibold shadow-sm"
                : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
            )}
          >
            <span>⚖️</span>
            <span>Comparar ambos</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas de pérdida */}
      <div className="grid gap-px border border-gunmetal bg-gunmetal grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden mt-6">
        <div className="bg-carbon-surface p-4 sm:p-5 flex flex-col justify-between">
          <p className="text-muted-steel text-[11px] font-medium uppercase tracking-wider">
            Poder inicial de compra
          </p>
          <p className="tabular font-display text-pure-white text-[26px] font-bold mt-1">
            100,00 {currencySymbol}
          </p>
          <p className="text-muted-steel text-[11px] truncate mt-0.5">
            {activeResult ? formatDate(activeResult.startDate) : "Inicio"}
          </p>
        </div>

        <div className="bg-carbon-surface p-4 sm:p-5 flex flex-col justify-between">
          <p className="text-muted-steel text-[11px] font-medium uppercase tracking-wider">
            Valor real actual
          </p>
          <p className="tabular font-display text-rose-400 text-[26px] font-bold mt-1">
            {activeResult
              ? `${activeResult.finalValue.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`
              : "—"}
          </p>
          <p className="text-muted-steel text-[11px] truncate mt-0.5">
            {activeResult ? formatDate(activeResult.endDate) : "Actualidad"}
          </p>
        </div>

        {/* Pérdida acumulada con figura de Cid (SIN nombres ni etiquetas) */}
        <div className="bg-carbon-surface p-4 sm:p-5 flex flex-col justify-between">
          <p className="text-muted-steel text-[11px] font-medium uppercase tracking-wider">
            Pérdida de compra
          </p>
          <div className="flex items-center gap-3 mt-1">
            {activeResult ? (
              <>
                <img
                  src={activeResult.mascot.src}
                  alt=""
                  className="size-16 sm:size-20 object-contain shrink-0 filter drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]"
                />
                <div className="min-w-0">
                  <p className="tabular font-display text-rose-400 text-[22px] font-bold leading-none">
                    {activeResult.totalLossPct.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %
                  </p>
                  <p className="text-muted-steel text-[11px] truncate mt-1">
                    en {activeResult.years} años
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-steel text-[13px]">Sin datos</p>
            )}
          </div>
        </div>

        <div className="bg-carbon-surface p-4 sm:p-5 flex flex-col justify-between">
          <p className="text-muted-steel text-[11px] font-medium uppercase tracking-wider">
            Inflación media anual
          </p>
          <p className="tabular font-display text-pure-white text-[22px] font-bold mt-1">
            {activeResult
              ? `+${activeResult.annualInflationRate.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
              : "—"}
            <span className="text-[12px] font-normal text-muted-steel ml-1">/ año</span>
          </p>
          <p className="text-muted-steel text-[11px] truncate mt-0.5">
            {regionMode === "us" ? "Fuente: BLS (CPI)" : "Fuente: Eurostat (IPCA)"}
          </p>
        </div>
      </div>

      {/* Selector de horizonte temporal */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <span className="text-muted-steel text-[12px] font-medium">Horizonte temporal:</span>
        <div className="flex flex-wrap gap-1.5">
          {PURCHASING_POWER_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "font-display rounded-full border px-3.5 py-1 text-[12px] font-medium transition-colors cursor-pointer",
                range === r.id
                  ? "bg-periwinkle-glow text-void-black border-transparent font-semibold shadow-sm"
                  : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico interactivo */}
      <div className="mt-5 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 12, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="grad-loss-single" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#fb7185" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#1f2433" strokeDasharray="3 4" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#646e87" }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              tickFormatter={(v: string) => v.slice(0, 4)}
            />
            <YAxis
              domain={[
                (dataMin: number) => Math.floor(Math.min(dataMin, 60) / 10) * 10,
                105,
              ]}
              tick={{ fontSize: 10, fill: "#646e87" }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => `${v.toFixed(0)} ${currencySymbol}`}
            />
            <ReferenceLine
              y={100}
              stroke="#646e87"
              strokeDasharray="4 4"
              label={{
                value: `Base 100 ${currencySymbol}`,
                position: "insideTopRight",
                fill: "#98a4f7",
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                background: "#151621",
                border: "1px solid #1f2433",
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                fontSize: 12,
                color: "#ffffff",
              }}
              labelStyle={{ color: "#c9d3ee", fontWeight: 500 }}
              labelFormatter={(v) => formatDate(String(v))}
              formatter={(value, name) => {
                const val = Number(value);
                const loss = val - 100;
                const label =
                  name === "valorEuropa"
                    ? "Zona Euro (100 €)"
                    : name === "valorUS"
                      ? "Estados Unidos (100 $)"
                      : `Poder real de 100 ${currencySymbol}`;
                return [
                  `${val.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol} (${loss >= 0 ? "+" : ""}${loss.toFixed(1)} %)`,
                  label,
                ];
              }}
            />

            {regionMode !== "compare" ? (
              <Area
                type="monotone"
                dataKey="valor"
                stroke="#fb7185"
                strokeWidth={2.4}
                fill="url(#grad-loss-single)"
                isAnimationActive={false}
                dot={false}
              />
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="valorEuropa"
                  name="valorEuropa"
                  stroke="#818cf8"
                  strokeWidth={2.4}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="valorUS"
                  name="valorUS"
                  stroke="#38bdf8"
                  strokeWidth={2.4}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {regionMode === "compare" && (
        <div className="flex items-center justify-center gap-6 mt-2 text-[12px] text-muted-steel">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-[#818cf8]" />
            <span>🇪🇺 Zona Euro (100 €)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-[#38bdf8]" />
            <span>🇺🇸 Estados Unidos (100 $)</span>
          </div>
        </div>
      )}

      {/* Explicación didáctica para principiantes */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3 border-t border-gunmetal/80 pt-6">
        <div className="bg-void-black/60 border border-gunmetal/60 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-pure-white text-[13px] font-semibold">
            <Coins className="size-4 text-periwinkle-glow shrink-0" />
            <span>¿Por qué 100 € valen menos?</span>
          </div>
          <p className="text-muted-steel text-[12px] leading-[1.6]">
            El número en el billete sigue siendo 100, pero como los precios de la comida, la energía y la vivienda suben con la inflación, necesitas más dinero para comprar exactamente la misma cesta.
          </p>
        </div>

        <div className="bg-void-black/60 border border-gunmetal/60 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-pure-white text-[13px] font-semibold">
            <Flame className="size-4 text-rose-400 shrink-0" />
            <span>El impuesto silencioso</span>
          </div>
          <p className="text-muted-steel text-[12px] leading-[1.6]">
            Dejar el dinero parado en una cuenta corriente al 0 % garantiza perder poder de compra todos los meses. En 10 años, una inflación moderada del 2,5 % hace que tu dinero pierda más del 20 % de su valor.
          </p>
        </div>

        <div className="bg-void-black/60 border border-gunmetal/60 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-pure-white text-[13px] font-semibold">
            <Info className="size-4 text-emerald-400 shrink-0" />
            <span>La solución: invertir</span>
          </div>
          <p className="text-muted-steel text-[12px] leading-[1.6]">
            Para conservar y hacer crecer tu patrimonio es imprescindible invertir en activos productivos (empresas con ventajas competitivas, fondos o deuda remunerada) cuya rentabilidad supere la inflación.
          </p>
        </div>
      </div>
    </section>
  );
}
