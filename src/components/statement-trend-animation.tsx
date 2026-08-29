"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { MetricDirection } from "@/lib/financials/metric-semantics";
import styles from "./statement-trend-animation.module.css";

export type TrendPoint = {
  key: string;
  end: string;
  value: number;
};

export type StatementBarGeometry = {
  index: number;
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
};

export type StatementChartGeometry = {
  width: number;
  height: number;
  bars: StatementBarGeometry[];
};

export type TrendScene = "walk" | "stairs" | "climb" | "rocket" | "surge" | "flat" | "ski" | "distress" | "insufficient";

export type CharacterPhase = "elderly" | "walk" | "stairs" | "climb" | "rocket" | "snowboard" | "parachute";

export type CharacterMood = "happy" | "neutral" | "sad" | "worried";

export type CharacterMotionPlan = {
  path: string;
  phases: CharacterPhase[];
  keyTimes: number[];
  changesPct: Array<number | null>;
};

export type PhaseOpacityTimeline = {
  keyTimes: number[];
  values: Record<CharacterPhase, number[]>;
};

export type TrendAnalysis = {
  scene: TrendScene;
  title: string;
  description: string;
  annualGrowthPct: number | null;
  latestChangePct: number | null;
  breakoutIndex: number | null;
};

export type BusinessProfileKind = "walk" | "earthquake" | "stairs" | "elevator" | "mixed" | "insufficient";

export type BusinessProfile = {
  kind: BusinessProfileKind;
  title: string;
  description: string;
};

type AnnualRate = {
  pointIndex: number;
  value: number;
};

type LandingPoint = {
  index: number;
  x: number;
  y: number;
  left: number;
  right: number;
};

const DAY_MS = 86_400_000;

export function analyzeStatementTrend(data: readonly TrendPoint[]): TrendAnalysis {
  if (data.length < 2) {
    return result(
      "insufficient",
      "Aún no hay recorrido",
      "Se necesitan al menos dos periodos comparables para interpretar la trayectoria.",
      null,
      null,
    );
  }

  const annualRates = buildComparableAnnualRates(data);
  const recentRates = annualRates.slice(-5).map((rate) => rate.value);
  const annualGrowthPct = median(recentRates);
  const lastRate = annualRates.at(-1);
  const latestChangePct = lastRate?.pointIndex === data.length - 1 ? lastRate.value : null;

  if (annualGrowthPct === null) {
    return result(
      "insufficient",
      "Trayectoria no comparable",
      "Todavía no hay periodos interanuales comparables para calcular el recorrido.",
      null,
      latestChangePct,
    );
  }

  if (annualGrowthPct < -50 || (latestChangePct !== null && latestChangePct < -50)) {
    const causedByLatest = annualGrowthPct >= -50 && latestChangePct !== null;
    return result(
      "distress",
      "Caída extrema",
      causedByLatest
        ? "El último dato interanual pierde más de la mitad y el personaje abre el paracaídas."
        : "La serie pierde más de la mitad de su altura y el personaje desciende con paracaídas.",
      annualGrowthPct,
      latestChangePct,
    );
  }

  if (annualGrowthPct < -5 || (latestChangePct !== null && latestChangePct < -5)) {
    const causedByLatest = annualGrowthPct >= -5 && latestChangePct !== null;
    return result(
      "ski",
      "Pendiente descendente",
      causedByLatest
        ? "El último dato rompe a la baja la trayectoria reciente y el personaje desciende sobre su snowboard."
        : "La trayectoria interanual apunta hacia abajo y el personaje baja sobre su snowboard.",
      annualGrowthPct,
      latestChangePct,
    );
  }

  const plateauBreakout = findPlateauBreakout(data);
  const rateBreakout = findRateBreakout(annualRates, data.length);
  const suddenBreakout = isLatestSuddenJump(annualRates, data.length) ? data.length - 1 : null;
  const breakoutIndex = plateauBreakout ?? rateBreakout ?? suddenBreakout;

  if (breakoutIndex !== null) {
    const isLongPlateau = plateauBreakout !== null;
    return result(
      "surge",
      isLongPlateau ? "Años planos y despegue" : "Salto repentino",
      isLongPlateau
        ? "Tras una meseta prolongada, el personaje recorre las barras aburridas y salta sobre el punto exacto del despegue."
        : "El último dato rompe una trayectoria estable y el personaje salta sobre la barra que provoca el cambio.",
      annualGrowthPct,
      latestChangePct,
      breakoutIndex,
    );
  }

  if (annualGrowthPct > 50) {
    return result(
      "rocket",
      "Crecimiento explosivo",
      "El crecimiento supera el 50 % y el personaje recorre el salto montado en su cohete.",
      annualGrowthPct,
      latestChangePct,
    );
  }

  if (annualGrowthPct >= 15) {
    return result(
      "climb",
      "Empresa ascensor",
      "El personaje asciende con el piolet y una expresión alegre.",
      annualGrowthPct,
      latestChangePct,
    );
  }

  if (annualGrowthPct > 5) {
    return result(
      "stairs",
      "Empresa de escalera",
      "El personaje sube peldaño a peldaño siguiendo el crecimiento real de la empresa.",
      annualGrowthPct,
      latestChangePct,
    );
  }

  return result(
    "flat",
    "Empresa de paseo",
    "El caminante veterano avanza despacio sobre una sucesión de barras casi planas.",
    annualGrowthPct,
    latestChangePct,
  );
}

