"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpToLine,
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleAlert,
  Gauge,
  Info,
  Radar,
  Waves,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  OptionExpirationAnalysis,
  OptionSideSnapshot,
  OptionsMarketAnalysis,
} from "@/lib/options/types";
import { cn } from "@/lib/utils";

const integerFormatter = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

function formatPrice(value: number | null): string {
  return value === null || !Number.isFinite(value)
    ? "—"
    : `$${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatRatio(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "—" : value.toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${value}T12:00:00Z`));
}

function formatTimestamp(value: string | null): string {
  if (!value) return "hora no informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function pressureTone(score: number): { text: string; border: string; bg: string; fill: string } {
  if (score >= 12) return {
    text: "text-emerald-300",
    border: "border-emerald-700/40",
    bg: "bg-emerald-950/25",
    fill: "bg-emerald-400",
  };
  if (score <= -12) return {
    text: "text-rose-300",
    border: "border-rose-700/40",
    bg: "bg-rose-950/25",
    fill: "bg-rose-400",
  };
  return {
    text: "text-frost",
    border: "border-gunmetal",
    bg: "bg-carbon-surface",
    fill: "bg-periwinkle-glow",
  };
}

function quoteCell(value: number | null, size: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × ${size === null ? "—" : integerFormatter.format(size)}`;
}

function SideLiquidity({ side }: { side: OptionSideSnapshot | null }) {
  if (!side) return <span className="text-muted-steel">—</span>;
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className="text-frost">{integerFormatter.format(side.volume)}</span>
      <span className="text-muted-steel text-[10px]">OI {integerFormatter.format(side.openInterest)}</span>
    </span>
  );
}

function PressureMeter({ analysis }: { analysis: OptionExpirationAnalysis }) {
  const score = analysis.pressureScore;
  const tone = pressureTone(score);
  const width = Math.abs(score) / 2;
  const left = score < 0 ? 50 - width : 50;
  return (
    <div className={cn("rounded-2xl border p-5", tone.border, tone.bg)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-muted-steel font-mono text-[10px] uppercase tracking-[0.16em]">
            Proxy compuesto · confianza {analysis.pressureConfidence.toLowerCase()}
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className={cn("font-display text-[24px] font-medium", tone.text)}>{analysis.pressureLabel}</span>
            <span className={cn("font-mono text-[13px]", tone.text)}>
              {score > 0 ? "+" : ""}{score.toFixed(0)} / 100
            </span>
          </div>
        </div>
        <div className="text-muted-steel flex items-center gap-2 text-[11px]">
          <Gauge className="size-4 text-periwinkle-glow" />
          Volumen 45% · OI 35% · libro visible 20%
        </div>
      </div>

      <div className="mt-5">
        <div className="bg-void-black relative h-3 overflow-hidden rounded-full border border-gunmetal">
          <div className="bg-gunmetal absolute inset-y-0 left-1/2 w-px" />
          <div className={cn("absolute inset-y-0 rounded-full transition-all duration-500", tone.fill)} style={{ left: `${left}%`, width: `${width}%` }} />
        </div>
        <div className="text-muted-steel mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider">
          <span>Más presión bajista</span>
          <span>Equilibrio</span>
          <span>Más presión alcista</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "text-pure-white",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="bg-void-black/55 border-gunmetal rounded-xl border p-4">
      <div className="text-muted-steel flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
        <Icon className="size-3.5 text-periwinkle-glow" />
        {label}
      </div>
      <div className={cn("tabular mt-2 font-display text-[22px] font-medium", tone)}>{value}</div>
      <p className="text-muted-steel mt-1 text-[11px] leading-[1.45]">{detail}</p>
    </div>
  );
}

function ConcentrationChart({ analysis, spot }: { analysis: OptionExpirationAnalysis; spot: number }) {
  const data = useMemo(() => analysis.strikes.map((row) => ({
    strike: row.strike,
    calls: row.call?.openInterest ?? 0,
    puts: -(row.put?.openInterest ?? 0),
  })), [analysis]);
  const closestStrike = analysis.strikes.reduce<number | null>(
    (closest, row) => closest === null || Math.abs(row.strike - spot) < Math.abs(closest - spot) ? row.strike : closest,
    null,
  );

  return (
    <div className="bg-void-black/55 border-gunmetal rounded-xl border p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-pure-white flex items-center gap-2 font-display text-[15px] font-medium">
            <BarChart3 className="size-4 text-periwinkle-glow" />
            Concentración de posiciones abiertas
          </h4>
          <p className="text-muted-steel mt-0.5 text-[11px]">Calls arriba · puts abajo · contratos, no dinero negociado</p>
        </div>
        <div className="flex gap-3 font-mono text-[10px]">
          <span className="text-emerald-300"><i className="mr-1 inline-block size-2 rounded-sm bg-emerald-400" />Calls</span>
          <span className="text-rose-300"><i className="mr-1 inline-block size-2 rounded-sm bg-rose-400" />Puts</span>
        </div>
      </div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 2, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#1f2433" strokeDasharray="3 4" />
            <XAxis dataKey="strike" tick={{ fill: "#646e87", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis
              width={48}
              tick={{ fill: "#646e87", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => integerFormatter.format(Math.abs(value))}
            />
            <ReferenceLine y={0} stroke="#646e87" />
            {closestStrike !== null ? <ReferenceLine x={closestStrike} stroke="#98a4f7" strokeDasharray="4 4" /> : null}
            <Tooltip
              cursor={{ fill: "rgba(152,164,247,0.06)" }}
              contentStyle={{ background: "#12141c", border: "1px solid #23293a", borderRadius: 10, fontSize: 11 }}
              labelFormatter={(value) => `Strike $${Number(value).toFixed(2)}`}
              formatter={(value, name) => [integerFormatter.format(Math.abs(Number(value))), name === "calls" ? "OI calls" : "OI puts"]}
            />
            <Bar dataKey="calls" fill="#34d399" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="puts" fill="#fb7185" radius={[0, 0, 3, 3]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ImpliedRange({ analysis, spot }: { analysis: OptionExpirationAnalysis; spot: number }) {
  if (analysis.expectedRangeLow === null || analysis.expectedRangeHigh === null || analysis.expectedMovePct === null) return null;
  const low = analysis.expectedRangeLow;
  const high = analysis.expectedRangeHigh;
  const maxPainPosition = analysis.maxPain === null || high === low
    ? null
    : Math.min(100, Math.max(0, ((analysis.maxPain - low) / (high - low)) * 100));
  return (
    <div className="bg-void-black/55 border-gunmetal rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-pure-white flex items-center gap-2 font-display text-[15px] font-medium">
            <Waves className="size-4 text-periwinkle-glow" />
            Rango implícito hasta {formatDate(analysis.expiration)}
          </h4>
          <p className="text-muted-steel mt-0.5 text-[11px]">{analysis.expectedMoveMethod} · el rango no predice qué dirección tomará</p>
        </div>
        <span className="text-periwinkle-glow font-mono text-[13px] font-semibold">±{analysis.expectedMovePct.toFixed(1)}%</span>
      </div>
      <div className="mt-7 px-2">
        <div className="relative h-2 rounded-full bg-gradient-to-r from-rose-400 via-periwinkle-glow to-emerald-400">
          <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pure-white bg-iris-blue shadow-lg" />
          {maxPainPosition !== null ? (
            <div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-amber-200 bg-amber-400" style={{ left: `${maxPainPosition}%` }} />
          ) : null}
        </div>
        <div className="mt-2 grid grid-cols-3 font-mono text-[11px]">
          <span className="text-rose-300">{formatPrice(low)}</span>
          <span className="text-center text-frost">Spot {formatPrice(spot)}</span>
          <span className="text-right text-emerald-300">{formatPrice(high)}</span>
        </div>
        {analysis.maxPain !== null ? <p className="text-muted-steel mt-2 text-center text-[10px]">◆ Máximo dolor: {formatPrice(analysis.maxPain)} sobre los strikes cubiertos</p> : null}
      </div>
    </div>
  );
}

function OptionsLadder({ analysis }: { analysis: OptionExpirationAnalysis }) {
  return (
    <div className="border-gunmetal overflow-hidden rounded-xl border">
      <div className="bg-void-black/70 flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div>
          <h4 className="text-pure-white flex items-center gap-2 font-display text-[15px] font-medium">
            <BookOpen className="size-4 text-periwinkle-glow" />
            Libro visible por precio de ejercicio
          </h4>
          <p className="text-muted-steel mt-0.5 text-[11px]">Bid = mejor compra publicada · Ask = mejor venta publicada · tamaño en contratos</p>
        </div>
        <span className="text-muted-steel font-mono text-[10px]">{analysis.contractCount} contratos analizados</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse text-right font-mono text-[11px]">
          <thead className="bg-carbon-surface text-muted-steel uppercase tracking-wider">
            <tr className="border-t border-gunmetal">
              <th colSpan={3} className="border-r border-gunmetal px-3 py-2 text-center text-emerald-300">Calls</th>
              <th rowSpan={2} className="border-r border-gunmetal px-4 py-2 text-center text-frost">Strike</th>
              <th colSpan={3} className="px-3 py-2 text-center text-rose-300">Puts</th>
            </tr>
            <tr className="border-t border-gunmetal/70">
              <th className="px-3 py-2">Bid × tamaño</th>
              <th className="px-3 py-2">Ask × tamaño</th>
              <th className="border-r border-gunmetal px-3 py-2">Vol / OI</th>
              <th className="px-3 py-2">Bid × tamaño</th>
              <th className="px-3 py-2">Ask × tamaño</th>
              <th className="px-3 py-2">Vol / OI</th>
            </tr>
          </thead>
          <tbody>
            {analysis.strikes.map((row) => {
              const atMoney = Math.abs(row.distancePct) <= 1;
              return (
                <tr key={row.strike} className={cn("border-t border-gunmetal/60", atMoney ? "bg-periwinkle-glow/[0.06]" : "bg-void-black/30 hover:bg-gunmetal/25")}>
                  <td className="px-3 py-2.5 text-frost">{quoteCell(row.call?.bid ?? null, row.call?.bidSize ?? null)}</td>
                  <td className="px-3 py-2.5 text-emerald-200">{quoteCell(row.call?.ask ?? null, row.call?.askSize ?? null)}</td>
                  <td className="border-r border-gunmetal px-3 py-2.5"><SideLiquidity side={row.call} /></td>
                  <td className="border-r border-gunmetal px-4 py-2.5 text-center">
                    <span className={cn("text-pure-white font-semibold", atMoney && "text-periwinkle-glow")}>${row.strike.toFixed(2)}</span>
                    <span className="text-muted-steel ml-1.5 text-[9px]">{row.distancePct > 0 ? "+" : ""}{row.distancePct.toFixed(1)}%</span>
                  </td>
                  <td className="px-3 py-2.5 text-frost">{quoteCell(row.put?.bid ?? null, row.put?.bidSize ?? null)}</td>
                  <td className="px-3 py-2.5 text-rose-200">{quoteCell(row.put?.ask ?? null, row.put?.askSize ?? null)}</td>
                  <td className="px-3 py-2.5"><SideLiquidity side={row.put} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyOptionsState({ result }: { result: Extract<OptionsMarketAnalysis, { status: "unavailable" }> }) {
  return (
    <div className="bg-carbon-surface border-gunmetal overflow-hidden rounded-2xl border">
      <div className="border-gunmetal flex flex-col gap-3 border-b p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-periwinkle-glow font-mono text-[10px] uppercase tracking-[0.18em]">Nuevo módulo</span>
          <h3 className="text-pure-white mt-1 flex items-center gap-2 font-display text-[21px] font-medium">
            <Radar className="size-5 text-periwinkle-glow" />
            Presión compradora y vendedora en opciones
          </h3>
          <p className="text-frost/75 mt-1 max-w-3xl text-[13px] leading-[1.55]">Volumen, interés abierto, bid/ask, tamaños publicados, volatilidad y rango implícito para los próximos meses.</p>
        </div>
        <span className="border-gunmetal bg-void-black text-muted-steel rounded-full border px-3 py-1 font-mono text-[10px]">Solo opciones listadas en EE. UU.</span>
      </div>
      <div className="p-6">
        <div className="border-gunmetal bg-void-black/55 flex gap-3 rounded-xl border p-4">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-300" />
          <div>
            <p className="text-pure-white text-[14px] font-medium">Datos de opciones no disponibles para {result.ticker}</p>
            <p className="text-frost/75 mt-1 text-[12px] leading-[1.55]">{result.message}</p>
          </div>
        </div>
        {result.reason === "not-configured" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href="https://www.marketdata.app/docs/account/free-accounts/" target="_blank" rel="noreferrer noopener" className="border-gunmetal hover:border-periwinkle-glow/50 bg-void-black/35 rounded-xl border p-4 transition-colors">
              <span className="text-pure-white text-[13px] font-medium">Market Data · capa gratuita</span>
              <p className="text-muted-steel mt-1 text-[11px] leading-[1.5]">100 créditos diarios, cadenas con 24 h de retraso. Usa MARKETDATA_API_TOKEN.</p>
            </a>
            <a href="https://docs.tradier.com/docs/market-data" target="_blank" rel="noreferrer noopener" className="border-gunmetal hover:border-periwinkle-glow/50 bg-void-black/35 rounded-xl border p-4 transition-colors">
              <span className="text-pure-white text-[13px] font-medium">Tradier · preferido para tiempo real</span>
              <p className="text-muted-steel mt-1 text-[11px] leading-[1.5]">Tiempo real para titulares de cuenta de brokerage. Usa TRADIER_API_TOKEN.</p>
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function OptionsPressurePanel({ result }: { result: OptionsMarketAnalysis }) {
  const [selectedExpiration, setSelectedExpiration] = useState(0);
  if (result.status === "unavailable") return <EmptyOptionsState result={result} />;
  const active = result.expirations[Math.min(selectedExpiration, result.expirations.length - 1)];
  if (!active) return null;
  const tone = pressureTone(active.pressureScore);

  return (
    <section className="bg-carbon-surface border-gunmetal overflow-hidden rounded-2xl border">
      <div className="border-gunmetal flex flex-col gap-4 border-b p-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="text-periwinkle-glow font-mono text-[10px] uppercase tracking-[0.18em]">Derivados · próximos meses</span>
          <h3 className="text-pure-white mt-1 flex items-center gap-2 font-display text-[22px] font-medium">
            <Radar className="size-5 text-periwinkle-glow" />
            Presión compradora y vendedora en opciones
          </h3>
          <p className="text-frost/75 mt-1 max-w-3xl text-[13px] leading-[1.55]">Qué se está negociando, dónde se acumulan las posiciones y cuánto movimiento está descontando el mercado.</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 lg:items-end">
          <a href={result.providerHref} target="_blank" rel="noreferrer noopener" className="border-gunmetal bg-void-black text-frost hover:border-periwinkle-glow/50 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] transition-colors">
            <span className="size-1.5 rounded-full bg-periwinkle-glow" />{result.provider}
          </a>
          <span className="text-muted-steel font-mono text-[9px]">{result.freshness} · {formatTimestamp(result.asOf)}</span>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {result.expirations.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-steel mr-1 flex items-center gap-1.5 font-mono text-[10px] uppercase"><CalendarDays className="size-3.5" />Vencimiento</span>
            {result.expirations.map((expiration, index) => (
              <button
                key={expiration.expiration}
                type="button"
                onClick={() => setSelectedExpiration(index)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors",
                  index === selectedExpiration
                    ? "border-periwinkle-glow/50 bg-iris-blue/20 text-pure-white"
                    : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
                )}
              >
                {formatDate(expiration.expiration)} · {expiration.daysToExpiration} días
              </button>
            ))}
          </div>
        ) : null}

        <PressureMeter analysis={active} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Activity} label="Put / Call · volumen" value={formatRatio(active.putCallVolumeRatio)} detail={`${integerFormatter.format(active.putVolume)} puts frente a ${integerFormatter.format(active.callVolume)} calls negociadas`} tone={(active.putCallVolumeRatio ?? 1) > 1 ? "text-rose-300" : "text-emerald-300"} />
          <MetricCard icon={BookOpen} label="Put / Call · interés abierto" value={formatRatio(active.putCallOpenInterestRatio)} detail={`${integerFormatter.format(active.putOpenInterest)} puts frente a ${integerFormatter.format(active.callOpenInterest)} calls abiertas`} tone={(active.putCallOpenInterestRatio ?? 1) > 1 ? "text-rose-300" : "text-emerald-300"} />
          <MetricCard icon={Waves} label="Movimiento implícito" value={active.expectedMovePct === null ? "—" : `±${active.expectedMovePct.toFixed(1)}%`} detail={active.expectedMoveMethod ? `${active.expectedMoveMethod} en el strike ATM ${active.atmStrike?.toFixed(2) ?? "—"}` : "No hay precios suficientes para calcularlo"} />
          <MetricCard icon={Gauge} label="Desequilibrio bid/ask" value={active.displayedBookImbalancePct === null ? "—" : `${active.displayedBookImbalancePct > 0 ? "+" : ""}${active.displayedBookImbalancePct.toFixed(1)}%`} detail="Solo el mejor nivel publicado; no es profundidad completa" tone={tone.text} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <ConcentrationChart analysis={active} spot={result.underlyingPrice} />
          <div className="space-y-5">
            <ImpliedRange analysis={active} spot={result.underlyingPrice} />
            <div className="bg-void-black/55 border-gunmetal rounded-xl border p-4">
              <h4 className="text-pure-white flex items-center gap-2 font-display text-[15px] font-medium"><Radar className="size-4 text-periwinkle-glow" />Niveles que concentran posiciones</h4>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="border-emerald-800/35 bg-emerald-950/20 rounded-lg border p-3">
                  <span className="text-emerald-300 flex items-center gap-1 font-mono text-[9px] uppercase"><ArrowUpToLine className="size-3" />Call wall</span>
                  <strong className="text-pure-white mt-1 block font-mono text-[16px]">{formatPrice(active.callWall?.strike ?? null)}</strong>
                  <span className="text-muted-steel text-[10px]">OI {integerFormatter.format(active.callWall?.openInterest ?? 0)}</span>
                </div>
                <div className="border-rose-800/35 bg-rose-950/20 rounded-lg border p-3">
                  <span className="text-rose-300 flex items-center gap-1 font-mono text-[9px] uppercase"><ArrowDownToLine className="size-3" />Put wall</span>
                  <strong className="text-pure-white mt-1 block font-mono text-[16px]">{formatPrice(active.putWall?.strike ?? null)}</strong>
                  <span className="text-muted-steel text-[10px]">OI {integerFormatter.format(active.putWall?.openInterest ?? 0)}</span>
                </div>
              </div>
              {active.observations.length > 0 ? (
                <ul className="text-frost/75 mt-3 space-y-1.5 text-[11px] leading-[1.45]">
                  {active.observations.slice(0, 3).map((observation) => <li key={observation}>· {observation}</li>)}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        <OptionsLadder analysis={active} />

        {active.unusualActivity.length > 0 ? (
          <div className="border-gunmetal bg-void-black/45 rounded-xl border p-4">
            <h4 className="text-pure-white flex items-center gap-2 font-display text-[15px] font-medium"><Activity className="size-4 text-amber-300" />Actividad estadísticamente llamativa</h4>
            <p className="text-muted-steel mt-0.5 text-[11px]">Volumen ≥ 100 y al menos 1,5 veces el interés abierto. No revela si la operación fue compra o venta.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {active.unusualActivity.map((item) => (
                <div key={item.symbol} className="border-gunmetal bg-carbon-surface rounded-lg border px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[9px] uppercase", item.side === "call" ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300")}>{item.side}</span>
                    <span className="text-pure-white font-mono text-[12px]">Strike ${item.strike.toFixed(2)}</span>
                  </div>
                  <p className="text-muted-steel mt-1.5 font-mono text-[10px]">Vol/OI {item.volumeToOpenInterest.toFixed(1)}× · {integerFormatter.format(item.volume)} contratos</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-gunmetal bg-void-black/55 flex gap-3 rounded-xl border p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-periwinkle-glow" />
          <div className="text-muted-steel text-[11px] leading-[1.55]">
            <p><strong className="text-frost">Qué sí sabemos:</strong> precios bid/ask, tamaños del mejor nivel, contratos negociados hoy, posiciones que permanecen abiertas y volatilidad implícita.</p>
            <p className="mt-1"><strong className="text-frost">Qué no sabemos con esta foto:</strong> la intención del inversor, si una call se compró o se vendió para abrir, ni todas las órdenes ocultas o niveles de profundidad. Cada contrato ejecutado tiene comprador y vendedor; la dirección es una inferencia, no un hecho.</p>
            <p className="mt-1">Cobertura: {result.coverage}. Este módulo describe posicionamiento y escenarios; no es una recomendación de inversión.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
