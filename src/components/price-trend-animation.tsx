"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CharacterPose,
  AdaptiveCharacter,
  StaticAdaptiveCharacter,
  classifyCidProfile,
  characterPhaseForChange,
  type BusinessProfile,
  type CharacterMotionPlan,
  type CharacterPhase,
} from "@/components/statement-trend-animation";
import type { PricePoint } from "@/lib/prices/types";

export type PricePointGeometry = {
  index: number;
  date: string;
  value: number;
  x: number;
  y: number;
};

export type PriceChartGeometry = {
  width: number;
  height: number;
  points: PricePointGeometry[];
};

export type ThreeMonthTrendPoint = PricePointGeometry & {
  averageValue: number;
  averageY?: number;
  changePct: number | null;
};

export const TWO_MONTH_MS = 61 * 86_400_000;
export const THREE_MONTH_MS = 92 * 86_400_000;
export const SIX_MONTH_MS = 183 * 86_400_000;

export function analyzeTenYearPriceProfile(points: readonly PricePoint[]): BusinessProfile {
  const ordered = [...points]
    .filter((point) => Number.isFinite(point.close) && Number.isFinite(Date.parse(point.date)))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (ordered.length < 2) return classifyCidProfile([]);

  const yearEnds: PricePoint[] = [];
  ordered.forEach((point, index) => {
    const next = ordered[index + 1];
    if (!next || next.date.slice(0, 4) !== point.date.slice(0, 4)) yearEnds.push(point);
  });
  const changes = yearEnds.slice(1).flatMap((point, index) => {
    const previous = yearEnds[index].close;
    return previous === 0 ? [] : [((point.close - previous) / Math.abs(previous)) * 100];
  });

  return classifyCidProfile(changes);
}

export function pricePhaseForChange(
  changePct: number | null,
  fallback: CharacterPhase = "senor",
): CharacterPhase {
  if (changePct === null || !Number.isFinite(changePct)) return fallback;
  return characterPhaseForChange(changePct);
}

export function buildTwoMonthTrendPoints(
  geometry: readonly PricePointGeometry[],
  allPoints?: readonly PricePoint[],
  smoothY = true,
  windowMs = TWO_MONTH_MS,
): ThreeMonthTrendPoint[] {
  const points = [...geometry]
    .filter((point) => (
      Number.isFinite(point.x)
      && Number.isFinite(point.y)
      && Number.isFinite(point.value)
      && Number.isFinite(Date.parse(point.date))
    ))
    .sort((a, b) => a.index - b.index);
  if (points.length === 0) return [];

  // Cuando allPoints está disponible, podemos obtener la media previa incluso en los primeros días del rango
  const history = allPoints && allPoints.length > 0
    ? [...allPoints].filter((p) => Number.isFinite(p.close) && Number.isFinite(Date.parse(p.date))).sort((a, b) => a.date.localeCompare(b.date))
    : null;

  const trend: ThreeMonthTrendPoint[] = [];
  let windowStart = 0;
  let comparisonIndex = -1;
  let valueSum = 0;
  let ySum = 0;

  points.forEach((point, index) => {
    const pointTime = Date.parse(point.date);
    valueSum += point.value;
    ySum += point.y;

    while (windowStart < index && pointTime - Date.parse(points[windowStart].date) > windowMs) {
      valueSum -= points[windowStart].value;
      ySum -= points[windowStart].y;
      windowStart += 1;
    }

    const count = index - windowStart + 1;
    const averageValue = valueSum / count;
    const averageY = ySum / count;
    const comparisonTarget = pointTime - windowMs;

    while (
      comparisonIndex + 1 < trend.length
      && Date.parse(trend[comparisonIndex + 1].date) <= comparisonTarget
    ) {
      comparisonIndex += 1;
    }
    const comparison = comparisonIndex >= 0 ? trend[comparisonIndex] : null;

    let changePct: number | null = null;
    if (comparison && comparison.averageValue !== 0) {
      changePct = ((averageValue - comparison.averageValue) / Math.abs(comparison.averageValue)) * 100;
    } else if (history && history.length > 0) {
      const priorPoints = history.filter((p) => {
        const t = Date.parse(p.date);
        return t <= comparisonTarget && t >= comparisonTarget - windowMs;
      });
      if (priorPoints.length > 0) {
        const priorAvg = priorPoints.reduce((s, p) => s + p.close, 0) / priorPoints.length;
        if (priorAvg > 0) {
          changePct = ((averageValue - priorAvg) / priorAvg) * 100;
        }
      } else {
        const firstClose = history[0]?.close;
        if (firstClose && firstClose > 0) {
          changePct = ((averageValue - firstClose) / firstClose) * 100;
        }
      }
    }

    trend.push({
      ...point,
      y: smoothY ? averageY : point.y,
      averageValue,
      averageY,
      changePct,
    });
  });

  return trend;
}

