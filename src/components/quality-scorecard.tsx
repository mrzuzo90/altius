"use client";

import { Check, CircleHelp, X } from "lucide-react";
import type {
  QualityItemStatus,
  QualityScorecardResult,
} from "@/lib/sec/quality";

const METHODOLOGY_LINKS = [
  { label: "CFA Institute", href: "https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation" },
  { label: "Damodaran", href: "https://pages.stern.nyu.edu/adamodar/New_Home_Page/littlebook/growthrates.htm" },
  { label: "Berkshire", href: "https://www.berkshirehathaway.com/letters/2014ltr.pdf" },
  { label: "Everything Money", href: "https://www.everythingmoney.com/blog/the-real-value-of-everything-money-13" },
  { label: "McKinsey", href: "https://www.mckinsey.com/featured-insights/mckinsey-explainers/how-are-companies-valued" },
  { label: "Foro ValueInvesting", href: "https://www.reddit.com/r/ValueInvesting/comments/odwz7s" },
] as const;

const KEY_MEANINGS: Record<string, string> = {
  growth: "Comprueba que ventas y beneficio por acción crezcan juntos durante varios años.",
  returns: "Mide cuánto beneficio genera la empresa con el capital que necesita para operar.",
  cashQuality: "Verifica que el beneficio contable termine convirtiéndose en caja real.",
  balance: "Evalúa si la deuda y la liquidez permiten resistir años difíciles.",
  perShare: "Comprueba que el crecimiento no se pierda al emitir demasiadas acciones.",
  valuation: "Compara el PER actual con la valoración habitual de la propia empresa.",
};

