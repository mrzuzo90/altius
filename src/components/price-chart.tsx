"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarRange, PersonStanding } from "lucide-react";
import {
  PriceTrendAnimation,
  type PriceChartGeometry,
  type PricePointGeometry,
} from "@/components/price-trend-animation";
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
  type Timestamped,
} from "@/lib/prices/chart";

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
  ticker: string;
}) {
  const firstAvailable = points[0]?.date ?? "";
  const lastAvailable = points.at(-1)?.date ?? "";
  const initialFrom = lastAvailable ? priceRangeCutoff(lastAvailable, "5y") : "";
  const [range, setRange] = useState<PriceRangeId>("5y");
  const [from, setFrom] = useState(initialFrom < firstAvailable ? firstAvailable : initialFrom);
  const [to, setTo] = useState(lastAvailable);
  const [showAlti, setShowAlti] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const [measuredChart, setMeasuredChart] = useState<{
    signature: string;
    geometry: PriceChartGeometry;
  } | null>(null);
  const geometryCollector = useRef<{ signature: string; points: Map<number, PricePointGeometry> }>({
    signature: "",
    points: new Map(),
  });
  const measureFrame = useRef(0);

  const data = useMemo(() => {
    return filterPricePoints(points, range, { from, to, fiscalYearStart });
  }, [points, range, from, to, fiscalYearStart]);
  const chartData = useMemo(() => timestampPricePoints(data), [data]);
  const spanDays = chartSpanDays(chartData);
  const xTicks = useMemo(() => chartTimeTicks(chartData), [chartData]);
  const yDomain = useMemo(() => priceChartDomain(data), [data]);
  const chartSignature = `${ticker}:${range}:${data.length}:${data[0]?.date ?? "none"}:${data.at(-1)?.date ?? "none"}`;
  const capturePriceGeometry = useCallback((point: PricePointGeometry) => {
    if (range !== "10y") return;
    if (geometryCollector.current.signature !== chartSignature) {
      geometryCollector.current = { signature: chartSignature, points: new Map() };
    }
    geometryCollector.current.points.set(point.index, point);
    cancelAnimationFrame(measureFrame.current);
    measureFrame.current = requestAnimationFrame(() => {
      const container = chartRef.current;
      const captured = [...geometryCollector.current.points.values()].sort((a, b) => a.index - b.index);
      if (!container || captured.length < data.length || container.clientWidth <= 0 || container.clientHeight <= 0) return;
      const next = { width: container.clientWidth, height: container.clientHeight, points: captured };
      setMeasuredChart((current) => (
        current?.signature === chartSignature && samePriceGeometry(current.geometry, next)
          ? current
          : { signature: chartSignature, geometry: next }
      ));
    });
  }, [chartSignature, data.length, range]);

  useEffect(() => () => cancelAnimationFrame(measureFrame.current), []);

  if (points.length === 0) {
    return (
      <div className="bg-carbon-surface border-gunmetal text-muted-steel rounded-2xl border border-dashed px-6 py-16 text-center text-[13px]">
        No hay una serie de cotización disponible. Altius no la sustituye por ceros.
      </div>
    );
  }

  const first = data[0]?.close ?? null;
  const last = data.at(-1)?.close ?? null;
  const rises = first !== null && last !== null ? last >= first : false;
  const change = first && last !== null ? ((last - first) / first) * 100 : null;
  const periodLabel = range === "custom"
    ? `${from || firstAvailable} → ${to || lastAvailable}`
    : RANGES.find((item) => item.id === range)?.label ?? "periodo";
  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <span className="tabular font-display text-pure-white block text-[34px] font-medium leading-none tracking-tight">
            {last === null ? "—" : formatPriceQuote(last, currency)}
          </span>
          <span className={cn("tabular mt-2 block text-[13px] font-mono", rises ? "text-emerald-400" : "text-rose-400")}>
            {change === null ? "Sin datos en el periodo" : `${rises ? "+" : "−"}${Math.abs(change).toLocaleString("es-ES", { maximumFractionDigits: 1 })} % · ${periodLabel}`}
          </span>
        </div>

        <div className="ml-auto flex max-w-full flex-wrap justify-end gap-2">
          {RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={range === item.id}
              onClick={() => setRange(item.id)}
              className={cn(
                "border-gunmetal font-display rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                range === item.id ? "bg-periwinkle-glow text-void-black border-transparent" : "bg-void-black text-muted-steel hover:text-frost",
              )}
            >
              {item.label}
            </button>
          ))}
          {range === "10y" && (
            <>
              <span className="border-gunmetal bg-void-black/50 text-muted-steel inline-flex items-center rounded-full border px-3 py-1.5 text-[11px]">
                Recorrido · media móvil de 3 meses
              </span>
              <button
                type="button"
                aria-pressed={showAlti}
                aria-label={`${showAlti ? "Ocultar" : "Mostrar"} a Alti en la cotización`}
                onClick={() => setShowAlti((visible) => !visible)}
                className={cn(
                  "font-display inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  showAlti
                    ? "border-periwinkle-glow/60 bg-periwinkle-glow/10 text-periwinkle-glow"
                    : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
                )}
              >
                <PersonStanding className="size-3.5" />
                Alti · {showAlti ? "activo" : "oculto"}
              </button>
            </>
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
            onChange={(event) => { setFrom(event.target.value); setRange("custom"); }}
            className="bg-void-black border-gunmetal text-frost mt-1 block rounded-lg border px-3 py-1.5 text-[12px] normal-case [color-scheme:dark]"
          />
        </label>
        <label className="text-muted-steel text-[11px] uppercase tracking-wider">
          Hasta
          <input
            type="date"
            value={to}
            min={from || firstAvailable}
            max={lastAvailable}
            onChange={(event) => { setTo(event.target.value); setRange("custom"); }}
            className="bg-void-black border-gunmetal text-frost mt-1 block rounded-lg border px-3 py-1.5 text-[12px] normal-case [color-scheme:dark]"
          />
        </label>
        <span className="text-muted-steel ml-auto text-[11px] font-mono">
          Disponible: {firstAvailable} → {lastAvailable}
        </span>
      </div>

      {data.length > 0 ? (
        <div ref={chartRef} className="relative mt-5 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: range === "10y" ? 76 : 4, right: 4, bottom: 0, left: 0 }}>
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
              <YAxis domain={yDomain} tick={{ fontSize: 11, fill: "#646e87" }} tickLine={false} axisLine={false} width={68} tickFormatter={(value: number) => formatPriceQuote(value, currency, true)} />
              <Tooltip
                wrapperStyle={{ zIndex: 5 }}
                contentStyle={{ background: "#151621", border: "1px solid #1f2433", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.5)", fontSize: 12, color: "#ffffff" }}
                labelStyle={{ color: "#c9d3ee", fontWeight: 500 }}
                itemStyle={{ color: "#98a4f7" }}
                labelFormatter={(value) => formatPriceChartDate(Number(value))}
                formatter={(value) => [formatPriceQuote(Number(value), currency), "Cierre"]}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#98a4f7"
                strokeWidth={1.8}
                fill="url(#grad-precio)"
                isAnimationActive={false}
                dot={range === "10y"
                  ? (props) => (
                      <PriceGeometryDot
                        {...props}
                        index={typeof props.index === "number" ? props.index : -1}
                        onGeometry={capturePriceGeometry}
                      />
                    )
                  : false}
              />
            </AreaChart>
          </ResponsiveContainer>
          {range === "10y" && showAlti && (
            <PriceTrendAnimation
              label={ticker}
              geometry={measuredChart?.signature === chartSignature ? measuredChart.geometry : null}
            />
          )}
        </div>
      ) : (
        <div className="text-muted-steel py-16 text-center text-[13px]">
          No hay observaciones entre las fechas seleccionadas. Amplía el intervalo.
        </div>
      )}
      <p className="text-muted-steel mt-3 text-[12px]">Cierres ajustados por splits · frecuencia diaria en el último año, semanal hasta 10 años y mensual antes · en 10 años, el personaje recorre la media móvil de 3 meses · {source} · Divisa: {currency ?? "no declarada"}</p>
    </div>
  );
}

function PriceGeometryDot({
  cx,
  cy,
  index,
  payload,
  onGeometry,
}: {
  cx?: number;
  cy?: number;
  index: number;
  payload?: Timestamped<PricePoint>;
  onGeometry: (point: PricePointGeometry) => void;
}) {
  if (!payload || index < 0 || !Number.isFinite(cx) || !Number.isFinite(cy)) return <g />;
  const geometry = { index, date: payload.date, value: payload.close, x: cx!, y: cy! };

  return (
    <circle
      ref={(node) => {
        if (node) onGeometry(geometry);
      }}
      cx={cx}
      cy={cy}
      r="0"
      fill="transparent"
      data-price-point-index={index}
    />
  );
}

function samePriceGeometry(current: PriceChartGeometry, next: PriceChartGeometry): boolean {
  if (current.width !== next.width || current.height !== next.height || current.points.length !== next.points.length) return false;
  return current.points.every((point, index) => {
    const candidate = next.points[index];
    return point.index === candidate.index
      && point.date === candidate.date
      && point.value === candidate.value
      && point.x === candidate.x
      && point.y === candidate.y;
  });
}
