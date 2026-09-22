"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarRange, PersonStanding } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PricePoint } from "@/lib/prices/types";
import { filterPricePoints, priceRangeCutoff, type PriceRangeId } from "@/lib/prices/ranges";
import {
  chartSpanDays,
  chartTimeTicks,
  formatPriceChartDate,
  formatPriceChartTick,
  formatPriceQuote,
  priceChartDomain,
  timestampPricePoints,
} from "@/lib/prices/chart";
import {
  annualizedChange,
  elapsedYears,
  getCidTrendForRate,
  type CidPatternInfo,
} from "@/components/statement-trend-animation";

export type PriceAnnualTrend = CidPatternInfo & {
  rate: number;
  years: number;
  isAnnualized: boolean;
};

export function calculatePriceAnnualTrend(
  points: readonly PricePoint[],
  minYears: number = 1.8,
): PriceAnnualTrend | null {
  if (points.length < 2) return null;
  const firstPoint = points[0];
  const lastPoint = points.at(-1)!;
  if (!firstPoint || !lastPoint || !firstPoint.date || !lastPoint.date) return null;
  if (firstPoint.close <= 0 || lastPoint.close <= 0) return null;

  const years = elapsedYears(firstPoint.date, lastPoint.date);
  if (years < minYears) return null;

  const rate = annualizedChange(firstPoint.close, lastPoint.close, years);
  if (rate === null || !Number.isFinite(rate)) return null;

  const info = getCidTrendForRate(rate);
  return {
    rate,
    years,
    isAnnualized: true,
    ...info,
  };
}

export type TenYearAnnualTrend = PriceAnnualTrend;

export function calculateTenYearAnnualTrend(points: readonly PricePoint[]): TenYearAnnualTrend | null {
  return calculatePriceAnnualTrend(points, 1.8);
}

const RANGES = [
  { id: "1m", label: "1 mes" },
  { id: "3m", label: "3 meses" },
  { id: "6m", label: "6 meses" },
  { id: "ytd", label: "Año actual" },
  { id: "fytd", label: "Ej. fiscal" },
  { id: "1y", label: "1 año" },
  { id: "3y", label: "3 años" },
  { id: "5y", label: "5 años" },
  { id: "10y", label: "10 años" },
  { id: "max", label: "Máx." },
] as const;

