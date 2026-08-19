import { notFound } from "next/navigation";
import { resolveTicker } from "@/lib/sec/tickers";
import { buildStatements, hasUsableData } from "@/lib/sec/statements";
import { CompanyHeader } from "@/components/company-header";
import { FinancialsClient } from "./financials-client";
import { DataSourceBadge } from "@/components/data-source-badge";
import { formatDate } from "@/lib/format";
import type { Frequency } from "@/lib/sec/normalize";

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
  const ticker = bruto.toUpperCase();
  const frequency: Frequency = freq === "quarterly" ? "quarterly" : "annual";

  const hit = await resolveTicker(ticker);
  if (!hit) notFound();

  const bundle = await buildStatements(hit.cik, frequency);

  return (
    <>
      <CompanyHeader profile={bundle.profile} ticker={ticker} active="/financials" />

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium">Estados financieros</h2>
          <DataSourceBadge
            source="SEC EDGAR"
            asOf={bundle.latestPeriodEnd ? formatDate(bundle.latestPeriodEnd) : undefined}
            detail="Hechos XBRL de la API companyfacts de la SEC. Cuando una empresa reexpresa un ejercicio, Altius muestra la versión más reciente."
            href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${bundle.profile.cik}&type=10-K`}
          />
        </div>

        {hasUsableData(bundle) ? (
          <FinancialsClient bundle={bundle} ticker={ticker} frequency={frequency} />
        ) : (
          <div className="border-border/60 bg-muted/20 rounded-lg border border-dashed p-10 text-center">
            <p className="text-muted-foreground text-sm text-pretty">
              La SEC no publica datos XBRL estructurados para esta empresa. Suele ocurrir con
              emisores extranjeros que presentan formulario 20-F y con registros anteriores a la
              obligatoriedad del XBRL.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
