import { notFound } from "next/navigation";
import { resolveTicker } from "@/lib/sec/tickers";
import { buildStatements, hasUsableData } from "@/lib/sec/statements";
import { getPriceSeries } from "@/lib/prices";
import { buildValuationMetrics } from "@/lib/valuation";
import { CompanyHeader } from "@/components/company-header";
import { ValuationSummaryCards } from "@/components/valuation/valuation-summary-cards";
import { ProjectionCalculator } from "@/components/valuation/projection-calculator";
import { DataSourceBadge } from "@/components/data-source-badge";
import { formatDate } from "@/lib/format";

export const revalidate = 21600;

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} · Múltiplos y Valoración` };
}

export default async function ValuationPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: bruto } = await params;
  const ticker = bruto.toUpperCase();

  const hit = await resolveTicker(ticker);
  if (!hit) notFound();

  const [bundle, precios] = await Promise.all([
    buildStatements(hit.cik, "annual"),
    getPriceSeries(ticker),
  ]);

  if (!hasUsableData(bundle)) {
    return (
      <>
        <CompanyHeader profile={bundle.profile} ticker={ticker} active="/valuation" />
        <div className="mx-auto max-w-[1200px] px-5 py-12">
          <div className="bg-fog border-mist rounded-[20px] border border-dashed px-8 py-16 text-center">
            <p className="text-steel mx-auto max-w-lg text-[15px] leading-[1.5] text-pretty">
              La SEC no publica datos XBRL estructurados para esta empresa necesarios para calcular la valoración.
            </p>
          </div>
        </div>
      </>
    );
  }

  const latestPoint = precios.ok ? precios.series.points.at(-1) : null;
  const currentPrice = latestPoint ? latestPoint.close : 0;
  const priceDate = latestPoint ? latestPoint.date : null;

  const metrics = buildValuationMetrics(bundle, currentPrice, priceDate);

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
                Múltiplos de mercado basados en los estados financieros de la SEC y la cotización semanal ajustada.
              </p>
            </div>
            {precios.ok ? (
              <DataSourceBadge
                source={`${precios.series.source} + SEC EDGAR`}
                asOf={priceDate ? formatDate(priceDate) : undefined}
                detail="Múltiplos calculados combinando el precio ajustado por splits con los estados auditados de la SEC."
              />
            ) : null}
          </div>

          <ValuationSummaryCards metrics={metrics} />
        </div>

        <ProjectionCalculator metrics={metrics} />
      </div>
    </>
  );
}
