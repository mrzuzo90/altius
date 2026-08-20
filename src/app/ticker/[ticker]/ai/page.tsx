import { notFound } from "next/navigation";
import { resolveTicker } from "@/lib/sec/tickers";
import { findLatestFiling, getCompanyProfile } from "@/lib/sec/submissions";
import { secFetchText } from "@/lib/sec/client";
import { extractMdna } from "@/lib/sec/mdna";
import { summarizeMdna } from "@/lib/ai/gemini";
import { TTL } from "@/lib/cache/store";
import { CompanyHeader } from "@/components/company-header";
import { MdnaSummary } from "@/components/mdna-summary";

export const revalidate = 86400;
// El documento pesa varios megabytes y el modelo tarda; se necesita margen.
export const maxDuration = 120;

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} · Copiloto` };
}

export default async function CopilotoPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: bruto } = await params;
  const ticker = bruto.toUpperCase();

  const hit = await resolveTicker(ticker);
  if (!hit) notFound();

  const [profile, filing] = await Promise.all([
    getCompanyProfile(hit.cik),
    findLatestFiling(hit.cik, ["10-K"]),
  ]);

  return (
    <>
      <CompanyHeader profile={profile} ticker={ticker} active="/ai" />
      <div className="mx-auto max-w-[1200px] px-5 py-12">
        <h2 className="font-display text-graphite text-[32px] leading-[1.19] tracking-[-0.64px]">Análisis de la dirección</h2>
        <p className="text-steel mt-4 mb-9 max-w-2xl text-[18px] leading-[1.5] text-pretty">
          Resumen del apartado &laquo;Management&rsquo;s Discussion and Analysis&raquo; del último
          informe anual, elaborado únicamente a partir del texto de ese apartado.
        </p>
        {filing ? (
          <Contenido cik={hit.cik} url={filing.documentUrl} filing={filing} nombre={profile.name} />
        ) : (
          <Aviso texto="Esta empresa no tiene ningún formulario 10-K reciente en EDGAR." />
        )}
      </div>
    </>
  );
}

async function Contenido({
  url,
  filing,
  nombre,
}: {
  cik: string;
  url: string;
  filing: NonNullable<Awaited<ReturnType<typeof findLatestFiling>>>;
  nombre: string;
}) {
  const html = await secFetchText(url, TTL.filingDocument);
  const seccion = extractMdna(html, "10-K");

  if (!seccion) {
    return (
      <Aviso texto="No se ha localizado el apartado Item 7 en el documento. Algunos emisores lo presentan como anexo o dentro de un documento aparte." />
    );
  }

  const body = await summarizeMdna(seccion.text, nombre, filing.reportDate);
  return <MdnaSummary body={body} filing={filing} chars={seccion.chars} />;
}

function Aviso({ texto }: { texto: string }) {
  return (
    <div className="bg-fog border-mist rounded-[20px] border border-dashed px-8 py-16 text-center">
      <p className="text-steel mx-auto max-w-lg text-[15px] leading-[1.5] text-pretty">{texto}</p>
    </div>
  );
}
