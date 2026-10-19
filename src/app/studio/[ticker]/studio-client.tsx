"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Check,
  CircleHelp,
  X,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  Video,
} from "lucide-react";
import type { StatementBundle } from "@/lib/sec/statements";
import type { QualityScorecardResult } from "@/lib/sec/quality";
import type { PriceSeries, PricePoint } from "@/lib/prices/types";
import {
  CID_MASCOTS,
  AdaptiveCharacter,
  StaticAdaptiveCharacter,
  characterPhaseForChange,
  type CharacterPhase,
  type CharacterMotionPlan,
} from "@/components/statement-trend-animation";
import { cn } from "@/lib/utils";

export type StudioSceneId = "price" | "keys" | "revenue" | "fcf" | "fcf-margin";

const SCENES: { id: StudioSceneId; title: string; subtitle: string; icon: any }[] = [
  { id: "price", title: "Cotización 10A", subtitle: "Precio histórico con Cid", icon: TrendingUp },
  { id: "keys", title: "Las 6 Claves", subtitle: "Scorecard cuantitativo", icon: ShieldCheck },
  { id: "revenue", title: "Ingresos 10A", subtitle: "Crecimiento anual en $B", icon: DollarSign },
  { id: "fcf", title: "FCF Total 10A", subtitle: "Generación de caja libre", icon: Play },
  { id: "fcf-margin", title: "Margen FCF 10A", subtitle: "Rentabilidad sobre ventas", icon: PieChart },
];