export function analyzeBusinessProfile(data: readonly TrendPoint[]): BusinessProfile {
  const rates = buildComparableAnnualRates(data).map((rate) => rate.value).slice(-10);
  return classifyAltiProfile(rates);
}

export function classifyAltiProfile(changesPct: readonly number[]): BusinessProfile {
  const rates = changesPct.filter(Number.isFinite).slice(-10);
  if (rates.length === 0) {
    return {
      kind: "insufficient",
      title: "Lectura pendiente",
      description: "Se necesitan al menos dos periodos comparables para clasificar la evolución de esta empresa.",
    };
  }

  const hasGrowthPeak = rates.some((rate) => rate > 30);
  const hasContractionPeak = rates.some((rate) => rate < -30);
  if (hasGrowthPeak && hasContractionPeak) {
    return {
      kind: "earthquake",
      title: "Empresa terremoto",
      description: "La serie presenta los dos extremos: al menos un periodo supera el +30 % y otro cae por debajo del −30 %.",
    };
  }

  const recent = rates.slice(-5);
  const calmShare = recent.filter((rate) => Math.abs(rate) <= 5).length / recent.length;
  const typicalAbsoluteMove = median(recent.map((rate) => Math.abs(rate))) ?? Number.POSITIVE_INFINITY;
  const hasNoMaterialJump = recent.every((rate) => Math.abs(rate) <= 10);
  if (recent.length >= 3 && calmShare >= 0.6 && typicalAbsoluteMove <= 5 && hasNoMaterialJump) {
    return {
      kind: "walk",
      title: "Empresa de paseo",
      description: "Los últimos años apenas cambian: la serie avanza tranquila, sin pendientes importantes.",
    };
  }

  if (recent.length >= 3 && recent.every((rate) => rate >= 5 && rate <= 10)) {
    return {
      kind: "stairs",
      title: "Empresa de escalera",
      description: "La serie muestra una subida ordenada y repetida de entre el 5 % y el 10 %: peldaño tras peldaño.",
    };
  }

  if (recent.length >= 3 && recent.every((rate) => rate > 15)) {
    return {
      kind: "elevator",
      title: "Empresa ascensor (compounder)",
      description: "La serie mantiene crecimiento compuesto superior al 15 % de forma continua: no sube escalones, sube en ascensor.",
    };
  }

  return {
    kind: "mixed",
    title: "Empresa en transición",
    description: "Todavía no hay un patrón dominante: combina años tranquilos con movimientos más exigentes.",
  };
}

