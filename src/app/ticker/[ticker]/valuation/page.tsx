import { notFound, redirect } from "next/navigation";
import { resolveTicker } from "@/lib/sec/tickers";
import { buildStatements, hasUsableData } from "@/lib/sec/statements";
import { getPriceSeries } from "@/lib/prices";
import { buildValuationMetrics } from "@/lib/valuation";
import { buildHistoricalPeSeries } from "@/lib/valuation/historical-pe";
import { buildQuarterlyPeSeries } from "@/lib/valuation/quarterly-pe";
import { CompanyHeader } from "@/components/company-header";
import { ValuationSummaryCards } from "@/components/valuation/valuation-summary-cards";
import { ProjectionCalculator } from "@/components/valuation/projection-calculator";
import { ValuationAuditPanel } from "@/components/valuation/valuation-audit-panel";
import { HistoricalPeChart } from "@/components/valuation/historical-pe-chart";
import { DataSourceBadge } from "@/components/data-source-badge";
import { formatDate } from "@/lib/format";
import { resolveIndexSymbol } from "@/lib/indices";
import { resolveCommoditySymbol } from "@/lib/commodities";
import { resolveCurrencySymbol } from "@/lib/currencies";
import { resolveEsefCompanyDynamic } from "@/lib/esef/resolve";
import { buildEsefStatements } from "@/lib/esef";
import { mergeStatementBundles } from "@/lib/financials/merge";
import { convertPriceSeriesCurrency } from "@/lib/prices/fx";
import { supplementAnnualStatements } from "@/lib/financials/yahoo-supplement";

export const revalidate = 21600;

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} · Múltiplos y Valoración` };
}

export default async function ValuationPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: bruto } = await params;
  const rawQuery = bruto.trim();

  // Redirecciones directas si la URL era un índice, materia prima o divisa
  const indexHit = resolveIndexSymbol(rawQuery);
  if (indexHit) redirect(`/indices/${indexHit.slug}`);
  const commodityHit = resolveCommoditySymbol(rawQuery);
  if (commodityHit) redirect(`/commodities/${commodityHit.slug}`);
  const currencyHit = resolveCurrencySymbol(rawQuery);
  if (currencyHit) redirect(`/divisas/${currencyHit.slug}`);

  const [esefCompany, hit] = await Promise.all([
    resolveEsefCompanyDynamic(rawQuery),
    resolveTicker(rawQuery),
  ]);
  if (!hit && !esefCompany) notFound();
  const ticker = esefCompany?.ticker ?? hit!.ticker;

  const [secBundle, secQuarterlyBundle, esefBundle, precios] = await Promise.all([
    hit ? buildStatements(hit.cik, "annual", hit.name, ticker) : Promise.resolve(null),
    hit
      ? buildStatements(hit.cik, "quarterly", hit.name, ticker, { maxPeriods: 80 })
      : Promise.resolve(null),
    esefCompany ? buildEsefStatements(esefCompany, "annual") : Promise.resolve(null),
    getPriceSeries(ticker),
  ]);
  const regulatorBundle = esefBundle && hasUsableData(esefBundle)
    ? mergeStatementBundles(esefBundle, secBundle && hasUsableData(secBundle) ? secBundle : null)
    : secBundle ?? esefBundle!;
  const bundle = hasUsableData(regulatorBundle)
    ? await supplementAnnualStatements(regulatorBundle, {
        ticker,
        name: regulatorBundle.profile.name,
        country: regulatorBundle.profile.stateOfIncorporation ?? undefined,
        sector: regulatorBundle.profile.sector,
      })
    : regulatorBundle;

  if (!hasUsableData(bundle)) {
    return (
      <>
        <CompanyHeader profile={bundle.profile} ticker={ticker} active="/valuation" />
        <div className="mx-auto max-w-[1200px] px-5 py-12">
          <div className="bg-fog border-mist rounded-[20px] border border-dashed px-8 py-16 text-center">
            <p className="text-steel mx-auto max-w-lg text-[15px] leading-[1.5] text-pretty">
              No hay estados financieros estructurados suficientes para calcular la valoración.
            </p>
          </div>
        </div>
      </>
    );
  }

  const [valuationPrices, quarterlyValuationPrices] = await Promise.all([
    precios.ok
      ? convertPriceSeriesCurrency(precios.series, bundle.currency ?? "USD")
      : Promise.resolve(null),
    precios.ok && secQuarterlyBundle
      ? convertPriceSeriesCurrency(precios.series, secQuarterlyBundle.currency ?? "USD")
      : Promise.resolve(null),
  ]);
  const latestPoint = valuationPrices?.points.at(-1) ?? null;
  const currentPrice = latestPoint?.close ?? null;
  const priceDate = latestPoint ? latestPoint.date : null;

  const metrics = buildValuationMetrics(bundle, currentPrice, priceDate);
  const historicalPe = buildHistoricalPeSeries(bundle, valuationPrices, bundle.currency ?? "USD");
  const quarterlyPe = buildQuarterlyPeSeries(
    secQuarterlyBundle,
    quarterlyValuationPrices,
    secQuarterlyBundle?.currency ?? "USD",
  );

  return (
    <>
      <CompanyHeader profile={bundle.profile} ticker={ticker} active="/valuation" />

      <div className="mx-auto max-w-[1200px] px-5 py-12 space-y-12">
        <div>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-graphite text-[32px] leading-[1.19] tracking-[-0.64px]">
                Múltiplos y Valoración
              </h2>
              <p className="text-steel mt-1 text-[14px]">
                Múltiplos point-in-time basados en estados regulatorios y cotizaciones ajustadas por splits.
              </p>
            </div>
            {valuationPrices ? (
              <DataSourceBadge
                source={`${valuationPrices.source} + ${bundle.source?.label ?? "fuente regulatoria"}`}
                asOf={priceDate ? formatDate(priceDate) : undefined}
                detail="Múltiplos calculados únicamente cuando la cotización y los beneficios están expresados en la misma divisa."
              />
            ) : null}
          </div>

          <ValuationSummaryCards metrics={metrics} />
          <div className="mt-6">
            <HistoricalPeChart series={historicalPe} quarterlySeries={quarterlyPe} />
          </div>
          <div className="mt-6">
            <ValuationAuditPanel
              metrics={metrics}
              priceSource={valuationPrices?.source ?? null}
              financialSource={bundle.source?.label ?? "Fuente regulatoria"}
            />
          </div>
        </div>

        <ProjectionCalculator metrics={metrics} historicalPe={historicalPe} />
      </div>
    </>
  );
}
