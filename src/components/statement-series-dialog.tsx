"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps } from "recharts";
import { PersonStanding } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MetricDirectionNotice } from "@/components/metric-direction";
import {
  ALTI_MASCOTS,
  annualizedChange,
  characterPhaseForChange,
  elapsedYears,
  StatementTrendAnimation,
  type CharacterPhase,
  type MascotPhaseConfig,
  type StatementBarGeometry,
  type StatementChartGeometry,
} from "@/components/statement-trend-animation";
import { cn } from "@/lib/utils";
import { getMetricSemantics } from "@/lib/financials/metric-semantics";
import { formatPct, formatValue, pctChange, SCALES, type Scale } from "@/lib/format";
import type { LineSeries, Period } from "@/lib/sec/normalize";

export type ChartPoint = {
  key: string;
  label: string;
  end: string;
  value: number;
  derived: boolean;
};

export type OverallAnnualTrend = {
  annualizedRatePct: number | null;
  phase: CharacterPhase;
  mascot: MascotPhaseConfig;
  status: "up" | "down" | "flat" | "insufficient";
  statusText: string;
  headline: string;
  patternName: string;
  patternDescription: string;
  periodSpanText: string;
  firstLabel: string;
  lastLabel: string;
  totalPeriods: number;
  years: number;
};

export function calculateOverallAnnualTrend(data: readonly ChartPoint[]): OverallAnnualTrend {
  if (data.length < 2) {
    const phase: CharacterPhase = "walk";
    const mascot = ALTI_MASCOTS.walk;
    return {
      annualizedRatePct: null,
      phase,
      mascot,
      status: "insufficient",
      statusText: "Datos insuficientes",
      headline: "Aún no hay suficiente histórico",
      patternName: "Alti de paseo",
      patternDescription: "Se necesitan al menos dos periodos comparables para clasificar el patrón general de Alti.",
      periodSpanText: data.length === 1 ? `Solo 1 periodo registrado (${data[0].label})` : "Sin datos registrados",
      firstLabel: data[0]?.label ?? "—",
      lastLabel: data.at(-1)?.label ?? "—",
      totalPeriods: data.length,
      years: 0,
    };
  }

  const first = data[0];
  const last = data.at(-1)!;
  const rawYears = elapsedYears(first.end, last.end);
  const years = Math.max(
    rawYears,
    (data.length - 1) * (data.some((p) => !p.key.startsWith("FY")) ? 0.25 : 1),
    0.25,
  );

  let rate = annualizedChange(first.value, last.value, years);

  if (rate === null) {
    const firstNonZero = data.find((p) => p.value !== 0);
    if (firstNonZero && firstNonZero !== last) {
      const subYears = Math.max(elapsedYears(firstNonZero.end, last.end), 0.25);
      rate = annualizedChange(firstNonZero.value, last.value, subYears);
    }
  }

  const rateVal = rate ?? 0;
  const phase = characterPhaseForChange(rateVal);
  const mascot = ALTI_MASCOTS[phase] ?? ALTI_MASCOTS.walk;

  let status: "up" | "down" | "flat" = "flat";
  let statusText = "Sin variación significativa";
  let headline = `Estable (${rateVal >= 0 ? "+" : ""}${rateVal.toFixed(1)}% anualizado)`;

  if (rateVal > 5) {
    status = "up";
    statusText = "Ha subido";
    headline = `Ha subido un +${rateVal.toFixed(1)}% anualizado`;
  } else if (rateVal < -5) {
    status = "down";
    statusText = "Ha bajado";
    headline = `Ha bajado un ${rateVal.toFixed(1)}% anualizado`;
  }

  let patternName = "Alti de paseo";
  let patternDescription = "Variación plana entre el -5% y +5% anualizado: avanza a paso tranquilo sin grandes pendientes.";

  if (phase === "rocket") {
    patternName = "Alti en cohete";
    patternDescription = "Subida explosiva superior al 30% anualizado: crecimiento vertiginoso sobre su cohete.";
  } else if (phase === "climb") {
    patternName = "Alti escalando (piolet)";
    patternDescription = "Crecimiento fuerte del 15% al 30% anualizado: ascensión constante y vigorosa con piolet.";
  } else if (phase === "stairs") {
    patternName = "Alti en escalera";
    patternDescription = "Crecimiento constante del 5% al 15% anualizado: sube peldaño a peldaño siguiendo el ritmo de la empresa.";
  } else if (phase === "snowboard") {
    patternName = "Alti en snowboard";
    patternDescription = "Descenso moderado de entre el -5% y -30% anualizado: desciende la pendiente sobre su tabla de snowboard.";
  } else if (phase === "parachute") {
    patternName = "Alti en paracaídas";
    patternDescription = "Caída extrema de más del -30% anualizado: descenso de emergencia con paracaídas desplegado.";
  }

  const periodSpanText = `Calculado sobre todos los datos registrados: ${first.label} a ${last.label} (${data.length} periodos).`;

  return {
    annualizedRatePct: rateVal,
    phase,
    mascot,
    status,
    statusText,
    headline,
    patternName,
    patternDescription,
    periodSpanText,
    firstLabel: first.label,
    lastLabel: last.label,
    totalPeriods: data.length,
    years,
  };
}

