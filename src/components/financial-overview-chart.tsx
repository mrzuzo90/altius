"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ChevronDown, ChevronUp, X, Sparkles, RotateCcw } from "lucide-react";
import type { StatementBundle } from "@/lib/sec/statements";
import type { Frequency, LineSeries } from "@/lib/sec/normalize";
import {
  CID_MASCOTS,
  AdaptiveCharacter,
  StaticAdaptiveCharacter,
  characterPhaseForChange,
  type CharacterPhase,
  type CharacterMotionPlan,
} from "@/components/statement-trend-animation";
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

export type TimeHorizon = "3y" | "5y" | "10y" | "all";

export type OverviewChartPoint = {
  key: string;
  year: string;
  end: string;
  revenue: number | null;
  netIncome: number | null;
  operatingIncome: number | null;
  freeCashFlow: number | null;
  netMargin: number | null;
  operatingMargin: number | null;
  __cidScore: number;
  [customKey: string]: any;
};

const HORIZON_OPTIONS: { id: TimeHorizon; label: string; shortLabel: string; count: number | null }[] = [
  { id: "3y", label: "3 Años", shortLabel: "3A", count: 3 },
  { id: "5y", label: "5 Años", shortLabel: "5A", count: 5 },
  { id: "10y", label: "10 Años", shortLabel: "10A", count: 10 },
  { id: "all", label: "Todo el Histórico", shortLabel: "Todo", count: null },
];

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

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  return reduced;
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
  const [showCid, setShowCid] = useState(true);
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("10y");
  const [animKey, setAnimKey] = useState(0);

  const reducedMotion = usePrefersReducedMotion();
  const animationRootRef = useRef<SVGSVGElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const togglePreset = (presetId: PresetMetricKey) => {
    setActivePresets((prev) => {
      if (prev.includes(presetId)) {
        if (prev.length <= 1 && customLines.length === 0) return prev;
        return prev.filter((m) => m !== presetId);
      }
      return [...prev, presetId];
    });
  };

  const incomeBlock = bundle.blocks.find((b) => b.id === "income");
  const cashflowBlock = bundle.blocks.find((b) => b.id === "cashflow");
  const rawPeriods = incomeBlock?.periods ?? cashflowBlock?.periods ?? bundle.blocks[0]?.periods ?? [];

  // Orden cronológico de menor a mayor (años iniciales a la izquierda, últimos años a la derecha)
  const allChronologicalPeriods = useMemo(() => {
    return [...rawPeriods].sort((a, b) => {
      if (a.end && b.end) {
        return a.end.localeCompare(b.end);
      }
      if (a.fiscalYear !== b.fiscalYear) {
        return a.fiscalYear - b.fiscalYear;
      }
      return a.quarter - b.quarter;
    });
  }, [rawPeriods]);

  // Filtrado según el horizonte temporal decidido por el usuario (10 años por defecto)
  const periods = useMemo(() => {
    const horizonConfig = HORIZON_OPTIONS.find((h) => h.id === timeHorizon);
    if (!horizonConfig || horizonConfig.count === null) {
      return allChronologicalPeriods;
    }
    return allChronologicalPeriods.slice(-horizonConfig.count);
  }, [allChronologicalPeriods, timeHorizon]);

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

  // Escala monetaria automática basada en los periodos visibles
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

  // Construcción de los puntos del gráfico con cálculo de puntuación agregada para Cid
  const chartData: OverviewChartPoint[] = useMemo(() => {
    const rawPoints: OverviewChartPoint[] = periods.map((p) => {
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

      const point: OverviewChartPoint = {
        key: p.key,
        year: p.label,
        end: p.end,
        revenue,
        netIncome,
        operatingIncome,
        freeCashFlow,
        netMargin,
        operatingMargin,
        __cidScore: 50,
      };

      // Inyección de líneas personalizadas de la tabla
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

    if (rawPoints.length === 0) return [];

    // Cálculo de la agregación de todos los gráficos activos en ese momento
    // Obtenemos los rangos [min, max] de cada métrica activa para normalizarla a escala 20-80
    const activeSeriesKeys: string[] = [
      ...activePresets,
      ...customLines.map((cl) => cl.line.id),
    ];

    const seriesMinMax: Record<string, { min: number; max: number }> = {};
    activeSeriesKeys.forEach((key) => {
      const values = rawPoints
        .map((p) => p[key])
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      if (values.length > 0) {
        seriesMinMax[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    });

    return rawPoints.map((point): OverviewChartPoint => {
      let totalNormalized = 0;
      let count = 0;

      activeSeriesKeys.forEach((key) => {
        const val = point[key];
        const bounds = seriesMinMax[key];
        if (typeof val === "number" && bounds) {
          const range = bounds.max - bounds.min;
          const normalized = range > 0 ? 20 + ((val - bounds.min) / range) * 60 : 50;
          totalNormalized += normalized;
          count += 1;
        }
      });

      const aggregateScore = count > 0 ? Number((totalNormalized / count).toFixed(1)) : 50;
      point.__cidScore = aggregateScore;
      return point;
    });
  }, [
    periods,
    revenueRow,
    netIncomeRow,
    operatingIncomeRow,
    fcfRow,
    divisor,
    customLines,
    activePresets,
  ]);

  // Cálculo del crecimiento en el horizonte temporal seleccionado
  const rangeGrowth = useMemo(() => {
    if (chartData.length < 2) return null;
    const firstPoint = chartData[0];
    const lastPoint = chartData.at(-1)!;
    const yearsCount = chartData.length - 1;

    // Crecimiento de ingresos
    const revStart = firstPoint.revenue;
    const revEnd = lastPoint.revenue;
    let revTotalPct: number | null = null;
    let revCagrPct: number | null = null;
    if (revStart && revEnd && revStart > 0 && revEnd > 0 && yearsCount > 0) {
      revTotalPct = ((revEnd - revStart) / revStart) * 100;
      revCagrPct = (Math.pow(revEnd / revStart, 1 / yearsCount) - 1) * 100;
    }

    // Crecimiento de beneficio neto
    const netStart = firstPoint.netIncome;
    const netEnd = lastPoint.netIncome;
    let netTotalPct: number | null = null;
    let netCagrPct: number | null = null;
    if (netStart && netEnd && netStart > 0 && netEnd > 0 && yearsCount > 0) {
      netTotalPct = ((netEnd - netStart) / netStart) * 100;
      netCagrPct = (Math.pow(netEnd / netStart, 1 / yearsCount) - 1) * 100;
    }

    return {
      yearsCount,
      revTotalPct,
      revCagrPct,
      netTotalPct,
      netCagrPct,
    };
  }, [chartData]);

  // Dimensiones seguras del contenedor mediante ResizeObserver (sin re-renders infinitos)
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      if (el.clientWidth > 0) setContainerWidth(el.clientWidth);
    };
    updateWidth();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [isCollapsed]);

  const hasRightAxis =
    activePresets.some((m) => PRESET_METRICS.find((c) => c.id === m)?.yAxisId === "right") ||
    customLines.some((cl) => cl.line.unit === "percent");

  // Plan de movimiento y fases de Cid según la agregación de todos los gráficos
  const { motionPlan, finalPhase, pointsGeometry } = useMemo(() => {
    if (chartData.length === 0) {
      return {
        motionPlan: { path: "", phases: [], keyTimes: [0, 1], changesPct: [] } as CharacterMotionPlan,
        finalPhase: "senor" as CharacterPhase,
        pointsGeometry: [],
      };
    }

    const n = chartData.length;
    const usableLeft = 56;
    const usableRight = containerWidth - (hasRightAxis ? 64 : 24);
    const usableTop = 32;
    const usableHeight = 270;
    const stepX = (usableRight - usableLeft) / Math.max(1, n);

    // Coordenadas calculadas limpiamente de forma síncrona
    const points = chartData.map((d, i) => {
      const x = usableLeft + (i + 0.5) * stepX;
      const score = d.__cidScore ?? 50;
      const y = usableTop + usableHeight * (1 - score / 100);
      return { index: i, x, y, score, year: d.year };
    });

    if (points.length < 2) {
      const singlePhase: CharacterPhase = "senor";
      return {
        motionPlan: {
          path: `M ${points[0]?.x ?? 0} ${points[0]?.y ?? 0}`,
          phases: [singlePhase],
          keyTimes: [0, 1],
          changesPct: [0],
        },
        finalPhase: singlePhase,
        pointsGeometry: points,
      };
    }

    // Variaciones agregadas entre periodos consecutivos y determinación de las fases de Cid
    const changesPct: number[] = [];
    const phases: CharacterPhase[] = [];
    for (let i = 1; i < points.length; i++) {
      const diff = points[i].score - points[i - 1].score;
      const changePct = diff * 2.5; // Escala proporcional al porcentaje de cambio
      changesPct.push(changePct);
      phases.push(characterPhaseForChange(changePct));
    }

    // Construcción de la ruta suave de movimiento (Catmull-Rom a Bezier Cúbica)
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    const lengths: number[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      lengths.push(Math.hypot(p2.x - p1.x, p2.y - p1.y));
    }

    const totalLength = lengths.reduce((acc, len) => acc + len, 0);
    const keyTimes = [0];
    let traversed = 0;
    lengths.forEach((len) => {
      traversed += len;
      keyTimes.push(totalLength > 0 ? traversed / totalLength : keyTimes.length / lengths.length);
    });
    keyTimes[keyTimes.length - 1] = 1;

    const finalPhase = phases.at(-1) ?? "senor";
    return {
      motionPlan: { path, phases, keyTimes, changesPct },
      finalPhase,
      pointsGeometry: points,
    };
  }, [chartData, hasRightAxis, containerWidth]);

  // Veredicto global de Cid en la cabecera
  const cidVerdict = useMemo(() => {
    switch (finalPhase) {
      case "canon":
        return "Crecimiento de alto impacto en todas las magnitudes activas";
      case "cuerda":
        return "Expansión sólida y equilibrada en los gráficos seleccionados";
      case "caballero":
        return "Trayectoria agregada con progresión constructiva y estable";
      case "senor":
        return "Consolidación general y resultados agregados sin grandes variaciones";
      case "piedra":
        return "Contracción o desaceleración moderada en el conjunto de métricas";
      case "flecha":
        return "Corrección generalizada en los indicadores seleccionados";
      case "apunalado":
      default:
        return "Presión estructural o caída simultánea en los gráficos activos";
    }
  }, [finalPhase]);

  const mascot = CID_MASCOTS[finalPhase];
  const firstYear = chartData[0]?.year ?? "";
  const lastYear = chartData.at(-1)?.year ?? "";
  const duration = Math.min(26, Math.max(12, chartData.length * 1.8));

  // Disparo de la animación de Cid por el gráfico agregado
  useEffect(() => {
    if (reducedMotion || !motionPlan.path || !showCid) return;
    const frame = requestAnimationFrame(() => {
      animationRootRef.current
        ?.querySelectorAll<SVGAnimationElement>("animate, animateMotion")
        .forEach((anim) => {
          try {
            anim.beginElement();
          } catch {
            // Entornos de prueba o sin soporte SVG SMIL
          }
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [motionPlan.path, duration, reducedMotion, showCid, animKey, timeHorizon]);

  if (chartData.length === 0) return null;

  const lastLandingPoint = pointsGeometry.at(-1);

  return (
    <section
      id={id}
      className="mb-8 overflow-hidden rounded-[24px] border border-gunmetal bg-carbon-surface shadow-[0_24px_80px_rgba(0,0,0,0.25)] transition-all"
    >
      {/* Cabecera del gráfico con Cid, selector de horizonte temporal y conmutadores */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gunmetal px-6 py-4">
        {/* Lado izquierdo: Información histórica y presencia de Cid */}
        <div className="flex items-center gap-3">
          {showCid && (
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-gunmetal bg-void-black/70 p-1">
              <img
                src={mascot.src}
                alt={mascot.label}
                className="size-full object-contain filter drop-shadow-[0_2px_6px_rgba(152,164,247,0.3)]"
              />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-[19px] font-medium tracking-tight text-pure-white sm:text-[21px]">
                Evolución Financiera Histórica ({firstYear} - {lastYear})
              </h3>
              <span className="rounded-full border border-periwinkle-glow/30 bg-periwinkle-glow/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-periwinkle-glow">
                {frequency === "quarterly" ? "Trimestral" : "Anual"}
              </span>
            </div>

            {/* Veredicto de Cid y métricas de crecimiento temporal */}
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-frost/90">
              {showCid && (
                <p>
                  <span className="text-periwinkle-glow font-semibold">Cid evalúa:</span> {cidVerdict}
                </p>
              )}

              {rangeGrowth && rangeGrowth.revTotalPct !== null && (
                <span className="font-mono text-[11px] text-muted-steel">
                  Crecimiento ({rangeGrowth.yearsCount} años):{" "}
                  <strong className={rangeGrowth.revTotalPct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    Ingresos {rangeGrowth.revTotalPct >= 0 ? "+" : ""}{rangeGrowth.revTotalPct.toFixed(1)}%
                  </strong>
                  {rangeGrowth.revCagrPct !== null && (
                    <span> ({rangeGrowth.revCagrPct >= 0 ? "+" : ""}{rangeGrowth.revCagrPct.toFixed(1)}%/año)</span>
                  )}
                  {rangeGrowth.netTotalPct !== null && (
                    <span className="ml-1">
                      · Beneficio{" "}
                      <strong className={rangeGrowth.netTotalPct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {rangeGrowth.netTotalPct >= 0 ? "+" : ""}{rangeGrowth.netTotalPct.toFixed(1)}%
                      </strong>
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lado derecho: Selector de años, Botón Activar/Desactivar Cid y Minimizar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Horizonte Temporal (Predeterminado 10 Años) */}
          <div className="flex items-center rounded-full border border-gunmetal bg-void-black/70 p-0.5 shadow-xs">
            {HORIZON_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTimeHorizon(opt.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-display text-[11px] font-medium transition-all cursor-pointer",
                  timeHorizon === opt.id
                    ? "bg-periwinkle-glow text-void-black font-semibold shadow-xs"
                    : "text-muted-steel hover:text-frost",
                )}
                title={`Ver los últimos ${opt.label.toLowerCase()}`}
              >
                {opt.shortLabel}
              </button>
            ))}
          </div>

          {/* Botón de Activar / Desactivar Cid en la parte superior */}
          <button
            type="button"
            onClick={() => setShowCid((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[12px] font-medium transition-all cursor-pointer shadow-xs",
              showCid
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                : "border-gunmetal bg-void-black/60 text-muted-steel hover:text-frost hover:border-gunmetal/80",
            )}
            aria-label={showCid ? "Desactivar Cid en el gráfico" : "Activar Cid en el gráfico"}
            title={showCid ? "Ocultar a Cid y su evaluación animada" : "Mostrar a Cid y su evaluación animada"}
          >
            <Sparkles className={cn("size-3.5", showCid ? "text-amber-400" : "opacity-40")} />
            <span>{showCid ? "Cid: Activado" : "Cid: Desactivado"}</span>
          </button>

          {/* Botón para reiniciar la animación de Cid */}
          {showCid && (
            <button
              type="button"
              onClick={() => setAnimKey((k) => k + 1)}
              className="size-7 grid place-items-center rounded-full border border-gunmetal bg-void-black/60 text-muted-steel hover:text-periwinkle-glow hover:border-periwinkle-glow/50 transition-all cursor-pointer"
              aria-label="Repetir animación de Cid"
              title="Repetir recorrido de Cid por el gráfico agregado"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}

          {/* Botón para minimizar o desplegar el gráfico */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-full border border-gunmetal/60 bg-carbon-surface/80 px-3 py-1 font-display text-[12px] font-medium text-muted-steel hover:text-frost hover:border-gunmetal transition-all cursor-pointer shadow-xs"
            aria-label={isCollapsed ? "Ver gráfico superior" : "Minimizar gráfico superior"}
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="size-3.5" />
                <span>Ver gráfico</span>
              </>
            ) : (
              <>
                <ChevronUp className="size-3.5" />
                <span>Minimizar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subcabecera con selección de métricas activas */}
      {!isCollapsed && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gunmetal/50 bg-void-black/30 px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-muted-steel mr-1">Métricas en el gráfico:</span>
            {PRESET_METRICS.map((cfg) => {
              const isActive = activePresets.includes(cfg.id);
              return (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => togglePreset(cfg.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-display text-[11px] font-medium tracking-tight transition-all cursor-pointer shadow-xs",
                    isActive
                      ? "border-gunmetal/80 bg-void-black/80 text-pure-white ring-1"
                      : "border-gunmetal/40 bg-carbon-surface/60 text-muted-steel opacity-50 hover:opacity-85",
                  )}
                  style={isActive ? { borderColor: cfg.color, color: "#ffffff" } : undefined}
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span>
                    {cfg.shortLabel} {cfg.yAxisId === "left" ? `(${currencySymbol}${unitSuffix})` : "(%)"}
                  </span>
                </button>
              );
            })}

            {/* Píldoras de partidas añadidas desde la tabla */}
            {customLines.map((cl, idx) => {
              const color = CUSTOM_COLORS[idx % CUSTOM_COLORS.length];
              return (
                <div
                  key={cl.line.id}
                  className="flex items-center gap-1.5 rounded-full border border-periwinkle-glow/60 bg-void-black/90 px-2.5 py-0.5 font-display text-[11px] font-medium text-pure-white shadow-xs"
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="max-w-[120px] truncate">{cl.line.label}</span>
                  {onToggleLine && (
                    <button
                      type="button"
                      onClick={() => onToggleLine(cl)}
                      className="text-muted-steel hover:text-rose-400 ml-0.5 transition-colors cursor-pointer"
                      title={`Quitar ${cl.line.label} del gráfico`}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {showCid && (
            <span className="text-[11px] font-mono text-periwinkle-glow/80 hidden sm:inline-block">
              ✦ Cid recorre la agregación de todos los gráficos activos
            </span>
          )}
        </div>
      )}

      {/* Cuerpo del Gráfico Desplegable con Movimiento Agregado de Cid */}
      {!isCollapsed && (
        <div ref={chartContainerRef} className="relative p-6 animate-in fade-in-0 duration-200">
          <div className="mb-2 flex items-center justify-between text-[11px] font-mono text-muted-steel">
            <span>{unitLabel}</span>
            {hasRightAxis && <span>Margen / Ratios (%)</span>}
          </div>

          <div className="relative h-[340px] w-full">
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

                {/* Eje invisible dedicado a la trayectoria agregada de Cid (0 a 100) */}
                <YAxis yAxisId="cidTrajectoryAxis" domain={[0, 100]} hide={true} />

                <Tooltip
                  wrapperStyle={{ zIndex: 30 }}
                  contentStyle={{
                    background: "#11131d",
                    border: "1px solid #23293a",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#ffffff", fontWeight: 600, marginBottom: 4 }}
                  formatter={(value: any, name: any) => {
                    if (name === "__cidScore") {
                      return [`${Number(value).toFixed(1)} / 100`, "Índice Agregado Cid"];
                    }
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

                {/* Líneas de Porcentajes / Márgenes */}
                {activePresets.includes("netMargin") && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="netMargin"
                    name="netMargin"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 3.5, fill: "#f59e0b", stroke: "#151621", strokeWidth: 1.5 }}
                    isAnimationActive={true}
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

                {/* Línea agregada de Cid que unifica todos los gráficos activos */}
                {showCid && (
                  <Line
                    yAxisId="cidTrajectoryAxis"
                    type="monotone"
                    dataKey="__cidScore"
                    name="__cidScore"
                    stroke="rgba(152, 164, 247, 0.45)"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    isAnimationActive={false}
                    dot={{
                      r: 2.5,
                      fill: "#98a4f7",
                      fillOpacity: 0.6,
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>

            {/* Capa de animación SVG de Cid recorriendo el gráfico agregado */}
            {showCid && motionPlan.path && lastLandingPoint && (
              <div
                className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
                role="img"
                aria-label={`Cid recorre la trayectoria financiera agregada de ${ticker}`}
              >
                <svg
                  ref={animationRootRef}
                  viewBox={`0 0 ${containerWidth} 340`}
                  className="block size-full overflow-visible"
                  aria-hidden="true"
                >
                  <g
                    filter="drop-shadow(0 4px 10px rgba(0,0,0,0.85))"
                    transform={reducedMotion ? `translate(${lastLandingPoint.x}, ${lastLandingPoint.y})` : undefined}
                  >
                    {!reducedMotion && (
                      <animateMotion
                        key={`cid-motion-${motionPlan.path}-${animKey}`}
                        path={motionPlan.path}
                        begin="0s"
                        dur={`${duration}s`}
                        repeatCount="1"
                        fill="freeze"
                        calcMode="paced"
                      />
                    )}
                    {!reducedMotion && motionPlan.phases.length > 0 ? (
                      <AdaptiveCharacter
                        key={`cid-char-${motionPlan.path}-${animKey}`}
                        plan={motionPlan}
                        duration={duration}
                        repeatCount="1"
                      />
                    ) : (
                      <StaticAdaptiveCharacter phase={finalPhase} />
                    )}
                  </g>
                </svg>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
