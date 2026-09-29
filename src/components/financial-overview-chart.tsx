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
import { ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";
import type { StatementBundle } from "@/lib/sec/statements";
import type { Frequency, LineSeries } from "@/lib/sec/normalize";
import { CID_MASCOTS, type CharacterPhase } from "@/components/statement-trend-animation";
import { cn } from "@/lib/utils";

export type PresetMetricKey =
  | "revenue"
  | "netIncome"
  | "netMargin"
  | "freeCashFlow"
  | "operatingIncome"
  | "operatingMargin";

export type MetricConfig = {
  id: PresetMetricKey;
  label: string;
  shortLabel: string;
  color: string;
  type: "bar" | "line";
  yAxisId: "left" | "right";
};

const PRESET_METRICS: MetricConfig[] = [
  { id: "revenue", label: "Ingresos", shortLabel: "Ingresos", color: "#1d8cf8", type: "bar", yAxisId: "left" },
  { id: "netIncome", label: "Beneficio Neto", shortLabel: "Beneficio Neto", color: "#00d084", type: "bar", yAxisId: "left" },
  { id: "netMargin", label: "Margen Neto (%)", shortLabel: "Margen Neto", color: "#f59e0b", type: "line", yAxisId: "right" },
  { id: "freeCashFlow", label: "Flujo Caja Libre", shortLabel: "FCF", color: "#a855f7", type: "bar", yAxisId: "left" },
  { id: "operatingMargin", label: "Margen Operativo (%)", shortLabel: "Margen Op.", color: "#fb923c", type: "line", yAxisId: "right" },
];

const CUSTOM_COLORS = [
  "#38bdf8",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#eab308",
  "#06b6d4",
  "#84cc16",
];

function findRowByKeywords(
  blocks: StatementBundle["blocks"],
  blockId: string,
  lineId: string,
  keywords: string[],
): LineSeries | null {
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const exact = block.rows.find((r) => r.line.id === lineId);
  if (exact) return exact;
  return (
    block.rows.find((r) => {
      const l = r.line.label.toLowerCase();
      const id = r.line.id.toLowerCase();
      return keywords.some((k) => l.includes(k) || id.includes(k));
    }) ?? null
  );
}

export function FinancialOverviewChart({
  id = "financial-overview-chart",
  bundle,
  ticker,
  frequency,
  customLines = [],
  onToggleLine,
}: {
  id?: string;
  bundle: StatementBundle;
  ticker: string;
  frequency: Frequency;
  customLines?: LineSeries[];
  onToggleLine?: (line: LineSeries) => void;
}) {
  const [activePresets, setActivePresets] = useState<PresetMetricKey[]>([
    "revenue",
    "netIncome",
    "netMargin",
  ]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const togglePreset = (id: PresetMetricKey) => {
    setActivePresets((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1 && customLines.length === 0) return prev;
        return prev.filter((m) => m !== id);
      }
      return [...prev, id];
    });
  };

  const incomeBlock = bundle.blocks.find((b) => b.id === "income");
  const cashflowBlock = bundle.blocks.find((b) => b.id === "cashflow");
  const periods = incomeBlock?.periods ?? cashflowBlock?.periods ?? bundle.blocks[0]?.periods ?? [];

  // Búsqueda inteligente de partidas clave adaptada a SEC y ESEF
  const revenueRow = useMemo(
    () => findRowByKeywords(bundle.blocks, "income", "revenue", ["revenue", "ingreso", "venta", "turnover"]),
    [bundle.blocks],
  );
  const netIncomeRow = useMemo(
    () => findRowByKeywords(bundle.blocks, "income", "netIncome", ["net income", "beneficio neto", "resultado del ejercicio", "net loss"]),
    [bundle.blocks],
  );
  const operatingIncomeRow = useMemo(
    () => findRowByKeywords(bundle.blocks, "income", "operatingIncome", ["operating income", "explotación", "operativo", "ebit"]),
    [bundle.blocks],
  );
  const fcfRow = useMemo(
    () => findRowByKeywords(bundle.blocks, "cashflow", "freeCashFlow", ["free cash flow", "flujo de caja libre", "libre"]),
    [bundle.blocks],
  );

  // Escala monetaria automática
  const maxRawValue = useMemo(() => {
    let max = 0;
    periods.forEach((p) => {
      const rev = Math.abs(revenueRow?.cells[p.key]?.value ?? 0);
      const net = Math.abs(netIncomeRow?.cells[p.key]?.value ?? 0);
      if (rev > max) max = rev;
      if (net > max) max = net;
      customLines.forEach((cl) => {
        if (cl.line.unit !== "percent") {
          const v = Math.abs(cl.cells[p.key]?.value ?? 0);
          if (v > max) max = v;
        }
      });
    });
    return max;
  }, [periods, revenueRow, netIncomeRow, customLines]);

  const isBillions = maxRawValue >= 1e9;
  const divisor = isBillions ? 1e9 : 1e6;
  const unitSuffix = isBillions ? "B" : "M";
  const currencySymbol = bundle.currency === "EUR" ? "€" : bundle.currency === "GBP" ? "£" : "$";
  const unitLabel = isBillions
    ? `Miles de Millones (${currencySymbol} ${bundle.currency ?? "USD"})`
    : `Millones (${currencySymbol} ${bundle.currency ?? "USD"})`;

  // Construcción de los puntos del gráfico
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

      const point: Record<string, any> = {
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

      // Inyección de líneas personalizadas seleccionadas desde la tabla
      customLines.forEach((cl) => {
        const val = cl.cells[p.key]?.value ?? null;
        if (val !== null) {
          point[cl.line.id] = cl.line.unit === "percent" ? Number(val.toFixed(1)) : Number((val / divisor).toFixed(2));
        } else {
          point[cl.line.id] = null;
        }
      });

      return point;
    });
  }, [periods, revenueRow, netIncomeRow, operatingIncomeRow, fcfRow, divisor, customLines]);

  // Análisis de postura de Cid según márgenes y crecimiento
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
    if (cidPhase === "canon") return "Crecimiento de alto impacto y rentabilidad";
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

  const hasRightAxis =
    activePresets.some((m) => PRESET_METRICS.find((c) => c.id === m)?.yAxisId === "right") ||
    customLines.some((cl) => cl.line.unit === "percent");

  if (chartData.length === 0) return null;

  return (
    <section
      id={id}
      className="mb-8 overflow-hidden rounded-[24px] border border-gunmetal bg-carbon-surface shadow-[0_24px_80px_rgba(0,0,0,0.25)] transition-all"
    >
      {/* Cabecera del gráfico con Cid y conmutadores */}
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

        {/* Controles de métricas y botón de minimizar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Píldoras predefinidas */}
          {PRESET_METRICS.map((cfg) => {
            const isActive = activePresets.includes(cfg.id);
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => togglePreset(cfg.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 font-display text-[12px] font-medium tracking-tight transition-all cursor-pointer shadow-xs",
                  isActive
                    ? "border-gunmetal/80 bg-void-black/80 text-pure-white ring-1"
                    : "border-gunmetal/40 bg-carbon-surface/60 text-muted-steel opacity-50 hover:opacity-85",
                )}
                style={isActive ? { borderColor: cfg.color, color: "#ffffff" } : undefined}
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span>
                  {cfg.shortLabel} {cfg.yAxisId === "left" ? `(${currencySymbol}${unitSuffix})` : "(%)"}
                </span>
              </button>
            );
          })}

          {/* Píldoras de partidas añadidas dinámicamente desde la tabla */}
          {customLines.map((cl, idx) => {
            const color = CUSTOM_COLORS[idx % CUSTOM_COLORS.length];
            return (
              <div
                key={cl.line.id}
                className="flex items-center gap-1.5 rounded-full border border-periwinkle-glow/60 bg-void-black/90 px-3 py-1 font-display text-[12px] font-medium text-pure-white shadow-xs"
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="max-w-[120px] truncate">{cl.line.label}</span>
                {onToggleLine && (
                  <button
                    type="button"
                    onClick={() => onToggleLine(cl)}
                    className="text-muted-steel hover:text-rose-400 ml-1 transition-colors cursor-pointer"
                    title={`Quitar ${cl.line.label} del gráfico`}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Botón no invasivo para minimizar o desplegar */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="border-gunmetal bg-void-black/70 hover:bg-gunmetal/40 text-muted-steel hover:text-frost flex items-center gap-1 rounded-full border px-3 py-1 font-display text-[11px] font-medium transition-colors cursor-pointer ml-1"
            title={isCollapsed ? "Ver gráfico desplegado" : "Minimizar gráfico"}
          >
            {isCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
            <span>{isCollapsed ? "Ver gráfico" : "Minimizar"}</span>
          </button>
        </div>
      </div>

      {/* Cuerpo del Gráfico Desplegable */}
      {!isCollapsed && (
        <div className="relative p-6 animate-in fade-in-0 duration-200">
          <div className="mb-2 flex items-center justify-between text-[11px] font-mono text-muted-steel">
            <span>{unitLabel}</span>
            {hasRightAxis && <span>Margen / Ratios (%)</span>}
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
                    const presetCfg = PRESET_METRICS.find((c) => c.id === name);
                    if (presetCfg) {
                      if (presetCfg.yAxisId === "right") {
                        return [`${Number(value).toFixed(1)} %`, presetCfg.label];
                      }
                      return [
                        `${currencySymbol} ${Number(value).toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${unitSuffix}`,
                        presetCfg.label,
                      ];
                    }
                    const customLine = customLines.find((cl) => cl.line.id === name);
                    if (customLine) {
                      if (customLine.line.unit === "percent") {
                        return [`${Number(value).toFixed(1)} %`, customLine.line.label];
                      }
                      return [
                        `${currencySymbol} ${Number(value).toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${unitSuffix}`,
                        customLine.line.label,
                      ];
                    }
                    return [value, name];
                  }}
                />

                {/* Barras de Magnitudes Monetarias Predefinidas */}
                {activePresets.includes("revenue") && (
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

                {activePresets.includes("netIncome") && (
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

                {activePresets.includes("freeCashFlow") && (
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
                {activePresets.includes("netMargin") && (
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
                      // Monigote de Cid posado sobre el final de la curva de márgenes
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

                {activePresets.includes("operatingMargin") && (
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

                {/* Inyección de series personalizadas de la tabla */}
                {customLines.map((cl, idx) => {
                  const color = CUSTOM_COLORS[idx % CUSTOM_COLORS.length];
                  if (cl.line.unit === "percent") {
                    return (
                      <Line
                        key={cl.line.id}
                        yAxisId="right"
                        type="monotone"
                        dataKey={cl.line.id}
                        name={cl.line.id}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: color }}
                        isAnimationActive={true}
                      />
                    );
                  }
                  return (
                    <Bar
                      key={cl.line.id}
                      yAxisId="left"
                      dataKey={cl.line.id}
                      name={cl.line.id}
                      fill={color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={44}
                      isAnimationActive={true}
                    />
                  );
                })}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
