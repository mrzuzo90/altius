"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { StatementBundle } from "@/lib/sec/statements";
import type { Frequency } from "@/lib/sec/normalize";
import { CID_MASCOTS, type CharacterPhase } from "@/components/statement-trend-animation";
import { cn } from "@/lib/utils";

export type MetricKey =
  | "revenue"
  | "netIncome"
  | "netMargin"
  | "freeCashFlow"
  | "operatingIncome"
  | "operatingMargin";

export type MetricConfig = {
  id: MetricKey;
  label: string;
  shortLabel: string;
  color: string;
  type: "bar" | "line";
  yAxisId: "left" | "right";
};

const METRIC_CONFIGS: MetricConfig[] = [
  { id: "revenue", label: "Ingresos", shortLabel: "Ingresos", color: "#1d8cf8", type: "bar", yAxisId: "left" },
  { id: "netIncome", label: "Beneficio Neto", shortLabel: "Beneficio Neto", color: "#00d084", type: "bar", yAxisId: "left" },
  { id: "netMargin", label: "Margen Neto (%)", shortLabel: "Margen Neto", color: "#f59e0b", type: "line", yAxisId: "right" },
  { id: "freeCashFlow", label: "Flujo Caja Libre", shortLabel: "FCF", color: "#a855f7", type: "bar", yAxisId: "left" },
  { id: "operatingMargin", label: "Margen Operativo (%)", shortLabel: "Margen Op.", color: "#fb923c", type: "line", yAxisId: "right" },
];