export function PriceChart({
  points,
  source,
  currency,
  fiscalYearStart,
  ticker,
}: {
  points: PricePoint[];
  source: string;
  currency: string | null;
  fiscalYearStart?: string | null;
  ticker?: string;
}) {
  const firstAvailable = points[0]?.date ?? "";
  const lastAvailable = points.at(-1)?.date ?? "";
  const initialFrom = lastAvailable ? priceRangeCutoff(lastAvailable, "10y") : "";
  const [range, setRange] = useState<PriceRangeId>("10y");
  const [from, setFrom] = useState(initialFrom < firstAvailable ? firstAvailable : initialFrom);
  const [to, setTo] = useState(lastAvailable);
  const [showCid, setShowCid] = useState(true);

  const data = useMemo(() => {
    return filterPricePoints(points, range, { from, to, fiscalYearStart });
  }, [points, range, from, to, fiscalYearStart]);
  const chartData = useMemo(() => timestampPricePoints(data), [data]);
  const spanDays = chartSpanDays(chartData);
  const xTicks = useMemo(() => chartTimeTicks(chartData), [chartData]);
  const yDomain = useMemo(() => priceChartDomain(data), [data]);

  if (points.length === 0) {
    return (
      <div className="bg-carbon-surface border-gunmetal text-muted-steel rounded-2xl border border-dashed px-6 py-16 text-center text-[13px]">
        No hay una serie de cotización disponible. Altius no la sustituye por ceros.
      </div>
    );
  }

  // El rendimiento anualizado (CAGR) solo se calcula en rangos multianuales (>= 2 años)
  const isMultiYearRange = range === "3y" || range === "5y" || range === "10y" || range === "max" || range === "custom";
  const annualTrend = useMemo(() => {
    if (!isMultiYearRange) return null;
    return calculatePriceAnnualTrend(data, 1.8);
  }, [data, isMultiYearRange]);

  const yearsLabel = useMemo(() => {
    if (!annualTrend) return "";
    if (annualTrend.years >= 9.5 && range === "10y") return "10 años";
    if (range === "3y" || (annualTrend.years >= 2.5 && annualTrend.years < 3.5)) return "3 años";
    if (range === "5y" || (annualTrend.years >= 4.5 && annualTrend.years < 5.5)) return "5 años";
    if (range === "max") return `máx. · ${Math.round(annualTrend.years)} años`;
    return `${Math.round(annualTrend.years * 10) / 10} años`;
  }, [annualTrend, range]);

  const first = data[0]?.close ?? null;
  const last = data.at(-1)?.close ?? null;
  const rises = first !== null && last !== null ? last >= first : false;
  const change = first && last !== null ? ((last - first) / first) * 100 : null;
  const periodLabel =
    range === "custom"
      ? `${from || firstAvailable} → ${to || lastAvailable}`
      : RANGES.find((item) => item.id === range)?.label ?? "periodo";

  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <span className="tabular font-display text-pure-white block text-[34px] font-medium leading-none tracking-tight">
              {last === null ? "—" : formatPriceQuote(last, currency)}
            </span>
            <span
              className={cn(
                "tabular mt-2 block text-[13px] font-mono",
                rises ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {change === null
                ? "Sin datos en el periodo"
                : `${rises ? "+" : "−"}${Math.abs(change).toLocaleString("es-ES", { maximumFractionDigits: 1 })} % · ${periodLabel}`}
            </span>
          </div>

          {showCid && annualTrend && (
            <div className="bg-void-black/80 border-gunmetal flex items-center gap-3.5 rounded-2xl border px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-md backdrop-blur-sm transition-all hover:border-periwinkle-glow/40">
              <img
                src={annualTrend.mascot.src}
                alt="Cid"
                className="size-11 sm:size-13 object-contain shrink-0 filter drop-shadow-[0_2px_8px_rgba(152,164,247,0.35)]"
              />
              <div>
                <span className="text-muted-steel text-[10px] font-semibold uppercase tracking-[0.12em] block">
                  CAGR · {yearsLabel}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className={cn(
                      "tabular font-display text-[20px] sm:text-[22px] font-bold leading-none tracking-tight",
                      annualTrend.rate >= 0 ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {annualTrend.rate >= 0 ? "+" : ""}
                    {annualTrend.rate.toLocaleString("es-ES", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}{" "}
                    %
                    <span className="text-[12px] font-normal text-muted-steel ml-1">/ año</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex max-w-full flex-wrap justify-end gap-2">
          {RANGES.filter((item) => item.id !== "fytd" || Boolean(fiscalYearStart)).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={range === item.id}
              onClick={() => setRange(item.id)}
              className={cn(
                "border-gunmetal font-display rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                range === item.id
                  ? "bg-periwinkle-glow text-void-black border-transparent"
                  : "bg-void-black text-muted-steel hover:text-frost",
              )}
            >
              {item.label}
            </button>
          ))}
          {annualTrend && (
            <button
              type="button"
              aria-pressed={showCid}
              aria-label={`${showCid ? "Ocultar" : "Mostrar"} a Cid en la cotización`}
              onClick={() => setShowCid((visible) => !visible)}
              className={cn(
                "font-display inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                showCid
                  ? "border-periwinkle-glow/60 bg-periwinkle-glow/10 text-periwinkle-glow"
                  : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
              )}
            >
              <PersonStanding className="size-3.5" />
              Cid · {showCid ? "activo" : "oculto"}
            </button>
          )}
        </div>
      </div>

      <div className="border-gunmetal mt-5 flex flex-wrap items-end gap-3 border-y py-3">
        <div className="text-muted-steel flex items-center gap-2 text-[12px] font-medium">
          <CalendarRange className="size-4 text-periwinkle-glow" />
          Periodo personalizado
        </div>
        <label className="text-muted-steel text-[11px] uppercase tracking-wider">
          Desde
          <input
            type="date"
            value={from}
            min={firstAvailable}
            max={to || lastAvailable}
            onChange={(e) => {
              setRange("custom");
              setFrom(e.target.value);
            }}
            className="border-gunmetal bg-void-black text-pure-white ml-2 rounded border px-2 py-1 font-mono text-[12px]"
          />
        </label>
        <label className="text-muted-steel text-[11px] uppercase tracking-wider">
          Hasta
          <input
            type="date"
            value={to}
            min={from || firstAvailable}
            max={lastAvailable}
            onChange={(e) => {
              setRange("custom");
              setTo(e.target.value);
            }}
            className="border-gunmetal bg-void-black text-pure-white ml-2 rounded border px-2 py-1 font-mono text-[12px]"
          />
        </label>
      </div>

      {data.length > 0 ? (
        <div className="relative mt-5 h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 24,
                right: 16,
                bottom: 0,
                left: 0,
              }}
            >
              <defs>
                <linearGradient id="grad-precio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#98a4f7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#98a4f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                ticks={xTicks}
                tick={{ fontSize: 11, fill: "#646e87" }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
                tickFormatter={(value: number) => formatPriceChartTick(value, spanDays)}
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 11, fill: "#646e87" }}
                tickLine={false}
                axisLine={false}
                width={68}
                tickFormatter={(value: number) => formatPriceQuote(value, currency, true)}
              />
              <Tooltip
                wrapperStyle={{ zIndex: 5 }}
                contentStyle={{
                  background: "#151621",
                  border: "1px solid #1f2433",
                  borderRadius: 10,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  fontSize: 12,
                  color: "#ffffff",
                }}
                labelStyle={{ color: "#c9d3ee", fontWeight: 500 }}
                itemStyle={{ color: "#98a4f7" }}
                labelFormatter={(value) => formatPriceChartDate(Number(value))}
                formatter={(value) => [formatPriceQuote(Number(value), currency), "Cierre"]}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#98a4f7"
                strokeWidth={2}
                fill="url(#grad-precio)"
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-muted-steel py-16 text-center text-[13px]">
          No hay observaciones entre las fechas seleccionadas. Amplía el intervalo.
        </div>
      )}
      <p className="text-muted-steel mt-3 text-[12px]">
        Cierres ajustados por splits · en rangos superiores a 2 años se muestra la rentabilidad anualizada (CAGR) con el Cid correspondiente · {source} · Divisa: {currency ?? "no declarada"}
      </p>
    </div>
  );
}
