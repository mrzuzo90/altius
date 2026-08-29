"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps } from "recharts";
import { PersonStanding } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MetricDirectionNotice } from "@/components/metric-direction";
import {
  StatementTrendAnimation,
  type StatementBarGeometry,
  type StatementChartGeometry,
} from "@/components/statement-trend-animation";
import { cn } from "@/lib/utils";
import { getMetricSemantics } from "@/lib/financials/metric-semantics";
import { formatPct, formatValue, pctChange, SCALES, type Scale } from "@/lib/format";
import type { LineSeries, Period } from "@/lib/sec/normalize";

type ChartPoint = {
  key: string;
  label: string;
  end: string;
  value: number;
  derived: boolean;
};

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
      <DialogContent className="bg-carbon-surface border-gunmetal max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="border-gunmetal border-b px-6 pt-6 pb-5">
          <DialogTitle className="font-display text-pure-white text-[24px] tracking-tight">
            {row.line.label}
          </DialogTitle>
          <DialogDescription className="text-muted-steel">
            Evolución histórica · cifras en {row.line.unit === "USD" ? `${SCALES[scale].label} de ${currency}` : "la unidad indicada"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-px border-b border-gunmetal bg-gunmetal sm:grid-cols-3">
          <Metric label="Último periodo" value={latest ? formatValue(latest.value, row.line.unit, scale) : "—"} detail={latest?.label ?? "Sin datos"} />
          <Metric label="Variación interanual" value={formatPct(yoy)} detail={priorComparable ? `frente a ${priorComparable.label}` : "Sin comparable"} />
          <Metric label="Cobertura" value={`${data.length} periodos`} detail={data.length > 1 ? `${data[0].label} — ${data.at(-1)!.label}` : data[0]?.label ?? "Sin datos"} />
        </div>

        <MetricDirectionNotice semantics={semantics} />

        <div className="mx-3 mt-5 flex justify-end sm:mx-6">
          <button
            type="button"
            aria-pressed={showAlti}
            aria-label={`${showAlti ? "Ocultar" : "Mostrar"} a Alti en el gráfico de ${row.line.label}`}
            onClick={() => setShowAlti((visible) => !visible)}
            className={cn(
              "font-display inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors",
              showAlti
                ? "border-periwinkle-glow/60 bg-periwinkle-glow/10 text-periwinkle-glow"
                : "border-gunmetal bg-carbon-surface text-muted-steel hover:text-frost",
            )}
          >
            <PersonStanding className="size-3.5" />
            Alti · {showAlti ? "activo" : "oculto"}
          </button>
        </div>

        <div className="px-3 pt-7 pb-3 sm:px-6">
          <div ref={chartRef} className="relative h-[330px] w-full" role="group" aria-label={`Gráfico de barras de ${row.line.label}${showAlti ? " con personaje animado" : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 88, right: 8, bottom: 4, left: 4 }}>
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
                  wrapperStyle={{ zIndex: 5 }}
                  cursor={{ fill: "rgba(152, 164, 247, 0.06)" }}
                  contentStyle={{
                    background: "#151621",
                    border: "1px solid #1f2433",
                    borderRadius: 12,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                    fontSize: 12,
                    color: "#ffffff",
                  }}
                  labelStyle={{ color: "#c9d3ee", fontWeight: 500, marginBottom: 4 }}
                  itemStyle={{ color: "#98a4f7" }}
                  formatter={(value) => [formatValue(Number(value), row.line.unit, scale), row.line.label]}
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

          <div className="text-muted-steel flex flex-wrap items-center gap-x-5 gap-y-2 px-2 py-3 text-[12px]">
            <Legend color="#98a4f7" label="Reportado por la empresa" />
            <Legend color="#5b63d3" label="Calculado por Altius" />
            <span className="ml-auto">Los periodos sin cifra no se convierten en cero.</span>
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
  const radius = Math.max(0, Math.min(5, props.width / 2, height / 2));
  const geometry = {
    index: props.index,
    key: point.key,
    value: point.value,
    x: props.x,
    y,
    width: props.width,
    height,
  };

  return (
    <rect
      ref={(node) => {
        if (node) props.onGeometry(geometry);
      }}
      x={props.x}
      y={y}
      width={props.width}
      height={height}
      rx={radius}
      ry={radius}
      fill={point.derived ? "#5b63d3" : "#98a4f7"}
      data-statement-bar-index={props.index}
      data-statement-bar-key={point.key}
      data-statement-bar-value={point.value}
    />
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