export function FinancialOverviewChart({
  bundle,
  ticker,
  frequency,
}: {
  bundle: StatementBundle;
  ticker: string;
  frequency: Frequency;
}) {
  // Métricas activas por defecto: exactamente como en la imagen de referencia (Ingresos, Beneficio Neto, Margen Neto)
  const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>([
    "revenue",
    "netIncome",
    "netMargin",
  ]);

  const toggleMetric = (id: MetricKey) => {
    setActiveMetrics((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Mantener al menos una métrica
        return prev.filter((m) => m !== id);
      }
      return [...prev, id];
    });
  };

  const incomeBlock = bundle.blocks.find((b) => b.id === "income");
  const cashflowBlock = bundle.blocks.find((b) => b.id === "cashflow");

  const periods = incomeBlock?.periods ?? cashflowBlock?.periods ?? [];

  // Filas clave de resultados y caja
  const revenueRow = incomeBlock?.rows.find((r) => r.line.id === "revenue");
  const netIncomeRow = incomeBlock?.rows.find((r) => r.line.id === "netIncome");
  const operatingIncomeRow = incomeBlock?.rows.find((r) => r.line.id === "operatingIncome");
  const fcfRow = cashflowBlock?.rows.find((r) => r.line.id === "freeCashFlow");

  // Determinar la escala monetaria óptima (Billions o Millions)
  const maxRawValue = useMemo(() => {
    let max = 0;
    periods.forEach((p) => {
      const rev = Math.abs(revenueRow?.cells[p.key]?.value ?? 0);
      const net = Math.abs(netIncomeRow?.cells[p.key]?.value ?? 0);
      if (rev > max) max = rev;
      if (net > max) max = net;
    });
    return max;
  }, [periods, revenueRow, netIncomeRow]);

  const isBillions = maxRawValue >= 1e9;
  const divisor = isBillions ? 1e9 : 1e6;
  const unitSuffix = isBillions ? "B" : "M";
  const currencySymbol = bundle.currency === "EUR" ? "€" : "$";
  const unitLabel = isBillions
    ? `Miles de Millones (${currencySymbol} ${bundle.currency ?? "USD"})`
    : `Millones (${currencySymbol} ${bundle.currency ?? "USD"})`;

  // Construcción de la serie histórica multieje
  const chartData = useMemo(() => {
    return periods.map((p) => {
      const rawRev = revenueRow?.cells[p.key]?.value ?? null;
      const rawNet = netIncomeRow?.cells[p.key]?.value ?? null;
      const rawOp = operatingIncomeRow?.cells[p.key]?.value ?? null;
      const rawFcf = fcfRow?.cells[p.key]?.value ?? null;

      const revenue = rawRev !== null ? Number((rawRev / divisor).toFixed(2)) : null;
      const netIncome = rawNet !== null ? Number((rawNet / divisor).toFixed(2)) : null;
      const operatingIncome = rawOp !== null ? Number((rawOp / divisor).toFixed(2)) : null;
      const freeCashFlow = rawFcf !== null ? Number((rawFcf / divisor).toFixed(2)) : null;

      const netMargin =
        rawRev && rawRev !== 0 && rawNet !== null
          ? Number(((rawNet / rawRev) * 100).toFixed(1))
          : null;

      const operatingMargin =
        rawRev && rawRev !== 0 && rawOp !== null
          ? Number(((rawOp / rawRev) * 100).toFixed(1))
          : null;

      return {
        key: p.key,
        year: p.label,
        end: p.end,
        revenue,
        netIncome,
        operatingIncome,
        freeCashFlow,
        netMargin,
        operatingMargin,
      };
    });
  }, [periods, revenueRow, netIncomeRow, operatingIncomeRow, fcfRow, divisor]);

  // Análisis de Cid según el margen y la evolución final
  const latestData = chartData.at(-1);
  const latestMargin = latestData?.netMargin ?? 0;
  const latestGrowth = useMemo(() => {
    if (chartData.length < 2) return 0;
    const prev = chartData.at(-2)?.revenue ?? null;
    const curr = chartData.at(-1)?.revenue ?? null;
    if (prev && curr && prev !== 0) {
      return ((curr - prev) / Math.abs(prev)) * 100;
    }
    return 0;
  }, [chartData]);

  const cidPhase: CharacterPhase = useMemo(() => {
    if (latestMargin > 15 || latestGrowth > 25) return "canon";
    if (latestMargin > 8 || latestGrowth > 10) return "cuerda";
    if (latestMargin > 4 && latestGrowth >= 0) return "caballero";
    if (latestMargin >= 0) return "senor";
    if (latestMargin > -10) return "piedra";
    if (latestMargin > -20) return "flecha";
    return "apunalado";
  }, [latestMargin, latestGrowth]);

  const cidVerdict = useMemo(() => {
    if (cidPhase === "canon") return "Crecimiento explosivo y alta rentabilidad";
    if (cidPhase === "cuerda") return "Expansión sólida y márgenes saludables";
    if (cidPhase === "caballero") return "Negocio equilibrado en progresión positiva";
    if (cidPhase === "senor") return "Resultados estables en consolidación";
    if (cidPhase === "piedra") return "Contracción temporal o presión en márgenes";
    if (cidPhase === "flecha") return "Corrección en rentabilidad que vigilar";
    return "Ejercicio en pérdidas o ajuste estructural";
  }, [cidPhase]);

  const firstYear = chartData[0]?.year ?? "";
  const lastYear = chartData.at(-1)?.year ?? "";
  const mascot = CID_MASCOTS[cidPhase];

  if (chartData.length === 0) return null;

  return (
    <section className="mb-8 overflow-hidden rounded-[24px] border border-gunmetal bg-carbon-surface shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
      {/* Cabecera del gráfico interactivo con Cid */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gunmetal px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-gunmetal bg-void-black/70 p-1">
            <img
              src={mascot.src}
              alt={mascot.label}
              className="size-full object-contain filter drop-shadow-[0_2px_6px_rgba(152,164,247,0.3)]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-[20px] font-medium tracking-tight text-pure-white sm:text-[22px]">
                Evolución Financiera Histórica ({firstYear} - {lastYear})
              </h3>
              <span className="rounded-full border border-periwinkle-glow/30 bg-periwinkle-glow/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-periwinkle-glow">
                {frequency === "quarterly" ? "Trimestral" : "Anual"}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] font-medium text-frost/90">
              <span className="text-periwinkle-glow">Cid evalúa:</span> {cidVerdict}
            </p>
          </div>
        </div>

        {/* Píldoras interactivas para sumar o quitar métricas del gráfico */}
        <div className="flex flex-wrap items-center gap-2">
          {METRIC_CONFIGS.map((cfg) => {
            const isActive = activeMetrics.includes(cfg.id);
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => toggleMetric(cfg.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 font-display text-[12px] font-medium tracking-tight transition-all cursor-pointer shadow-xs",
                  isActive
                    ? "border-gunmetal/80 bg-void-black/80 text-pure-white ring-1"
                    : "border-gunmetal/40 bg-carbon-surface/60 text-muted-steel opacity-50 hover:opacity-85",
                )}
                style={isActive ? { borderColor: cfg.color, color: "#ffffff" } : undefined}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
                <span>
                  {cfg.shortLabel}{" "}
                  {cfg.yAxisId === "left" ? `(${currencySymbol}${unitSuffix})` : "(%)"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenedor del Gráfico Multieje */}
      <div className="relative p-6">
        <div className="mb-2 flex items-center justify-between text-[11px] font-mono text-muted-steel">
          <span>{unitLabel}</span>
          {activeMetrics.some((m) => METRIC_CONFIGS.find((c) => c.id === m)?.yAxisId === "right") && (
            <span>Margen (%)</span>
          )}
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 28, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2433" vertical={false} />

              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "#8a94a6" }}
                tickLine={false}
                axisLine={{ stroke: "#23293a" }}
              />

              {/* Eje izquierdo: Importes monetarios */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "#8a94a6" }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(val: number) => `${val.toLocaleString("es-ES")}`}
              />

              {/* Eje derecho: Margen porcentual */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#f59e0b" }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(val: number) => `${val}%`}
              />

              <Tooltip
                wrapperStyle={{ zIndex: 10 }}
                contentStyle={{
                  background: "#11131d",
                  border: "1px solid #23293a",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#ffffff", fontWeight: 600, marginBottom: 4 }}
                formatter={(value: any, name: any) => {
                  const cfg = METRIC_CONFIGS.find((c) => c.id === name);
                  if (!cfg) return [value, name];
                  if (cfg.yAxisId === "right") {
                    return [`${Number(value).toFixed(1)} %`, cfg.label];
                  }
                  return [
                    `${currencySymbol} ${Number(value).toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${unitSuffix}`,
                    cfg.label,
                  ];
                }}
              />

              {/* Barras de Magnitudes Monetarias */}
              {activeMetrics.includes("revenue") && (
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  name="revenue"
                  fill="#1d8cf8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                  isAnimationActive={true}
                />
              )}

              {activeMetrics.includes("netIncome") && (
                <Bar
                  yAxisId="left"
                  dataKey="netIncome"
                  name="netIncome"
                  fill="#00d084"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                  isAnimationActive={true}
                />
              )}

              {activeMetrics.includes("freeCashFlow") && (
                <Bar
                  yAxisId="left"
                  dataKey="freeCashFlow"
                  name="freeCashFlow"
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                  isAnimationActive={true}
                />
              )}

              {/* Líneas de Porcentajes / Márgenes con Cid coronando el final */}
              {activeMetrics.includes("netMargin") && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="netMargin"
                  name="netMargin"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  isAnimationActive={true}
                  dot={(props: any) => {
                    const isLast = props.index === chartData.length - 1;
                    if (!isLast) {
                      return (
                        <circle
                          key={`dot-${props.index}`}
                          cx={props.cx}
                          cy={props.cy}
                          r={4}
                          fill="#f59e0b"
                          stroke="#151621"
                          strokeWidth={2}
                        />
                      );
                    }
                    // Monigote de Cid posado en el punto final de la curva de margen
                    return (
                      <g key={`cid-perched-${props.index}`} transform={`translate(${props.cx}, ${props.cy})`}>
                        <circle r={6} fill="#f59e0b" className="animate-ping opacity-60" />
                        <circle r={5} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
                        <image
                          href={mascot.src}
                          x={-24}
                          y={-52}
                          width={48}
                          height={48}
                          className="filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
                        />
                      </g>
                    );
                  }}
                />
              )}

              {activeMetrics.includes("operatingMargin") && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="operatingMargin"
                  name="operatingMargin"
                  stroke="#fb923c"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  isAnimationActive={true}
                  dot={{ r: 3, fill: "#fb923c" }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
