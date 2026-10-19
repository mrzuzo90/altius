import { notFound } from "next/navigation";
import { resolveTicker } from "@/lib/sec/tickers";
import { resolveEsefCompanyDynamic } from "@/lib/esef/resolve";
import { getPriceSeries } from "@/lib/prices";
import { buildStatements, hasUsableData, type StatementBundle } from "@/lib/sec/statements";
import { buildEsefStatements } from "@/lib/esef";
import { mergeStatementBundles } from "@/lib/financials/merge";
import { buildHistoricalPeSeries } from "@/lib/valuation/historical-pe";
import { evaluateQualityScorecard } from "@/lib/sec/quality";
import { StudioClient } from "./studio-client";

export default async function StudioPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: bruto } = await params;
  const rawQuery = bruto.trim();

  const [esefCompany, hit] = await Promise.all([
    resolveEsefCompanyDynamic(rawQuery),
    resolveTicker(rawQuery),
  ]);

  if (!hit && !esefCompany) notFound();
  const ticker = esefCompany?.ticker ?? hit!.ticker;
  const companyName = esefCompany?.name ?? hit!.name;

  const [precios, secBundle, esefBundle] = await Promise.all([
    getPriceSeries(ticker),
    hit ? buildStatements(hit.cik, "annual", hit.name, ticker) : Promise.resolve(null),
    esefCompany ? buildEsefStatements(esefCompany, "annual") : Promise.resolve(null),
  ]);

  const bundle: StatementBundle | null =
    esefBundle && hasUsableData(esefBundle)
      ? mergeStatementBundles(esefBundle, secBundle && hasUsableData(secBundle) ? secBundle : null)
      : secBundle ?? esefBundle;

  if (!bundle) notFound();

  const historicalPe = buildHistoricalPeSeries(
    bundle,
    precios.ok ? precios.series : null,
    bundle.currency ?? "USD",
  );

  const scorecard = evaluateQualityScorecard(bundle, {
    historicalPe,
    splits: precios.ok ? precios.series.splits : undefined,
  });

  return (
    <StudioClient
      ticker={ticker}
      companyName={companyName}
      bundle={bundle}
      scorecard={scorecard}
      priceSeries={precios.ok ? precios.series : null}
    />
  );
}