export const buildThreeMonthTrendPoints = buildTwoMonthTrendPoints;
export const buildSixMonthTrendPoints = buildTwoMonthTrendPoints;

function defaultWindowMs(points: readonly PricePointGeometry[], hasAllPoints: boolean): number {
  if (hasAllPoints) return TWO_MONTH_MS;
  if (points.length < 2) return TWO_MONTH_MS;
  const intervals = points.slice(1).map((p, i) => (
    Math.abs(Date.parse(p.date) - Date.parse(points[i].date)) / 86_400_000
  )).filter((d) => Number.isFinite(d) && d > 0).sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)] ?? 1;
  // Si los puntos son trimestrales/cuatrimestrales (intervalo > 45 días), usar ventana trimestral
  if (medianInterval > 45) return THREE_MONTH_MS;
  // Para series de cotización (diarias/semanales), usar la media móvil de 2 meses
  return TWO_MONTH_MS;
}

export function buildPriceMotionPlan(
  geometry: readonly PricePointGeometry[],
  defaultPhase: CharacterPhase = "senor",
  allPoints?: readonly PricePoint[],
  smoothY = false,
  windowMs?: number,
): CharacterMotionPlan {
  const effectiveWindowMs = windowMs ?? defaultWindowMs(geometry, Boolean(allPoints && allPoints.length > 0));
  const points = buildTwoMonthTrendPoints(geometry, allPoints, smoothY, effectiveWindowMs);
  if (points.length < 2) return { path: "", phases: [], keyTimes: [0, 1], changesPct: [] };

  const changesPct = points.slice(1).map((point) => point.changePct);
  const rawPhases = changesPct.map((change) => (
    change === null ? defaultPhase : characterPhaseForChange(change)
  ));
  const phases = stabilizePricePhases(rawPhases, minimumPhaseRun(points));
  const path = buildSmoothPath(points);
  const lengths = points.slice(1).map((point, index) => (
    Math.hypot(point.x - points[index].x, point.y - points[index].y)
  ));

  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  const keyTimes = [0];
  let traversed = 0;
  lengths.forEach((length, index) => {
    traversed += length;
    keyTimes.push(totalLength > 0 ? traversed / totalLength : (index + 1) / lengths.length);
  });
  keyTimes[keyTimes.length - 1] = 1;

  return { path, phases, keyTimes, changesPct };
}

export function PriceTrendAnimation({
  geometry,
  label,
  annualTrend,
  allPoints,
}: {
  geometry: PriceChartGeometry | null;
  label: string;
  annualTrend?: {
    rate: number;
    phase: CharacterPhase;
    patternName: string;
    patternDescription: string;
  } | null;
  allPoints?: readonly PricePoint[];
}) {
  const animationRootRef = useRef<SVGSVGElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const targetPhase: CharacterPhase = annualTrend?.phase ?? "senor";
  const plan = useMemo(
    () => buildPriceMotionPlan(geometry?.points ?? [], targetPhase, allPoints),
    [geometry?.points, targetPhase, allPoints],
  );
  const lastPoint = geometry?.points.at(-1) ?? null;
  const duration = 30;

  useEffect(() => {
    if (reducedMotion || !plan.path) return;
    const frame = requestAnimationFrame(() => {
      animationRootRef.current
        ?.querySelectorAll<SVGAnimationElement>("animate, animateMotion")
        .forEach((animation) => animation.beginElement());
    });
    return () => cancelAnimationFrame(frame);
  }, [duration, plan.path, reducedMotion]);

  if (!geometry || !lastPoint || !plan.path || plan.phases.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      role="img"
      aria-label={`Cid recorre la cotización de ${label}`}
    >
      <svg
        ref={animationRootRef}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        className="block size-full overflow-visible"
        aria-hidden="true"
      >
        <g
          color="#f7f8fc"
          filter="drop-shadow(0 2px 3px rgb(0 0 0 / 72%))"
          transform={reducedMotion ? `translate(${lastPoint.x} ${lastPoint.y})` : undefined}
        >
          {!reducedMotion && (
            <animateMotion
              key={`motion-${plan.path}-${duration}`}
              path={plan.path}
              begin="indefinite"
              dur={`${duration}s`}
              repeatCount="1"
              fill="freeze"
              calcMode="paced"
            />
          )}
          {!reducedMotion && plan.phases.length > 0 ? (
            <AdaptiveCharacter
              key={`character-${plan.path}-${duration}`}
              plan={plan}
              duration={duration}
              repeatCount="1"
            />
          ) : (
            <StaticAdaptiveCharacter phase={plan.phases.at(-1) ?? targetPhase} />
          )}
        </g>
      </svg>
    </div>
  );
}