export function StudioClient({
  ticker,
  companyName,
  bundle,
  scorecard,
  priceSeries,
}: {
  ticker: string;
  companyName: string;
  bundle: StatementBundle;
  scorecard: QualityScorecardResult;
  priceSeries: PriceSeries | null;
}) {
  const searchParams = useSearchParams();
  const initialScene = (searchParams.get("scene") as StudioSceneId) || "price";
  const isRecording = searchParams.get("record") === "true";

  const [activeScene, setActiveScene] = useState<StudioSceneId>(initialScene);
  const [animKey, setAnimKey] = useState(0);

  // Períodos de los últimos 10 años ordenados cronológicamente
  const incomeBlock = bundle.blocks.find((b) => b.id === "income");
  const cashflowBlock = bundle.blocks.find((b) => b.id === "cashflow");
  const ratiosBlock = bundle.blocks.find((b) => b.id === "ratios");
  const rawPeriods = incomeBlock?.periods ?? cashflowBlock?.periods ?? [];

  const periods10Y = useMemo(() => {
    const sorted = [...rawPeriods].sort((a, b) => (a.end ?? "").localeCompare(b.end ?? ""));
    return sorted.slice(-10);
  }, [rawPeriods]);

  // Datos de Ingresos (en Miles de Millones / Billions USD)
  const revenueData = useMemo(() => {
    const row = incomeBlock?.rows.find(
      (r) =>
        r.line.id === "revenue" ||
        r.line.label.toLowerCase().includes("ingreso") ||
        r.line.label.toLowerCase().includes("revenue"),
    );
    return periods10Y.map((p) => {
      const raw = row?.cells[p.key]?.value ?? null;
      return {
        key: p.key,
        year: p.label.replace("FY ", ""),
        raw,
        value: raw !== null ? Number((raw / 1e9).toFixed(2)) : 0,
      };
    });
  }, [incomeBlock, periods10Y]);

  // Datos de FCF Total (en Miles de Millones / Billions USD)
  const fcfData = useMemo(() => {
    const row = cashflowBlock?.rows.find(
      (r) =>
        r.line.id === "freeCashFlow" ||
        r.line.label.toLowerCase().includes("libre") ||
        r.line.label.toLowerCase().includes("free cash flow"),
    );
    return periods10Y.map((p) => {
      const raw = row?.cells[p.key]?.value ?? null;
      return {
        key: p.key,
        year: p.label.replace("FY ", ""),
        raw,
        value: raw !== null ? Number((raw / 1e9).toFixed(2)) : 0,
      };
    });
  }, [cashflowBlock, periods10Y]);

  // Datos de Margen FCF (%)
  const fcfMarginData = useMemo(() => {
    const ratioRow = ratiosBlock?.rows.find((r) => r.line.id === "fcfMargin");
    return periods10Y.map((p, idx) => {
      let marginPct = ratioRow?.cells[p.key]?.value ?? null;
      if (marginPct === null) {
        const rev = revenueData[idx]?.value ?? 0;
        const fcf = fcfData[idx]?.value ?? 0;
        if (rev > 0) marginPct = (fcf / rev) * 100;
      }
      return {
        key: p.key,
        year: p.label.replace("FY ", ""),
        value: marginPct !== null ? Number(marginPct.toFixed(1)) : 0,
      };
    });
  }, [ratiosBlock, periods10Y, revenueData, fcfData]);

  // Puntos de Precio de los últimos 10 años
  const price10YPoints = useMemo(() => {
    if (!priceSeries || priceSeries.points.length === 0) return [];
    const tenYearsAgo = new Date(Date.now() - 10 * 365.25 * 86400000).toISOString().slice(0, 10);
    const filtered = priceSeries.points.filter((p) => p.date >= tenYearsAgo);
    return filtered.length > 0 ? filtered : priceSeries.points.slice(-500);
  }, [priceSeries]);

  const priceStats = useMemo(() => {
    if (price10YPoints.length < 2) return null;
    const first = price10YPoints[0].close;
    const last = price10YPoints.at(-1)!.close;
    const totalGrowth = ((last - first) / first) * 100;
    const years = 10;
    const cagr = (Math.pow(last / first, 1 / years) - 1) * 100;
    return {
      first,
      last,
      totalGrowth,
      cagr,
      currency: priceSeries?.currency ?? "USD",
    };
  }, [price10YPoints, priceSeries]);

  return (
    <div className={cn("min-h-screen bg-[#07080d] text-frost flex flex-col items-center justify-start", !isRecording ? "pb-16" : "p-0 overflow-hidden")}>
      {/* Barra de control para el usuario (se oculta al grabar si record=true) */}
      {!isRecording && (
        <header className="sticky top-0 z-50 w-full border-b border-gunmetal/80 bg-carbon-surface/90 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="size-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <h1 className="font-display text-[16px] font-semibold text-pure-white flex items-center gap-2">
                MarketCid Studio 9:16
                <span className="rounded-full border border-periwinkle-glow/40 bg-periwinkle-glow/15 px-2 py-0.2 text-[10px] font-mono text-periwinkle-glow">
                  {ticker}
                </span>
              </h1>
              <p className="text-[11px] text-muted-steel">
                Plantillas verticales de alta definición (1080 × 1920) optimizadas para YouTube Shorts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-void-black/70 p-1 rounded-full border border-gunmetal">
            {SCENES.map((s) => {
              const Icon = s.icon;
              const isActive = activeScene === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveScene(s.id);
                    setAnimKey((k) => k + 1);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-display text-[12px] font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-periwinkle-glow text-void-black font-semibold shadow-xs"
                      : "text-muted-steel hover:text-frost hover:bg-gunmetal/30",
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnimKey((k) => k + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gunmetal bg-void-black/60 text-muted-steel hover:text-periwinkle-glow text-[12px] font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Reiniciar animación</span>
            </button>
          </div>
        </header>
      )}

      {/* Marco 9:16 vertical centrado (1080x1920 nativo o escalado en pantalla) */}
      <main className={cn("flex justify-center w-full", !isRecording ? "mt-6 px-4" : "m-0 p-0")}>
        <div
          id="short-canvas"
          className={cn(
            "relative w-[1080px] h-[1920px] shrink-0 bg-[#090b12] overflow-hidden flex flex-col justify-between p-16 select-none",
            !isRecording
              ? "border-2 border-gunmetal/60 rounded-[48px] shadow-[0_32px_120px_rgba(0,0,0,0.85)] origin-top scale-[0.45] sm:scale-[0.55] lg:scale-[0.68] xl:scale-[0.80] mb-[-400px]"
              : "rounded-none border-0 shadow-none m-0",
          )}
        >
          {/* Fondo sutil con resplandor cinematográfico */}
          <div className="pointer-events-none absolute -top-40 -left-40 size-[600px] rounded-full bg-periwinkle-glow/12 blur-[140px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 size-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />

          {/* CABECERA 9:16 (ZONA SUPERIOR) */}
          <div className="relative z-10 space-y-4 pt-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-periwinkle-glow/40 bg-periwinkle-glow/15 px-4 py-1.5 font-mono text-[14px] font-bold uppercase tracking-[0.2em] text-periwinkle-glow">
                  {ticker} · {companyName}
                </span>
                <span className="rounded-full border border-gunmetal bg-void-black/70 px-3.5 py-1.5 font-mono text-[13px] text-muted-steel">
                  10 AÑOS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-emerald-400" />
                <span className="font-mono text-[13px] font-medium text-emerald-300">MarketCid</span>
              </div>
            </div>

            {/* Título de la escena activa */}
            <div>
              <h2 className="font-display text-[44px] font-semibold leading-tight tracking-tight text-pure-white">
                {activeScene === "price" && "Evolución de la Cotización"}
                {activeScene === "keys" && "Las 6 Claves Cuantitativas"}
                {activeScene === "revenue" && "Crecimiento de Ingresos"}
                {activeScene === "fcf" && "Flujo de Caja Libre (FCF)"}
                {activeScene === "fcf-margin" && "Margen de Free Cash Flow"}
              </h2>
              <p className="text-[20px] font-medium text-frost/85 mt-1">
                {activeScene === "price" && "Trayectoria del precio de la acción en los últimos 10 años"}
                {activeScene === "keys" && "Evaluación fundamental completa de calidad y solvencia"}
                {activeScene === "revenue" && "Evolución histórica anual de ventas de 2016 a 2025"}
                {activeScene === "fcf" && "Caja real neta generada tras descontar inversiones de capital"}
                {activeScene === "fcf-margin" && "Porcentaje de ventas convertidas directamente en caja libre"}
              </p>
            </div>
          </div>

          {/* CUERPO CENTRAL 9:16 (ZONA SEGURA INTERACTIVA / GRÁFICO) */}
          <div className="relative z-10 flex-1 my-8 flex flex-col justify-center">
            {activeScene === "price" && (
              <ScenePrice
                key={`price-${animKey}`}
                points={price10YPoints}
                stats={priceStats}
                duration={8}
              />
            )}

            {activeScene === "keys" && (
              <SceneScorecard key={`keys-${animKey}`} scorecard={scorecard} />
            )}

            {activeScene === "revenue" && (
              <SceneBarChart
                key={`rev-${animKey}`}
                data={revenueData}
                metricLabel="Ingresos Anuales"
                unitSuffix="B"
                color="#1d8cf8"
                duration={8}
              />
            )}

            {activeScene === "fcf" && (
              <SceneBarChart
                key={`fcf-${animKey}`}
                data={fcfData}
                metricLabel="Flujo de Caja Libre (FCF)"
                unitSuffix="B"
                color="#00d084"
                duration={8}
              />
            )}

            {activeScene === "fcf-margin" && (
              <SceneLineChart
                key={`margin-${animKey}`}
                data={fcfMarginData}
                metricLabel="Margen FCF"
                unitSuffix="%"
                color="#f59e0b"
                duration={8}
              />
            )}
          </div>

          {/* PIE DE PÁGINA 9:16 (ZONA INFERIOR CON SAFE ZONE PARA YOUTUBE SHORTS) */}
          <div className="relative z-10 pb-16 border-t border-gunmetal/60 pt-6 flex items-center justify-between text-[16px] text-muted-steel font-mono">
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-periwinkle-glow" />
              <span>Análisis con Monigote Cid animado</span>
            </div>
            <span>marketcid.com</span>
          </div>
        </div>
      </main>
    </div>
  );
}

// -------------------------------------------------------------
// ESCENA 1: Cotización 10 Años + Cid
// -------------------------------------------------------------
function ScenePrice({
  points,
  stats,
  duration = 8,
}: {
  points: PricePoint[];
  stats: any;
  duration?: number;
}) {
  const chartWidth = 900;
  const chartHeight = 700;

  const chartData = useMemo(() => {
    return points.map((p, i) => ({
      index: i,
      date: p.date,
      year: p.date.slice(0, 4),
      close: p.close,
    }));
  }, [points]);

  const minVal = useMemo(() => Math.floor(Math.min(...chartData.map((d) => d.close)) * 0.95), [chartData]);
  const maxVal = useMemo(() => Math.ceil(Math.max(...chartData.map((d) => d.close)) * 1.05), [chartData]);
  const range = maxVal - minVal || 1;

  const usableLeft = 80;
  const usableRight = 860;
  const usableTop = 60;
  const usableHeight = 560;
  const stepX = (usableRight - usableLeft) / Math.max(1, chartData.length - 1);

  const geoPoints = useMemo(() => {
    return chartData.map((d, i) => ({
      x: usableLeft + i * stepX,
      y: usableTop + usableHeight * (1 - (d.close - minVal) / range),
      close: d.close,
      year: d.year,
    }));
  }, [chartData, usableLeft, stepX, usableTop, usableHeight, minVal, range]);

  const { path, phases, finalPhase } = useMemo(() => {
    if (geoPoints.length < 2) {
      return { path: "", phases: ["senor" as CharacterPhase], finalPhase: "senor" as CharacterPhase };
    }
    let p = `M ${geoPoints[0].x.toFixed(1)} ${geoPoints[0].y.toFixed(1)}`;
    const ph: CharacterPhase[] = [];

    for (let i = 0; i < geoPoints.length - 1; i++) {
      const p0 = geoPoints[i === 0 ? 0 : i - 1];
      const p1 = geoPoints[i];
      const p2 = geoPoints[i + 1];
      const p3 = geoPoints[i + 2 >= geoPoints.length ? geoPoints.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      p += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;

      const diffPct = ((p2.close - p1.close) / (p1.close || 1)) * 100;
      ph.push(characterPhaseForChange(diffPct * 15));
    }

    return { path: p, phases: ph, finalPhase: ph.at(-1) ?? "senor" };
  }, [geoPoints]);

  const areaPath = useMemo(() => {
    if (!path || geoPoints.length < 2) return "";
    return `${path} L ${geoPoints.at(-1)!.x.toFixed(1)} ${(usableTop + usableHeight).toFixed(1)} L ${geoPoints[0].x.toFixed(1)} ${(usableTop + usableHeight).toFixed(1)} Z`;
  }, [path, geoPoints, usableTop, usableHeight]);

  const motionPlan: CharacterMotionPlan = useMemo(() => {
    return {
      path,
      phases,
      keyTimes: [0, 1],
      changesPct: [10],
    };
  }, [path, phases]);

  const mascot = CID_MASCOTS[finalPhase] ?? CID_MASCOTS.caballero;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: Math.round(minVal + range * pct),
    y: usableTop + usableHeight * (1 - pct),
  }));

  const xYearTicks = useMemo(() => {
    const seen = new Set<string>();
    const ticks: { year: string; x: number }[] = [];
    geoPoints.forEach((pt) => {
      if (!seen.has(pt.year)) {
        seen.add(pt.year);
        if (ticks.length === 0 || pt.x - ticks.at(-1)!.x >= 60) {
          ticks.push({ year: pt.year, x: pt.x });
        }
      }
    });
    return ticks;
  }, [geoPoints]);

  return (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* Tarjeta KPI Superior */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 bg-carbon-surface/80 border border-gunmetal/80 rounded-3xl p-6">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-wider text-muted-steel">Precio Actual</p>
            <p className="font-display text-[42px] font-bold text-pure-white leading-tight mt-1">
              {stats.last.toFixed(2)} $
            </p>
            <p className="text-[14px] text-muted-steel mt-0.5">USD por acción</p>
          </div>
          <div>
            <p className="font-mono text-[13px] uppercase tracking-wider text-muted-steel">Rentabilidad 10A</p>
            <p className="font-display text-[42px] font-bold text-emerald-400 leading-tight mt-1">
              +{stats.totalGrowth.toFixed(0)} %
            </p>
            <p className="text-[14px] text-emerald-300 mt-0.5">Multiplicador {(stats.last / stats.first).toFixed(1)}x</p>
          </div>
          <div>
            <p className="font-mono text-[13px] uppercase tracking-wider text-muted-steel">CAGR Anualizado</p>
            <p className="font-display text-[42px] font-bold text-periwinkle-glow leading-tight mt-1">
              +{stats.cagr.toFixed(1)} %
            </p>
            <p className="text-[14px] text-periwinkle-glow/80 mt-0.5">Tasa anual constante</p>
          </div>
        </div>
      )}

      {/* Gráfico y Lienzo de Animación SVG */}
      <div className="relative w-full h-[750px] bg-void-black/40 border border-gunmetal/60 rounded-3xl p-6 overflow-hidden flex items-center justify-center">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-[900px] h-[700px] overflow-visible">
          <defs>
            <linearGradient id="priceShortGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Líneas horizontales de cuadrícula y etiquetas Y */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line x1={usableLeft} y1={t.y} x2={usableRight} y2={t.y} stroke="#1f2433" strokeDasharray="4 4" strokeWidth="1" />
              <text x={usableLeft - 15} y={t.y + 5} textAnchor="end" fill="#8a94a6" fontSize="15" fontFamily="monospace">
                ${t.val}
              </text>
            </g>
          ))}

          {/* Etiquetas de años X */}
          {xYearTicks.map((t, idx) => (
            <text key={idx} x={t.x} y={usableTop + usableHeight + 35} textAnchor="middle" fill="#8a94a6" fontSize="15" fontFamily="monospace">
              {t.year}
            </text>
          ))}

          {/* Área rellena con gradiente */}
          {areaPath && <path d={areaPath} fill="url(#priceShortGrad)" />}

          {/* Línea de cotización */}
          {path && <path d={path} fill="none" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Recorrido animado de Cid */}
          {path && (
            <g filter="drop-shadow(0 6px 16px rgba(0,0,0,0.9))">
              <animateMotion
                path={path}
                begin="0s"
                dur={`${duration}s`}
                repeatCount="1"
                fill="freeze"
                calcMode="paced"
              />
              <AdaptiveCharacter plan={motionPlan} duration={duration} repeatCount="1" />
            </g>
          )}
        </svg>
      </div>

      {/* Veredicto de Cid */}
      <div className="flex items-center gap-5 bg-carbon-surface/80 border border-gunmetal/80 rounded-3xl p-6">
        <div className="size-20 shrink-0 overflow-hidden rounded-2xl border border-gunmetal bg-void-black/80 p-2">
          <img src={mascot.src} alt={mascot.label} className="size-full object-contain" />
        </div>
        <div>
          <span className="font-mono text-[13px] uppercase tracking-wider text-periwinkle-glow font-bold">
            Veredicto de Cid sobre el Precio:
          </span>
          <p className="font-display text-[24px] font-semibold text-pure-white mt-1">
            Tendencia compounder de muy alto impacto con crecimiento sostenido
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ESCENA 2: Las 6 Claves Cuantitativas (Símbolos en 9:16)
// -------------------------------------------------------------
function SceneScorecard({ scorecard }: { scorecard: QualityScorecardResult }) {
  return (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* Banner de Puntuación */}
      <div className="flex items-center justify-between bg-carbon-surface/80 border border-gunmetal/80 rounded-3xl p-8">
        <div>
          <span className="font-mono text-[13px] uppercase tracking-wider text-periwinkle-glow font-bold">
            PUNTUACIÓN CUANTITATIVA
          </span>
          <h3 className="font-display text-[32px] font-semibold text-pure-white mt-1">
            {scorecard.score === 6
              ? "Excelente: Cumple todos los criterios fundamentales"
              : `${scorecard.score} de 6 criterios cuantitativos cumplidos`}
          </h3>
          <p className="text-[16px] text-muted-steel mt-1">
            Análisis estricto de balances, márgenes, rentabilidad y valoración
          </p>
        </div>
        <div className="flex items-baseline gap-1 font-display text-pure-white">
          <span className="text-[80px] font-bold leading-none text-emerald-400">{scorecard.score}</span>
          <span className="text-[32px] text-muted-steel">/6</span>
        </div>
      </div>

      {/* Cuadrícula vertical 2 x 3 con las 6 claves */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {scorecard.items.map((item, idx) => {
          return (
            <div
              key={item.id}
              className="bg-carbon-surface/90 border border-gunmetal/80 rounded-3xl p-6 flex flex-col justify-between shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-display text-[28px] font-bold text-periwinkle-glow/70">
                    0{idx + 1}
                  </span>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-steel mt-0.5">
                    {item.category}
                  </p>
                </div>

                {/* Símbolo visual de estado */}
                {item.status === "pass" && (
                  <span className="grid size-12 place-items-center rounded-full border-2 border-emerald-400/40 bg-emerald-400/20 text-emerald-400 shadow-md">
                    <Check className="size-6 stroke-[3]" />
                  </span>
                )}
                {item.status === "warn" && (
                  <span className="grid size-12 place-items-center rounded-full border-2 border-amber-400/40 bg-amber-400/20 text-amber-400 shadow-md">
                    <span className="font-display text-[22px] font-bold leading-none">?</span>
                  </span>
                )}
                {item.status === "fail" && (
                  <span className="grid size-12 place-items-center rounded-full border-2 border-rose-400/40 bg-rose-400/20 text-rose-400 shadow-md">
                    <X className="size-6 stroke-[3]" />
                  </span>
                )}
                {item.status === "unknown" && (
                  <span className="grid size-12 place-items-center rounded-full border-2 border-gunmetal bg-void-black text-muted-steel shadow-md">
                    <CircleHelp className="size-6" />
                  </span>
                )}
              </div>

              <div className="mt-4">
                <h4 className="font-display text-[20px] font-semibold text-pure-white leading-tight">
                  {item.name}
                </h4>
                <p className="font-display text-[24px] font-bold text-periwinkle-glow mt-2">
                  {item.valueFormatted}
                </p>
                <p className="text-[13px] text-frost/85 mt-2 line-clamp-2 leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ESCENA 3 & 4: Gráfico de Barras 10 Años (Ingresos o FCF) + Cid
// -------------------------------------------------------------
function SceneBarChart({
  data,
  metricLabel,
  unitSuffix,
  color,
  duration = 8,
}: {
  data: { year: string; value: number }[];
  metricLabel: string;
  unitSuffix: string;
  color: string;
  duration?: number;
}) {
  const chartWidth = 900;
  const chartHeight = 700;

  const firstVal = data[0]?.value ?? 0;
  const lastVal = data.at(-1)?.value ?? 0;
  const growthPct = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;
  const years = Math.max(1, data.length - 1);
  const cagr = firstVal > 0 && lastVal > 0 ? (Math.pow(lastVal / firstVal, 1 / years) - 1) * 100 : 0;

  const maxVal = Math.ceil((Math.max(...data.map((d) => d.value)) * 1.15) / 50) * 50 || 100;
  const usableLeft = 80;
  const usableRight = 860;
  const usableTop = 60;
  const usableHeight = 560;
  const stepX = (usableRight - usableLeft) / data.length;
  const barWidth = 44;

  const bars = data.map((d, i) => {
    const xCenter = usableLeft + (i + 0.5) * stepX;
    const barH = usableHeight * (d.value / maxVal);
    const yTop = usableTop + usableHeight - barH;
    return {
      xCenter,
      x: xCenter - barWidth / 2,
      y: yTop,
      width: barWidth,
      height: barH,
      val: d.value,
      year: d.year,
    };
  });

  const { path, phases, finalPhase } = useMemo(() => {
    if (bars.length < 2) {
      return { path: "", phases: ["senor" as CharacterPhase], finalPhase: "senor" as CharacterPhase };
    }

    let p = `M ${bars[0].xCenter.toFixed(1)} ${bars[0].y.toFixed(1)}`;
    const ph: CharacterPhase[] = [];

    for (let i = 0; i < bars.length - 1; i++) {
      const p0 = bars[i === 0 ? 0 : i - 1];
      const p1 = bars[i];
      const p2 = bars[i + 1];
      const p3 = bars[i + 2 >= bars.length ? bars.length - 1 : i + 2];

      const cp1x = p1.xCenter + (p2.xCenter - p0.xCenter) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.xCenter - (p3.xCenter - p1.xCenter) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      p += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.xCenter.toFixed(1)} ${p2.y.toFixed(1)}`;

      const diff = p2.val - p1.val;
      const pct = (diff / (p1.val || 1)) * 100;
      ph.push(characterPhaseForChange(pct));
    }

    return { path: p, phases: ph, finalPhase: ph.at(-1) ?? "senor" };
  }, [bars]);

  const motionPlan: CharacterMotionPlan = useMemo(() => {
    return {
      path,
      phases,
      keyTimes: [0, 1],
      changesPct: [growthPct],
    };
  }, [path, phases, growthPct]);

  const mascot = CID_MASCOTS[finalPhase] ?? CID_MASCOTS.caballero;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: Math.round(maxVal * pct),
    y: usableTop + usableHeight * (1 - pct),
  }));

  const gradId = `barGrad-${color.replace("#", "")}`;

  return (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* Tarjeta KPI Superior */}
      <div className="grid grid-cols-3 gap-4 bg-carbon-surface/80 border border-gunmetal/80 rounded-3xl p-6">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-wider text-muted-steel">Último Ejercicio</p>
          <p className="font-display text-[42px] font-bold text-pure-white leading-tight mt-1">
            ${lastVal.toFixed(1)} {unitSuffix}
          </p>
          <p className="text-[14px] text-muted-steel mt-0.5">Miles de Millones USD</p>
        </div>
        <div>
          <p className="font-mono text-[13px] uppercase tracking-wider text-muted-steel">Crecimiento 10A</p>
          <p className="font-display text-[42px] font-bold text-emerald-400 leading-tight mt-1">
            +{growthPct.toFixed(0)} %
          </p>
          <p className="text-[14px] text-emerald-300 mt-0.5">De ${firstVal.toFixed(1)}B a ${lastVal.toFixed(1)}B</p>
        </div>
        <div>
          <p className="font-mono text-[13px] uppercase tracking-wider text-muted-steel">CAGR Anual</p>
          <p className="font-display text-[42px] font-bold text-periwinkle-glow leading-tight mt-1">
            +{cagr.toFixed(1)} %
          </p>
          <p className="text-[14px] text-periwinkle-glow/80 mt-0.5">Ritmo anualizado</p>
        </div>
      </div>

      {/* Gráfico de Barras y Animación de Cid */}
      <div className="relative w-full h-[750px] bg-void-black/40 border border-gunmetal/60 rounded-3xl p-6 overflow-hidden flex items-center justify-center">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-[900px] h-[700px] overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.65} />
            </linearGradient>
          </defs>

          {/* Líneas horizontales de cuadrícula y etiquetas Y */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line x1={usableLeft} y1={t.y} x2={usableRight} y2={t.y} stroke="#1f2433" strokeDasharray="4 4" strokeWidth="1" />
              <text x={usableLeft - 15} y={t.y + 5} textAnchor="end" fill="#8a94a6" fontSize="15" fontFamily="monospace">
                ${t.val}B
              </text>
            </g>
          ))}

          {/* Barras y etiquetas */}
          {bars.map((b, idx) => (
            <g key={idx}>
              <rect
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                rx={8}
                ry={8}
                fill={`url(#${gradId})`}
                stroke={color}
                strokeWidth="1.5"
              />
              <text
                x={b.xCenter}
                y={b.y - 12}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="15"
                fontWeight="bold"
                fontFamily="monospace"
              >
                ${b.val.toFixed(0)}B
              </text>
              <text
                x={b.xCenter}
                y={usableTop + usableHeight + 35}
                textAnchor="middle"
                fill="#8a94a6"
                fontSize="15"
                fontFamily="monospace"
              >
                {b.year}
              </text>
            </g>
          ))}

          {/* Monigote Cid recorriendo las barras */}
          {path && (
            <g filter="drop-shadow(0 6px 16px rgba(0,0,0,0.9))">
              <animateMotion
                path={path}
                begin="0s"
                dur={`${duration}s`}
                repeatCount="1"
                fill="freeze"
                calcMode="paced"
              />
              <AdaptiveCharacter plan={motionPlan} duration={duration} repeatCount="1" />
            </g>
          )}
        </svg>
      </div>

      {/* Veredicto de Cid */}
      <div className="flex items-center gap-5 bg-carbon-surface/80 border border-gunmetal/80 rounded-3xl p-6">
        <div className="size-20 shrink-0 overflow-hidden rounded-2xl border border-gunmetal bg-void-black/80 p-2">
          <img src={mascot.src} alt={mascot.label} className="size-full object-contain" />
        </div>
        <div>
          <span className="font-mono text-[13px] uppercase tracking-wider text-periwinkle-glow font-bold">
            Evaluación de Cid sobre {metricLabel}:
          </span>
          <p className="font-display text-[24px] font-semibold text-pure-white mt-1">
            {growthPct > 50
              ? "Crecimiento potente y continuo impulsando el liderazgo de la empresa"
              : "Generación estable y predecible a lo largo del ciclo decenal"}
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ESCENA 5: Gráfico de Margen Free Cash Flow (%) + Cid
// -------------------------------------------------------------
function SceneLineChart({
  data,
  metricLabel,
  unitSuffix,
  color,
  duration = 8,
}: {
  data: { year: string; value: number }[];
  metricLabel: string;
  unitSuffix: string;
  color: string;
  duration?: number;
}) {
  const chartWidth = 900;
  const chartHeight = 700;

  const lastVal = data.at(-1)?.value ?? 0;
  const avgVal = data.reduce((acc, d) => acc + d.value, 0) / (data.length || 1);
  const minVal = Math.floor(Math.min(...data.map((d) => d.value)) - 4);
  const maxVal = Math.ceil(Math.max(...data.map((d) => d.value)) + 4);
  const yRange = maxVal - minVal || 10;

  const usableLeft = 80;
  const usableRight = 860;
  const usableTop = 60;
  const usableHeight = 560;
  const stepX = (usableRight - usableLeft) / Math.max(1, data.length - 1);

  const geoPoints = data.map((d, i) => ({
    x: usableLeft + i * stepX,
    y: usableTop + usableHeight * (1 - (d.value - minVal) / yRange),
    val: d.value,
    year: d.year,
  }));

  const { path, phases, finalPhase } = useMemo(() => {
    if (geoPoints.length < 2) {
      return { path: "", phases: ["senor" as CharacterPhase], finalPhase: "senor" as CharacterPhase };
    }

    let p = `M ${geoPoints[0].x.toFixed(1)} ${geoPoints[0].y.toFixed(1)}`;
    const ph: CharacterPhase[] = [];

    for (let i = 0; i < geoPoints.length - 1; i++) {
      const p0 = geoPoints[i === 0 ? 0 : i - 1];
      const p1 = geoPoints[i];
      const p2 = geoPoints[i + 1];
      const p3 = geoPoints[i + 2 >= geoPoints.length ? geoPoints.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      p += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;

      const diff = p2.val - p1.val;
      ph.push(characterPhaseForChange(diff * 4));
    }

    return { path: p, phases: ph, finalPhase: ph.at(-1) ?? "senor" };
  }, [geoPoints]);

  const areaPath = useMemo(() => {
    if (!path || geoPoints.length < 2) return "";
    return `${path} L ${geoPoints.at(-1)!.x.toFixed(1)} ${(usableTop + usableHeight).toFixed(1)} L ${geoPoints[0].x.toFixed(1)} ${(usableTop + usableHeight).toFixed(1)} Z`;
  }, [path, geoPoints, usableTop, usableHeight]);

  const motionPlan: CharacterMotionPlan = useMemo(() => {
    return {
      path,
      phases,
      keyTimes: [0, 1],
      changesPct: [lastVal],
    };
  }, [path, phases, lastVal]);

  const mascot = CID_MASCOTS[finalPhase] ?? CID_MASCOTS.caballero;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: Math.round(minVal + yRange * pct),
    y: usableTop + usableHeight * (1 - pct),
  }));

  return (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* Tarjeta KPI Superior */}
      <div className="grid grid-cols-3 gap-4 bg-carbon-surface/80 border border-gunmetal/80 rounded-3xl p-6">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-wider text-muted-steel">Último Margen FCF</p>
          <p className="font-display text-[42px] font-bold text-amber-400 leading-tight mt-1">
            {lastVal.toFixed(1)} %
          </p>
          <p className="text-[14px] text-amber-300 mt-0.5">Caja libre sobre ventas</p>
        </div>
        <div>
          <p className="font-mono text-[13px] uppercase tracking-wider text-muted-steel">Media 10 Años</p>
          <p className="font-display text-[42px] font-bold text-pure-white leading-tight mt-1">
            {avgVal.toFixed(1)} %
          </p>
          <p className="text-[14px] text-muted-steel mt-0.5">Margen medio normalizado</p>
        </div>
        <div>
          <p className="font-mono text-[13px] uppercase tracking-wider text-muted-steel">Rango Histórico</p>
          <p className="font-display text-[36px] font-bold text-periwinkle-glow leading-tight mt-1">
            {minVal.toFixed(0)}% - {maxVal.toFixed(0)}%
          </p>
          <p className="text-[14px] text-periwinkle-glow/80 mt-0.5">Mínimo y máximo 10A</p>
        </div>
      </div>

      {/* Gráfico de Línea con Relleno y Animación de Cid */}
      <div className="relative w-full h-[750px] bg-void-black/40 border border-gunmetal/60 rounded-3xl p-6 overflow-hidden flex items-center justify-center">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-[900px] h-[700px] overflow-visible">
          <defs>
            <linearGradient id="marginShortGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Líneas horizontales de cuadrícula y etiquetas Y */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line x1={usableLeft} y1={t.y} x2={usableRight} y2={t.y} stroke="#1f2433" strokeDasharray="4 4" strokeWidth="1" />
              <text x={usableLeft - 15} y={t.y + 5} textAnchor="end" fill="#f59e0b" fontSize="15" fontFamily="monospace">
                {t.val}%
              </text>
            </g>
          ))}

          {/* Años en X */}
          {geoPoints.map((pt, idx) => (
            <text key={idx} x={pt.x} y={usableTop + usableHeight + 35} textAnchor="middle" fill="#8a94a6" fontSize="15" fontFamily="monospace">
              {pt.year}
            </text>
          ))}

          {/* Área rellena con gradiente */}
          {areaPath && <path d={areaPath} fill="url(#marginShortGrad)" />}

          {/* Línea de Margen */}
          {path && <path d={path} fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Puntos y valores */}
          {geoPoints.map((pt, idx) => (
            <g key={idx}>
              <circle cx={pt.x} cy={pt.y} r="6" fill="#f59e0b" stroke="#07080d" strokeWidth="3" />
              <text x={pt.x} y={pt.y - 14} textAnchor="middle" fill="#fde68a" fontSize="14" fontWeight="bold" fontFamily="monospace">
                {pt.val.toFixed(1)}%
              </text>
            </g>
          ))}

          {/* Monigote Cid recorriendo la curva de margen */}
          {path && (
            <g filter="drop-shadow(0 6px 16px rgba(0,0,0,0.9))">
              <animateMotion
                path={path}
                begin="0s"
                dur={`${duration}s`}
                repeatCount="1"
                fill="freeze"
                calcMode="paced"
              />
              <AdaptiveCharacter plan={motionPlan} duration={duration} repeatCount="1" />
            </g>
          )}
        </svg>
      </div>

      {/* Veredicto de Cid */}
      <div className="flex items-center gap-5 bg-carbon-surface/80 border border-gunmetal/80 rounded-3xl p-6">
        <div className="size-20 shrink-0 overflow-hidden rounded-2xl border border-gunmetal bg-void-black/80 p-2">
          <img src={mascot.src} alt={mascot.label} className="size-full object-contain" />
        </div>
        <div>
          <span className="font-mono text-[13px] uppercase tracking-wider text-periwinkle-glow font-bold">
            Evaluación de Cid sobre el Margen FCF:
          </span>
          <p className="font-display text-[24px] font-semibold text-pure-white mt-1">
            {lastVal >= 20
              ? "Excelente rentabilidad de caja libre (>20%), altísima capacidad de reinversión"
              : "Margen de caja adecuado y sostenible a lo largo de los 10 años"}
          </p>
        </div>
      </div>
    </div>
  );
}
