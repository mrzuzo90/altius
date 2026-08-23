import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Gauge,
  Layers,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import type { TechnicalBias, TechnicalStats } from "@/lib/technical/types";
import { cn } from "@/lib/utils";

const BIAS_CONFIG: Record<
  TechnicalBias,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  strong_bullish: {
    label: "Fuerte Sesgo Alcista",
    bg: "bg-emerald-950/40",
    border: "border-emerald-700/50",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  bullish: {
    label: "Sesgo Alcista",
    bg: "bg-emerald-950/25",
    border: "border-emerald-800/40",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  neutral: {
    label: "Sesgo Neutral / Consolidación",
    bg: "bg-carbon-surface",
    border: "border-gunmetal",
    text: "text-muted-steel",
    dot: "bg-muted-steel",
  },
  bearish: {
    label: "Sesgo Bajista / Corrección",
    bg: "bg-rose-950/25",
    border: "border-rose-800/40",
    text: "text-rose-400",
    dot: "bg-rose-400",
  },
  strong_bearish: {
    label: "Fuerte Sesgo Bajista",
    bg: "bg-rose-950/40",
    border: "border-rose-700/50",
    text: "text-rose-300",
    dot: "bg-rose-400",
  },
};

export function TechnicalScorecard({ stats }: { stats: TechnicalStats }) {
  const biasInfo = BIAS_CONFIG[stats.overallBias];

  return (
    <div className="space-y-6">
      {/* 1. Semáforo Global / Banner de Diagnóstico */}
      <div className={cn("rounded-2xl border p-6 transition-all", biasInfo.bg, biasInfo.border)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full animate-pulse shadow-sm" style={{ backgroundColor: biasInfo.dot }} />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-steel">
                DIAGNÓSTICO TÉCNICO CUANTITATIVO
              </span>
              <h3 className={cn("font-display text-[22px] font-medium tracking-tight", biasInfo.text)}>
                {biasInfo.label}
              </h3>
            </div>
          </div>

          <div className="bg-void-black/60 border-gunmetal flex items-center gap-4 rounded-xl border px-4 py-2 text-[13px] font-mono">
            <div>
              <span className="text-muted-steel block text-[11px]">Volatilidad (1A)</span>
              <span className="text-pure-white font-medium">
                {stats.annualizedVolatilityPct.toFixed(1)} %
              </span>
            </div>
            <div className="border-gunmetal h-6 w-px border-r" />
            <div>
              <span className="text-muted-steel block text-[11px]">RSI (14)</span>
              <span
                className={cn(
                  "font-medium",
                  (stats.rsi14 ?? 50) >= 70
                    ? "text-rose-400"
                    : (stats.rsi14 ?? 50) <= 30
                      ? "text-emerald-400"
                      : "text-periwinkle-glow",
                )}
              >
                {stats.rsi14 ? stats.rsi14.toFixed(1) : "—"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-frost/90 mt-4 text-[14px] leading-[1.6] text-pretty">
          {stats.summaryText}
        </p>
      </div>

      {/* 2. Cuadrícula de 4 Pilares Técnicos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pilar 1: Tendencia y Medias */}
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-periwinkle-glow" />
                Medias Móviles
              </span>
            </div>

            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted-steel">SMA 20</dt>
                <dd className="font-mono text-pure-white">
                  {stats.sma20 ? `$${stats.sma20.toFixed(2)}` : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-steel">SMA 50</dt>
                <dd className="font-mono text-pure-white">
                  {stats.sma50 ? `$${stats.sma50.toFixed(2)}` : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-steel">SMA 200</dt>
                <dd className="font-mono text-pure-white font-semibold">
                  {stats.sma200 ? `$${stats.sma200.toFixed(2)}` : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-gunmetal/60 pt-3 mt-3 text-[12px]">
            {stats.sma200 ? (
              <span
                className={cn(
                  "font-mono font-medium flex items-center gap-1",
                  stats.currentPrice >= stats.sma200 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {stats.currentPrice >= stats.sma200 ? (
                  <>
                    <ArrowUpRight className="size-3" />
                    +
                    {(
                      ((stats.currentPrice - stats.sma200) / stats.sma200) *
                      100
                    ).toFixed(1)}
                    % vs SMA 200
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="size-3" />
                    {(
                      ((stats.currentPrice - stats.sma200) / stats.sma200) *
                      100
                    ).toFixed(1)}
                    % vs SMA 200
                  </>
                )}
              </span>
            ) : (
              <span className="text-muted-steel">—</span>
            )}
          </div>
        </div>

        {/* Pilar 2: Momentum & MACD */}
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="size-3.5 text-periwinkle-glow" />
                Momentum (RSI/MACD)
              </span>
            </div>

            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted-steel">RSI (14)</dt>
                <dd className="font-mono text-pure-white">
                  {stats.rsi14 ? `${stats.rsi14.toFixed(1)} / 100` : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-steel">Línea MACD</dt>
                <dd className="font-mono text-pure-white">
                  {stats.macdLine ? stats.macdLine.toFixed(2) : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-steel">Histograma</dt>
                <dd
                  className={cn(
                    "font-mono font-medium",
                    (stats.macdHistogram ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {stats.macdHistogram !== null
                    ? `${stats.macdHistogram >= 0 ? "+" : ""}${stats.macdHistogram.toFixed(2)}`
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-gunmetal/60 pt-3 mt-3 text-[12px]">
            <span className="text-frost/80 font-mono text-[11px]">
              {(stats.rsi14 ?? 50) >= 70
                ? "Sobrecompra técnica"
                : (stats.rsi14 ?? 50) <= 30
                  ? "Sobreventa técnica"
                  : "Zona de oscilación normal"}
            </span>
          </div>
        </div>

        {/* Pilar 3: Volatilidad & Bollinger */}
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="size-3.5 text-periwinkle-glow" />
                Bandas Bollinger
              </span>
            </div>

            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted-steel">Banda Sup.</dt>
                <dd className="font-mono text-pure-white">
                  {stats.bollingerUpper ? `$${stats.bollingerUpper.toFixed(2)}` : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-steel">Banda Media</dt>
                <dd className="font-mono text-pure-white">
                  {stats.bollingerMiddle ? `$${stats.bollingerMiddle.toFixed(2)}` : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-steel">Banda Inf.</dt>
                <dd className="font-mono text-pure-white">
                  {stats.bollingerLower ? `$${stats.bollingerLower.toFixed(2)}` : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-gunmetal/60 pt-3 mt-3 text-[12px]">
            <span className="text-frost/80 font-mono text-[11px]">
              Vol. Anualizada: {stats.annualizedVolatilityPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Pilar 4: Rango 52 Semanas & Niveles */}
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="size-3.5 text-periwinkle-glow" />
                Rango 52 Semanas
              </span>
            </div>

            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted-steel">Máx. 52s</dt>
                <dd className="font-mono text-pure-white">
                  ${stats.high52w.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-steel">Mín. 52s</dt>
                <dd className="font-mono text-pure-white">
                  ${stats.low52w.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-steel">vs Máximo</dt>
                <dd
                  className={cn(
                    "font-mono font-medium",
                    stats.distanceFrom52wHighPct >= -5 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {stats.distanceFrom52wHighPct.toFixed(1)} %
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-gunmetal/60 pt-3 mt-3 text-[12px]">
            <span className="text-muted-steel font-mono text-[11px]">
              +{Math.abs(stats.distanceFrom52wLowPct).toFixed(1)}% desde mín. 52s
            </span>
          </div>
        </div>
      </div>

      {/* 3. Tabla Desglosada de Señales e Indicadores */}
      <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
        <h4 className="font-display text-pure-white text-[16px] font-medium tracking-tight mb-4">
          Detalle de Señales Cuantitativas
        </h4>

        <div className="space-y-3">
          {stats.signals.map((sig, idx) => {
            const isBull = sig.bias === "bullish" || sig.bias === "strong_bullish";
            const isBear = sig.bias === "bearish" || sig.bias === "strong_bearish";

            return (
              <div
                key={`${sig.indicator}-${idx}`}
                className="bg-void-black/60 border-gunmetal flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-medium text-[14px] text-pure-white">
                      {sig.indicator}
                    </span>
                    <span className="font-mono text-[12px] text-muted-steel">
                      ({sig.value})
                    </span>
                  </div>
                  <p className="text-[13px] text-frost/80">{sig.description}</p>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  <span
                    className={cn(
                      "font-mono text-[11px] font-medium px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5",
                      isBull
                        ? "text-emerald-300 bg-emerald-950/50 border-emerald-700/40"
                        : isBear
                          ? "text-rose-300 bg-rose-950/50 border-rose-700/40"
                          : "text-muted-steel bg-carbon-surface border-gunmetal",
                    )}
                  >
                    {isBull ? (
                      <CheckCircle2 className="size-3 text-emerald-400" />
                    ) : isBear ? (
                      <ShieldAlert className="size-3 text-rose-400" />
                    ) : null}
                    {sig.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Soportes y Resistencias Cuantitativos */}
        {(stats.supports.length > 0 || stats.resistances.length > 0) && (
          <div className="mt-6 pt-6 border-t border-gunmetal/60 grid gap-6 sm:grid-cols-2">
            <div>
              <h5 className="font-mono text-[12px] uppercase text-emerald-400 font-semibold mb-3 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400" />
                Soportes Cuantitativos Clave
              </h5>
              <div className="space-y-2">
                {stats.supports.map((s, i) => (
                  <div
                    key={`sup-${i}`}
                    className="flex items-center justify-between text-[13px] font-mono bg-void-black border border-gunmetal px-3 py-1.5 rounded-lg"
                  >
                    <span className="text-pure-white font-medium">${s.price.toFixed(2)}</span>
                    <span className="text-emerald-400/90 text-[12px]">
                      {s.distancePct.toFixed(1)}% (Nivel {i + 1})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-mono text-[12px] uppercase text-rose-400 font-semibold mb-3 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-400" />
                Resistencias Cuantitativas Clave
              </h5>
              <div className="space-y-2">
                {stats.resistances.map((r, i) => (
                  <div
                    key={`res-${i}`}
                    className="flex items-center justify-between text-[13px] font-mono bg-void-black border border-gunmetal px-3 py-1.5 rounded-lg"
                  >
                    <span className="text-pure-white font-medium">${r.price.toFixed(2)}</span>
                    <span className="text-rose-400/90 text-[12px]">
                      +{r.distancePct.toFixed(1)}% (Nivel {i + 1})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
