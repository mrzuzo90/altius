import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resolveTicker } from "@/lib/sec/tickers";
import { findLatestFiling, getCompanyProfile } from "@/lib/sec/submissions";
import { getPriceSeries } from "@/lib/prices";
import { CompanyHeader } from "@/components/company-header";
import { PriceChart } from "@/components/price-chart";
import { DataSourceBadge } from "@/components/data-source-badge";
import { formatDate } from "@/lib/format";
import { extractBusinessSection, extractBusinessSummary, type AnnualBusinessForm } from "@/lib/sec/mdna";
import { Skeleton } from "@/components/ui/skeleton";
import type { FilingRef } from "@/lib/sec/types";

import { buildStatements, hasUsableData, type StatementBundle } from "@/lib/sec/statements";
import { evaluateQualityScorecard, type QualityScorecardResult } from "@/lib/sec/quality";
import { QualityScorecard } from "@/components/quality-scorecard";
import { CompanyResearchSnapshot } from "@/components/company-research-snapshot";
import { buildBusinessSnapshot, buildCompanyAttention } from "@/lib/company-research";
import { getCompanyNews } from "@/lib/news";
import { CompanyNewsFeed } from "@/components/news/company-news-feed";
import { resolveIndexSymbol } from "@/lib/indices";
import { resolveCommoditySymbol } from "@/lib/commodities";
import { resolveCurrencySymbol } from "@/lib/currencies";
import { resolveEsefCompanyDynamic } from "@/lib/esef/resolve";
import { buildEsefStatements } from "@/lib/esef";
import { mergeStatementBundles } from "@/lib/financials/merge";
import { buildHistoricalPeSeries } from "@/lib/valuation/historical-pe";
import { fetchAnnualReportHtml } from "@/lib/financials/annual-report";
import { extractMostProfitableSegment } from "@/lib/financials/segments";
import { summarizeBusinessReport } from "@/lib/ai/business";

export const revalidate = 21600;

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: ticker.toUpperCase() };
}

