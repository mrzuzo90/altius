import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DataSourceBadge } from "@/components/data-source-badge";
import { TechnicalChart } from "@/components/technical/technical-chart";
import { TechnicalScorecard } from "@/components/technical/technical-scorecard";
import { CompanyNewsFeed } from "@/components/news/company-news-feed";
import { getIndexDetail, resolveIndexSymbol } from "@/lib/indices";
import { getCompanyNews } from "@/lib/news";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const meta = resolveIndexSymbol(symbol);
  if (!meta) return { title: "Índice no encontrado" };
  return { title: `${meta.shortName} · ${meta.name} | Altius` };
}

export default async function IndexDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const meta = resolveIndexSymbol(symbol);
  if (!meta) notFound();

  const [detail, newsResult] = await Promise.all([
    getIndexDetail(meta.symbol),
    getCompanyNews(meta.shortName, meta.name),
  ]);

  const { summary, technical } = detail;

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 space-y-10">
      {/* Botón de Retorno y Cabecera del Índice */}
      <div className="space-y-4">
        <Link
          href="/indices"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-steel hover:text-frost font-display font-medium transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver a todos los índices</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-periwinkle-glow font-bold text-[14px] bg-carbon-surface px-3 py-1 rounded-full border border-gunmetal">
                {meta.shortName}
              </span>
              <span className="text-muted-steel text-[12px] font-mono bg-void-black border border-gunmetal px-2 py-0.5 rounded">
                Símbolo oficial: {meta.marketSymbol}
              </span>
            </div>

            <h1 className="font-display text-pure-white text-[36px] font-medium leading-[1.1] tracking-tight">
              {meta.name}
            </h1>
            <p className="text-frost/80 text-[15px] max-w-2xl mt-1.5 leading-[1.6]">
              {meta.description}
            </p>
          </div>

          <DataSourceBadge
            source={meta.provider}
            detail={`Cotización oficial en puntos de índice nominales (${meta.marketSymbol}).`}
            href={meta.fredSeriesId ? `https://fred.stlouisfed.org/series/${meta.fredSeriesId}` : undefined}
          />
        </div>
      </div>

      {/* Gráfico Técnico Interactivo y Selector de Indicadores */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-pure-white text-[22px] font-medium tracking-tight">
            Evolución y Análisis Técnico Interactivo
          </h2>
          <span className="text-muted-steel font-mono text-[12px]">
            Puntos de índice nominales · SMA 20/50/200 · Bollinger · RSI · MACD
          </span>
        </div>

        <TechnicalChart
          points={technical.points}
          source={meta.provider}
          currency={meta.isVolatilityIndex ? "PTS" : meta.currency}
        />
      </section>

      {/* Cuadro de Mando Cuantitativo y Diagnóstico de Señales */}
      <section className="space-y-4">
        <h2 className="font-display text-pure-white text-[22px] font-medium tracking-tight">
          Diagnóstico Técnico Cuantitativo
        </h2>
        <TechnicalScorecard stats={technical.stats} />
      </section>

      {/* Tabla de Estadísticas Históricas */}
      <section className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
        <h3 className="font-display text-pure-white text-[18px] font-medium tracking-tight mb-5">
          Estadísticas Históricas y Rendimientos
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-[13px]">
          <div className="bg-void-black border border-gunmetal p-4 rounded-xl">
            <span className="text-muted-steel block text-[11px] font-mono">1 DÍA</span>
            <span
              className={cn(
                "font-mono text-[18px] font-medium",
                (summary.change1D ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {summary.change1D !== undefined
                ? `${summary.change1D >= 0 ? "+" : ""}${summary.change1D.toFixed(2)}%`
                : "—"}
            </span>
          </div>

          <div className="bg-void-black border border-gunmetal p-4 rounded-xl">
            <span className="text-muted-steel block text-[11px] font-mono">1 SEMANA</span>
            <span
              className={cn(
                "font-mono text-[18px] font-medium",
                (summary.change1W ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {summary.change1W !== undefined
                ? `${summary.change1W >= 0 ? "+" : ""}${summary.change1W.toFixed(2)}%`
                : "—"}
            </span>
          </div>

          <div className="bg-void-black border border-gunmetal p-4 rounded-xl">
            <span className="text-muted-steel block text-[11px] font-mono">1 MES</span>
            <span
              className={cn(
                "font-mono text-[18px] font-medium",
                (summary.change1M ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {summary.change1M !== undefined
                ? `${summary.change1M >= 0 ? "+" : ""}${summary.change1M.toFixed(2)}%`
                : "—"}
            </span>
          </div>

          <div className="bg-void-black border border-gunmetal p-4 rounded-xl">
            <span className="text-muted-steel block text-[11px] font-mono">1 AÑO</span>
            <span
              className={cn(
                "font-mono text-[18px] font-medium",
                (summary.change1Y ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {summary.change1Y !== undefined
                ? `${summary.change1Y >= 0 ? "+" : ""}${summary.change1Y.toFixed(2)}%`
                : "—"}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gunmetal/60 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-[13px]">
          <div>
            <span className="text-muted-steel block text-[11px] font-mono">MÁXIMO HISTÓRICO (ATH)</span>
            <span className="font-mono text-pure-white font-medium text-[16px]">
              {summary.ath.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
            </span>
            <span className="text-muted-steel block text-[11px] mt-0.5">Alcanzado el {summary.athDate}</span>
          </div>

          <div>
            <span className="text-muted-steel block text-[11px] font-mono">DRAWDOWN DESDE ATH</span>
            <span
              className={cn(
                "font-mono font-medium text-[16px]",
                summary.drawdownFromAthPct >= -5 ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {summary.drawdownFromAthPct.toFixed(2)} %
            </span>
            <span className="text-muted-steel block text-[11px] mt-0.5">Distancia a máximos históricos</span>
          </div>

          <div>
            <span className="text-muted-steel block text-[11px] font-mono">MÁXIMO 52 SEMANAS</span>
            <span className="font-mono text-pure-white font-medium text-[16px]">
              {summary.high52w.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
            </span>
            <span className="text-muted-steel block text-[11px] mt-0.5">Cota superior últimos 12 meses</span>
          </div>

          <div>
            <span className="text-muted-steel block text-[11px] font-mono">MÍNIMO 52 SEMANAS</span>
            <span className="font-mono text-pure-white font-medium text-[16px]">
              {summary.low52w.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
            </span>
            <span className="text-muted-steel block text-[11px] mt-0.5">Soporte anual de mercado</span>
          </div>
        </div>
      </section>

      {/* Flujo de Noticias Relevantes del Índice */}
      <section className="space-y-4">
        <h2 className="font-display text-pure-white text-[22px] font-medium tracking-tight">
          Noticias y Pulso de Mercado
        </h2>
        <CompanyNewsFeed
          news={newsResult.news}
          ticker={meta.shortName}
          companyName={meta.name}
        />
      </section>
    </div>
  );
}