export function StatementTrendAnimation({
  data,
  label,
  geometry,
  direction = "higher",
}: {
  data: readonly TrendPoint[];
  label: string;
  geometry: StatementChartGeometry | null;
  direction?: MetricDirection;
}) {
  const trend = analyzeStatementTrend(data);
  const reducedMotion = usePrefersReducedMotion();
  const animationRootRef = useRef<SVGSVGElement>(null);
  const bars = geometry?.bars ?? [];
  const motionPlan = buildInteractiveMotionPlan(bars);
  const motionPath = motionPlan.path;
  const lastLanding = bars.length > 0 ? landingPoint(bars.at(-1)!) : null;
  const duration = Math.min(24, Math.max(8, bars.length * 1.05));
  const motionStyle = { "--motion-duration": `${duration}s` } as CSSProperties;

  useEffect(() => {
    if (reducedMotion || !motionPath) return;
    const frame = requestAnimationFrame(() => {
      animationRootRef.current
        ?.querySelectorAll<SVGAnimationElement>("animate, animateMotion")
        .forEach((animation) => animation.beginElement());
    });
    return () => cancelAnimationFrame(frame);
  }, [duration, motionPath, reducedMotion]);

  if (!geometry || bars.length === 0 || !motionPath || !lastLanding) return null;

  return (
    <div
      className={styles.overlay}
      role="img"
      aria-label={`El personaje recorre las barras de ${label} y adapta su movimiento a cada variación.`}
    >
      <svg
        ref={animationRootRef}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        className={styles.canvas}
        aria-hidden="true"
      >
        <g
          className={styles.motion}
          style={motionStyle}
          transform={reducedMotion ? `translate(${lastLanding.x} ${lastLanding.y})` : undefined}
        >
          {!reducedMotion && (
            <animateMotion
              key={`${trend.scene}-${motionPath}`}
              path={motionPath}
              begin="indefinite"
              dur={`${duration}s`}
              repeatCount="1"
              fill="freeze"
              calcMode="paced"
            />
          )}
          {!reducedMotion && motionPlan.phases.length > 0 ? (
            <AdaptiveCharacter plan={motionPlan} duration={duration} direction={direction} />
          ) : (
            <StaticAdaptiveCharacter phase={motionPlan.phases.at(-1) ?? "walk"} direction={direction} />
          )}
        </g>
      </svg>
    </div>
  );
}

const CHARACTER_PHASES: CharacterPhase[] = [
  "elderly",
  "walk",
  "stairs",
  "climb",
  "rocket",
  "snowboard",
  "parachute",
];

export function AdaptiveCharacter({
  plan,
  duration,
  direction = "higher",
}: {
  plan: CharacterMotionPlan;
  duration: number;
  direction?: MetricDirection;
}) {
  const timeline = buildPhaseOpacityTimeline(plan, duration);
  const keyTimes = timeline.keyTimes.map(formatProgress).join(";");
  const initialPhase = plan.phases[0];
  const shadowValues = timeline.values.parachute.map((value) => 1 - value);

  return (
    <g className={styles.figure} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <ellipse className={styles.shadow} cx="0" cy="2" rx="12" ry="3" opacity={initialPhase === "parachute" ? 0 : 1}>
        <animate
          attributeName="opacity"
          begin="indefinite"
          values={shadowValues.join(";")}
          keyTimes={keyTimes}
          calcMode="linear"
          dur={`${duration}s`}
          repeatCount="1"
          fill="freeze"
        />
      </ellipse>

      <path d="M0-25L-2-8" className={styles.bodyLine} />
      <circle cx="0" cy="-35" r="10" className={styles.head} />

      {CHARACTER_PHASES.map((phase) => (
        <g key={phase} className={styles.poseLayer} opacity={initialPhase === phase ? 1 : 0}>
          <animate
            attributeName="opacity"
            begin="indefinite"
            values={timeline.values[phase].join(";")}
            keyTimes={keyTimes}
            calcMode="linear"
            dur={`${duration}s`}
            repeatCount="1"
            fill="freeze"
          />
          <CharacterPose phase={phase} direction={direction} />
        </g>
      ))}

    </g>
  );
}

export function StaticAdaptiveCharacter({
  phase,
  direction = "higher",
}: {
  phase: CharacterPhase;
  direction?: MetricDirection;
}) {
  return (
    <g className={styles.figure} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {phase !== "parachute" && <ellipse className={styles.shadow} cx="0" cy="2" rx="12" ry="3" />}
      <path d="M0-25L-2-8" className={styles.bodyLine} />
      <circle cx="0" cy="-35" r="10" className={styles.head} />
      <CharacterPose phase={phase} direction={direction} />
    </g>
  );
}

