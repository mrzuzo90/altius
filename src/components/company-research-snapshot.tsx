import { BriefcaseBusiness, CircleHelp, Coins, ExternalLink, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import type { BusinessSnapshot, CompanyAttentionItem } from "@/lib/company-research";
import { cn } from "@/lib/utils";

export function CompanyResearchSnapshot({
  snapshot,
  attention,
}: {
  snapshot: BusinessSnapshot;
  attention: CompanyAttentionItem[];
}) {
  return (
    <section className="space-y-4">
      <article className="relative overflow-hidden rounded-[24px] border border-gunmetal bg-carbon-surface">
        <div className="pointer-events-none absolute -left-24 -top-32 size-72 rounded-full bg-periwinkle-glow/10 blur-3xl" />
        <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-gunmetal px-5 py-3.5">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-periwinkle-glow">El negocio en 30 segundos</p>
            <h2 className="mt-1 font-display text-[21px] font-medium tracking-tight text-pure-white">Qué hace y cómo gana dinero</h2>
          </div>
          <SourceLink snapshot={snapshot} />
        </header>

        <div className="relative grid gap-px bg-gunmetal md:grid-cols-2">
          <div className="bg-carbon-surface p-5">
            <div className="flex items-center gap-2 text-periwinkle-glow">
              <BriefcaseBusiness className="size-4" />
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">A qué se dedica</h3>
            </div>
            <p className="mt-3 text-[14px] leading-6 text-frost">{snapshot.activity}</p>
          </div>
          <div className="bg-carbon-surface p-5">
            <div className="flex items-center gap-2 text-emerald-300">
              <Coins className="size-4" />
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">Cómo gana dinero</h3>
            </div>
            <p className="mt-3 text-[14px] leading-6 text-frost">{snapshot.revenueModel}</p>
            <div className={`mt-4 rounded-xl border p-3 ${snapshot.profitEngine.status === "reported" ? "border-emerald-400/20 bg-emerald-400/[0.045]" : "border-gunmetal bg-void-black/45"}`}>
              <p className={`font-mono text-[8px] font-semibold uppercase tracking-[0.15em] ${snapshot.profitEngine.status === "reported" ? "text-emerald-300" : "text-muted-steel"}`}>
                {snapshot.profitEngine.status === "reported" ? "División que más beneficio aporta" : "Beneficio por divisiones"}
              </p>
              <p className="mt-1.5 font-display text-[15px] font-medium text-pure-white">{snapshot.profitEngine.title}</p>
              <p className="mt-1.5 text-[10px] leading-4 text-muted-steel">{snapshot.profitEngine.detail}</p>
            </div>
          </div>
        </div>

        {snapshot.regulatoryExcerpt ? (
          <details className="group border-t border-gunmetal bg-void-black/35 px-5 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-medium text-muted-steel marker:hidden hover:text-frost">
              <span>Ver el texto localizado en el informe anual</span>
              <span className="grid size-5 place-items-center rounded-full border border-gunmetal text-periwinkle-glow transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 max-w-5xl border-l-2 border-periwinkle-glow/40 pl-4 text-[11px] italic leading-5 text-muted-steel">
              {snapshot.regulatoryExcerpt}
            </p>
          </details>
        ) : (
          <p className="border-t border-gunmetal bg-void-black/35 px-5 py-3 text-[10px] leading-4 text-muted-steel">
            {snapshot.confidence === "regulatory"
              ? "Los productos y marcas se han comprobado en el informe anual, aunque el documento no ofrece un párrafo operativo limpio para mostrar como extracto."
              : "Síntesis basada en la clasificación regulatoria y los estados financieros; no se encontró un apartado operativo legible en el documento anual."}
          </p>
        )}
      </article>

      <div>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-periwinkle-glow">Lectura rápida</p>
            <h2 className="mt-1 font-display text-[23px] font-medium tracking-tight text-pure-white">Tres cosas que llaman la atención</h2>
          </div>
          <p className="hidden max-w-md text-right text-[10px] leading-4 text-muted-steel sm:block">
            Señales calculadas con los mismos datos y umbrales de Las seis claves; pueden ser fortalezas, dudas o riesgos.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {attention.map((item, index) => <AttentionCard key={item.id} item={item} index={index} />)}
        </div>
      </div>
    </section>
  );
}

function SourceLink({ snapshot }: { snapshot: BusinessSnapshot }) {
  const annualLabel = /^informe anual\b/i.test(snapshot.evidenceLabel)
    ? snapshot.evidenceLabel
    : `Informe anual · ${snapshot.evidenceLabel}`;
  const label = snapshot.confidence === "regulatory" ? annualLabel : `Clasificación · ${snapshot.evidenceLabel}`;
  if (!snapshot.evidenceUrl) return <span className="text-[10px] text-muted-steel">{label}</span>;
  return (
    <a href={snapshot.evidenceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-[10px] text-periwinkle-glow hover:underline">
      {label}
      <ExternalLink className="size-3" />
    </a>
  );
}

function AttentionCard({ item, index }: { item: CompanyAttentionItem; index: number }) {
  const tone = item.tone === "positive"
    ? { border: "border-emerald-400/25", wash: "bg-emerald-400/[0.045]", text: "text-emerald-300", Icon: ShieldCheck }
    : item.tone === "risk"
      ? { border: "border-rose-400/25", wash: "bg-rose-400/[0.045]", text: "text-rose-300", Icon: TriangleAlert }
      : item.tone === "watch"
        ? { border: "border-amber-400/25", wash: "bg-amber-400/[0.045]", text: "text-amber-300", Icon: Sparkles }
        : { border: "border-gunmetal", wash: "bg-carbon-surface", text: "text-muted-steel", Icon: CircleHelp };
  return (
    <article className={cn("relative min-h-[168px] overflow-hidden rounded-2xl border p-4", tone.border, tone.wash)}>
      <div className="flex items-start justify-between gap-3">
        <span className="font-display text-[25px] leading-none text-muted-steel/45">0{index + 1}</span>
        <tone.Icon className={cn("size-4", tone.text)} />
      </div>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-steel">{item.eyebrow}</p>
      <h3 className="mt-1.5 font-display text-[16px] font-medium leading-5 text-pure-white">{item.title}</h3>
      <p className={cn("mt-2 text-[11px] font-semibold", tone.text)}>{item.value}</p>
      <p className="mt-1.5 line-clamp-2 text-[10px] leading-[1.45] text-frost">{item.detail}</p>
    </article>
  );
}