export default async function PerfilPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: bruto } = await params;
  const rawQuery = bruto.trim();

  // 1. Si es un índice, redirigir a su ficha oficial
  const indexHit = resolveIndexSymbol(rawQuery);
  if (indexHit) redirect(`/indices/${indexHit.slug}`);

  // 2. Si es una materia prima, redirigir a su ficha oficial
  const commodityHit = resolveCommoditySymbol(rawQuery);
  if (commodityHit) redirect(`/commodities/${commodityHit.slug}`);

  // 3. Si es una divisa / tipo de cambio, redirigir a su ficha oficial
  const currencyHit = resolveCurrencySymbol(rawQuery);
  if (currencyHit) redirect(`/divisas/${currencyHit.slug}`);

  // 4. Resolver tanto el emisor SEC como la cotización/entidad regulatoria local.
  const [esefCompany, hit] = await Promise.all([
    resolveEsefCompanyDynamic(rawQuery),
    resolveTicker(rawQuery),
  ]);
  if (!hit && !esefCompany) notFound();
  const ticker = esefCompany?.ticker ?? hit!.ticker;
  const companyName = esefCompany?.name ?? hit!.name;

  const [secProfile, annualFiling, precios, secBundle, esefBundle, newsResult] = await Promise.all([
    hit ? getCompanyProfile(hit.cik, hit.name, ticker) : Promise.resolve(null),
    hit ? findLatestFiling(hit.cik, ["10-K", "20-F", "40-F"]) : Promise.resolve(null),
    getPriceSeries(ticker),
    hit ? buildStatements(hit.cik, "annual", hit.name, ticker) : Promise.resolve(null),
    esefCompany ? buildEsefStatements(esefCompany, "annual") : Promise.resolve(null),
    getCompanyNews(ticker, companyName, hit?.cik),
  ]);
  const bundle = esefBundle && hasUsableData(esefBundle)
    ? mergeStatementBundles(esefBundle, secBundle && hasUsableData(secBundle) ? secBundle : null)
    : secBundle ?? esefBundle;
  const profile = bundle?.profile ?? secProfile;
  if (!profile) notFound();
  const historicalPe = bundle
    ? buildHistoricalPeSeries(bundle, precios.ok ? precios.series : null, bundle.currency ?? "USD")
    : null;
  // El denominador de Las seis claves siempre es seis. Si falta un dato se
  // muestra como "sin dato" y se informa la cobertura, nunca un engañoso 3/4.
  const scorecard = bundle ? evaluateQualityScorecard(bundle, {
    historicalPe,
    splits: precios.ok ? precios.series.splits : undefined,
  }) : null;
  const fiscalYearStart = bundle?.latestPeriodEnd
    ? new Date(Date.parse(`${bundle.latestPeriodEnd}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
    : null;

  return (
    <>
      <CompanyHeader profile={profile} ticker={ticker} active="/" />

      <div className="mx-auto grid max-w-[1200px] gap-x-12 gap-y-8 px-5 py-8 sm:py-10 lg:grid-cols-3">
        {scorecard ? <div className="lg:col-span-3"><QualityScorecard scorecard={scorecard} /></div> : null}
        {bundle && scorecard ? (
          <div className="lg:col-span-3">
            <Suspense fallback={<CompanyResearchLoading />}>
              <CompanyResearch filing={annualFiling} bundle={bundle} scorecard={scorecard} />
            </Suspense>
          </div>
        ) : null}
        <section className="lg:col-span-2 space-y-10">
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-graphite text-[24px] leading-[1.15] tracking-[-0.48px]">Cotización histórica</h2>
              {precios.ok ? <DataSourceBadge source={precios.series.source} /> : null}
            </div>

            {precios.ok ? (
              <PriceChart
                points={precios.series.points}
                source={precios.series.source}
                currency={precios.series.currency}
                fiscalYearStart={fiscalYearStart}
                ticker={ticker}
              />
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
              Identidad según {bundle?.source?.label ?? (hit ? "SEC EDGAR" : "la fuente regulatoria disponible")}.
            </p>
          </div>

          {annualFiling ? (
            <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
              <h2 className="font-display text-pure-white mb-4 text-[16px] font-medium tracking-tight">Último informe anual</h2>
              <dl className="space-y-3 text-[14px]">
                <Fila t="Formulario" v={annualFiling.form} />
                <Fila t="Presentado" v={formatDate(annualFiling.filingDate)} />
                <Fila t="Cierre" v={formatDate(annualFiling.reportDate)} />
              </dl>
              <a
                href={annualFiling.documentUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="font-display text-periwinkle-glow hover:underline mt-4 inline-block text-[14px] font-medium tracking-tight"
              >
                Abrir el documento en EDGAR
              </a>
            </div>
          ) : bundle?.source?.href ? (
            <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6">
              <h2 className="font-display text-pure-white mb-3 text-[16px] font-medium tracking-tight">Último informe regulatorio</h2>
              <p className="text-muted-steel text-[13px] leading-[1.5]">{bundle.source.detail}</p>
              <a
                href={bundle.source.href}
                target="_blank"
                rel="noreferrer noopener"
                className="font-display text-periwinkle-glow hover:underline mt-4 inline-block text-[14px] font-medium tracking-tight"
              >
                Abrir en {bundle.source.label}
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

async function CompanyResearch({
  filing,
  bundle,
  scorecard,
}: {
  filing: FilingRef | null;
  bundle: StatementBundle;
  scorecard: QualityScorecardResult;
}) {
  let excerpt: string | null = null;
  let reportText: string | null = null;
  let offeringText: string | null = null;
  let narrative: Awaited<ReturnType<typeof summarizeBusinessReport>> = null;
  let segmentProfit: ReturnType<typeof extractMostProfitableSegment> = null;
  const report = filing ? {
    label: `${filing.form} · SEC EDGAR`,
    url: filing.documentUrl,
    form: filing.form as AnnualBusinessForm,
    periodEnd: filing.reportDate,
  } : bundle.annualReport ? {
    label: bundle.annualReport.label,
    url: bundle.annualReport.href,
    form: bundle.annualReport.form as AnnualBusinessForm,
    periodEnd: bundle.annualReport.periodEnd,
  } : null;

  if (report) {
    try {
      const html = await fetchAnnualReportHtml(report.url);
      if (html) {
        offeringText = html;
        const section = extractBusinessSection(html, report.form);
        reportText = section?.text ?? null;
        excerpt = extractBusinessSummary(html, report.form);
        segmentProfit = extractMostProfitableSegment(html);
        narrative = reportText
          ? await summarizeBusinessReport(reportText, bundle.profile.name, report.periodEnd)
          : null;
      }
    } catch {
      excerpt = null;
    }
  }
  const snapshot = buildBusinessSnapshot(bundle.profile, bundle, excerpt, {
    label: report?.label ?? bundle.source?.label ?? "fuente regulatoria",
    url: report?.url ?? bundle.source?.href ?? null,
  }, {
    reportText,
    offeringText,
    narrative,
    segmentProfit,
  });
  return <CompanyResearchSnapshot snapshot={snapshot} attention={buildCompanyAttention(scorecard)} />;
}

function CompanyResearchLoading() {
  return (
    <div className="space-y-4">
      <div className="bg-carbon-surface border-gunmetal rounded-[24px] border p-6">
        <Skeleton className="h-5 w-72 bg-gunmetal" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-24 bg-gunmetal" />
          <Skeleton className="h-24 bg-gunmetal" />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-40 bg-gunmetal" />
        <Skeleton className="h-40 bg-gunmetal" />
        <Skeleton className="h-40 bg-gunmetal" />
      </div>
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