function CharacterPose({ phase, direction }: { phase: CharacterPhase; direction: MetricDirection }) {
  if (phase === "elderly") {
    return (
      <g className={styles.poseElderly}>
        <CharacterFace phase={phase} direction={direction} />
        <g className={styles.armA}><path d="M-1-21L-13-12" /></g>
        <g className={styles.armB}><path d="M-1-20Q8-16 12-9" /></g>
        <g className={styles.legA}><path d="M-2-8L-11 0" /></g>
        <g className={styles.legB}><path d="M-2-8L7 0" /></g>
        <path d="M12-17L16 1Q16 5 21 4" className={styles.transformingStaff} />
      </g>
    );
  }

  if (phase === "climb") {
    return (
      <g className={styles.poseClimb}>
        <CharacterFace phase={phase} direction={direction} />
        <g className={styles.armA}><path d="M0-21L-13-31" /></g>
        <g className={styles.armB}><path d="M0-20L12-12" /></g>
        <g className={styles.legA}><path d="M-2-8L-12-1" /></g>
        <g className={styles.legB}><path d="M-2-8L8 1" /></g>
        <path d="M12-12L18-32M11-30Q18-36 26-30" className={styles.transformingStaff} />
      </g>
    );
  }

  if (phase === "stairs") {
    return (
      <g className={styles.poseStairs}>
        <CharacterFace phase={phase} direction={direction} />
        <g className={styles.armA}><path d="M0-21L-12-27" /></g>
        <g className={styles.armB}><path d="M0-21L11-14" /></g>
        <g className={styles.legA}><path d="M-2-8L-11-7L-12 1" /></g>
        <g className={styles.legB}><path d="M-2-8L8-1L13-1" /></g>
      </g>
    );
  }

  if (phase === "rocket") {
    return (
      <g className={styles.poseRocket}>
        <CharacterFace phase={phase} direction={direction} />
        <g className={styles.armA}><path d="M0-21L-12-27" /></g>
        <g className={styles.armB}><path d="M0-21L12-27" /></g>
        <g className={styles.legA}><path d="M-2-8L-11-2" /></g>
        <g className={styles.legB}><path d="M-2-8L8-2" /></g>
        <path d="M-11-3Q0-21 11-3L7 2H-7Z" className={styles.rocketBody} />
        <circle cx="0" cy="-8" r="3.2" className={styles.rocketWindow} />
        <path d="M-7 0L-14 5L-8 6M7 0L14 5L8 6" className={styles.rocketFin} />
        <path d="M-5 3Q0 17 5 3Q0 10-5 3Z" className={styles.rocketFlame} />
      </g>
    );
  }

  if (phase === "parachute") {
    return (
      <g className={styles.poseParachute}>
        <CharacterFace phase={phase} direction={direction} />
        <g className={styles.armA}><path d="M0-21L-11-34L-19-51" /></g>
        <g className={styles.armB}><path d="M0-21L11-34L19-51" /></g>
        <g className={styles.legA}><path d="M-2-8L-8 2" /></g>
        <g className={styles.legB}><path d="M-2-8L5 2" /></g>
        <path d="M-27-58Q0-82 27-58Q14-67 0-56Q-14-67-27-58Z" className={styles.canopySail} />
        <path d="M-24-58L-10-35M24-58L10-35" className={styles.canopyCord} />
      </g>
    );
  }

  if (phase === "snowboard") {
    return (
      <g className={styles.poseSnowboard}>
        <CharacterFace phase={phase} direction={direction} />
        <path d="M-25-23L-17-23M-28-17L-20-17M-24-11L-16-11" className={styles.speedLines} />
        <g className={styles.armA}><path d="M0-21L-14-27" /></g>
        <g className={styles.armB}><path d="M0-21L13-15" /></g>
        <g className={styles.legA}><path d="M-2-8L-10-2L-2 1" /></g>
        <g className={styles.legB}><path d="M-2-8L8-3L14 0" /></g>
        <path d="M-25 1Q-20 5-13 5H15Q22 5 26 0Q19 3 12 2H-14Q-21 2-25-1Z" className={styles.snowboard} />
      </g>
    );
  }

  return (
      <g className={styles.poseWalk}>
      <CharacterFace phase={phase} direction={direction} />
      <g className={styles.armA}><path d="M0-21L-13-11" /></g>
      <g className={styles.armB}><path d="M0-21L13-11" /></g>
      <g className={styles.legA}><path d="M-2-8L-11 0" /></g>
      <g className={styles.legB}><path d="M-2-8L9 0" /></g>
    </g>
  );
}