export function buildStatementChartData(periods: Period[], row: LineSeries): ChartPoint[] {
  return periods
    .flatMap((period) => {
      const cell = row.cells[period.key];
      return cell?.value == null
        ? []
        : [{
            key: period.key,
            label: period.label,
            end: period.end,
            value: cell.value,
            derived: cell.derived,
          }];
    })
    .reverse();
}

export function normalizeStatementBarRect(y: number, height: number): { y: number; height: number } {
  return height < 0
    ? { y: y + height, height: Math.abs(height) }
    : { y, height };
}

export function StatementSeriesDialog({
  row,
  periods,
  scale,
  currency,
  open,
  onOpenChange,
}: {
  row: LineSeries | null;
  periods: Period[];
  scale: Scale;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showAlti, setShowAlti] = useState(true);
  const [measuredChart, setMeasuredChart] = useState<{
    signature: string;
    geometry: StatementChartGeometry;
  } | null>(null);
  const chartSignature = `${row?.line.id ?? "none"}:${periods.map((period) => period.key).join("|")}`;
  const expectedBarCount = row
    ? periods.filter((period) => row.cells[period.key]?.value != null).length
    : 0;
  const geometryCollector = useRef<{ signature: string; bars: Map<number, StatementBarGeometry> }>({
    signature: "",
    bars: new Map(),
  });
  const measureFrame = useRef(0);
  const captureBarGeometry = useCallback((bar: StatementBarGeometry) => {
    if (!open) return;
    if (geometryCollector.current.signature !== chartSignature) {
      geometryCollector.current = { signature: chartSignature, bars: new Map() };
    }
    geometryCollector.current.bars.set(bar.index, bar);
    cancelAnimationFrame(measureFrame.current);
    measureFrame.current = requestAnimationFrame(() => {
      const container = chartRef.current;
      const bars = [...geometryCollector.current.bars.values()].sort((a, b) => a.index - b.index);
      if (!container || bars.length < expectedBarCount || container.clientWidth <= 0 || container.clientHeight <= 0) return;
      const next = { width: container.clientWidth, height: container.clientHeight, bars };
      setMeasuredChart((current) => (
        current?.signature === chartSignature && sameGeometry(current.geometry, next)
          ? current
          : { signature: chartSignature, geometry: next }
      ));
    });
  }, [chartSignature, expectedBarCount, open]);

  useEffect(() => () => cancelAnimationFrame(measureFrame.current), []);

  if (!row) return null;

  const data = buildStatementChartData(periods, row);
  const semantics = getMetricSemantics(row.line);
  const overallTrend = calculateOverallAnnualTrend(data);
  const latest = data.at(-1) ?? null;
  const priorComparable = latest
    ? [...data]
        .reverse()
        .find((point) => {
          if (point.key === latest.key) return false;
          if (latest.key.startsWith("FY")) return true;
          return point.key.endsWith(latest.key.slice(-2));
        }) ?? null
    : null;
  const yoy = pctChange(latest?.value ?? null, priorComparable?.value ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-carbon-surface border-gunmetal p-0 sm:max-w-3xl overflow-hidden shadow-2xl">
        <DialogHeader className="border-gunmetal border-b px-6 py-3.5 flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="font-display text-pure-white text-[22px] tracking-tight">
              {row.line.label}
            </DialogTitle>
            <DialogDescription className="text-muted-steel text-[12px] mt-0.5">
              Evolución histórica · cifras en {row.line.unit === "USD" ? `${SCALES[scale].label} de ${currency}` : "la unidad indicada"}
            </DialogDescription>
          </div>

          <button
            type="button"
            aria-pressed={showAlti}
            aria-label={`${showAlti ? "Ocultar" : "Mostrar"} a Alti en el gráfico de ${row.line.label}`}
            onClick={() => setShowAlti((visible) => !visible)}
            className={cn(
              "font-display inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ml-4",
              showAlti
                ? "border-periwinkle-glow/60 bg-periwinkle-glow/10 text-periwinkle-glow"
                : "border-gunmetal bg-carbon-surface text-muted-steel hover:text-frost",
            )}
          >
            <PersonStanding className="size-3.5" />
            <span>Alti · {showAlti ? "activo" : "oculto"}</span>
          </button>
        </DialogHeader>

        <div className="grid gap-px border-b border-gunmetal bg-gunmetal grid-cols-2 sm:grid-cols-4">
          <Metric label="Último periodo" value={latest ? formatValue(latest.value, row.line.unit, scale) : "—"} detail={latest?.label ?? "Sin datos"} />
          <Metric label="Variación interanual" value={formatPct(yoy)} detail={priorComparable ? `frente a ${priorComparable.label}` : "Sin comparable"} />
          <div className="bg-carbon-surface px-5 py-3 flex flex-col justify-between">
            <p className="text-muted-steel text-[10px] font-medium uppercase tracking-[0.12em]">
              Patrón general
            </p>
            <div className="flex items-center gap-2.5 mt-0.5">
              <img
                src={overallTrend.mascot.src}
                alt=""
                className="size-7 object-contain shrink-0 filter drop-shadow-[0_1px_4px_rgba(152,164,247,0.3)]"
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "tabular font-display text-[17px] sm:text-[18px] font-semibold leading-tight tracking-tight",
                    overallTrend.status === "up"
                      ? "text-emerald-400"
                      : overallTrend.status === "down"
                      ? "text-rose-400"
                      : "text-pure-white",
                  )}
                >
                  {overallTrend.annualizedRatePct !== null
                    ? `${overallTrend.annualizedRatePct > 0 ? "+" : ""}${overallTrend.annualizedRatePct.toFixed(1)}%`
                    : "—"}
                </p>
                <p className="text-muted-steel text-[11px] leading-none mt-0.5 truncate">
                  anualizado · {overallTrend.statusText}
                </p>
              </div>
            </div>
          </div>
          <Metric label="Cobertura" value={`${data.length} periodos`} detail={data.length > 1 ? `${data[0].label} — ${data.at(-1)!.label}` : data[0]?.label ?? "Sin datos"} />
        </div>

        <MetricDirectionNotice semantics={semantics} />

        <div className="px-5 pt-2 pb-3">
          <div ref={chartRef} className="relative h-[290px] w-full" role="group" aria-label={`Gráfico de barras de ${row.line.label}${showAlti ? " con personaje animado" : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 80, right: 8, bottom: 4, left: 4 }}>
                <CartesianGrid vertical={false} stroke="#1f2433" strokeDasharray="3 4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#646e87" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={12}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#646e87" }}
                  tickLine={false}
                  axisLine={false}
                  width={66}
                  tickFormatter={(value: number) => compactValue(value, row.line.unit, scale)}
                />
                <Tooltip
                  wrapperStyle={{ zIndex: 20 }}
                  cursor={{ fill: "rgba(152, 164, 247, 0.06)" }}
                  content={(props) => (
                    <StatementChartTooltip
                      active={props.active}
                      payload={props.payload as any}
                      label={props.label}
                      unit={row.line.unit}
                      scale={scale}
                      metricLabel={row.line.label}
                      data={data}
                    />
                  )}
                />
                <Bar
                  dataKey="value"
                  maxBarSize={56}
                  isAnimationActive={false}
                  shape={(props: BarShapeProps) => (
                    <StatementBarShape {...props} onGeometry={captureBarGeometry} />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
            {showAlti && (
              <StatementTrendAnimation
                data={data}
                label={row.line.label}
                geometry={measuredChart?.signature === chartSignature ? measuredChart.geometry : null}
                direction={semantics.direction}
              />
            )}
          </div>

          <div className="text-muted-steel flex items-center justify-between px-2 pt-2 text-[11px]">
            <div className="flex items-center gap-4">
              <Legend color="#98a4f7" label="Reportado" />
              <Legend color="#5b63d3" label="Calculado" />
            </div>
            <span>Los periodos sin cifra no se convierten en cero.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatementBarShape(props: BarShapeProps & { onGeometry: (bar: StatementBarGeometry) => void }) {
  const point = props.payload as ChartPoint | undefined;
  if (!point || !Number.isFinite(props.x) || !Number.isFinite(props.y)) return null;
  const { y, height } = normalizeStatementBarRect(props.y, props.height);

  const w = props.width;
  const h = height;
  const bottom = y + h;

  // Altura mínima garantizada para que las barras pequeñas (ej: primeros años de NVIDIA)
  // nunca se vean como simples líneas, sino siempre como castillos en miniatura.
  const visualH = Math.max(16, h);
  const towerY = bottom - visualH;

  const geometry = {
    index: props.index,
    key: point.key,
    value: point.value,
    x: props.x,
    y: towerY,
    width: props.width,
    height: visualH,
  };

  const isDerived = Boolean(point.derived);
  const baseColor = isDerived ? "#5b63d3" : "#98a4f7";
  const darkColor = isDerived ? "#3e4491" : "#6c7bd9";
  const highlightColor = isDerived ? "#7a82f0" : "#b5c0ff";

  // Cálculo de las almenas (merlons) en la cima de la torre:
  // Al menos 4px de altura para que siempre se distingan nítidamente las almenas.
  const merlonH = Math.min(8, Math.max(4, Math.round(Math.min(visualH * 0.26, w * 0.2))));
  const numMerlons = w >= 34 ? 3 : 2;
  const totalDivisions = numMerlons === 3 ? 5 : 3;
  const partW = w / totalDivisions;

  // Silueta limpia y pura de torre de castillo medieval con almenas (sin ventanas ni cruces)
  let towerPath = `M ${props.x} ${bottom} L ${props.x} ${towerY}`;
  if (numMerlons === 3) {
    towerPath += ` L ${props.x + partW} ${towerY}`
      + ` L ${props.x + partW} ${towerY + merlonH}`
      + ` L ${props.x + 2 * partW} ${towerY + merlonH}`
      + ` L ${props.x + 2 * partW} ${towerY}`
      + ` L ${props.x + 3 * partW} ${towerY}`
      + ` L ${props.x + 3 * partW} ${towerY + merlonH}`
      + ` L ${props.x + 4 * partW} ${towerY + merlonH}`
      + ` L ${props.x + 4 * partW} ${towerY}`
      + ` L ${props.x + w} ${towerY}`;
  } else {
    towerPath += ` L ${props.x + partW} ${towerY}`
      + ` L ${props.x + partW} ${towerY + merlonH}`
      + ` L ${props.x + 2 * partW} ${towerY + merlonH}`
      + ` L ${props.x + 2 * partW} ${towerY}`
      + ` L ${props.x + w} ${towerY}`;
  }
  towerPath += ` L ${props.x + w} ${bottom} Z`;

  // Moldura horizontal sutil bajo las almenas (solo si la torre tiene suficiente altura)
  const corniceY = towerY + merlonH + 1.5;
  const hasCornice = visualH >= 24;

  return (
    <g
      ref={(node) => {
        if (node) props.onGeometry(geometry);
      }}
      data-statement-bar-index={props.index}
      data-statement-bar-key={point.key}
      data-statement-bar-value={point.value}
      className="cursor-pointer transition-opacity hover:opacity-90"
    >
      {/* Cuerpo principal almenado de la torre de castillo */}
      <path
        d={towerPath}
        fill={baseColor}
      />

      {/* Bisel 3D iluminado en el lateral izquierdo */}
      <line
        x1={props.x + 1}
        y1={towerY}
        x2={props.x + 1}
        y2={bottom}
        stroke={highlightColor}
        strokeWidth={1.5}
        strokeOpacity={0.65}
      />

      {/* Bisel 3D sombreado en el lateral derecho */}
      <line
        x1={props.x + w - 1}
        y1={towerY}
        x2={props.x + w - 1}
        y2={bottom}
        stroke={darkColor}
        strokeWidth={1.5}
        strokeOpacity={0.75}
      />

      {/* Moldura de piedra limpia bajo las almenas */}
      {hasCornice && (
        <line
          x1={props.x}
          y1={corniceY}
          x2={props.x + w}
          y2={corniceY}
          stroke={darkColor}
          strokeWidth={1.2}
          strokeOpacity={0.8}
        />
      )}

      {/* Plinto / base de piedra de la torre */}
      {visualH >= 28 && (
        <rect
          x={props.x - 0.5}
          y={bottom - 2.5}
          width={w + 1}
          height={2.5}
          fill={darkColor}
          fillOpacity={0.5}
        />
      )}
    </g>
  );
}

function sameGeometry(current: StatementChartGeometry | null, next: StatementChartGeometry): boolean {
  if (!current || current.width !== next.width || current.height !== next.height || current.bars.length !== next.bars.length) {
    return false;
  }
  return current.bars.every((bar, index) => {
    const candidate = next.bars[index];
    return bar.key === candidate.key
      && bar.x === candidate.x
      && bar.y === candidate.y
      && bar.width === candidate.width
      && bar.height === candidate.height
      && bar.value === candidate.value;
  });
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-carbon-surface px-6 py-4">
      <p className="text-muted-steel text-[11px] font-medium uppercase tracking-[0.12em]">{label}</p>
      <p className="tabular font-display text-pure-white mt-1 text-[20px] tracking-tight">{value}</p>
      <p className="text-muted-steel mt-0.5 text-[12px]">{detail}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="size-2 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function compactValue(value: number, unit: LineSeries["line"]["unit"], scale: Scale): string {
  if (unit !== "USD") return formatValue(value, unit, scale);
  const scaled = value / SCALES[scale].divisor;
  return new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 }).format(scaled);
}

function StatementChartTooltip({
  active,
  payload,
  label,
  unit,
  scale,
  metricLabel,
  data,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartPoint }>;
  label?: string | number;
  unit: LineSeries["line"]["unit"];
  scale: Scale;
  metricLabel: string;
  data: ChartPoint[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const index = data.findIndex((p) => p.key === point.key);
  const previous = index > 0 ? data[index - 1] : null;
  const changePct = previous && previous.value !== 0
    ? ((point.value - previous.value) / Math.abs(previous.value)) * 100
    : null;

  return (
    <div className="rounded-xl border border-gunmetal bg-void-black/95 p-3 shadow-2xl backdrop-blur-md min-w-[210px] text-left">
      <div className="flex items-center justify-between border-b border-gunmetal/80 pb-1.5 mb-2">
        <span className="font-mono text-[13px] font-bold text-frost">{label}</span>
        {point.derived ? (
          <span className="text-[10px] font-mono text-periwinkle-glow bg-periwinkle-glow/10 border border-periwinkle-glow/20 px-1.5 py-0.5 rounded">
            Calculado
          </span>
        ) : (
          <span className="text-[10px] font-mono text-muted-steel bg-carbon-surface border border-gunmetal px-1.5 py-0.5 rounded">
            Oficial SEC
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div>
          <span className="text-[11px] text-muted-steel block">{metricLabel}</span>
          <span className="font-display text-[16px] font-semibold text-pure-white">
            {formatValue(point.value, unit, scale)}
          </span>
        </div>

        {previous ? (
          <div className="border-t border-gunmetal/60 pt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-muted-steel font-mono text-[10px] uppercase">Frente a {previous.label}:</span>
            <span
              className={cn(
                "font-mono font-bold text-[12px]",
                changePct !== null && changePct > 0
                  ? "text-emerald-400"
                  : changePct !== null && changePct < 0
                  ? "text-rose-400"
                  : "text-frost",
              )}
            >
              {changePct !== null ? `${changePct > 0 ? "▲ +" : "▼ "}${changePct.toFixed(1)}%` : "—"}
            </span>
          </div>
        ) : (
          <div className="border-t border-gunmetal/60 pt-1 text-[10px] text-muted-steel italic">
            Primer periodo de la serie
          </div>
        )}
      </div>
    </div>
  );
}
