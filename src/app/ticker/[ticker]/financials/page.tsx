import { notFound, redirect } from "next/navigation";
import { resolveTicker } from "@/lib/sec/tickers";
import { buildStatements, hasUsableData } from "@/lib/sec/statements";
import { CompanyHeader } from "@/components/company-header";
import { FinancialsClient } from "./financials-client";
import { DataSourceBadge } from "@/components/data-source-badge";
import { formatDate } from "@/lib/format";
import type { Frequency } from "@/lib/sec/normalize";
import { resolveIndexSymbol } from "@/lib/indices";
import { resolveCommoditySymbol } from "@/lib/commodities";
import { resolveCurrencySymbol } from "@/lib/currencies";
import { resolveEsefCompanyDynamic } from "@/lib/esef/resolve";
import { buildEsefStatements } from "@/lib/esef";
import { mergeStatementBundles } from "@/lib/financials/merge";

export const revalidate = 21600;

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} · Estados financieros` };
}

export default async function FinancialsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ freq?: string }>;
}) {
  const [{ ticker: bruto }, { freq }] = await Promise.all([params, searchParams]);
  const rawQuery = bruto.trim();

  // Redirecciones directas si la URL era un índice, materia prima o divisa
  const indexHit = resolveIndexSymbol(rawQuery);
  if (indexHit) redirect(`/indices/${indexHit.slug}`);
  const commodityHit = resolveCommoditySymbol(rawQuery);
  if (commodityHit) redirect(`/commodities/${commodityHit.slug}`);
  const currencyHit = resolveCurrencySymbol(rawQuery);
  if (currencyHit) redirect(`/divisas/${currencyHit.slug}`);

  const frequency: Frequency = freq === "quarterly" ? "quarterly" : "annual";

  const [esefCompany, hit] = await Promise.all([
    resolveEsefCompanyDynamic(rawQuery),
    resolveTicker(rawQuery),
  ]);
  if (!hit && !esefCompany) notFound();
  const ticker = esefCompany?.ticker ?? hit!.ticker;

  const [secBundle, esefBundle] = await Promise.all([
    hit ? buildStatements(hit.cik, frequency, hit.name, ticker) : Promise.resolve(null),
    esefCompany && frequency === "annual" ? buildEsefStatements(esefCompany, frequency) : Promise.resolve(null),
  ]);
  const bundle = esefBundle && hasUsableData(esefBundle)
    ? mergeStatementBundles(esefBundle, secBundle && hasUsableData(secBundle) ? secBundle : null)
    : secBundle ?? esefBundle!;

  return (
    <>
      <CompanyHeader profile={bundle.profile} ticker={ticker} active="/financials" />

      <div className="mx-auto max-w-[1200px] px-5 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <h2 className="font-display text-graphite text-[32px] leading-[1.19] tracking-[-0.64px]">Estados financieros</h2>
          <DataSourceBadge
            source={bundle.source?.label ?? "Fuente regulatoria"}
            asOf={bundle.latestPeriodEnd ? formatDate(bundle.latestPeriodEnd) : undefined}
            detail={bundle.source?.detail ?? "Estados financieros estructurados publicados por la empresa."}
            href={bundle.source?.href}
          />
        </div>

        {hasUsableData(bundle) ? (
          <FinancialsClient bundle={bundle} ticker={ticker} frequency={frequency} />
        ) : (
          <div className="bg-fog border-mist rounded-[20px] border border-dashed px-8 py-16 text-center">
            <p className="text-steel mx-auto max-w-lg text-[15px] leading-[1.5] text-pretty">
              No hay estados regulatorios estructurados suficientes para esta frecuencia y este
              emisor. Prueba la vista anual o el ticker local con su sufijo de mercado.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