function CharacterFace({ phase, direction }: { phase: CharacterPhase; direction: MetricDirection }) {
  if (phase === "elderly") {
    return (
      <g className={styles.elderlyFace}>
        <path d="M-6-38Q-3-40 0-38M1-38Q4-40 7-38" className={styles.eyebrow} />
        <path d="M-5-35Q-3-33-1-35M2-35Q4-33 6-35" className={styles.closedEye} />
        <path d="M-8-33Q-10-27-6-23Q-4-17 0-14Q4-17 6-23Q10-27 8-33Q4-29 0-30Q-4-29-8-33Z" className={styles.beard} />
        <path d="M-4-29Q0-31 4-29M-3-27Q0-25 3-27" className={styles.beardDetail} />
      </g>
    );
  }

  const mood = characterMoodForPhase(phase, direction);

  if (mood === "worried") {
    return (
      <g className={styles.scaredFace}>
        <path d="M-7-40Q-3-43-1-40M1-40Q4-43 7-40" className={styles.eyebrow} />
        <circle cx="-3.5" cy="-35" r="1.7" className={styles.eye} />
        <circle cx="3.5" cy="-35" r="1.7" className={styles.eye} />
        <ellipse cx="0" cy="-28.5" rx="2.7" ry="3.5" className={styles.openMouth} />
      </g>
    );
  }

  if (mood === "sad") {
    return (
      <g className={styles.sadFace}>
        <path d="M-7-38L-2-40M7-38L2-40" className={styles.eyebrow} />
        <path d="M-6-35Q-3-37-1-35M1-35Q3-37 6-35" className={styles.closedEye} />
        <path d="M-4-28Q0-33 4-28" className={styles.mouth} />
        <path d="M6-33Q9-29 6-26Q3-29 6-33Z" className={styles.tear} />
      </g>
    );
  }

  if (mood === "happy" && phase === "rocket") {
    return (
      <g className={styles.rocketFace}>
        <path d="M-6-36L-3-38L0-36L-3-34ZM1-36L4-38L7-36L4-34Z" className={styles.starEye} />
        <path d="M-5-30Q0-24 5-30" className={styles.mouth} />
      </g>
    );
  }

  if (mood === "happy") {
    return (
      <g className={phase === "climb" ? styles.climbFace : styles.stairsFace}>
        <path d="M-7-38Q-4-41-1-38M1-38Q4-41 7-38" className={styles.eyebrow} />
        <circle cx="-3.5" cy="-34.5" r="1.25" className={styles.eye} />
        <circle cx="3.5" cy="-34.5" r="1.25" className={styles.eye} />
        <path d="M-4-30Q0-26 4-30" className={styles.mouth} />
      </g>
    );
  }

  return (
    <g className={styles.walkFace}>
      <circle cx="-3.5" cy="-35" r="1.2" className={styles.eye} />
      <circle cx="3.5" cy="-35" r="1.2" className={styles.eye} />
      <path d="M-4-30Q0-27 4-30" className={styles.mouth} />
    </g>
  );
}

export function characterMoodForPhase(phase: CharacterPhase, direction: MetricDirection): CharacterMood {
  if (phase === "elderly" || phase === "walk" || direction === "contextual") return "neutral";
  const isRising = phase === "stairs" || phase === "climb" || phase === "rocket";
  const favorable = direction === "higher" ? isRising : !isRising;
  if (favorable) return "happy";
  return phase === "rocket" || phase === "parachute" ? "worried" : "sad";
}

export function buildPhaseOpacityTimeline(
  plan: Pick<CharacterMotionPlan, "phases" | "keyTimes">,
  duration: number,
): PhaseOpacityTimeline {
  const firstPhase = plan.phases[0] ?? "walk";
  const samples: Array<{ time: number; phase: CharacterPhase }> = [{ time: 0, phase: firstPhase }];
  const maximumHalfBlend = 0.38 / Math.max(duration, 0.1);

  for (let index = 1; index < plan.phases.length; index += 1) {
    const previous = plan.phases[index - 1];
    const next = plan.phases[index];
    if (previous === next) continue;
    const boundary = plan.keyTimes[index];
    const leftGap = boundary - plan.keyTimes[index - 1];
    const rightGap = plan.keyTimes[index + 1] - boundary;
    const halfBlend = Math.min(maximumHalfBlend, leftGap * 0.28, rightGap * 0.28);
    samples.push({ time: boundary - halfBlend, phase: previous });
    samples.push({ time: boundary + halfBlend, phase: next });
  }

  const lastPhase = plan.phases.at(-1) ?? firstPhase;
  samples.push({ time: 1, phase: lastPhase });
  const ordered = samples.filter((sample, index) => index === 0 || sample.time > samples[index - 1].time);

  return {
    keyTimes: ordered.map((sample) => sample.time),
    values: Object.fromEntries(CHARACTER_PHASES.map((phase) => [
      phase,
      ordered.map((sample) => sample.phase === phase ? 1 : 0),
    ])) as Record<CharacterPhase, number[]>,
  };
}

