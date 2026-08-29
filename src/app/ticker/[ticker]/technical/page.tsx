import { notFound, redirect } from "next/navigation";
import { CompanyHeader } from "@/components/company-header";
import { DataSourceBadge } from "@/components/data-source-badge";
import { TechnicalChart } from "@/components/technical/technical-chart";
import { OptionsPressurePanel } from "@/components/technical/options-pressure-panel";
import { TechnicalScorecard } from "@/components/technical/technical-scorecard";
import { getPriceSeries } from "@/lib/prices";
import { getCompanyProfile } from "@/lib/sec/submissions";
import { resolveTicker } from "@/lib/sec/tickers";
import { buildTechnicalDataset } from "@/lib/technical";
import { resolveIndexSymbol } from "@/lib/indices";
import { resolveCommoditySymbol } from "@/lib/commodities";
import { resolveCurrencySymbol } from "@/lib/currencies";
import { resolveEsefCompanyDynamic } from "@/lib/esef/resolve";
import { getEsefCompanyProfile } from "@/lib/esef";
import { getOptionsMarketAnalysis } from "@/lib/options";

export const revalidate = 900;

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: `Análisis Técnico · ${ticker.toUpperCase()} | Altius` };
}

export default async function TechnicalPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
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

  const [profile, precios, optionsAnalysis] = await Promise.all([
    esefCompany
      ? Promise.resolve(getEsefCompanyProfile(esefCompany))
      : getCompanyProfile(hit!.cik, hit!.name, ticker),
    getPriceSeries(ticker),
    getOptionsMarketAnalysis(ticker),
  ]);

  const technical = precios.ok
    ? buildTechnicalDataset(ticker, precios.series.source, precios.series.points)
    : null;

  return (
    <>
      <CompanyHeader profile={profile} ticker={ticker} active="/technical" />

      <div className="mx-auto max-w-[1200px] px-5 py-10 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-pure-white text-[28px] font-medium tracking-tight">
              Análisis Técnico e Indicadores Cuantitativos
            </h2>
            <p className="text-frost/80 text-[14px] mt-1">
              Tendencia de precio, momentum y una lectura separada del mercado de opciones: volumen, posiciones abiertas, bid/ask, volatilidad y rango implícito.
            </p>
          </div>
          {precios.ok && <DataSourceBadge source={precios.series.source} />}
        </div>

        {technical ? (
          <TechnicalChart
            points={technical.points}
            source={precios.ok ? precios.series.source : "Alpha Vantage"}
            currency={precios.ok ? precios.series.currency ?? "USD" : "USD"}
          />
        ) : <SinPrecio resultado={precios} />}

        <OptionsPressurePanel result={optionsAnalysis} />

        {technical ? (
          <section className="space-y-4">
            <h3 className="font-display text-pure-white text-[20px] font-medium tracking-tight">
              Diagnóstico de Señales Técnicas
            </h3>
            <TechnicalScorecard stats={technical.stats} />
          </section>
        ) : null}
      </div>
    </>
  );
}

function SinPrecio({ resultado }: { resultado: Awaited<ReturnType<typeof getPriceSeries>> }) {
  if (resultado.ok) return null;
  const mensaje =
    resultado.reason === "no-provider"
      ? "No hay proveedor de cotizaciones configurado. Añade ALPHAVANTAGE_API_KEY en el entorno para activar el análisis técnico completo; el resto de la aplicación no lo necesita."
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
