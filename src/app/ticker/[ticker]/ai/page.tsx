import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { resolveTicker } from "@/lib/sec/tickers";
import { findLatestFiling, getCompanyProfile } from "@/lib/sec/submissions";
import { secFetchText } from "@/lib/sec/client";
import { extractMdna } from "@/lib/sec/mdna";
import { summarizeMdna } from "@/lib/ai/gemini";
import { TTL } from "@/lib/cache/store";
import { CompanyHeader } from "@/components/company-header";
import { MdnaSummary } from "@/components/mdna-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, FileText, Loader2 } from "lucide-react";
import { resolveIndexSymbol } from "@/lib/indices";
import { resolveCommoditySymbol } from "@/lib/commodities";
import { resolveCurrencySymbol } from "@/lib/currencies";

export const revalidate = 86400;
// El documento pesa varios megabytes y el modelo tarda; se necesita margen.
export const maxDuration = 120;

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} · Copiloto 10-K / 20-F` };
}

export default async function CopilotoPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: bruto } = await params;
  const rawQuery = bruto.trim();

  // Redirecciones directas si la URL era un índice, materia prima o divisa
  const indexHit = resolveIndexSymbol(rawQuery);
  if (indexHit) redirect(`/indices/${indexHit.slug}`);
  const commodityHit = resolveCommoditySymbol(rawQuery);
  if (commodityHit) redirect(`/commodities/${commodityHit.slug}`);
  const currencyHit = resolveCurrencySymbol(rawQuery);
  if (currencyHit) redirect(`/divisas/${currencyHit.slug}`);

  const hit = await resolveTicker(rawQuery);
  if (!hit) notFound();
  const ticker = hit.ticker;

  const [profile, filing] = await Promise.all([
    getCompanyProfile(hit.cik),
    findLatestFiling(hit.cik, ["10-K", "20-F"]),
  ]);

  return (
    <>
      <CompanyHeader profile={profile} ticker={ticker} active="/ai" />
      <div className="mx-auto max-w-[1200px] px-5 py-12">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-4 text-periwinkle-glow" />
          <span className="text-periwinkle-glow font-mono text-[12px] uppercase tracking-wider font-semibold">
            Copiloto de Informe Anual 10-K
          </span>
        </div>
        <h2 className="font-display text-pure-white text-[32px] font-medium leading-[1.19] tracking-tight">
          Análisis de la dirección (MD&amp;A)
        </h2>
        <p className="text-frost mt-2 mb-9 max-w-2xl text-[16px] leading-[1.6] text-pretty">
          Resumen del apartado &laquo;Management&rsquo;s Discussion and Analysis&raquo; del último
          informe anual, elaborado exclusivamente a partir del texto oficial presentado ante la SEC.
        </p>

        {filing ? (
          <Suspense fallback={<CopilotoLoading filingDate={filing.filingDate} form={filing.form} />}>
            <Contenido url={filing.documentUrl} filing={filing} nombre={profile.name} />
          </Suspense>
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

function CopilotoLoading({ filingDate, form }: { filingDate: string; form: string }) {
  return (
    <div className="space-y-6">
      <div className="border-gunmetal flex items-center justify-between border-y py-4 text-[13px] text-muted-steel">
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin text-periwinkle-glow" />
          <span>Extrayendo apartado Item 7 del informe {form} ({filingDate})...</span>
        </div>
        <span className="font-mono text-[11px] text-periwinkle-glow">SEC EDGAR</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {[
          { label: "01 Impulsores de ingresos", icon: FileText },
          { label: "02 Riesgos operativos", icon: FileText },
          { label: "03 Tono de la directiva", icon: FileText },
        ].map((item, idx) => (
          <div key={idx} className="bg-carbon-surface border-gunmetal rounded-2xl border p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-steel font-mono text-[12px]">{item.label}</span>
              <Skeleton className="size-4 bg-gunmetal rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4 bg-gunmetal" />
            <Skeleton className="h-3.5 w-full bg-gunmetal/70" />
            <Skeleton className="h-3.5 w-5/6 bg-gunmetal/70" />
            <Skeleton className="h-3.5 w-4/6 bg-gunmetal/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border border-dashed px-8 py-16 text-center">
      <p className="text-frost mx-auto max-w-lg text-[15px] leading-[1.6] text-pretty">{texto}</p>
    </div>
  );
}