export function buildInteractiveMotionPlan(
  geometry: readonly StatementBarGeometry[],
): CharacterMotionPlan {
  const bars = [...geometry].sort((a, b) => a.index - b.index);
  if (bars.length === 0) return { path: "", phases: [], keyTimes: [0, 1], changesPct: [] };

  const points = bars.map(landingPoint);
  let path = `M ${round(points[0].x)} ${round(points[0].y)}`;
  const changesPct = bars.slice(1).map((bar, index) => directBarChangePct(bars[index].value, bar.value));
  const rawPhases = changesPct.map(phaseForTransition);
  const phases = stabilizeMotionPhases(rawPhases, changesPct, points);
  const lengths: number[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const phase = phases[index - 1];
    const piece = buildMotionPiece(previous, current, phase);

    path += piece.command;
    lengths.push(piece.length);
  }

  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  const keyTimes = [0];
  let traversed = 0;
  lengths.forEach((length) => {
    traversed += length;
    keyTimes.push(totalLength > 0 ? traversed / totalLength : keyTimes.length / lengths.length);
  });
  keyTimes[keyTimes.length - 1] = 1;

  return { path, phases, keyTimes, changesPct };
}

function stabilizeMotionPhases(
  rawPhases: readonly CharacterPhase[],
  changesPct: ReadonlyArray<number | null>,
  points: readonly LandingPoint[],
): CharacterPhase[] {
  const phases = [...rawPhases];
  const calm = rawPhases.map((phase, index) => {
    if (phase !== "elderly" && phase !== "walk") return false;
    const change = changesPct[index];
    const visualDelta = Math.abs(points[index + 1].y - points[index].y);
    return change === null || Math.abs(change) <= 5 || visualDelta <= 4;
  });

  let runStart = 0;
  while (runStart < calm.length) {
    if (!calm[runStart]) {
      runStart += 1;
      continue;
    }
    let runEnd = runStart + 1;
    while (runEnd < calm.length && calm[runEnd]) runEnd += 1;
    if (runEnd - runStart >= 3) {
      const runChanges = changesPct.slice(runStart, runEnd).filter((change): change is number => change !== null);
      const monotonicallyRising = runChanges.length > 0 && runChanges.every((change) => change > 0);
      const compounded = runChanges.reduce((factor, change) => factor * (1 + change / 100), 1) - 1;
      if (!monotonicallyRising && Math.abs(compounded) <= 0.06) {
        for (let index = runStart; index < runEnd; index += 1) phases[index] = "elderly";
      }
    }
    runStart = runEnd;
  }

  return phases;
}

function phaseForTransition(changePct: number | null): CharacterPhase {
  if (changePct === null) return "elderly";
  return characterPhaseForChange(changePct);
}

export function characterPhaseForChange(changePct: number): CharacterPhase {
  if (changePct < -50) return "parachute";
  if (changePct < -5) return "snowboard";
  if (changePct <= 5) return "elderly";
  if (changePct < 15) return "stairs";
  if (changePct <= 50) return "climb";
  return "rocket";
}

function buildMotionPiece(
  previous: LandingPoint,
  current: LandingPoint,
  phase: CharacterPhase,
): { command: string; length: number } {
  const midpoint = (previous.x + current.x) / 2;

  if (phase === "rocket") {
    const lift = Math.min(34, Math.max(20, Math.abs(current.y - previous.y) * 0.22 + 16));
    const apex = Math.min(previous.y, current.y) - lift;
    return {
      command: ` Q ${round(midpoint)} ${round(apex)} ${round(current.x)} ${round(current.y)}`,
      length: polylineLength([previous, { x: midpoint, y: apex }, current]),
    };
  }

  if (phase === "climb" && current.y < previous.y - 3) {
    const wallX = current.left - 5;
    const ledgeY = current.y + Math.min(11, Math.max(5, (previous.y - current.y) * 0.12));
    const controls = [
      previous,
      { x: midpoint, y: previous.y - 5 },
      { x: wallX, y: previous.y },
      { x: wallX, y: ledgeY },
      { x: current.left, y: current.y },
      current,
    ];
    return {
      command: ` Q ${round(midpoint)} ${round(previous.y - 5)} ${round(wallX)} ${round(previous.y)}`
        + ` L ${round(wallX)} ${round(ledgeY)}`
        + ` Q ${round(current.left)} ${round(current.y)} ${round(current.x)} ${round(current.y)}`,
      length: polylineLength(controls),
    };
  }

  if (phase === "parachute") {
    const dx = current.x - previous.x;
    const controlA = { x: previous.x + dx * 0.28, y: previous.y + 5 };
    const controlB = { x: previous.x + dx * 0.72, y: current.y - 12 };
    return {
      command: ` C ${round(controlA.x)} ${round(controlA.y)} ${round(controlB.x)} ${round(controlB.y)} ${round(current.x)} ${round(current.y)}`,
      length: polylineLength([previous, controlA, controlB, current]),
    };
  }

  if (phase === "snowboard") {
    const control = { x: midpoint, y: (previous.y + current.y) / 2 - 3 };
    return {
      command: ` Q ${round(control.x)} ${round(control.y)} ${round(current.x)} ${round(current.y)}`,
      length: polylineLength([previous, control, current]),
    };
  }

  const hop = phase === "elderly"
    ? 3
    : phase === "stairs"
      ? 8
    : Math.min(16, Math.max(6, Math.abs(current.y - previous.y) * 0.08 + 5));
  const control = { x: midpoint, y: Math.min(previous.y, current.y) - hop };
  return {
    command: ` Q ${round(control.x)} ${round(control.y)} ${round(current.x)} ${round(current.y)}`,
    length: polylineLength([previous, control, current]),
  };
}

