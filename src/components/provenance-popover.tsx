"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { edgarFilingUrl, type Provenance } from "@/lib/sec/provenance";
import { formatDate, formatValue } from "@/lib/format";
import { ExternalLink, FileText, Sigma, Minus } from "lucide-react";

/**
 * El cuerpo del popover, exportado aparte para poder probarlo sin Radix.
 */
export function ProvenanceDetail({ cik, provenance }: { cik: string; provenance: Provenance }) {
  if (provenance.kind === "absent") {
    return (
      <div className="flex items-start gap-2.5">
        <Minus className="text-muted-steel mt-0.5 size-4 shrink-0" />
        <p className="text-frost text-[13px] leading-[1.5]">
          La empresa no reporta este concepto en este periodo.
        </p>
      </div>
    );
  }

  if (provenance.kind === "derived") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sigma className="text-periwinkle-glow size-4 shrink-0" />
          <span className="text-pure-white text-[13px] font-medium">Calculado por Altius</span>
        </div>
        <p className="text-frost bg-void-black border-gunmetal rounded-lg border px-3 py-2 font-mono text-[12px] leading-[1.5]">
          {provenance.formula}
        </p>
        <dl className="space-y-1.5">
          {provenance.inputs.map((entrada) => (
            <div key={entrada.label} className="flex justify-between gap-4 text-[12px]">
              <dt className="text-muted-steel">{entrada.label}</dt>
              <dd className="text-frost tabular">{formatValue(entrada.value, "USD", "millions")}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="text-periwinkle-glow size-4 shrink-0" />
        <span className="text-pure-white text-[13px] font-medium">
          Dato publicado por la empresa
        </span>
      </div>
      <p className="text-frost bg-void-black border-gunmetal rounded-lg border px-3 py-2 font-mono text-[11px] leading-[1.4] break-all">
        {provenance.concept}
      </p>
      <dl className="space-y-1.5 text-[12px]">
        <Fila t="Unidad" v={provenance.unit} />
        <Fila
          t="Periodo"
          v={
            provenance.periodStart
              ? `${formatDate(provenance.periodStart)} → ${formatDate(provenance.periodEnd)}`
              : formatDate(provenance.periodEnd)
          }
        />
        <Fila t="Formulario" v={provenance.form} />
        <Fila t="Presentado" v={formatDate(provenance.filed)} />
      </dl>
      <a
        href={edgarFilingUrl(cik, provenance.accn)}
        target="_blank"
        rel="noreferrer noopener"
        className="text-periwinkle-glow inline-flex items-center gap-1.5 text-[12px] hover:underline"
      >
        <span>Abrir la presentación en EDGAR</span>
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function Fila({ t, v }: { t: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-steel shrink-0">{t}</dt>
      <dd className="text-frost text-right">{v}</dd>
    </div>
  );
}

export function ProvenancePopover({
  cik,
  provenance,
  children,
}: {
  cik: string;
  provenance: Provenance;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="¿De dónde sale este número?"
          className="hover:bg-gunmetal/60 focus-visible:ring-iris-blue -mx-1 rounded px-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-carbon-surface border-gunmetal w-80 p-4" align="end">
        <ProvenanceDetail cik={cik} provenance={provenance} />
      </PopoverContent>
    </Popover>
  );
}