function stabilizePricePhases(
  phases: readonly CharacterPhase[],
  minimumRun: number,
): CharacterPhase[] {
  if (minimumRun <= 1 || phases.length <= minimumRun) return [...phases];
  let stable = [...phases];

  for (let pass = 0; pass < 2; pass++) {
    let changed = false;
    let runStart = 0;
    while (runStart < stable.length) {
      let runEnd = runStart + 1;
      while (runEnd < stable.length && stable[runEnd] === stable[runStart]) runEnd += 1;
      const runLength = runEnd - runStart;
      if (runLength < minimumRun) {
        const previous = runStart > 0 ? stable[runStart - 1] : null;
        const next = runEnd < stable.length ? stable[runEnd] : null;
        const replacement = previous ?? next;
        if (replacement && replacement !== stable[runStart]) {
          for (let index = runStart; index < runEnd; index += 1) stable[index] = replacement;
          changed = true;
        }
      }
      runStart = runEnd;
    }
    if (!changed) break;
  }

  return stable;
}

function minimumPhaseRun(points: readonly ThreeMonthTrendPoint[]): number {
  if (points.length <= 10) return 1;
  // Mantener cada fase con suficiente estabilidad para evitar parpadeo puntual sin borrar bajadas
  return Math.max(3, Math.min(8, Math.round(points.length * 0.018)));
}

function buildSmoothPath(points: readonly ThreeMonthTrendPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${round(points[0].x)} ${round(points[0].y)}`;

  // Filtrado de puntos adyacentes excesivamente juntos (< 2.5px) para evitar jitter
  const filtered: ThreeMonthTrendPoint[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = filtered[filtered.length - 1];
    if (points[i].x - prev.x >= 2.5) {
      filtered.push(points[i]);
    }
  }
  filtered.push(points[points.length - 1]);

  const n = filtered.length;
  if (n === 2) {
    return `M ${round(filtered[0].x)} ${round(filtered[0].y)} L ${round(filtered[1].x)} ${round(filtered[1].y)}`;
  }

  // 1. Pendientes secantes
  const deltas: number[] = [];
  const dxs: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = Math.max(0.001, filtered[i + 1].x - filtered[i].x);
    const dy = filtered[i + 1].y - filtered[i].y;
    dxs.push(dx);
    deltas.push(dy / dx);
  }

  // 2. Tangentes monótonas de Fritsch-Carlson (sin sobreoscilación ni saltos en crestas y valles)
  const m: number[] = new Array(n);
  m[0] = deltas[0];
  m[n - 1] = deltas[n - 2];

  for (let i = 1; i < n - 1; i++) {
    const dPrev = deltas[i - 1];
    const dNext = deltas[i];
    if (dPrev * dNext <= 0) {
      m[i] = 0;
    } else {
      const w1 = dxs[i - 1] + 2 * dxs[i];
      const w2 = 2 * dxs[i - 1] + dxs[i];
      m[i] = (w1 + w2) / (w1 / dPrev + w2 / dNext);
    }
  }

  // 3. Trazado cúbico monótono
  let path = `M ${round(filtered[0].x)} ${round(filtered[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = filtered[i];
    const p2 = filtered[i + 1];
    const dx = dxs[i];

    const cp1x = p1.x + dx / 3;
    const cp1y = p1.y + m[i] * (dx / 3);
    const cp2x = p2.x - dx / 3;
    const cp2y = p2.y - m[i + 1] * (dx / 3);

    path += ` C ${round(cp1x)} ${round(cp1y)} ${round(cp2x)} ${round(cp2y)} ${round(p2.x)} ${round(p2.y)}`;
  }

  return path;
}

function round(value: number): string {
  return Number(value.toFixed(1)).toString();
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
