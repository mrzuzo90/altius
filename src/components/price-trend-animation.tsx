"use client";

import { useEffect, useRef, useState } from "react";
import {
  AdaptiveCharacter,
  StaticAdaptiveCharacter,
  classifyAltiProfile,
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
  changePct: number | null;
};

const THREE_MONTH_MS = 92 * 86_400_000;

export function analyzeTenYearPriceProfile(points: readonly PricePoint[]): BusinessProfile {
  const ordered = [...points]
    .filter((point) => Number.isFinite(point.close) && Number.isFinite(Date.parse(point.date)))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (ordered.length < 2) return classifyAltiProfile([]);

  const yearEnds: PricePoint[] = [];
  ordered.forEach((point, index) => {
    const next = ordered[index + 1];
    if (!next || next.date.slice(0, 4) !== point.date.slice(0, 4)) yearEnds.push(point);
  });
  const changes = yearEnds.slice(1).flatMap((point, index) => {
    const previous = yearEnds[index].close;
    return previous === 0 ? [] : [((point.close - previous) / Math.abs(previous)) * 100];
  });

  return classifyAltiProfile(changes);
}

export function buildThreeMonthTrendPoints(
  geometry: readonly PricePointGeometry[],
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

  const trend: ThreeMonthTrendPoint[] = [];
  let windowStart = 0;
  let comparisonIndex = -1;
  let valueSum = 0;
  let ySum = 0;

  points.forEach((point, index) => {
    const pointTime = Date.parse(point.date);
    valueSum += point.value;
    ySum += point.y;

    while (windowStart < index && pointTime - Date.parse(points[windowStart].date) > THREE_MONTH_MS) {
      valueSum -= points[windowStart].value;
      ySum -= points[windowStart].y;
      windowStart += 1;
    }

    const count = index - windowStart + 1;
    const averageValue = valueSum / count;
    const averageY = ySum / count;
    const comparisonTarget = pointTime - THREE_MONTH_MS;
    while (
      comparisonIndex + 1 < trend.length
      && Date.parse(trend[comparisonIndex + 1].date) <= comparisonTarget
    ) {
      comparisonIndex += 1;
    }
    const comparison = comparisonIndex >= 0 ? trend[comparisonIndex] : null;
    const changePct = comparison && comparison.averageValue !== 0
      ? ((averageValue - comparison.averageValue) / Math.abs(comparison.averageValue)) * 100
      : null;

    trend.push({
      ...point,
      y: averageY,
      averageValue,
      changePct,
    });
  });

  return trend;
}

export function buildPriceMotionPlan(geometry: readonly PricePointGeometry[]): CharacterMotionPlan {
  const points = buildThreeMonthTrendPoints(geometry);
  if (points.length < 2) return { path: "", phases: [], keyTimes: [0, 1], changesPct: [] };

  const changesPct = points.slice(1).map((point) => point.changePct);
  const rawPhases = changesPct.map((change) => (
    change === null ? "elderly" : characterPhaseForChange(change)
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
}: {
  geometry: PriceChartGeometry | null;
  label: string;
}) {
  const animationRootRef = useRef<SVGSVGElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const plan = buildPriceMotionPlan(geometry?.points ?? []);
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
  }, [plan.path, reducedMotion]);

  if (!geometry || !lastPoint || !plan.path || plan.phases.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      role="img"
      aria-label={`Alti recorre la tendencia móvil de tres meses de ${label} durante los últimos diez años`}
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
              path={plan.path}
              begin="indefinite"
              dur={`${duration}s`}
              repeatCount="1"
              fill="freeze"
              calcMode="paced"
            />
          )}
          <g transform="scale(0.86)">
            {!reducedMotion ? (
              <AdaptiveCharacter plan={plan} duration={duration} />
            ) : (
              <StaticAdaptiveCharacter phase={plan.phases.at(-1) ?? "elderly"} />
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}

function stabilizePricePhases(
  phases: readonly CharacterPhase[],
  minimumRun: number,
): CharacterPhase[] {
  if (minimumRun <= 1) return [...phases];
  const stable = [...phases];
  let runStart = 0;

  while (runStart < stable.length) {
    let runEnd = runStart + 1;
    while (runEnd < stable.length && stable[runEnd] === stable[runStart]) runEnd += 1;
    const runLength = runEnd - runStart;
    if (runLength < minimumRun) {
      const previous = runStart > 0 ? stable[runStart - 1] : null;
      const next = runEnd < stable.length ? stable[runEnd] : null;
      const replacement = previous === next ? previous : previous ?? next;
      if (replacement) {
        for (let index = runStart; index < runEnd; index += 1) stable[index] = replacement;
      }
    }
    runStart = runEnd;
  }

  return stable;
}

function minimumPhaseRun(points: readonly ThreeMonthTrendPoint[]): number {
  const intervals = points.slice(1).map((point, index) => (
    (Date.parse(point.date) - Date.parse(points[index].date)) / 86_400_000
  )).filter((days) => Number.isFinite(days) && days > 0).sort((a, b) => a - b);
  const typicalInterval = intervals[Math.floor(intervals.length / 2)] ?? 92;
  if (typicalInterval <= 10) return 3;
  if (typicalInterval <= 45) return 2;
  return 1;
}

function buildSmoothPath(points: readonly ThreeMonthTrendPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${round(points[0].x)} ${round(points[0].y)}`;

  let path = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const before = points[Math.max(0, index - 1)];
    const current = points[index];
    const next = points[index + 1];
    const after = points[Math.min(points.length - 1, index + 2)];
    const controlA = {
      x: current.x + (next.x - before.x) / 6,
      y: current.y + (next.y - before.y) / 6,
    };
    const controlB = {
      x: next.x - (after.x - current.x) / 6,
      y: next.y - (after.y - current.y) / 6,
    };
    path += ` C ${round(controlA.x)} ${round(controlA.y)} ${round(controlB.x)} ${round(controlB.y)} ${round(next.x)} ${round(next.y)}`;
  }
  return path;
}

function round(value: number): string {
  return Number(value.toFixed(1)).toString();
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}
