"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { IndicatorPoint } from "@/lib/technical/types";
import { filterPricePoints, type PriceRangeId } from "@/lib/prices/ranges";
import {
  chartSpanDays,
  chartTimeTicks,
  formatPriceChartDate,
  formatPriceChartTick,
  formatPriceQuote,
  priceChartDomain,
  timestampPricePoints,
} from "@/lib/prices/chart";

const RANGOS = [
  { id: "3m", label: "3 meses", range: "3m" },
  { id: "6m", label: "6 meses", range: "6m" },
  { id: "1a", label: "1 año", range: "1y" },
  { id: "3a", label: "3 años", range: "3y" },
  { id: "5a", label: "5 años", range: "5y" },
  { id: "max", label: "Máx", range: "max" },
] as const;

export function TechnicalChart({
  points,
  source,
  currency = "USD",
}: {
  points: IndicatorPoint[];
  source: string;
  currency?: string;
}) {
  const [rango, setRango] = useState<(typeof RANGOS)[number]["id"]>("1a");

  // Toggles de indicadores superpuestos en el gráfico principal
  const [showSma20, setShowSma20] = useState(false);
  const [showSma50, setShowSma50] = useState(true);
  const [showSma200, setShowSma200] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);

  // Subgráfico inferior
  const [subIndicator, setSubIndicator] = useState<"rsi" | "macd" | "none">("rsi");

  const datos = useMemo(() => {
    const def = RANGOS.find((r) => r.id === rango)!;
    return filterPricePoints(points, def.range as PriceRangeId);
  }, [points, rango]);
  const chartData = useMemo(() => timestampPricePoints(datos), [datos]);
  const spanDays = chartSpanDays(chartData);
  const xTicks = useMemo(() => chartTimeTicks(chartData), [chartData]);
  const yDomain = useMemo(() => priceChartDomain(datos), [datos]);

  if (datos.length === 0) {
    return (
      <div className="bg-carbon-surface border-gunmetal text-muted-steel rounded-2xl border border-dashed px-6 py-16 text-center text-[13px]">
        No hay observaciones suficientes para construir el análisis técnico.
      </div>
    );
  }

  const primero = datos[0].close;
  const ultimo = datos.at(-1)!.close;
  const sube = ultimo >= primero;
  const variacion = primero !== 0 ? ((ultimo - primero) / primero) * 100 : null;

  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6 space-y-6">
      {/* Cabecera del Gráfico: Precio, Variación y Controles */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="tabular font-display text-pure-white text-[34px] font-medium leading-none tracking-tight">
            {formatPriceQuote(ultimo, currency)}
          </span>
          <span
            className={cn(
              "tabular text-[13px] font-mono font-medium px-2 py-0.5 rounded border",
              sube
                ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/40"
                : "text-rose-400 bg-rose-950/40 border-rose-800/40",
            )}
          >
            {variacion !== null ? (sube ? "+" : "−") : ""}
            {variacion !== null ? `${Math.abs(variacion).toLocaleString("es-ES", { maximumFractionDigits: 2 })} %` : "—"}
          </span>
        </div>

        {/* Selector de Rango Temporal */}
        <div className="bg-void-black border-gunmetal inline-flex self-start rounded-full border p-1 sm:self-auto">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={rango === r.id}
              onClick={() => setRango(r.id)}
              className={cn(
                "font-display rounded-full px-3 py-1 text-[12px] font-medium tracking-tight transition-colors cursor-pointer",
                rango === r.id ? "bg-gunmetal text-pure-white shadow-xs" : "text-muted-steel hover:text-frost",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Toggles de Indicadores Técnicos */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-gunmetal/60 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-muted-steel font-mono mr-1">Superposiciones:</span>

          <button
            type="button"
            onClick={() => setShowSma20((v) => !v)}
            className={cn(
              "px-2.5 py-1 rounded-md border font-mono transition-colors cursor-pointer flex items-center gap-1.5",
              showSma20
                ? "bg-sky-950/60 border-sky-500 text-sky-300 font-semibold"
                : "bg-void-black border-gunmetal text-muted-steel hover:text-frost",
            )}
          >
            <span className="size-2 rounded-full bg-[#38bdf8]" />
            SMA 20
          </button>

          <button
            type="button"
            onClick={() => setShowSma50((v) => !v)}
            className={cn(
              "px-2.5 py-1 rounded-md border font-mono transition-colors cursor-pointer flex items-center gap-1.5",
              showSma50
                ? "bg-amber-950/60 border-amber-500 text-amber-300 font-semibold"
                : "bg-void-black border-gunmetal text-muted-steel hover:text-frost",
            )}
          >
            <span className="size-2 rounded-full bg-[#fbbf24]" />
            SMA 50
          </button>

          <button
            type="button"
            onClick={() => setShowSma200((v) => !v)}
            className={cn(
              "px-2.5 py-1 rounded-md border font-mono transition-colors cursor-pointer flex items-center gap-1.5",
              showSma200
                ? "bg-purple-950/60 border-purple-500 text-purple-300 font-semibold"
                : "bg-void-black border-gunmetal text-muted-steel hover:text-frost",
            )}
          >
            <span className="size-2 rounded-full bg-[#c084fc]" />
            SMA 200
          </button>

          <button
            type="button"
            onClick={() => setShowBollinger((v) => !v)}
            className={cn(
              "px-2.5 py-1 rounded-md border font-mono transition-colors cursor-pointer flex items-center gap-1.5",
              showBollinger
                ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold"
                : "bg-void-black border-gunmetal text-muted-steel hover:text-frost",
            )}
          >
            <span className="size-2 rounded-full bg-[#34d399]" />
            Bandas Bollinger
          </button>
        </div>

        {/* Selector de Subgráfico */}
        <div className="flex items-center gap-1 text-[12px]">
          <span className="text-muted-steel font-mono mr-1">Oscilador:</span>
          <div className="bg-void-black border-gunmetal rounded-lg border p-0.5 inline-flex">
            <button
              type="button"
              onClick={() => setSubIndicator("rsi")}
              className={cn(
                "px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer",
                subIndicator === "rsi" ? "bg-gunmetal text-pure-white font-medium" : "text-muted-steel hover:text-frost",
              )}
            >
              RSI (14)
            </button>
            <button
              type="button"
              onClick={() => setSubIndicator("macd")}
              className={cn(
                "px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer",
                subIndicator === "macd" ? "bg-gunmetal text-pure-white font-medium" : "text-muted-steel hover:text-frost",
              )}
            >
              MACD (12, 26, 9)
            </button>
            <button
              type="button"
              onClick={() => setSubIndicator("none")}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer",
                subIndicator === "none" ? "bg-gunmetal text-pure-white font-medium" : "text-muted-steel hover:text-frost",
              )}
            >
              Ocultar
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico Principal de Cotización */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="grad-precio-tech" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#98a4f7" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#98a4f7" stopOpacity={0.0} />
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
              minTickGap={48}
              tickFormatter={(value: number) => formatPriceChartTick(value, spanDays)}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11, fill: "#646e87" }}
              tickLine={false}
              axisLine={false}
              width={58}
              tickFormatter={(value: number) => formatPriceQuote(value, currency, true)}
            />
            <Tooltip
              contentStyle={{
                background: "#12141c",
                border: "1px solid #23293a",
                borderRadius: 10,
                boxShadow: "0 6px 16px rgba(0,0,0,0.6)",
                fontSize: 12,
                color: "#ffffff",
              }}
              labelStyle={{ color: "#c9d3ee", fontWeight: 600, marginBottom: 4 }}
              labelFormatter={(value) => formatPriceChartDate(Number(value))}
              formatter={(val, name) => {
                const n = Number(val);
                const formatNum = (num: number) => formatPriceQuote(num, currency);

                if (name === "close") return [formatNum(n), "Precio"];
                if (name === "sma20") return [formatNum(n), "SMA 20"];
                if (name === "sma50") return [formatNum(n), "SMA 50"];
                if (name === "sma200") return [formatNum(n), "SMA 200"];
                if (name === "bollingerUpper") return [formatNum(n), "Bollinger Sup."];
                if (name === "bollingerLower") return [formatNum(n), "Bollinger Inf."];
                return [n.toFixed(2), String(name)];
              }}
            />

            {/* Bandas de Bollinger */}
            {showBollinger && (
              <Line
                type="monotone"
                dataKey="bollingerUpper"
                stroke="#34d399"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showBollinger && (
              <Line
                type="monotone"
                dataKey="bollingerLower"
                stroke="#34d399"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Precio Base */}
            <Area
              type="monotone"
              dataKey="close"
              stroke="#98a4f7"
              strokeWidth={2}
              fill="url(#grad-precio-tech)"
              isAnimationActive={false}
              dot={false}
            />

            {/* Medias Móviles */}
            {showSma20 && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#38bdf8"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showSma50 && (
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#fbbf24"
                strokeWidth={1.6}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showSma200 && (
              <Line
                type="monotone"
                dataKey="sma200"
                stroke="#c084fc"
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Subgráfico Oscilador Inferior: RSI o MACD */}
      {subIndicator === "rsi" && (
        <div className="border-t border-gunmetal/80 pt-4">
          <div className="mb-2 flex items-center justify-between text-[12px] font-mono">
            <span className="text-frost font-medium">Índice de Fuerza Relativa (RSI 14)</span>
            <div className="flex items-center gap-3 text-muted-steel text-[11px]">
              <span className="text-rose-400">Sobrecompra ≥ 70</span>
              <span className="text-emerald-400">Sobreventa ≤ 30</span>
            </div>
          </div>

          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="timestamp" type="number" scale="time" domain={["dataMin", "dataMax"]} hide />
                <YAxis
                  domain={[0, 100]}
                  ticks={[30, 50, 70]}
                  tick={{ fontSize: 10, fill: "#646e87" }}
                  tickLine={false}
                  axisLine={false}
                  width={34}
                />
                <ReferenceArea y1={70} y2={100} fill="#f43f5e" fillOpacity={0.08} />
                <ReferenceArea y1={0} y2={30} fill="#10b981" fillOpacity={0.08} />
                <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={50} stroke="#646e87" strokeDasharray="2 2" strokeWidth={1} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
                <Tooltip
                  contentStyle={{
                    background: "#12141c",
                    border: "1px solid #23293a",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelFormatter={(value) => formatPriceChartDate(Number(value))}
                  formatter={(val) => [`${Number(val).toFixed(1)} / 100`, "RSI 14"]}
                />
                <Line
                  type="monotone"
                  dataKey="rsi14"
                  stroke="#a78bfa"
                  strokeWidth={1.8}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {subIndicator === "macd" && (
        <div className="border-t border-gunmetal/80 pt-4">
          <div className="mb-2 flex items-center justify-between text-[12px] font-mono">
            <span className="text-frost font-medium">MACD (12, 26, 9)</span>
            <div className="flex items-center gap-3 text-muted-steel text-[11px]">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-cyan-400" /> Línea MACD
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-amber-400" /> Señal
              </span>
            </div>
          </div>

          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="timestamp" type="number" scale="time" domain={["dataMin", "dataMax"]} hide />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "#646e87" }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                  tickFormatter={(v: number) => v.toFixed(1)}
                />
                <ReferenceLine y={0} stroke="#646e87" strokeWidth={1} />
                <Tooltip
                  contentStyle={{
                    background: "#12141c",
                    border: "1px solid #23293a",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelFormatter={(value) => formatPriceChartDate(Number(value))}
                  formatter={(val, name) => [
                    Number(val).toFixed(2),
                    name === "macdLine" ? "MACD" : name === "macdSignal" ? "Señal" : "Histograma",
                  ]}
                />
                <Bar
                  dataKey="macdHistogram"
                  fill="#38bdf8"
                  isAnimationActive={false}
                  shape={(props: unknown) => {
                    const { x, y, width, height, value } = props as {
                      x: number;
                      y: number;
                      width: number;
                      height: number;
                      value: number;
                    };
                    const fill = value >= 0 ? "#34d399" : "#f87171";
                    return <rect x={x} y={y} width={Math.max(1, width)} height={Math.max(1, height)} fill={fill} rx={1} />;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="macdLine"
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="macdSignal"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pie de Fuente */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gunmetal/60 pt-3 text-[12px] text-muted-steel">
        <p>Serie histórica ajustada · Cálculos cuantitativos directos · {source}</p>
        <span className="font-mono text-[11px] text-frost/70">
          Última obs: {datos.at(-1)?.date ?? "—"}
        </span>
      </div>
    </div>
  );
}
