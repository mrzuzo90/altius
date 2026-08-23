import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resolveTicker } from "@/lib/sec/tickers";
import { findLatestFiling, getCompanyProfile } from "@/lib/sec/submissions";
import { getPriceSeries } from "@/lib/prices";
import { CompanyHeader } from "@/components/company-header";
import { PriceChart } from "@/components/price-chart";
import { DataSourceBadge } from "@/components/data-source-badge";
import { formatDate } from "@/lib/format";
import { secFetchText } from "@/lib/sec/client";
import { extractBusinessSummary } from "@/lib/sec/mdna";
import { TTL } from "@/lib/cache/store";
import { Skeleton } from "@/components/ui/skeleton";
import type { FilingRef } from "@/lib/sec/types";

import { buildStatements, hasUsableData } from "@/lib/sec/statements";
import { evaluateQualityScorecard } from "@/lib/sec/quality";
import { QualityScorecard } from "@/components/quality-scorecard";
import { getCompanyNews } from "@/lib/news";
import { CompanyNewsFeed } from "@/components/news/company-news-feed";

export const revalidate = 21600;

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: ticker.toUpperCase() };
}

export default async function PerfilPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: bruto } = await params;
  const ticker = bruto.toUpperCase();

  const hit = await resolveTicker(ticker);
  if (!hit) notFound();

  const [profile, ultimo10K, precios, bundle, newsResult] = await Promise.all([
    getCompanyProfile(hit.cik),
    findLatestFiling(hit.cik, ["10-K"]),
    getPriceSeries(ticker),
    buildStatements(hit.cik, "annual"),
    getCompanyNews(ticker, hit.name, hit.cik),
  ]);

  const scorecard = hasUsableData(bundle) ? evaluateQualityScorecard(bundle) : null;

  return (
    <>
      <CompanyHeader profile={profile} ticker={ticker} active="/" />

      <div className="mx-auto grid max-w-[1200px] gap-x-12 gap-y-12 px-5 py-14 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-10">
          {scorecard ? <QualityScorecard scorecard={scorecard} /> : null}

          {ultimo10K ? (
            <div>
              <h2 className="font-display text-graphite mb-5 text-[24px] leading-[1.15] tracking-[-0.48px]">A qué se dedica</h2>
              <Suspense fallback={<DescripcionCargando />}>
                <Descripcion filing={ultimo10K} />
              </Suspense>
            </div>
          ) : null}

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-graphite text-[24px] leading-[1.15] tracking-[-0.48px]">Cotización semanal</h2>
              {precios.ok ? <DataSourceBadge source={precios.series.source} /> : null}
            </div>

            {precios.ok ? (
              <PriceChart points={precios.series.points} source={precios.series.source} />
            ) : (
              <SinPrecio resultado={precios} />
            )}
          </div>

          <CompanyNewsFeed
            news={newsResult.news}
            ticker={ticker}
            companyName={profile.name}
          />
        </section>

        <aside className="space-y-6">
          <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
            <h2 className="font-display text-pure-white mb-4 text-[16px] font-medium tracking-tight">Identidad</h2>
            <dl className="space-y-3 text-[14px]">
              <Fila t="Razón social" v={profile.name} />
              <Fila t="Sector" v={profile.sector} />
              <Fila t="Industria" v={profile.sicDescription || "—"} />
              <Fila t="Mercado" v={profile.exchanges.join(", ") || "—"} />
              <Fila t="Domicilio" v={profile.address ?? "—"} />
              {profile.website ? (
                <Fila
                  t="Web"
                  v={
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-periwinkle-glow hover:underline"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  }
                />
              ) : null}
            </dl>
            <p className="text-muted-steel mt-4 text-[12px] leading-[1.5]">
              Tal y como consta en el registro de la SEC.
            </p>
          </div>

          {ultimo10K ? (
            <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
              <h2 className="font-display text-pure-white mb-4 text-[16px] font-medium tracking-tight">Último informe anual</h2>
              <dl className="space-y-3 text-[14px]">
                <Fila t="Formulario" v={ultimo10K.form} />
                <Fila t="Presentado" v={formatDate(ultimo10K.filingDate)} />
                <Fila t="Cierre" v={formatDate(ultimo10K.reportDate)} />
              </dl>
              <a
                href={ultimo10K.documentUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="font-display text-periwinkle-glow hover:underline mt-4 inline-block text-[14px] font-medium tracking-tight"
              >
                Abrir el documento en EDGAR
              </a>
            </div>
          ) : null}

          <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
            <h2 className="font-display text-pure-white text-[16px] font-medium tracking-tight">Explorar</h2>
            <div className="mt-4 space-y-2.5">
              <Enlace href={`/ticker/${ticker}/financials`} texto="Estados financieros" />
              <Enlace href={`/ticker/${ticker}/valuation`} texto="Múltiplos y valoración" />
              <Enlace href={`/ticker/${ticker}/technical`} texto="Análisis técnico e indicadores" />
              <Enlace href={`/ticker/${ticker}/ai`} texto="Copiloto de informe 10-K" />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

/**
 * Descripción del negocio tomada literalmente del apartado "Item 1. Business"
 * del último 10-K. Va en Suspense porque descargar el informe cuesta segundos y
 * el resto del perfil no debe esperarlo.
 */
async function Descripcion({ filing }: { filing: FilingRef }) {
  let texto: string | null = null;
  try {
    texto = extractBusinessSummary(await secFetchText(filing.documentUrl, TTL.filingDocument));
  } catch {
    texto = null;
  }

  if (!texto) {
    return (
      <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
        <p className="text-muted-steel text-[14px]">
          No se ha podido aislar la descripción del negocio en este documento.
        </p>
        <a
          href={filing.documentUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-periwinkle-glow hover:underline mt-3 inline-block text-[13px]"
        >
          Consultar el informe completo
        </a>
      </div>
    );
  }

  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
      <p className="text-frost text-[15px] leading-[1.6] text-pretty">{texto}</p>
      <p className="text-muted-steel mt-4 text-[12px]">
        Texto literal del apartado «Item 1. Business» del 10-K presentado el{" "}
        {formatDate(filing.filingDate)}.{" "}
        <a
          href={filing.documentUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-periwinkle-glow hover:underline"
        >
          Ver el original
        </a>
      </p>
    </div>
  );
}

function DescripcionCargando() {
  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
      <Skeleton className="h-3.5 w-full bg-gunmetal" />
      <Skeleton className="mt-2 h-3.5 w-[92%] bg-gunmetal" />
      <Skeleton className="mt-2 h-3.5 w-[78%] bg-gunmetal" />
      <Skeleton className="mt-4 h-2.5 w-56 bg-gunmetal" />
    </div>
  );
}

function SinPrecio({ resultado }: { resultado: Awaited<ReturnType<typeof getPriceSeries>> }) {
  if (resultado.ok) return null;
  const mensaje =
    resultado.reason === "no-provider"
      ? "No hay proveedor de cotizaciones configurado. Añade ALPHAVANTAGE_API_KEY en el entorno para activar el gráfico; el resto de la aplicación no lo necesita."
      : resultado.reason === "rate-limited"
        ? `Cuota del proveedor agotada. ${resultado.message}`
        : resultado.reason === "not-found"
          ? `El proveedor no reconoce el símbolo ${resultado.ticker}.`
          : resultado.message;

  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border border-dashed px-8 py-14 text-center">
      <p className="text-frost mx-auto max-w-md text-[14px] leading-[1.6] text-pretty">{mensaje}</p>
    </div>
  );
}

function Fila({ t, v }: { t: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gunmetal/40 pb-2.5 last:border-0 last:pb-0">
      <dt className="text-muted-steel shrink-0">{t}</dt>
      <dd className="text-right text-pure-white font-medium">{v}</dd>
    </div>
  );
}

function Enlace({ href, texto }: { href: string; texto: string }) {
  return (
    <Link
      href={href}
      className="border-gunmetal bg-void-black hover:border-steel-border/50 hover:text-pure-white text-frost font-display flex items-center justify-between rounded-xl border px-4 py-3 text-[14px] font-medium transition-colors"
    >
      <span>{texto}</span>
      <ArrowRight className="size-3.5 text-muted-steel" />
    </Link>
  );
}
