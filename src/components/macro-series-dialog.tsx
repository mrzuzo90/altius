"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, CalendarRange, TrendingUp, Wallet, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { MacroMetricConfig, MacroPoint } from "@/lib/macro/metrics";
import {
  CID_MASCOTS,
  elapsedYears,
  type CharacterPhase,
  type MascotPhaseConfig,
} from "@/components/statement-trend-animation";
import { useTimeRangeFilter, TimeRangeSelector } from "@/components/time-range-filter";

export type MacroAnnualTrend = {
  rate: number;
  displayValue: string;
  sublabel: string;
  mascot: MascotPhaseConfig;
  years: number;
};

export function calculateMacroAnnualTrend(
  points: readonly MacroPoint[],
  metric: MacroMetricConfig | null,
): MacroAnnualTrend | null {
  if (points.length < 2) return null;
  const firstPoint = points[0];
  const lastPoint = points.at(-1)!;
  if (!firstPoint?.date || !lastPoint?.date) return null;

  const years = elapsedYears(firstPoint.date, lastPoint.date);
  const values = points.map((p) => p.value).filter((v) => Number.isFinite(v));
  if (values.length === 0) return null;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const latest = lastPoint.value;
  const id = metric?.id ?? "";

  let phase: CharacterPhase = "senor";
  let displayValue = "";
  let sublabel = "";
  let rate = mean;

  // 1. Inflación (IPCA Eurozona o IPC EE.UU.)
  if (metric?.yoy || id.includes("CPI")) {
    rate = mean;
    if (mean <= 3.0) phase = "senor";
    else if (mean <= 5.5) phase = "caballero";
    else if (mean <= 9.0) phase = "cuerda";
    else if (mean > 9.0) phase = "canon";
    else phase = "piedra";

    displayValue = `${mean >= 0 ? "+" : ""}${mean.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
    sublabel = `Media anual · actual: ${latest >= 0 ? "+" : ""}${latest.toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`;
  }
  // 2. Tipos de interés (BCE o Fed)
  else if (id === "ECBMRRFR" || id === "FEDFUNDS" || id === "ECBDFR") {
    rate = latest;
    if (latest <= 2.0) phase = "senor";
    else if (latest <= 3.75) phase = "caballero";
    else if (latest <= 5.5) phase = "cuerda";
    else if (latest > 5.5) phase = "canon";
    else phase = "piedra";

    displayValue = `${latest.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
    sublabel = `Tipo actual · media en rango: ${mean.toLocaleString("es-ES", { maximumFractionDigits: 2 })} %`;
  }
  // 3. Paro / Desempleo (Eurostat o BLS)
  else if (id === "EZ_UNRATE" || id === "UNRATE") {
    rate = latest;
    if (latest <= 4.5) phase = "caballero";
    else if (latest <= 7.0) phase = "senor";
    else if (latest <= 10.0) phase = "piedra";
    else phase = "apunalado";

    displayValue = `${latest.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
    sublabel = `Paro actual · media en rango: ${mean.toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`;
  }
  // Genérico / fallback
  else {
    rate = mean;
    phase = "senor";
    displayValue = `${mean.toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${metric?.chartUnit ?? "%"}`;
    sublabel = `Media del periodo (${years.toFixed(1)} años)`;
  }

  const mascot = CID_MASCOTS[phase] ?? CID_MASCOTS.senor;

  return {
    rate,
    displayValue,
    sublabel,
    mascot,
    years,
  };
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
  const {
    range,
    setRange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    filteredData: filteredPoints,
  } = useTimeRangeFilter({
    data: points,
    dateSelector: (p) => p.date,
    defaultRange: "10y",
    keepBaseline: true,
  });

  const annualTrend = useMemo(() => {
    return calculateMacroAnnualTrend(filteredPoints, metric);
  }, [filteredPoints, metric]);

  if (!metric) return null;

  const latest = filteredPoints.at(-1);
  const first = filteredPoints[0];
  const delta = latest && first ? latest.value - first.value : 0;
  const deltaPct =
    latest && first && first.value !== 0
      ? ((latest.value - first.value) / Math.abs(first.value)) * 100
      : null;

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
        </DialogHeader>

        {/* Resumen de métricas superiores */}
        <div className="grid gap-px border-b border-gunmetal bg-gunmetal grid-cols-2 sm:grid-cols-4">
          <div className="bg-carbon-surface px-5 py-3 flex flex-col justify-between">
            <p className="text-muted-steel text-[10px] font-medium uppercase tracking-[0.12em]">
              Última observación
            </p>
            <p className="tabular font-display text-pure-white text-[22px] font-bold leading-tight mt-1">
              {latest
                ? `${latest.value.toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${metric.chartUnit}`
                : "—"}
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

          {/* Figura de Cid con Rendimiento / Tasa Anual: SIN nombre de Cid, SIN etiquetas */}
          <div className="bg-carbon-surface px-5 py-3 flex flex-col justify-between">
            <p className="text-muted-steel text-[10px] font-medium uppercase tracking-[0.12em]">
              Rendimiento anual
            </p>
            <div className="flex items-center gap-3 mt-1">
              {annualTrend ? (
                <>
                  <img
                    src={annualTrend.mascot.src}
                    alt=""
                    className="size-16 sm:size-20 object-contain shrink-0 filter drop-shadow-[0_2px_8px_rgba(152,164,247,0.35)]"
                  />
                  <div className="min-w-0">
                    <p className="tabular font-display text-[20px] font-bold leading-none tracking-tight text-pure-white">
                      {annualTrend.displayValue}
                      <span className="text-[11px] font-normal text-muted-steel ml-1">/ año</span>
                    </p>
                    <p className="text-muted-steel text-[10px] truncate mt-1">
                      {annualTrend.sublabel}
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
        <div className="px-6 pt-4 pb-2">
          <TimeRangeSelector
            range={range}
            setRange={setRange}
            customFrom={customFrom}
            setCustomFrom={setCustomFrom}
            customTo={customTo}
            setCustomTo={setCustomTo}
          />
        </div>

        {/* Gráfico limpio: Cid NO recorre el gráfico */}
        <div className="px-6 py-2">
          <div
            className="relative h-[290px] w-full"
            role="group"
            aria-label={`Gráfico de ${metric.label}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredPoints} margin={{ top: 16, right: 12, bottom: 4, left: 4 }}>
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
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
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

        {/* Sección didáctica para principiantes */}
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