function directBarChangePct(previous: number, current: number): number | null {
  if (!Number.isFinite(previous) || !Number.isFinite(current) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function polylineLength(points: ReadonlyArray<{ x: number; y: number }>): number {
  return points.slice(1).reduce((total, point, index) => {
    const previous = points[index];
    return total + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
}

function formatProgress(value: number): string {
  if (value <= 0) return "0";
  if (value >= 1) return "1";
  return Number(value.toFixed(5)).toString();
}

function buildComparableAnnualRates(data: readonly TrendPoint[]): AnnualRate[] {
  const quarterly = data.some((point) => !point.key.startsWith("FY"));

  if (quarterly) {
    const byKey = new Map(data.map((point, index) => [point.key, { point, index }]));
    const rates: AnnualRate[] = [];

    data.forEach((point, pointIndex) => {
      const parsed = parseQuarterKey(point.key);
      if (!parsed) return;
      const previous = byKey.get(`${parsed.fiscalYear - 1}Q${parsed.quarter}`);
      if (!previous) return;
      const value = comparableAnnualChange(previous.point.value, point.value, previous.point.end, point.end);
      if (value !== null) rates.push({ pointIndex, value });
    });

    return rates;
  }

  return data.slice(1).flatMap((point, offset) => {
    const previous = data[offset];
    const value = comparableAnnualChange(previous.value, point.value, previous.end, point.end);
    return value === null ? [] : [{ pointIndex: offset + 1, value }];
  });
}

function findPlateauBreakout(data: readonly TrendPoint[]): number | null {
  if (data.length < 5 || data.some((point) => !point.key.startsWith("FY"))) return null;

  let best: { index: number; score: number } | null = null;

  for (let breakoutIndex = 4; breakoutIndex < data.length; breakoutIndex += 1) {
    for (let start = 0; start <= breakoutIndex - 4; start += 1) {
      const baseline = data.slice(start, breakoutIndex);
      const values = baseline.map((point) => point.value);
      if (values.some((value) => value <= 0)) continue;
      const center = median(values);
      if (center === null || center === 0) continue;

      const rangePct = ((Math.max(...values) - Math.min(...values)) / Math.abs(center)) * 100;
      const slope = annualizedChange(
        baseline[0].value,
        baseline.at(-1)!.value,
        elapsedYears(baseline[0].end, baseline.at(-1)!.end),
      );
      const jumpPct = ((data[breakoutIndex].value - center) / Math.abs(center)) * 100;
      const staysAbovePlateau = data
        .slice(breakoutIndex)
        .every((point) => point.value >= center * 1.15);

      if (rangePct > 18 || slope === null || Math.abs(slope) > 5.5 || jumpPct < 30 || !staysAbovePlateau) continue;

      const score = baseline.length * 20 + jumpPct - rangePct;
      if (!best || score > best.score) best = { index: breakoutIndex, score };
    }
  }

  if (best) return best.index;

  // A long low-value stretch can look genuinely flat at the scale of the complete
  // chart even when its percentages are not. This captures that visual compression
  // before a bar finally becomes material, without mistaking four ordinary growth
  // years for a plateau.
  if (data.length < 7 || data.some((point) => point.value <= 0)) return null;
  const visualScale = Math.max(...data.map((point) => Math.abs(point.value)));
  if (visualScale === 0) return null;

  for (let breakoutIndex = 6; breakoutIndex < data.length; breakoutIndex += 1) {
    for (let start = 0; start <= breakoutIndex - 6; start += 1) {
      const baseline = data.slice(start, breakoutIndex).map((point) => point.value);
      const baselineTop = Math.max(...baseline);
      const baselineFloor = Math.min(...baseline);
      const visualBandPct = ((baselineTop - baselineFloor) / visualScale) * 100;
      const breakoutValue = data[breakoutIndex].value;
      const jumpMultiple = breakoutValue / baselineTop;
      const visualJumpPct = ((breakoutValue - baselineTop) / visualScale) * 100;
      const staysElevated = data
        .slice(breakoutIndex)
        .every((point) => point.value >= baselineTop * 1.25);

      if (visualBandPct > 14 || jumpMultiple < 1.65 || visualJumpPct < 10 || !staysElevated) continue;

      const score = baseline.length * 20 + jumpMultiple * 12 + visualJumpPct - visualBandPct;
      if (!best || score > best.score) best = { index: breakoutIndex, score };
    }
  }

  return best?.index ?? null;
}

function findRateBreakout(rates: readonly AnnualRate[], pointCount: number): number | null {
  if (rates.length < 4) return null;
  const firstCandidate = Math.max(3, rates.length - 3);

  for (let index = firstCandidate; index < rates.length; index += 1) {
    const prior = rates.slice(Math.max(0, index - 4), index).map((rate) => rate.value);
    if (prior.length < 3) continue;
    const baseline = median(prior);
    if (baseline === null) continue;
    const deviation = median(prior.map((value) => Math.abs(value - baseline))) ?? 0;
    const current = rates[index];
    const remainsHigh = rates.slice(index).every((rate) => rate.value >= 20);
    const recentEnough = current.pointIndex >= pointCount - 3;
    if (Math.abs(baseline) <= 5 && deviation <= 5 && current.value >= 25 && remainsHigh && recentEnough) {
      return current.pointIndex;
    }
  }

  return null;
}

function comparableAnnualChange(previous: number, current: number, previousEnd: string, currentEnd: string): number | null {
  return annualizedChange(previous, current, elapsedYears(previousEnd, currentEnd));
}

function isLatestSuddenJump(rates: readonly AnnualRate[], pointCount: number): boolean {
  if (rates.length < 4) return false;
  const latest = rates.at(-1)!;
  if (latest.pointIndex !== pointCount - 1 || latest.value < 25) return false;

  const prior = rates.slice(-5, -1).map((rate) => rate.value);
  if (prior.length < 3) return false;
  const baseline = median(prior);
  if (baseline === null) return false;
  const deviation = median(prior.map((value) => Math.abs(value - baseline))) ?? 0;
  const stableBaseline = deviation <= Math.max(6, Math.abs(baseline) * 0.35);
  const exceptionalGap = latest.value - baseline >= Math.max(20, deviation * 3);

  return stableBaseline && exceptionalGap;
}

function parseQuarterKey(key: string): { fiscalYear: number; quarter: number } | null {
  const match = /^(\d{4})Q([1-4])$/.exec(key);
  if (!match) return null;
  return { fiscalYear: Number(match[1]), quarter: Number(match[2]) };
}

function landingPoint(bar: StatementBarGeometry): LandingPoint {
  return {
    index: bar.index,
    x: bar.x + bar.width / 2,
    y: bar.value >= 0 ? bar.y : bar.y + bar.height,
    left: bar.x,
    right: bar.x + bar.width,
  };
}

function result(
  scene: TrendScene,
  title: string,
  description: string,
  annualGrowthPct: number | null,
  latestChangePct: number | null,
  breakoutIndex: number | null = null,
): TrendAnalysis {
  return { scene, title, description, annualGrowthPct, latestChangePct, breakoutIndex };
}

function annualizedChange(previous: number, current: number, years: number): number | null {
  if (!Number.isFinite(previous) || !Number.isFinite(current) || previous === 0 || years <= 0) return null;

  if (previous > 0 && current >= 0) {
    return (Math.pow(current / previous, 1 / years) - 1) * 100;
  }

  if (previous < 0 && current < 0) {
    const magnitudeRatio = Math.abs(current) / Math.abs(previous);
    return magnitudeRatio <= 1
      ? (1 - Math.pow(magnitudeRatio, 1 / years)) * 100
      : -(Math.pow(magnitudeRatio, 1 / years) - 1) * 100;
  }

  return current > previous ? 100 : -100;
}

function elapsedYears(previousEnd: string, currentEnd: string): number {
  const previousDate = Date.parse(previousEnd);
  const currentDate = Date.parse(currentEnd);
  if (Number.isFinite(previousDate) && Number.isFinite(currentDate) && currentDate > previousDate) {
    return Math.max((currentDate - previousDate) / DAY_MS / 365.25, 0.25);
  }
  return 1;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0 ? (ordered[middle - 1] + ordered[middle]) / 2 : ordered[middle];
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
