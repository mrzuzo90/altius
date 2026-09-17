"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, CalendarRange, PersonStanding, TrendingUp, Wallet, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { MacroMetricConfig, MacroPoint } from "@/lib/macro/metrics";
import {
  PriceTrendAnimation,
  type PriceChartGeometry,
  type PricePointGeometry,
} from "@/components/price-trend-animation";
import {
  annualizedChange,
  elapsedYears,
  getCidTrendForRate,
  type CidPatternInfo,
} from "@/components/statement-trend-animation";

export type MacroRangeId = "1y" | "3y" | "5y" | "10y" | "max";

const RANGES: readonly { id: MacroRangeId; label: string }[] = [
  { id: "1y", label: "1 año" },
  { id: "3y", label: "3 años" },
  { id: "5y", label: "5 años" },
  { id: "10y", label: "10 años" },
  { id: "max", label: "Máx." },
];

export type MacroAnnualTrend = CidPatternInfo & {
  rate: number;
  years: number;
  isAnnualized: boolean;
};

export function calculateMacroAnnualTrend(
  points: readonly MacroPoint[],
  minYears: number = 0.5,
): MacroAnnualTrend | null {
  if (points.length < 2) return null;
  const firstPoint = points[0];
  const lastPoint = points.at(-1)!;
  if (!firstPoint?.date || !lastPoint?.date) return null;

  const years = elapsedYears(firstPoint.date, lastPoint.date);
  if (years < minYears) return null;

  let rate: number | null = null;
  if (firstPoint.value > 0 && lastPoint.value > 0) {
    rate = annualizedChange(firstPoint.value, lastPoint.value, years);
  } else {
    // Si los valores cruzan cero o son negativos, cálculo lineal anualizado
    rate = ((lastPoint.value - firstPoint.value) / Math.max(1, Math.abs(firstPoint.value || 1))) * (100 / years);
  }

  if (rate === null || !Number.isFinite(rate)) return null;

  const info = getCidTrendForRate(rate);
  return {
    rate,
    years,
    isAnnualized: true,
    ...info,
  };
}

function filterMacroPoints(points: readonly MacroPoint[], range: MacroRangeId): MacroPoint[] {
  if (points.length === 0 || range === "max") return [...points];
  const lastDate = points.at(-1)?.date;
  if (!lastDate) return [...points];

  const targetDate = new Date(`${lastDate}T00:00:00Z`);
  const yearsToSubtract = range === "1y" ? 1 : range === "3y" ? 3 : range === "5y" ? 5 : 10;
  targetDate.setUTCFullYear(targetDate.getUTCFullYear() - yearsToSubtract);
  const cutoff = targetDate.toISOString().slice(0, 10);

  const filtered = points.filter((p) => p.date >= cutoff);
  return filtered.length >= 2 ? filtered : [...points];
}