export function QualityScorecard({ scorecard }: { scorecard: QualityScorecardResult }) {
  const missing = scorecard.maxScore - scorecard.coverage;
  const summary = scorecard.coverage === 0
    ? "No hay datos comparables suficientes para evaluar las claves."
    : `${scorecard.score} de ${scorecard.maxScore} claves cumplen el criterio cuantitativo.${missing > 0 ? ` ${missing === 1 ? "Falta 1 clave" : `Faltan ${missing} claves`} por datos no comparables.` : " Las seis claves tienen datos comparables."}`;

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-gunmetal bg-carbon-surface shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
      <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-periwinkle-glow/10 blur-3xl" />
      <div className="relative grid gap-3 border-b border-gunmetal p-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-4 sm:py-3">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-periwinkle-glow/30 bg-periwinkle-glow/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-periwinkle-glow">
              Análisis fundamental
            </span>
            <span className="rounded-full border border-gunmetal bg-void-black/60 px-3 py-1 text-[10px] text-muted-steel">
              Cobertura {scorecard.coverage}/6
            </span>
            <details className="group/method relative z-30">
              <summary className="cursor-pointer list-none rounded-full border border-gunmetal bg-void-black/60 px-3 py-1 text-[10px] text-frost marker:hidden hover:border-periwinkle-glow/40">
                Cómo se calcula <span className="ml-1 inline-block text-periwinkle-glow transition group-open/method:rotate-45">+</span>
              </summary>
              <div className="absolute left-0 top-8 w-[min(620px,calc(100vw-4rem))] rounded-2xl border border-gunmetal bg-[#11131d]/98 p-4 text-[11px] leading-[1.55] text-muted-steel shadow-2xl">
                <p>
                  <span className="font-medium text-frost">{scorecard.methodologyLabel}.</span>{" "}
                  El análisis compara tendencias de varios ejercicios en crecimiento, retorno sobre capital, caja, balance,
                  disciplina por acción y valoración. Un dato ausente se identifica como tal y nunca se inventa.
                </p>
                <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  {METHODOLOGY_LINKS.map((source) => (
                    <a key={source.label} href={source.href} target="_blank" rel="noreferrer noopener" className="text-periwinkle-glow hover:underline">
                      {source.label}
                    </a>
                  ))}
                </p>
              </div>
            </details>
          </div>
          <h2 className="mt-2 font-display text-[25px] font-medium leading-none tracking-[-0.04em] text-pure-white sm:text-[27px]">
            Las seis claves
          </h2>
          <p className="mt-1.5 max-w-3xl text-[11px] leading-[1.4] text-frost">
            {summary}
          </p>
        </div>

        <div className="flex items-center sm:justify-end">
          <div className="min-w-24">
            <div className="flex items-end gap-1 font-display tabular-nums text-pure-white">
              <span className="text-[46px] font-medium leading-[0.85] tracking-[-0.06em]">{scorecard.score}</span>
              <span className="pb-1 text-[19px] text-muted-steel">/6</span>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-muted-steel">Criterios cumplidos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gunmetal">
        {scorecard.items.map((item, index) => (
          <CheckCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

function CheckCard({
  item,
  index,
}: {
  item: QualityScorecardResult["items"][number];
  index: number;
}) {
  return (
    <article className="group relative flex min-h-[170px] flex-col bg-carbon-surface p-3.5 sm:p-4 transition-colors hover:bg-[#1b1e2b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[22px] leading-none text-periwinkle-glow/70">{String(index + 1).padStart(2, "0")}</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-steel">{item.category}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-2.5">
        <h3 className="font-display text-[15px] sm:text-[16px] font-medium leading-5 tracking-tight text-pure-white">{item.name}</h3>
        <p className="mt-1.5 text-[10px] sm:text-[11px] leading-[1.45] text-frost">{KEY_MEANINGS[item.id] ?? item.whyItMatters}</p>
        <p className="mt-2 text-[12px] font-semibold leading-4 text-periwinkle-glow">{item.valueFormatted}</p>
      </div>

      <details className="group/detail mt-auto pt-2">
        <summary className="flex cursor-pointer list-none items-center justify-between border-t border-gunmetal/75 pt-2 text-[10px] sm:text-[11px] font-medium text-muted-steel marker:hidden hover:text-frost">
          <span>{item.status === "pass" ? "Por qué pasa" : "Qué ocurre"}</span>
          <span className="grid size-5 place-items-center rounded-full border border-gunmetal text-periwinkle-glow transition-transform group-open/detail:rotate-45">+</span>
        </summary>
        <div className="mt-2 rounded-lg border border-gunmetal/70 bg-void-black/55 p-2.5">
          <p className="text-[10px] sm:text-[11px] leading-4 text-frost">{item.description}</p>
          <p className="mt-2 text-[10px] sm:text-[11px] font-semibold leading-4 text-frost">{item.threshold}</p>
          <p className="mt-1 text-[10px] sm:text-[11px] leading-4 text-muted-steel">{item.whyItMatters}</p>
        </div>
      </details>
    </article>
  );
}

function StatusBadge({ status }: { status: QualityItemStatus }) {
  if (status === "pass") {
    return (
      <span
        className="grid size-7 sm:size-8 place-items-center rounded-full border border-emerald-400/35 bg-emerald-400/15 text-emerald-400 shadow-xs shadow-emerald-500/10 transition-transform group-hover:scale-105"
        title="Cumple el requisito"
        aria-label="Cumple el requisito"
      >
        <Check className="size-4 sm:size-4.5 stroke-[2.75]" />
      </span>
    );
  }
  if (status === "warn") {
    return (
      <span
        className="grid size-7 sm:size-8 place-items-center rounded-full border border-amber-400/35 bg-amber-400/15 text-amber-400 shadow-xs shadow-amber-500/10 transition-transform group-hover:scale-105"
        title="En vigilancia"
        aria-label="En vigilancia"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 sm:size-4.5"
          aria-hidden="true"
        >
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </span>
    );
  }
  if (status === "fail") {
    return (
      <span
        className="grid size-7 sm:size-8 place-items-center rounded-full border border-rose-400/35 bg-rose-400/15 text-rose-400 shadow-xs shadow-rose-500/10 transition-transform group-hover:scale-105"
        title="No cumple el requisito"
        aria-label="No cumple el requisito"
      >
        <X className="size-4 sm:size-4.5 stroke-[2.75]" />
      </span>
    );
  }
  return (
    <span
      className="grid size-7 sm:size-8 place-items-center rounded-full border border-gunmetal/70 bg-void-black/60 text-muted-steel"
      title="Sin dato comparable"
      aria-label="Sin dato comparable"
    >
      <CircleHelp className="size-4 sm:size-4.5" />
    </span>
  );
}
