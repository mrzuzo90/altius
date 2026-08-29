import Link from "next/link";
import { ArrowRight, ArrowUpRight, Coins, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { DataSourceBadge } from "@/components/data-source-badge";
import { Sparkline } from "@/components/sparkline";
import { getAllCurrenciesSummary, CURRENCY_PAIRS } from "@/lib/currencies";
import { cn } from "@/lib/utils";

export const revalidate = 3600;
export const metadata = { title: "Divisas y Tipos de Cambio (Forex) | Altius" };

export default async function DivisasPage() {
  const summaries = await getAllCurrenciesSummary();
  const majors = summaries.filter((s) => !s.symbol.includes("DXY"));
  const index = summaries.find((s) => s.symbol === "DXY");

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-14 space-y-12">
      {/* Cabecera de Sección */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gunmetal bg-carbon-surface px-3.5 py-1 text-[12px] font-mono text-periwinkle-glow shadow-xs mb-3">
            <span className="size-2 rounded-full bg-periwinkle-glow animate-pulse" />
            <span>MERCADO FOREX · TIPOS DE CAMBIO OFICIALES FEDERAL RESERVE H.10</span>
          </div>
          <h1 className="font-display text-pure-white text-[36px] font-medium leading-[1.15] tracking-tight sm:text-[42px]">
            Observatorio de Divisas (Forex)
          </h1>
          <p className="text-frost mt-2 max-w-2xl text-[16px] leading-[1.6]">
            Tipos de cambio de las principales monedas globales (EUR/USD, GBP/USD, AUD/USD, USD/JPY, USD/CAD, etc.) e Índice Dólar, con FRED H.10 como fuente principal y respaldo de mercado si el servicio oficial no responde.
          </p>
        </div>

        <DataSourceBadge
          source="Federal Reserve Board (H.10)"
          detail="Cotizaciones oficiales de tipos de cambio publicadas por el Banco de la Reserva Federal."
          href="https://fred.stlouisfed.org/"
        />
      </div>

      {/* Tarjeta Destacada: Índice Dólar (DXY) */}
      {index && (
        <section className="bg-carbon-surface border-gunmetal rounded-2xl border p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-amber-300 font-bold text-[13px] bg-void-black px-2.5 py-0.5 rounded-md border border-gunmetal">
                  {index.shortName}
                </span>
                <span className="text-muted-steel text-[12px] font-mono">
                  BENCHMARK GLOBAL · FRED: {CURRENCY_PAIRS.DXY.fredSeriesId}
                </span>
              </div>
              <h2 className="font-display text-pure-white text-[24px] font-medium tracking-tight">
                {index.name}
              </h2>
              <p className="text-frost/80 text-[14px] max-w-2xl leading-[1.6]">
                {CURRENCY_PAIRS.DXY.description}
              </p>
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <div className="text-right">
                <span className="tabular font-display text-pure-white text-[38px] font-medium leading-none tracking-tight block">
                  {index.currentValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
                </span>
                <span className="text-muted-steel text-[12px] font-mono mt-1 block">
                  Última cotización: {index.date}
                </span>
              </div>

              {index.change1D !== undefined && (
                <span
                  className={cn(
                    "tabular text-[13px] font-mono font-medium px-2.5 py-1 rounded flex items-center gap-1",
                    index.change1D >= 0
                      ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
                      : "text-rose-400 bg-rose-950/40 border border-rose-800/40",
                  )}
                >
                  {index.change1D >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {index.change1D >= 0 ? "+" : ""}{index.change1D.toFixed(2)}% (1D)
                </span>
              )}

              <Link
                href={`/divisas/${index.slug}`}
                className="btn-primary-gradient px-4 py-2 text-[13px] font-medium inline-flex items-center gap-1.5 ml-2"
              >
                <span>Analizar DXY</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Pares Principales (Majors & Global Forex) */}
      <section className="space-y-4">
        <div className="border-b border-gunmetal/80 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-carbon-surface border border-gunmetal flex items-center justify-center">
              <Coins className="size-4 text-periwinkle-glow" />
            </div>
            <div>
              <h2 className="font-display text-pure-white text-[20px] font-medium tracking-tight">
                Pares de Divisas Principales (Majors)
              </h2>
              <p className="text-muted-steel text-[12px]">
                Euro, Libra esterlina, Dólar australiano, Yen, Franco suizo, Dólar canadiense, Yuan y Peso mexicano frente al USD.
              </p>
            </div>
          </div>
          <span className="text-muted-steel font-mono text-[12px]">
            {majors.length} pares oficiales
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {majors.map((s) => {
            const meta = CURRENCY_PAIRS[s.symbol];
            const isUp = (s.change1D ?? 0) >= 0;

            return (
              <Link
                key={s.symbol}
                href={`/divisas/${s.slug}`}
                className="bg-carbon-surface border-gunmetal rounded-2xl border p-6 flex flex-col justify-between hover:border-steel-border/50 transition-all group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-periwinkle-glow font-bold text-[14px] bg-void-black px-2.5 py-0.5 rounded-md border border-gunmetal">
                        {meta.shortName}
                      </span>
                      <span className="text-muted-steel text-[11px] font-mono">
                        {meta.baseCurrency} / {meta.quoteCurrency}
                      </span>
                    </div>
                    <span className="text-muted-steel text-[11px] font-mono">
                      {s.date}
                    </span>
                  </div>

                  <h3 className="font-display text-pure-white text-[17px] font-medium tracking-tight mb-2.5 line-clamp-1">
                    {meta.name}
                  </h3>

                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="tabular font-display text-pure-white text-[30px] font-medium leading-none tracking-tight">
                      {s.currentValue.toLocaleString("es-ES", { maximumFractionDigits: 4 })}
                    </span>
                    {s.change1D !== undefined && (
                      <span
                        className={cn(
                          "tabular text-[12px] font-mono font-medium px-2 py-0.5 rounded flex items-center gap-1",
                          isUp
                            ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
                            : "text-rose-400 bg-rose-950/40 border border-rose-800/40",
                        )}
                      >
                        {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {isUp ? "+" : ""}{s.change1D.toFixed(2)}%
                      </span>
                    )}
                  </div>

                  {/* Sparkline de 30 días */}
                  {s.recentSparkline.length > 2 && (
                    <div className="my-3 py-2 border-y border-gunmetal/60">
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted-steel mb-1">
                        <span>Tendencia 30 sesiones</span>
                        <span className={cn(s.recentSparkline.at(-1)! >= s.recentSparkline[0] ? "text-emerald-400" : "text-rose-400")}>
                          {s.recentSparkline.at(-1)! >= s.recentSparkline[0] ? "+" : ""}
                          {(
                            ((s.recentSparkline.at(-1)! - s.recentSparkline[0]) /
                              s.recentSparkline[0]) *
                            100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                      <Sparkline
                        values={s.recentSparkline}
                        color={s.recentSparkline.at(-1)! >= s.recentSparkline[0] ? "#34d399" : "#f87171"}
                      />
                    </div>
                  )}

                  {/* Ratios y Rendimientos */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mt-3">
                    <div className="bg-void-black/70 border border-gunmetal/80 p-2 rounded-lg">
                      <span className="text-muted-steel block text-[10px]">1 AÑO</span>
                      <span className={cn("font-medium", (s.change1Y ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {s.change1Y !== undefined ? `${(s.change1Y >= 0 ? "+" : "")}${s.change1Y.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    <div className="bg-void-black/70 border border-gunmetal/80 p-2 rounded-lg">
                      <span className="text-muted-steel block text-[10px]">MÁX. 52S</span>
                      <span className="text-pure-white font-medium">
                        {s.high52w.toFixed(4)}
                      </span>
                    </div>
                    <div className="bg-void-black/70 border border-gunmetal/80 p-2 rounded-lg">
                      <span className="text-muted-steel block text-[10px]">MÍN. 52S</span>
                      <span className="text-pure-white font-medium">
                        {s.low52w.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gunmetal/60 flex items-center justify-between text-[12px]">
                  <span className="text-muted-steel group-hover:text-frost transition-colors">
                    Análisis técnico y osciladores
                  </span>
                  <span className="text-periwinkle-glow inline-flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition-transform">
                    <span>Ver {meta.shortName}</span>
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Nota Metodológica de Cobertura */}
      <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <h4 className="font-display text-pure-white text-[18px] font-medium tracking-tight">
            Transparencia de Datos en Mercado Forex
          </h4>
          <p className="text-frost/80 text-[14px] leading-[1.6]">
            Los tipos de cambio se obtienen directamente de la publicación estadística H.10 de la Reserva Federal de San Luis. Los osciladores (RSI 14, MACD 12/26/9), Bandas de Bollinger y Medias Móviles Simples se calculan matemáticamente sobre el histórico oficial.
          </p>
        </div>
        <Link
          href="/commodities"
          className="btn-primary-gradient shrink-0 px-5 py-2.5 text-[14px] font-medium inline-flex items-center gap-2"
        >
          <DollarSign className="size-4" />
          <span>Ver Materias Primas</span>
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
