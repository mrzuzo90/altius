import Link from "next/link";
import { ArrowRight, ArrowUpRight, Globe, TrendingDown, TrendingUp } from "lucide-react";
import { DataSourceBadge } from "@/components/data-source-badge";
import { Sparkline } from "@/components/sparkline";
import { getAllIndicesSummary, MARKET_INDICES } from "@/lib/indices";
import { cn } from "@/lib/utils";

export const revalidate = 3600;
export const metadata = { title: "Índices Bursátiles Mundiales y Europeos | Altius" };

export default async function IndicesPage() {
  const summaries = await getAllIndicesSummary();
  const usIndices = summaries.filter((s) => s.region === "us");
  const europeIndices = summaries.filter((s) => s.region === "europe");

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-14 space-y-12">
      {/* Cabecera de Sección */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gunmetal bg-carbon-surface px-3.5 py-1 text-[12px] font-mono text-periwinkle-glow shadow-xs mb-3">
            <span className="size-2 rounded-full bg-periwinkle-glow animate-pulse" />
            <span>MERCADOS GLOBALES · COBERTURA EE. UU. Y EUROPA</span>
          </div>
          <h1 className="font-display text-pure-white text-[36px] font-medium leading-[1.15] tracking-tight sm:text-[42px]">
            Índices Bursátiles de Referencia
          </h1>
          <p className="text-frost mt-2 max-w-2xl text-[16px] leading-[1.6]">
            Seguimiento oficial de Wall Street (S&amp;P 500, NASDAQ, Dow Jones, VIX) y los principales selectivos europeos (Euro Stoxx 50, DAX 40, IBEX 35, FTSE 100, CAC 40) sincronizados con FRED y bolsas internacionales.
          </p>
        </div>

        <DataSourceBadge
          source="FRED, CBOE & STOXX"
          detail="Series históricas y observaciones oficiales de selectivos bursátiles mundiales."
          href="https://fred.stlouisfed.org/"
        />
      </div>

      {/* Sección 1: Selectivos Europeos */}
      <section className="space-y-4">
        <div className="border-b border-gunmetal/80 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-carbon-surface border border-gunmetal flex items-center justify-center">
              <Globe className="size-4 text-periwinkle-glow" />
            </div>
            <div>
              <h2 className="font-display text-pure-white text-[20px] font-medium tracking-tight">
                Principales Índices Europeos
              </h2>
              <p className="text-muted-steel text-[12px]">
                Euro Stoxx 50, DAX 40 (Alemania), IBEX 35 (España), FTSE 100 (Reino Unido) y CAC 40 (Francia).
              </p>
            </div>
          </div>
          <span className="text-muted-steel font-mono text-[12px]">
            {europeIndices.length} selectivos
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {europeIndices.map((s) => (
            <IndexCard key={s.symbol} summary={s} />
          ))}
        </div>
      </section>

      {/* Sección 2: Wall Street (EE. UU.) */}
      <section className="space-y-4">
        <div className="border-b border-gunmetal/80 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-carbon-surface border border-gunmetal flex items-center justify-center">
              <span className="font-mono text-amber-300 font-bold text-[12px]">US</span>
            </div>
            <div>
              <h2 className="font-display text-pure-white text-[20px] font-medium tracking-tight">
                Wall Street &amp; Mercado Estadounidense
              </h2>
              <p className="text-muted-steel text-[12px]">
                S&amp;P 500, NASDAQ Composite, Dow Jones Industrial e Índice de Volatilidad VIX.
              </p>
            </div>
          </div>
          <span className="text-muted-steel font-mono text-[12px]">
            {usIndices.length} índices
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {usIndices.map((s) => (
            <IndexCard key={s.symbol} summary={s} />
          ))}
        </div>
      </section>

      {/* Nota Metodológica de Cobertura */}
      <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <h4 className="font-display text-pure-white text-[18px] font-medium tracking-tight">
            Transparencia de Datos en Índices Mundiales
          </h4>
          <p className="text-frost/80 text-[14px] leading-[1.6]">
            Las series de precios se sincronizan con los repositorios oficiales de FRED, Deutsche Börse, STOXX Ltd., BME y CBOE. Los cálculos de medias móviles (SMA), oscilador RSI y MACD se derivan matemáticamente sobre las observaciones históricas de cierre.
          </p>
        </div>
        <Link
          href="/commodities"
          className="btn-primary-gradient shrink-0 px-5 py-2.5 text-[14px] font-medium inline-flex items-center gap-2"
        >
          <span>Ver Materias Primas</span>
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function IndexCard({ summary: s }: { summary: Awaited<ReturnType<typeof getAllIndicesSummary>>[number] }) {
  const meta = MARKET_INDICES[s.symbol];
  const isUp = (s.change1D ?? 0) >= 0;
  const isVix = meta.isVolatilityIndex;

  return (
    <Link
      href={`/indices/${meta.slug}`}
      className="bg-carbon-surface border-gunmetal rounded-2xl border p-6 flex flex-col justify-between hover:border-steel-border/50 transition-all group relative overflow-hidden"
    >
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-periwinkle-glow font-bold text-[13px] bg-void-black px-2.5 py-0.5 rounded-md border border-gunmetal">
              {meta.shortName}
            </span>
            <span className="text-muted-steel text-[11px] font-mono">
              {meta.country} · {meta.currency}
            </span>
          </div>
          <span className="text-muted-steel text-[11px] font-mono">
            {s.date}
          </span>
        </div>

        <h3 className="font-display text-pure-white text-[18px] font-medium tracking-tight mb-3 line-clamp-1">
          {meta.name}
        </h3>

        <div className="flex items-baseline gap-3 mb-4">
          <span className="tabular font-display text-pure-white text-[30px] font-medium leading-none tracking-tight">
            {isVix
              ? s.currentValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })
              : s.currentValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
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
                ).toFixed(1)}
                %
              </span>
            </div>
            <Sparkline
              values={s.recentSparkline}
              color={s.recentSparkline.at(-1)! >= s.recentSparkline[0] ? "#34d399" : "#f87171"}
            />
          </div>
        )}

        {/* Métricas clave */}
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mt-3">
          <div className="bg-void-black/70 border border-gunmetal/80 p-2 rounded-lg">
            <span className="text-muted-steel block text-[10px]">1 AÑO</span>
            <span className={cn("font-medium", (s.change1Y ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {s.change1Y !== undefined ? `${(s.change1Y >= 0 ? "+" : "")}${s.change1Y.toFixed(1)}%` : "—"}
            </span>
          </div>
          <div className="bg-void-black/70 border border-gunmetal/80 p-2 rounded-lg">
            <span className="text-muted-steel block text-[10px]">MÁXIMO</span>
            <span className="text-pure-white font-medium">
              {s.ath.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="bg-void-black/70 border border-gunmetal/80 p-2 rounded-lg">
            <span className="text-muted-steel block text-[10px]">DRAWDOWN</span>
            <span className={cn("font-medium", s.drawdownFromAthPct >= -5 ? "text-emerald-400" : "text-rose-400")}>
              {s.drawdownFromAthPct.toFixed(1)}%
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
}
