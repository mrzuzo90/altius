"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { median, type HistoricalPePoint, type HistoricalPeSeries } from "@/lib/valuation/historical-pe";
import type { QuarterlyPePoint, QuarterlyPeSeries } from "@/lib/valuation/quarterly-pe";

const RANGES = [
  { id: "5y", label: "5 años", years: 5 },
  { id: "10y", label: "10 años", years: 10 },
  { id: "20y", label: "20 años", years: 20 },
  { id: "max", label: "Máx.", years: Number.POSITIVE_INFINITY },
] as const;

type Mode = "quarterly" | "annual";
type PePoint = HistoricalPePoint | QuarterlyPePoint;

export function HistoricalPeChart({
  series,
  quarterlySeries,
}: {
  series: HistoricalPeSeries;
  quarterlySeries: QuarterlyPeSeries;
}) {
  const quarterlyAvailable = quarterlySeries.points.some((point) => point.pe !== null);
  const annualAvailable = series.points.some((point) => point.pe !== null);
  const [mode, setMode] = useState<Mode>(quarterlyAvailable ? "quarterly" : "annual");
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("20y");
  const activePoints: PePoint[] = mode === "quarterly" ? quarterlySeries.points : series.points;
  const selected = RANGES.find((item) => item.id === range)!;
  const data = useMemo(() => {
    if (!Number.isFinite(selected.years)) return activePoints;
    const lastDate = activePoints.at(-1)?.earningsKnownAt;
    if (!lastDate) return activePoints;
    const cutoff = new Date(`${lastDate}T00:00:00Z`);
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - selected.years);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    return activePoints.filter((point) => point.earningsKnownAt >= cutoffIso);
  }, [activePoints, selected.years]);
  const rangeValues = useMemo(
    () => data.flatMap((point) => point.pe !== null ? [point.pe] : []),
    [data],
  );
  const rangeMedian = median(rangeValues);
  const rangeMin = rangeValues.length > 0 ? Math.min(...rangeValues) : null;
  const rangeMax = rangeValues.length > 0 ? Math.max(...rangeValues) : null;

  if (!quarterlyAvailable && !annualAvailable) {
    return (
      <section className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
        <h3 className="font-display text-pure-white text-[20px]">PER histórico</h3>
        <p className="text-muted-steel mt-2 text-[13px]">
          {quarterlySeries.reason ?? series.reason ?? "No hay datos suficientes."}
        </p>
      </section>
    );
  }

  const premium = series.premiumToMedian20Y;
  const activeReason = mode === "quarterly" ? quarterlySeries.reason : series.reason;

  return (
    <section className="bg-carbon-surface border-gunmetal overflow-hidden rounded-2xl border">
      <div className="border-gunmetal flex flex-wrap items-start gap-4 border-b px-6 py-5">
        <div>
          <h3 className="font-display text-pure-white text-[22px] tracking-tight">PER histórico</h3>
          <p className="text-muted-steel mt-1 max-w-2xl text-[13px] leading-relaxed">
            {mode === "quarterly"
              ? "Precio disponible al presentar cada resultado trimestral ÷ BPA de los cuatro trimestres conocidos entonces. No usa reexpresiones posteriores."
              : "Precio disponible cuando el beneficio anual quedó publicado ÷ BPA anual conocido entonces. Los ejercicios con pérdidas no generan PER."}
          </p>
        </div>

        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <div className="bg-void-black border-gunmetal inline-flex rounded-full border p-1">
            <ModeButton active={mode === "quarterly"} disabled={!quarterlyAvailable} onClick={() => setMode("quarterly")}>
              Trimestral TTM
            </ModeButton>
            <ModeButton active={mode === "annual"} disabled={!annualAvailable} onClick={() => setMode("annual")}>
              Anual
            </ModeButton>
          </div>
          <div className="bg-void-black border-gunmetal inline-flex rounded-full border p-1">
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={cn(
                  "font-display rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                  range === item.id ? "bg-gunmetal text-pure-white" : "text-muted-steel hover:text-frost",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!quarterlyAvailable && quarterlySeries.reason ? (
        <p className="border-gunmetal text-muted-steel border-b px-6 py-3 text-[12px]">
          Vista trimestral no disponible: {quarterlySeries.reason}
        </p>
      ) : null}

      {mode === "quarterly" ? (
        <div className="grid gap-px bg-gunmetal sm:grid-cols-4">
          <Metric label="Observaciones del periodo" value={`${rangeValues.length}`} />
          <Metric label="Mínimo del periodo" value={multiple(rangeMin)} tone="cheap" />
          <Metric label={`Mediana · ${selected.label}`} value={multiple(rangeMedian)} />
          <Metric label="Máximo del periodo" value={multiple(rangeMax)} tone="expensive" />
        </div>
      ) : (
        <div className="grid gap-px bg-gunmetal sm:grid-cols-4">
          <Metric label="PER actual / último FY" value={multiple(series.currentPe)} />
          <Metric label="Mediana últimos 20 años" value={multiple(series.median20Y)} />
          <Metric
            label="Cobertura de la mediana"
            value={series.observations20Y > 0
              ? `${series.observations20Y} ej. · FY ${series.startFiscalYear20Y}–${series.endFiscalYear20Y}`
              : "—"}
          />
          <Metric
            label="Frente a mediana 20a"
            value={premium === null ? "—" : `${premium >= 0 ? "+" : "−"}${Math.abs(premium).toFixed(1)} %`}
            tone={premium === null ? "neutral" : premium > 0 ? "expensive" : "cheap"}
          />
        </div>
      )}

      <div className="px-3 pt-7 pb-3 sm:px-6">
        {activeReason || rangeValues.length === 0 ? (
          <div className="text-muted-steel flex h-[330px] items-center justify-center text-center text-[13px]">
            {activeReason ?? "No hay observaciones de PER utilizables en este intervalo."}
          </div>
        ) : (
          <div className="h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#646e87" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={mode === "quarterly" ? 34 : 20}
                />
                <YAxis
                  width={48}
                  domain={[0, "auto"]}
                  tick={{ fontSize: 11, fill: "#646e87" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => `${value.toFixed(0)}x`}
                />
                {rangeMedian !== null ? (
                  <ReferenceLine
                    y={rangeMedian}
                    stroke="#646e87"
                    strokeDasharray="4 4"
                    label={{ value: `Mediana ${rangeMedian.toFixed(1)}x`, fill: "#646e87", fontSize: 11, position: "insideTopRight" }}
                  />
                ) : null}
                <Tooltip content={<PeTooltip epsLabel={mode === "quarterly" ? "BPA TTM" : "BPA anual"} />} />
                <Line
                  type="monotone"
                  dataKey="pe"
                  stroke="#98a4f7"
                  strokeWidth={2}
                  dot={{ r: mode === "quarterly" ? 2 : 3, fill: "#98a4f7", stroke: "#151621", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="text-muted-steel px-2 pb-2 text-[12px]">
          Cada punto usa la primera presentación regulatoria del periodo y el cierre de mercado inmediatamente anterior disponible, ambos ajustados por splits y en la misma divisa. La serie describe únicamente el historial observado.
        </p>
      </div>

      {mode === "quarterly" ? (
        <details className="border-gunmetal border-t">
          <summary className="text-frost hover:text-pure-white cursor-pointer px-6 py-4 text-[13px] font-medium transition-colors">
            Ver las {quarterlySeries.points.length} presentaciones y sus datos de cálculo
          </summary>
          <div className="max-h-[420px] overflow-auto border-t border-gunmetal/70">
            <table className="tabular w-full min-w-[720px] border-collapse text-[12px]">
              <thead className="bg-carbon-surface sticky top-0 z-10">
                <tr className="text-muted-steel border-gunmetal border-b text-left uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Periodo</th>
                  <th className="px-4 py-3 font-medium">Presentado</th>
                  <th className="px-4 py-3 font-medium">Cierre usado</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-right font-medium">BPA TTM</th>
                  <th className="px-6 py-3 text-right font-medium">PER</th>
                </tr>
              </thead>
              <tbody>
                {[...quarterlySeries.points].reverse().map((point) => (
                  <tr key={point.periodKey} className="border-gunmetal/50 text-frost border-b last:border-0">
                    <td className="px-6 py-2.5 font-medium">{point.label}</td>
                    <td className="text-muted-steel px-4 py-2.5">{point.earningsKnownAt}</td>
                    <td className="text-muted-steel px-4 py-2.5">{point.priceDate ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right">{point.price === null ? "—" : point.price.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right">{point.eps === null ? "—" : point.eps.toFixed(2)}</td>
                    <td className="text-periwinkle-glow px-6 py-2.5 text-right font-medium">
                      {point.status === "loss" ? "Pérdidas" : multiple(point.pe)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </section>
  );
}

function ModeButton({ active, disabled, onClick, children }: { active: boolean; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "font-display rounded-full px-3 py-1 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35",
        active ? "bg-periwinkle-glow text-void-black" : "text-muted-steel hover:text-frost",
      )}
    >
      {children}
    </button>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "cheap" | "expensive" }) {
  return (
    <div className="bg-carbon-surface px-6 py-4">
      <p className="text-muted-steel text-[11px] font-medium uppercase tracking-[0.12em]">{label}</p>
      <p className={cn(
        "tabular font-display mt-1 text-[22px] tracking-tight",
        tone === "cheap" ? "text-emerald-400" : tone === "expensive" ? "text-amber-300" : "text-pure-white",
      )}>
        {value}
      </p>
    </div>
  );
}

function PeTooltip({
  active,
  payload,
  epsLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload?: PePoint }>;
  epsLabel: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="bg-carbon-surface border-gunmetal min-w-48 rounded-xl border p-3 text-[12px] shadow-2xl">
      <p className="text-frost font-medium">{point.label}</p>
      <dl className="mt-2 space-y-1">
        <Row label="PER" value={point.status === "loss" ? "Pérdidas" : multiple(point.pe)} />
        <Row label="Precio" value={point.price === null ? "—" : point.price.toFixed(2)} />
        <Row label={epsLabel} value={point.eps === null ? "—" : point.eps.toFixed(2)} />
        <Row label="Presentado" value={point.earningsKnownAt} />
        <Row label="Cotización" value={point.priceDate ?? "—"} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted-steel">{label}</dt><dd className="text-pure-white tabular">{value}</dd></div>;
}

function multiple(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "—" : `${value.toFixed(1)}x`;
}
