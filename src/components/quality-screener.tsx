"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  LoaderCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import type {
  QualityScreenerBatch,
  QualityScreenerCompany,
  QualityScreenerKey,
} from "@/lib/quality-screener";
import type { QualityItemStatus } from "@/lib/sec/quality";

const KEY_FILTERS = [
  { id: "all", label: "Cualquier clave" },
  { id: "growth", label: "Crecimiento" },
  { id: "returns", label: "Rentabilidad" },
  { id: "cashQuality", label: "Caja/beneficio" },
  { id: "balance", label: "Balance" },
  { id: "perShare", label: "Por acción" },
  { id: "valuation", label: "Valoración" },
] as const;

const KEY_COLUMNS = [
  { id: "growth", short: "Crec.", title: "Crecimiento duradero" },
  { id: "returns", short: "ROIC", title: "Rentabilidad del capital" },
  { id: "cashQuality", short: "Caja", title: "Calidad del beneficio y caja" },
  { id: "balance", short: "Balance", title: "Balance resistente" },
  { id: "perShare", short: "Acción", title: "Disciplina por acción" },
  { id: "valuation", short: "PER", title: "Precio con margen" },
] as const;

export function QualityScreener() {
  const [companies, setCompanies] = useState<QualityScreenerCompany[]>([]);
  const [total, setTotal] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [minimumScore, setMinimumScore] = useState("all");
  const [requiredKey, setRequiredKey] = useState("all");
  const [region, setRegion] = useState("all");
  const [fullCoverage, setFullCoverage] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadUniverse() {
      let offset: number | null = 0;
      while (offset !== null && active) {
        const response = await fetch(`/api/companies/quality?offset=${offset}&limit=10`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`El motor respondió ${response.status}`);
        const batch = await response.json() as QualityScreenerBatch;
        if (!active) return;
        setTotal(batch.total);
        setCompanies((current) => {
          const merged = new Map(current.map((company) => [company.ticker, company]));
          batch.items.forEach((company) => merged.set(company.ticker, company));
          return [...merged.values()];
        });
        offset = batch.nextOffset;
      }
    }

    loadUniverse()
      .catch((cause) => {
        if (active && cause instanceof Error && cause.name !== "AbortError") {
          setError("La carga se ha detenido. Los resultados ya calculados siguen disponibles.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const sorted = useMemo(() => [...companies].sort((a, b) => {
    if (a.score === null) return b.score === null ? a.name.localeCompare(b.name) : 1;
    if (b.score === null) return -1;
    return b.score - a.score || b.coverage - a.coverage || a.name.localeCompare(b.name);
  }), [companies]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    const minimum = minimumScore === "all" ? null : Number(minimumScore);
    return sorted.filter((company) => {
      if (normalizedQuery && !`${company.ticker} ${company.name} ${company.sector} ${company.country}`.toLocaleLowerCase("es").includes(normalizedQuery)) return false;
      if (minimum !== null && (company.score === null || company.score < minimum)) return false;
      if (region !== "all" && company.region !== region) return false;
      if (fullCoverage && company.coverage < 6) return false;
      if (requiredKey !== "all" && company.keys.find((key) => key.id === requiredKey)?.status !== "pass") return false;
      return true;
    });
  }, [fullCoverage, minimumScore, query, region, requiredKey, sorted]);

  const available = companies.filter((company) => company.analysisStatus === "available").length;
  const progress = total > 0 ? (companies.length / total) * 100 : 0;
  const retry = () => {
    setCompanies([]);
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  };

  return (
    <section className="overflow-hidden rounded-[26px] border border-gunmetal bg-carbon-surface shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
      <div className="border-b border-gunmetal p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-periwinkle-glow/30 bg-periwinkle-glow/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-periwinkle-glow">
              <span className="size-1.5 rounded-full bg-periwinkle-glow" />
              Universo fundamental global
            </div>
            <h2 className="mt-3 font-display text-[30px] font-medium tracking-[-0.04em] text-pure-white sm:text-[38px]">
              Comparador por las seis claves
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-5 text-frost">
              Hasta 100 grandes cotizadas ordenadas por las mismas seis claves del perfil. Puedes exigir una puntuación,
              una clave concreta o cobertura completa.
            </p>
          </div>
          <div className="min-w-44 rounded-2xl border border-gunmetal bg-void-black/60 p-4">
            <div className="flex items-end justify-between gap-4">
              <span className="font-display text-[28px] leading-none text-pure-white">{companies.length}<span className="text-[15px] text-muted-steel">/{total}</span></span>
              {loading ? <LoaderCircle className="size-4 animate-spin text-periwinkle-glow" /> : <CheckCircle2 className="size-4 text-emerald-400" />}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gunmetal">
              <div className="h-full rounded-full bg-periwinkle-glow transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-[10px] text-muted-steel">{available} con análisis disponible</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto_auto]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-steel" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar empresa, ticker, país o sector"
              className="h-10 w-full rounded-xl border border-gunmetal bg-void-black pl-10 pr-3 text-[12px] text-pure-white outline-none placeholder:text-muted-steel focus:border-periwinkle-glow/60"
            />
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gunmetal bg-void-black px-3">
            <SlidersHorizontal className="size-3.5 text-muted-steel" />
            <select value={minimumScore} onChange={(event) => setMinimumScore(event.target.value)} className="h-9 bg-transparent text-[11px] text-frost outline-none">
              <option value="all">Cualquier puntuación</option>
              <option value="3">3 o más claves</option>
              <option value="4">4 o más claves</option>
              <option value="5">5 o más claves</option>
              <option value="6">Solo 6/6</option>
            </select>
          </div>
          <select value={region} onChange={(event) => setRegion(event.target.value)} className="h-10 rounded-xl border border-gunmetal bg-void-black px-3 text-[11px] text-frost outline-none">
            <option value="all">Todas las regiones</option>
            <option value="Estados Unidos">Estados Unidos</option>
            <option value="Europa">Europa</option>
            <option value="Canadá">Canadá</option>
            <option value="Australia/global">Australia/global</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {KEY_FILTERS.map((key) => (
            <button
              key={key.id}
              type="button"
              onClick={() => setRequiredKey(key.id)}
              className={`rounded-full border px-3 py-1 text-[10px] font-medium transition-colors ${requiredKey === key.id ? "border-periwinkle-glow/50 bg-periwinkle-glow/15 text-periwinkle-glow" : "border-gunmetal bg-void-black text-muted-steel hover:text-frost"}`}
            >
              {key.label}
            </button>
          ))}
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[10px] text-muted-steel">
            <input type="checkbox" checked={fullCoverage} onChange={(event) => setFullCoverage(event.target.checked)} className="accent-[#98a4f7]" />
            Solo cobertura 6/6
          </label>
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-4 border-b border-amber-800/50 bg-amber-950/20 px-5 py-3 text-[11px] text-amber-200">
          <span>{error}</span>
          <button type="button" onClick={retry} className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/50 px-3 py-1 hover:bg-amber-900/30">
            <RotateCcw className="size-3" /> Reintentar
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left tabular-nums">
          <thead>
            <tr className="border-b border-gunmetal bg-void-black/55 font-mono text-[9px] uppercase tracking-wider text-muted-steel">
              <th className="min-w-56 px-3 py-3 font-medium">Empresa</th>
              <th className="min-w-28 px-3 py-3 font-medium">Región</th>
              {KEY_COLUMNS.map((key) => <th key={key.id} title={key.title} className="w-16 px-2 py-3 text-center font-medium">{key.short}</th>)}
              <th className="w-20 px-3 py-3 text-center font-medium">Claves</th>
              <th className="w-20 px-4 py-3 text-right font-medium">Perfil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gunmetal/45">
            {filtered.map((company) => (
              <tr key={company.ticker} className="group hover:bg-gunmetal/25">
                <td className="px-3 py-3">
                  <Link href={`/ticker/${company.ticker}`} className="font-display text-[13px] font-medium text-pure-white hover:text-periwinkle-glow">{company.name}</Link>
                  <p className="mt-0.5 max-w-56 truncate text-[10px] text-muted-steel"><span className="font-mono text-periwinkle-glow">{company.ticker}</span> · {company.sector}</p>
                </td>
                <td className="px-3 py-3 text-[10px] text-frost"><span className="block">{company.region}</span><span className="text-muted-steel">{company.country}</span></td>
                {KEY_COLUMNS.map((column) => <KeyCell key={column.id} item={company.keys.find((key) => key.id === column.id)} />)}
                <td className="px-3 py-3 text-center">
                  {company.score === null ? <span className="text-muted-steel">—</span> : <span className="font-display text-[18px] font-semibold text-pure-white">{company.score}<span className="text-[11px] font-normal text-muted-steel">/6</span></span>}
                  <p className="text-[9px] text-muted-steel">datos {company.coverage}/6</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/ticker/${company.ticker}`} aria-label={`Abrir perfil de ${company.name}`} className="inline-flex size-7 items-center justify-center rounded-full border border-gunmetal bg-void-black text-muted-steel transition-colors group-hover:text-periwinkle-glow">
                    <ArrowRight className="size-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-14 text-center text-[12px] text-muted-steel">
          {loading ? "Calculando este tramo del universo…" : "Ninguna empresa cargada cumple todos los filtros seleccionados."}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gunmetal bg-void-black/35 px-5 py-3 text-[10px] text-muted-steel">
        <span>{filtered.length} resultados visibles · ordenados por claves superadas y cobertura</span>
        <span>Resultados cuantitativos basados en datos comparables.</span>
      </div>
    </section>
  );
}

function KeyCell({ item }: { item: QualityScreenerKey | undefined }) {
  const status: QualityItemStatus = item?.status ?? "unknown";
  return (
    <td className="px-2 py-3 text-center" title={item ? `${item.name}: ${item.value}` : "Sin dato comparable"}>
      <StatusIcon status={status} />
    </td>
  );
}

function StatusIcon({ status }: { status: QualityItemStatus }) {
  if (status === "pass") return <span className="mx-auto grid size-6 place-items-center rounded-full bg-emerald-400/10 text-emerald-400"><CheckCircle2 className="size-3.5" /></span>;
  if (status === "warn") return <span className="mx-auto grid size-6 place-items-center rounded-full bg-amber-400/10 text-amber-400"><AlertCircle className="size-3.5" /></span>;
  if (status === "fail") return <span className="mx-auto grid size-6 place-items-center rounded-full bg-rose-400/10 text-rose-400"><XCircle className="size-3.5" /></span>;
  return <span className="mx-auto grid size-6 place-items-center rounded-full bg-muted-steel/10 text-muted-steel"><CircleHelp className="size-3.5" /></span>;
}