export function MacroSeriesDialog({
  metric,
  points,
  open,
  onOpenChange,
}: {
  metric: MacroMetricConfig | null;
  points: MacroPoint[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [range, setRange] = useState<MacroRangeId>("5y");
  const [showCid, setShowCid] = useState(true);
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

  const filteredPoints = useMemo(() => {
    return filterMacroPoints(points, range);
  }, [points, range]);

  const annualTrend = useMemo(() => {
    return calculateMacroAnnualTrend(filteredPoints, 0.25);
  }, [filteredPoints]);

  const chartSignature = `${metric?.id ?? "none"}:${range}:${filteredPoints.length}:${filteredPoints[0]?.date ?? ""}:${filteredPoints.at(-1)?.date ?? ""}`;

  const captureGeometry = useCallback((point: PricePointGeometry) => {
    if (!showCid) return;
    if (geometryCollector.current.signature !== chartSignature) {
      geometryCollector.current = { signature: chartSignature, points: new Map() };
    }
    geometryCollector.current.points.set(point.index, point);
    cancelAnimationFrame(measureFrame.current);
    measureFrame.current = requestAnimationFrame(() => {
      const container = chartRef.current;
      const captured = [...geometryCollector.current.points.values()].sort((a, b) => a.index - b.index);
      if (!container || captured.length < filteredPoints.length || container.clientWidth <= 0 || container.clientHeight <= 0) return;
      const next = { width: container.clientWidth, height: container.clientHeight, points: captured };
      setMeasuredChart((current) => (
        current?.signature === chartSignature && sameGeometry(current.geometry, next)
          ? current
          : { signature: chartSignature, geometry: next }
      ));
    });
  }, [chartSignature, filteredPoints.length, showCid]);

  useEffect(() => () => cancelAnimationFrame(measureFrame.current), []);

  if (!metric) return null;

  const latest = filteredPoints.at(-1);
  const first = filteredPoints[0];
  const delta = latest && first ? latest.value - first.value : 0;
  const deltaPct = latest && first && first.value !== 0 ? ((latest.value - first.value) / Math.abs(first.value)) * 100 : null;

  const gradientId = `grad-macro-dialog-${metric.id}`;
  const strokeColor = metric.color || "#98a4f7";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-carbon-surface border-gunmetal p-0 sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="border-gunmetal border-b px-6 py-4 flex flex-row items-center justify-between space-y-0 sticky top-0 bg-carbon-surface/95 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={metric.regionLabel}>
              {metric.regionFlag}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="font-display text-pure-white text-[20px] font-medium tracking-tight">
                  {metric.label}
                </DialogTitle>
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-gunmetal bg-void-black text-muted-steel">
                  {metric.regionLabel}
                </span>
              </div>
              <DialogDescription className="text-muted-steel text-[12px] mt-0.5">
                {metric.sourceLabel} · Cifras en {metric.chartUnit}
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            aria-pressed={showCid}
            aria-label={`${showCid ? "Ocultar" : "Mostrar"} a Cid en el gráfico`}
            onClick={() => setShowCid((visible) => !visible)}
            className={cn(
              "font-display inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ml-4",
              showCid
                ? "border-periwinkle-glow/60 bg-periwinkle-glow/10 text-periwinkle-glow"
                : "border-gunmetal bg-carbon-surface text-muted-steel hover:text-frost",
            )}
          >
            <PersonStanding className="size-3.5" />
            <span>Cid · {showCid ? "activo" : "oculto"}</span>
          </button>
        </DialogHeader>

        {/* Resumen de métricas superiores */}
        <div className="grid gap-px border-b border-gunmetal bg-gunmetal grid-cols-2 sm:grid-cols-4">
          <div className="bg-carbon-surface px-5 py-3 flex flex-col justify-between">
            <p className="text-muted-steel text-[10px] font-medium uppercase tracking-[0.12em]">
              Última observación
            </p>
            <p className="tabular font-display text-pure-white text-[22px] font-bold leading-tight mt-1">
              {latest ? `${latest.value.toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${metric.chartUnit}` : "—"}
            </p>
            <p className="text-muted-steel text-[11px] truncate mt-0.5">
              {latest ? formatDate(latest.date) : "Sin datos"}
            </p>
          </div>

          <div className="bg-carbon-surface px-5 py-3 flex flex-col justify-between">
            <p className="text-muted-steel text-[10px] font-medium uppercase tracking-[0.12em]">
              Variación en rango
            </p>
            <p
              className={cn(
                "tabular font-display text-[22px] font-bold leading-tight mt-1",
                delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-pure-white",
              )}
            >
              {delta > 0 ? "+" : delta < 0 ? "−" : ""}
              {Math.abs(delta).toLocaleString("es-ES", { maximumFractionDigits: 2 })} {metric.chartUnit}
            </p>
            <p className="text-muted-steel text-[11px] truncate mt-0.5">
              {deltaPct !== null ? `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)} % relativo` : "—"}
            </p>
          </div>

          {/* Figura de Cid con Rendimiento Anual (sin textos redundantes) */}
          <div className="bg-carbon-surface px-5 py-3 flex flex-col justify-between">
            <p className="text-muted-steel text-[10px] font-medium uppercase tracking-[0.12em]">
              Rendimiento anual
            </p>
            <div className="flex items-center gap-2.5 mt-0.5">
              {annualTrend ? (
                <>
                  <img
                    src={annualTrend.mascot.src}
                    alt=""
                    className="size-9 object-contain shrink-0 filter drop-shadow-[0_2px_6px_rgba(152,164,247,0.35)]"
                  />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "tabular font-display text-[17px] font-bold leading-none tracking-tight",
                        annualTrend.rate >= 0 ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      {annualTrend.rate >= 0 ? "+" : ""}
                      {annualTrend.rate.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %
                      <span className="text-[11px] font-normal text-muted-steel ml-1">/ año</span>
                    </p>
                    <p className="text-muted-steel text-[11px] truncate mt-1">
                      {annualTrend.patternName}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-muted-steel text-[12px]">Sin recorrido</p>
              )}
            </div>
          </div>

          <div className="bg-carbon-surface px-5 py-3 flex flex-col justify-between">
            <p className="text-muted-steel text-[10px] font-medium uppercase tracking-[0.12em]">
              Cobertura
            </p>
            <p className="tabular font-display text-pure-white text-[18px] font-medium leading-tight mt-1">
              {filteredPoints.length} observaciones
            </p>
            <p className="text-muted-steel text-[11px] truncate mt-0.5">
              {first && latest ? `${first.date.slice(0, 4)} → ${latest.date.slice(0, 4)}` : "—"}
            </p>
          </div>
        </div>

        {/* Selector de rango de fechas */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-steel text-[12px]">
            <CalendarRange className="size-4 text-periwinkle-glow" />
            <span>Horizonte temporal:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={range === r.id}
                onClick={() => setRange(r.id)}
                className={cn(
                  "font-display rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                  range === r.id
                    ? "bg-periwinkle-glow text-void-black border-transparent font-semibold"
                    : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfico interactivo con Cid */}
        <div className="px-6 py-2">
          <div
            ref={chartRef}
            className="relative h-[290px] w-full"
            role="group"
            aria-label={`Gráfico de ${metric.label}${showCid ? " con animación de Cid" : ""}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredPoints} margin={{ top: 24, right: 12, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#646e87" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={38}
                  tickFormatter={(v: string) => v.slice(0, 4)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#646e87" }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(v: number) => v.toLocaleString("es-ES", { maximumFractionDigits: 1 })}
                />
                <ReferenceLine y={0} stroke="#1f2433" />
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
                  formatter={(v) => [
                    `${Number(v).toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${metric.chartUnit}`,
                    metric.shortLabel,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  isAnimationActive={false}
                  dot={
                    showCid
                      ? (props) => (
                          <MacroGeometryDot
                            {...props}
                            index={typeof props.index === "number" ? props.index : -1}
                            onGeometry={captureGeometry}
                          />
                        )
                      : false
                  }
                />
              </AreaChart>
            </ResponsiveContainer>

            {showCid && (
              <PriceTrendAnimation
                label={metric.label}
                geometry={measuredChart?.signature === chartSignature ? measuredChart.geometry : null}
                annualTrend={annualTrend}
              />
            )}
          </div>

          <div className="text-muted-steel flex items-center justify-between pt-1 text-[11px]">
            <span>{metric.description}</span>
            <a
              href={metric.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-periwinkle-glow hover:underline font-mono"
            >
              Fuente oficial ↗
            </a>
          </div>
        </div>

        {/* Sección educativa para principiantes */}
        <div className="border-t border-gunmetal bg-void-black/60 p-6 space-y-4">
          <div className="flex items-center gap-2 text-pure-white text-[15px] font-medium">
            <BookOpen className="size-4 text-periwinkle-glow" />
            <span>Guía didáctica: ¿Qué significa este dato para tu economía?</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-carbon-surface border border-gunmetal rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-frost text-[13px] font-medium">
                <TrendingUp className="size-4 text-sky-400 shrink-0" />
                <span>¿Qué mide exactamente?</span>
              </div>
              <p className="text-muted-steel text-[12px] leading-[1.6]">
                {metric.education.concept}
              </p>
            </div>

            <div className="bg-carbon-surface border border-gunmetal rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-frost text-[13px] font-medium">
                <Wallet className="size-4 text-emerald-400 shrink-0" />
                <span>¿Cómo afecta a tu día a día?</span>
              </div>
              <p className="text-muted-steel text-[12px] leading-[1.6]">
                {metric.education.dailyLife}
              </p>
            </div>

            <div className="bg-carbon-surface border border-gunmetal rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-frost text-[13px] font-medium">
                <Briefcase className="size-4 text-indigo-400 shrink-0" />
                <span>¿Qué significa al invertir?</span>
              </div>
              <p className="text-muted-steel text-[12px] leading-[1.6]">
                {metric.education.investing}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MacroGeometryDot({
  cx,
  cy,
  index,
  payload,
  onGeometry,
}: {
  cx?: number;
  cy?: number;
  index: number;
  payload?: MacroPoint;
  onGeometry: (point: PricePointGeometry) => void;
}) {
  if (!payload || index < 0 || !Number.isFinite(cx) || !Number.isFinite(cy)) return <g />;
  const geometry: PricePointGeometry = {
    index,
    date: payload.date,
    value: payload.value,
    x: cx!,
    y: cy!,
  };

  return (
    <circle
      ref={(node) => {
        if (node) onGeometry(geometry);
      }}
      cx={cx}
      cy={cy}
      r="0"
      fill="transparent"
      data-macro-point-index={index}
    />
  );
}

function sameGeometry(current: PriceChartGeometry, next: PriceChartGeometry): boolean {
  if (current.width !== next.width || current.height !== next.height || current.points.length !== next.points.length) {
    return false;
  }
  return current.points.every((point, index) => {
    const candidate = next.points[index];
    return (
      point.index === candidate.index &&
      point.date === candidate.date &&
      point.value === candidate.value &&
      point.x === candidate.x &&
      point.y === candidate.y
    );
  });
}
