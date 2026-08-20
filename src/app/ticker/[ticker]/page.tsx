import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resolveTicker } from "@/lib/sec/tickers";
import { findLatestFiling, getCompanyProfile } from "@/lib/sec/submissions";
import { getDailyPrices } from "@/lib/prices";
import { CompanyHeader } from "@/components/company-header";
import { PriceChart } from "@/components/price-chart";
import { DataSourceBadge } from "@/components/data-source-badge";
import { formatDate } from "@/lib/format";
import { secFetchText } from "@/lib/sec/client";
import { extractBusinessSummary } from "@/lib/sec/mdna";
import { TTL } from "@/lib/cache/store";
import { Skeleton } from "@/components/ui/skeleton";
import type { FilingRef } from "@/lib/sec/types";

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

  const [profile, ultimo10K, precios] = await Promise.all([
    getCompanyProfile(hit.cik),
    findLatestFiling(hit.cik, ["10-K"]),
    getDailyPrices(ticker),
  ]);

  return (
    <>
      <CompanyHeader profile={profile} ticker={ticker} active="/" />

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-8">
          {ultimo10K ? (
            <div>
              <h2 className="mb-3 text-sm font-medium">A qué se dedica</h2>
              <Suspense fallback={<DescripcionCargando />}>
                <Descripcion filing={ultimo10K} />
              </Suspense>
            </div>
          ) : null}

          <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Cotización diaria</h2>
            {precios.ok ? <DataSourceBadge source={precios.series.source} /> : null}
          </div>

          {precios.ok ? (
            <PriceChart points={precios.series.points} source={precios.series.source} />
          ) : (
            <SinPrecio resultado={precios} />
          )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="border-border/60 rounded-lg border p-5">
            <h2 className="mb-3 text-sm font-medium">Identidad</h2>
            <dl className="space-y-2 text-sm">
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
                      className="underline underline-offset-2"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  }
                />
              ) : null}
            </dl>
            <p className="text-muted-foreground mt-4 text-[11px] text-pretty">
              Tal y como consta en el registro de la SEC.
            </p>
          </div>

          {ultimo10K ? (
            <div className="border-border/60 rounded-lg border p-5">
              <h2 className="mb-3 text-sm font-medium">Último informe anual</h2>
              <dl className="space-y-2 text-sm">
                <Fila t="Formulario" v={ultimo10K.form} />
                <Fila t="Presentado" v={formatDate(ultimo10K.filingDate)} />
                <Fila t="Cierre" v={formatDate(ultimo10K.reportDate)} />
              </dl>
              <a
                href={ultimo10K.documentUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-block text-xs underline underline-offset-4"
              >
                Abrir el documento en EDGAR
              </a>
            </div>
          ) : null}

          <div className="border-border/60 rounded-lg border p-5">
            <h2 className="text-sm font-medium">Continuar</h2>
            <div className="mt-3 space-y-2">
              <Enlace href={`/ticker/${ticker}/financials`} texto="Estados financieros" />
              <Enlace href={`/ticker/${ticker}/ai`} texto="Resumen del informe" />
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
      <p className="text-muted-foreground text-sm text-pretty">
        No se ha podido aislar el apartado &laquo;Item 1. Business&raquo; de este informe. Altius no
        redacta descripciones propias: mostraría prosa que ningún documento respalda.
      </p>
    );
  }

  return (
    <div className="border-border/60 rounded-lg border p-5">
      <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{texto}</p>
      <p className="text-muted-foreground/70 mt-3 text-[11px]">
        Texto literal del apartado Item 1 del {filing.form} presentado el{" "}
        {formatDate(filing.filingDate)}.{" "}
        <a
          href={filing.documentUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2"
        >
          Ver el original
        </a>
      </p>
    </div>
  );
}

function DescripcionCargando() {
  return (
    <div className="border-border/60 rounded-lg border p-5">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="mt-2 h-3.5 w-[92%]" />
      <Skeleton className="mt-2 h-3.5 w-[78%]" />
      <Skeleton className="mt-4 h-2.5 w-56" />
    </div>
  );
}

function SinPrecio({ resultado }: { resultado: Awaited<ReturnType<typeof getDailyPrices>> }) {
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
    <div className="border-border/60 bg-muted/20 rounded-lg border border-dashed p-8 text-center">
      <p className="text-muted-foreground text-sm text-pretty">{mensaje}</p>
    </div>
  );
}

function Fila({ t, v }: { t: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground shrink-0">{t}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}

function Enlace({ href, texto }: { href: string; texto: string }) {
  return (
    <Link
      href={href}
      className="border-border/60 hover:bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors"
    >
      {texto}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}
