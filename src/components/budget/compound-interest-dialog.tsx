"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  Sparkles,
  Wallet,
  PiggyBank,
  RotateCcw,
  Calendar,
  Percent,
  Building2,
  Search,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  calculateCompoundInterest,
  generateCompoundInterestYearlySeries,
  calculateHistoricalCagr,
  type CompoundInterestYearPoint,
} from "@/lib/budget/calculations";
import {
  COMPOUND_INTEREST_PRESETS,
  type CompoundInterestPresetId,
  type HistoricalPricePoint,
  type HistoricalCagrResult,
} from "@/lib/budget/types";
import { CID_MASCOTS, characterPhaseForChange } from "@/components/statement-trend-animation";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(val);

const formatCompactCurrency = (val: number) => {
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} M €`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toLocaleString("es-ES", { maximumFractionDigits: 0 })} k €`;
  }
  return `${Math.round(val)} €`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const POPULAR_COMPANIES = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft" },
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "GOOGL", name: "Alphabet (Google)" },
  { ticker: "AMZN", name: "Amazon" },
  { ticker: "ITX.MC", name: "Inditex" },
  { ticker: "SAN.MC", name: "Banco Santander" },
  { ticker: "TSLA", name: "Tesla" },
];

export function CompoundInterestDialog({
  open,
  onOpenChange,
  initialMonthlyContribution = 500,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMonthlyContribution?: number;
}) {
  const [principal, setPrincipal] = useState<number>(1000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(initialMonthlyContribution);
  const [years, setYears] = useState<number>(20);
  const [selectedPresetId, setSelectedPresetId] = useState<CompoundInterestPresetId>("sp500");
  const [customRate, setCustomRate] = useState<number>(8.0);

  // Estado de Empresa Singular
  const [selectedCompany, setSelectedCompany] = useState<{ ticker: string; name: string } | null>({
    ticker: "AAPL",
    name: "Apple Inc.",
  });
  const [companyPrices, setCompanyPrices] = useState<HistoricalPricePoint[] | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(false);
  const [companyFetchError, setCompanyFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string; meta?: string }>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Sync monthlyContribution when initialMonthlyContribution changes or when dialog opens
  useEffect(() => {
    if (open) {
      setMonthlyContribution(initialMonthlyContribution);
    }
  }, [open, initialMonthlyContribution]);

  // Carga de precios históricos de la empresa seleccionada
  useEffect(() => {
    if (!selectedCompany?.ticker) return;
    let cancelled = false;
    setIsLoadingPrices(true);
    setCompanyFetchError(null);

    fetch(`/api/prices/${encodeURIComponent(selectedCompany.ticker)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("No se encontraron cotizaciones para este valor.");
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.ok && Array.isArray(data?.series?.points) && data.series.points.length > 0) {
          setCompanyPrices(data.series.points);
        } else {
          setCompanyFetchError("No hay suficientes datos de precios para este valor.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setCompanyFetchError(err?.message || "Error al consultar cotizaciones.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPrices(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCompany?.ticker]);

  // Búsqueda con retardo (debounce)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => {
          const list: Array<{ symbol: string; name: string; meta?: string }> = [];
          if (Array.isArray(data?.ranked)) {
            for (const item of data.ranked) {
              if (item.kind === "company") {
                list.push({ symbol: item.symbol, name: item.name, meta: item.meta });
              }
            }
          } else if (Array.isArray(data?.results)) {
            for (const item of data.results) {
              list.push({ symbol: item.ticker, name: item.name, meta: "SEC" });
            }
          }
          setSearchResults(list.slice(0, 8));
          setShowDropdown(true);
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cálculo del CAGR histórico dinámico según los años elegidos en el slider
  const companyCagrResult = useMemo(() => {
    if (!companyPrices || !selectedCompany) return null;
    return calculateHistoricalCagr(companyPrices, years, selectedCompany.ticker, selectedCompany.name);
  }, [companyPrices, selectedCompany, years]);

  const activeRatePct = useMemo(() => {
    if (selectedPresetId === "custom") return customRate;
    if (selectedPresetId === "company") {
      return companyCagrResult ? companyCagrResult.cagrPct : 10.0;
    }
    const found = COMPOUND_INTEREST_PRESETS.find((p) => p.id === selectedPresetId);
    return found?.ratePct ?? 10.0;
  }, [selectedPresetId, customRate, companyCagrResult]);

  const result = useMemo(() => {
    return calculateCompoundInterest(principal, monthlyContribution, years, activeRatePct);
  }, [principal, monthlyContribution, years, activeRatePct]);

  const series = useMemo(() => {
    return generateCompoundInterestYearlySeries(principal, monthlyContribution, years, activeRatePct);
  }, [principal, monthlyContribution, years, activeRatePct]);

  // Mascot for the annualized rate
  const phase = characterPhaseForChange(activeRatePct);
  const mascot = CID_MASCOTS[phase] ?? CID_MASCOTS.caballero;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-carbon-surface border-gunmetal p-0 sm:max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <DialogHeader className="border-gunmetal border-b px-6 py-4 flex flex-row items-center justify-between space-y-0 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <DialogTitle className="font-display text-pure-white text-[20px] sm:text-[22px] tracking-tight">
                Calculador de Interés Compuesto
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-steel text-[12px] mt-0.5">
              Simula el crecimiento exponencial de tu patrimonio a largo plazo con aportaciones periódicas.
            </DialogDescription>
          </div>

          {/* Badge Cid */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-periwinkle-glow/30 bg-periwinkle-glow/10 px-3 py-1 text-[11px] text-periwinkle-glow">
            <img src={mascot.src} alt="" className="size-5 object-contain" />
            <span className="font-medium">{mascot.label}</span>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {/* Hero Result Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-carbon-surface to-carbon-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={cn(
                  "font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5",
                  result.totalInterest >= 0 ? "text-emerald-400" : "text-amber-400"
                )}>
                  <Sparkles className="size-3.5" />
                  Capital Final Proyectado tras {years} años
                </p>
                <p className="tabular font-display text-pure-white text-[32px] sm:text-[42px] font-bold tracking-tight mt-1 leading-none">
                  {formatCurrency(result.futureValue)}
                </p>
                <p className="text-muted-steel text-[13px] mt-2">
                  {result.multiplier >= 1 ? (
                    <>
                      Multiplicas por{" "}
                      <span className="text-emerald-400 font-semibold font-mono">
                        {result.multiplier.toFixed(1)}x
                      </span>{" "}
                      el dinero aportado de tu bolsillo ({formatCurrency(result.totalContributed)}).
                    </>
                  ) : (
                    <>
                      Conservas el{" "}
                      <span className="text-rose-400 font-semibold font-mono">
                        {(result.multiplier * 100).toFixed(0)}%
                      </span>{" "}
                      del dinero aportado ({formatCurrency(result.totalContributed)}).
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-void-black/70 border border-gunmetal rounded-xl p-3 sm:px-5 sm:py-3">
                <img
                  src={mascot.src}
                  alt={mascot.label}
                  className="size-12 sm:size-14 object-contain shrink-0 filter drop-shadow-[0_2px_8px_rgba(52,211,153,0.3)]"
                />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-mono text-muted-steel">Rentabilidad Anual</p>
                  <p className={cn(
                    "font-display font-bold text-[20px] sm:text-[22px] leading-tight",
                    activeRatePct >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {activeRatePct >= 0 ? `+${activeRatePct.toFixed(1)}%` : `${activeRatePct.toFixed(1)}%`}
                  </p>
                  <p className="text-muted-steel text-[11px] leading-none mt-0.5">anual compuesto</p>
                </div>
              </div>
            </div>

            {/* Quick KPI pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gunmetal/60">
              <div className="flex items-center justify-between rounded-lg bg-void-black/40 px-3.5 py-2">
                <span className="text-muted-steel text-[12px] flex items-center gap-1.5">
                  <Wallet className="size-3.5 text-periwinkle-glow" />
                  Total aportado por ti:
                </span>
                <span className="font-mono text-[13px] font-semibold text-frost">
                  {formatCurrency(result.totalContributed)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-void-black/40 px-3.5 py-2">
                <span className="text-muted-steel text-[12px] flex items-center gap-1.5">
                  <TrendingUp className={cn("size-3.5", result.totalInterest >= 0 ? "text-emerald-400" : "text-rose-400")} />
                  {result.totalInterest >= 0 ? "Generado por intereses:" : "Pérdida por depreciación:"}
                </span>
                <span className={cn(
                  "font-mono text-[13px] font-semibold",
                  result.totalInterest >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {result.totalInterest >= 0 ? `+${formatCurrency(result.totalInterest)}` : formatCurrency(result.totalInterest)} ({result.interestPctOfTotal.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Inputs Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Aporte Inicial */}
            <div className="rounded-xl border border-gunmetal bg-void-black/50 p-4">
              <label className="text-muted-steel text-[11px] font-medium uppercase tracking-wider block">
                Aporte Inicial (Capital de partida)
              </label>
              <div className="relative mt-2">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={principal}
                  onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-lg border border-gunmetal bg-carbon-surface px-3 py-2 text-[15px] font-semibold text-pure-white focus:border-periwinkle-glow focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-muted-steel text-[13px]">€</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[0, 1000, 3000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPrincipal(val)}
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-mono transition-colors",
                      principal === val
                        ? "bg-periwinkle-glow/20 text-periwinkle-glow font-bold border border-periwinkle-glow/30"
                        : "bg-carbon-surface text-muted-steel hover:text-frost border border-gunmetal",
                    )}
                  >
                    {val === 0 ? "0" : `${val / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Aporte Mensual */}
            <div className="rounded-xl border border-gunmetal bg-void-black/50 p-4">
              <div className="flex items-center justify-between">
                <label className="text-muted-steel text-[11px] font-medium uppercase tracking-wider">
                  Aporte Mensual
                </label>
                <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Ahorro
                </span>
              </div>
              <div className="relative mt-2">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-lg border border-gunmetal bg-carbon-surface px-3 py-2 text-[15px] font-semibold text-pure-white focus:border-emerald-400 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-muted-steel text-[13px]">€/mes</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[100, 250, 500, 750, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMonthlyContribution(val)}
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-mono transition-colors",
                      monthlyContribution === val
                        ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30"
                        : "bg-carbon-surface text-muted-steel hover:text-frost border border-gunmetal",
                    )}
                  >
                    {val}€
                  </button>
                ))}
              </div>
            </div>

            {/* Plazo de Inversión */}
            <div className="rounded-xl border border-gunmetal bg-void-black/50 p-4">
              <div className="flex items-center justify-between">
                <label className="text-muted-steel text-[11px] font-medium uppercase tracking-wider">
                  Plazo de Inversión
                </label>
                <span className="text-[13px] font-mono font-bold text-pure-white">{years} años</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-periwinkle-glow cursor-pointer mt-3"
              />
              <div className="flex justify-between gap-1 mt-2">
                {[5, 10, 15, 20, 25, 30].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYears(y)}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors",
                      years === y
                        ? "bg-periwinkle-glow/20 text-periwinkle-glow font-bold border border-periwinkle-glow/30"
                        : "bg-carbon-surface text-muted-steel hover:text-frost border border-gunmetal",
                    )}
                  >
                    {y}a
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preajustes de Rentabilidad */}
          <div>
            <p className="text-muted-steel text-[11px] font-medium uppercase tracking-[0.12em] mb-2.5 flex items-center gap-1.5">
              <Percent className="size-3.5 text-periwinkle-glow" />
              Preajustes de Rentabilidad (Promedios Históricos)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {COMPOUND_INTEREST_PRESETS.map((preset) => {
                const active = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={cn(
                      "text-left rounded-xl border p-3 transition-all cursor-pointer flex flex-col justify-between",
                      active
                        ? "border-periwinkle-glow bg-periwinkle-glow/15 shadow-sm"
                        : "border-gunmetal bg-void-black/40 hover:border-muted-steel/60 hover:bg-void-black/70",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-display font-medium text-[13px] text-pure-white truncate">
                        {preset.name}
                      </span>
                      <span className="font-mono text-[12px] font-bold text-emerald-400 shrink-0">
                        {preset.ratePct.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-muted-steel text-[10px] mt-1 line-clamp-2 leading-tight">
                      {preset.description}
                    </p>
                  </button>
                );
              })}

              {/* Empresa Singular */}
              <button
                type="button"
                onClick={() => {
                  setSelectedPresetId("company");
                  if (!selectedCompany) {
                    setSelectedCompany({ ticker: "AAPL", name: "Apple Inc." });
                  }
                }}
                className={cn(
                  "text-left rounded-xl border p-3 transition-all cursor-pointer flex flex-col justify-between",
                  selectedPresetId === "company"
                    ? "border-amber-400 bg-amber-400/15 shadow-sm ring-1 ring-amber-400/30"
                    : "border-gunmetal bg-void-black/40 hover:border-muted-steel/60 hover:bg-void-black/70",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-display font-medium text-[13px] text-pure-white flex items-center gap-1.5 truncate">
                    <Building2 className="size-3.5 text-amber-400 shrink-0" />
                    Empresa Singular
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[12px] font-bold shrink-0",
                      selectedPresetId === "company" && companyCagrResult
                        ? companyCagrResult.cagrPct >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                        : "text-amber-400",
                    )}
                  >
                    {selectedPresetId === "company" && companyCagrResult
                      ? `${companyCagrResult.cagrPct >= 0 ? "+" : ""}${companyCagrResult.cagrPct.toFixed(1)}%`
                      : "Buscador"}
                  </span>
                </div>
                <p className="text-muted-steel text-[10px] mt-1 leading-tight line-clamp-2">
                  {selectedCompany
                    ? `${selectedCompany.ticker} · Histórico ${years}a`
                    : "Busca una acción cotizada"}
                </p>
              </button>

              {/* Personalizado */}
              <button
                type="button"
                onClick={() => setSelectedPresetId("custom")}
                className={cn(
                  "text-left rounded-xl border p-3 transition-all cursor-pointer flex flex-col justify-between",
                  selectedPresetId === "custom"
                    ? "border-periwinkle-glow bg-periwinkle-glow/15 shadow-sm"
                    : "border-gunmetal bg-void-black/40 hover:border-muted-steel/60 hover:bg-void-black/70",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-display font-medium text-[13px] text-pure-white">
                    Personalizado
                  </span>
                  <span className="font-mono text-[12px] font-bold text-periwinkle-glow shrink-0">
                    {customRate.toFixed(1)}%
                  </span>
                </div>
                <p className="text-muted-steel text-[10px] mt-1 leading-tight">
                  Ajusta la tasa anual libremente
                </p>
              </button>
            </div>

            {/* Custom slider if custom is selected */}
            {selectedPresetId === "custom" && (
              <div className="mt-3 rounded-xl border border-periwinkle-glow/40 bg-periwinkle-glow/10 p-3 flex items-center gap-4">
                <span className="text-[12px] text-frost whitespace-nowrap">Tasa Anual Manual:</span>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.1"
                  value={customRate}
                  onChange={(e) => setCustomRate(Number(e.target.value))}
                  className="w-full accent-periwinkle-glow cursor-pointer"
                />
                <span className="font-mono font-bold text-[14px] text-pure-white min-w-16 text-right">
                  {customRate.toFixed(1)} %
                </span>
              </div>
            )}

            {/* Panel de Empresa Singular */}
            {selectedPresetId === "company" && (
              <div className="mt-3 rounded-2xl border border-amber-500/30 bg-void-black/60 p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-amber-400" />
                    <span className="font-display font-semibold text-[14px] text-pure-white">
                      Buscador de Empresa Singular
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Histórico {years} años
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-steel">
                    El rendimiento se recalcula automáticamente según el plazo ({years} años)
                  </span>
                </div>

                {/* Buscador interactivo */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 size-4 text-muted-steel" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Buscar empresa por nombre o ticker (ej. Apple, AAPL, Microsoft, Inditex...)"
                      className="w-full rounded-xl border border-gunmetal bg-carbon-surface pl-9 pr-9 py-2.5 text-[13px] text-pure-white placeholder:text-muted-steel/60 focus:border-amber-400 focus:outline-none transition-colors"
                    />
                    {isSearching ? (
                      <Loader2 className="absolute right-3 size-4 animate-spin text-amber-400" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setShowDropdown(false);
                        }}
                        className="absolute right-3 text-muted-steel hover:text-frost"
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </div>

                  {/* Resultados desplegables */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-gunmetal bg-void-black/95 backdrop-blur-md shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                      {searchResults.map((item) => (
                        <button
                          key={item.symbol}
                          type="button"
                          onClick={() => {
                            setSelectedCompany({ ticker: item.symbol, name: item.name });
                            setSearchQuery("");
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-carbon-surface/80 flex items-center justify-between border-b border-gunmetal/40 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-[12px] font-bold text-amber-400 shrink-0">
                              {item.symbol}
                            </span>
                            <span className="text-[13px] text-pure-white truncate">{item.name}</span>
                          </div>
                          {item.meta && (
                            <span className="text-[10px] text-muted-steel shrink-0 ml-2">
                              {item.meta}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Píldoras de empresas populares */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono text-muted-steel mr-1">
                    Sugerencias:
                  </span>
                  {POPULAR_COMPANIES.map((comp) => {
                    const isSelected = selectedCompany?.ticker.toUpperCase() === comp.ticker.toUpperCase();
                    return (
                      <button
                        key={comp.ticker}
                        type="button"
                        onClick={() => {
                          setSelectedCompany(comp);
                          setSearchQuery("");
                          setShowDropdown(false);
                        }}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[11px] font-mono transition-colors border",
                          isSelected
                            ? "bg-amber-400/20 text-amber-300 font-bold border-amber-400/40"
                            : "bg-carbon-surface text-muted-steel hover:text-frost hover:border-muted-steel/60 border-gunmetal",
                        )}
                      >
                        {comp.ticker}
                      </button>
                    );
                  })}
                </div>

                {/* Tarjeta de Detalle / Estado */}
                {isLoadingPrices ? (
                  <div className="rounded-xl border border-gunmetal bg-carbon-surface/60 p-4 flex items-center justify-center gap-3">
                    <Loader2 className="size-4 animate-spin text-amber-400" />
                    <span className="text-[12px] text-muted-steel">
                      Consultando cotizaciones históricas de {selectedCompany?.name ?? "la empresa"}...
                    </span>
                  </div>
                ) : companyFetchError ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-[12px] text-rose-300 flex items-center justify-between">
                    <span>{companyFetchError}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCompany) {
                          setSelectedCompany({ ...selectedCompany });
                        }
                      }}
                      className="underline text-[11px] ml-3 hover:text-white"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : companyCagrResult ? (
                  <div className="rounded-xl border border-amber-500/25 bg-carbon-surface/60 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gunmetal/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 font-mono text-[12px] font-bold text-amber-300">
                          {companyCagrResult.ticker}
                        </span>
                        <span className="font-display font-semibold text-[14px] text-pure-white">
                          {companyCagrResult.companyName}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono text-muted-steel block">
                          Rentabilidad Anualizada ({companyCagrResult.actualYears} años)
                        </span>
                        <span
                          className={cn(
                            "font-display font-bold text-[18px] sm:text-[20px]",
                            companyCagrResult.cagrPct >= 0 ? "text-emerald-400" : "text-rose-400",
                          )}
                        >
                          {companyCagrResult.cagrPct >= 0
                            ? `+${companyCagrResult.cagrPct.toFixed(1)}%`
                            : `${companyCagrResult.cagrPct.toFixed(1)}%`}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded-lg bg-void-black/50 p-2 border border-gunmetal/40">
                        <span className="text-muted-steel block">Cotización inicial:</span>
                        <span className="font-mono font-semibold text-frost">
                          {formatCurrency(companyCagrResult.startPrice)}
                        </span>
                        <span className="text-muted-steel text-[10px] block mt-0.5">
                          ({formatDate(companyCagrResult.startDate)})
                        </span>
                      </div>

                      <div className="rounded-lg bg-void-black/50 p-2 border border-gunmetal/40">
                        <span className="text-muted-steel block">Cotización final:</span>
                        <span className="font-mono font-semibold text-frost">
                          {formatCurrency(companyCagrResult.endPrice)}
                        </span>
                        <span className="text-muted-steel text-[10px] block mt-0.5">
                          ({formatDate(companyCagrResult.endDate)})
                        </span>
                      </div>

                      <div className="rounded-lg bg-void-black/50 p-2 border border-gunmetal/40">
                        <span className="text-muted-steel block">Retorno acumulado total:</span>
                        <span
                          className={cn(
                            "font-mono font-semibold",
                            companyCagrResult.totalReturnPct >= 0 ? "text-emerald-400" : "text-rose-400",
                          )}
                        >
                          {companyCagrResult.totalReturnPct >= 0
                            ? `+${companyCagrResult.totalReturnPct.toFixed(1)}%`
                            : `${companyCagrResult.totalReturnPct.toFixed(1)}%`}
                        </span>
                        <span className="text-muted-steel text-[10px] block mt-0.5">
                          en {companyCagrResult.actualYears} años
                        </span>
                      </div>
                    </div>

                    {!companyCagrResult.hasEnoughHistory && (
                      <p className="text-[11px] text-amber-400/90 bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
                        ℹ️ Esta empresa cuenta con {companyCagrResult.actualYears} años de cotización disponible (desde {formatDate(companyCagrResult.startDate)}). Se ha calculado la rentabilidad anualizada con todo el histórico disponible para proyectar el plazo seleccionado de {years} años.
                      </p>
                    )}
                  </div>
                ) : null}

                {/* Disclaimer Obligatorio */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3">
                  <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-muted-steel leading-relaxed space-y-0.5">
                    <p className="font-semibold text-amber-300">
                      Aviso Legal Importante: Rentabilidades pasadas no garantizan rendimientos futuros.
                    </p>
                    <p className="text-muted-steel/90">
                      La rentabilidad calculada refleja el comportamiento histórico de{" "}
                      <strong className="text-frost">
                        {selectedCompany?.name ?? "la acción"} ({selectedCompany?.ticker})
                      </strong>{" "}
                      durante los años analizados. La inversión en acciones individuales conlleva un nivel de volatilidad y riesgo de pérdida de capital sustancialmente superior al de fondos indexados o cestas diversificadas. Simulación con fines didácticos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Chart */}
          <div className="rounded-2xl border border-gunmetal bg-void-black/60 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-display text-[15px] font-semibold text-pure-white">
                  Evolución del Patrimonio en el Tiempo
                </p>
                <p className="text-muted-steel text-[11px]">
                  Observa cómo la curva de intereses supera progresivamente a las aportaciones del bolsillo.
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-muted-steel">
                  <span className="size-2.5 rounded-sm bg-sky-400" />
                  Total aportado
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <span className="size-2.5 rounded-sm bg-emerald-400" />
                  Intereses generados
                </span>
              </div>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="grad-contributed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="grad-interest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#1f2433" strokeDasharray="3 4" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#646e87" }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(series.length / 7))}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#646e87" }}
                    tickLine={false}
                    axisLine={false}
                    width={65}
                    tickFormatter={(val: number) => formatCompactCurrency(val)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const pt = payload[0].payload as CompoundInterestYearPoint;
                      return (
                        <div className="rounded-xl border border-gunmetal bg-void-black/95 p-3 shadow-2xl backdrop-blur-md min-w-[200px] text-left">
                          <p className="font-mono text-[12px] font-bold text-frost border-b border-gunmetal/80 pb-1 mb-2">
                            {pt.label}
                          </p>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-muted-steel">Capital acumulado:</span>
                              <span className="font-mono font-bold text-pure-white">
                                {formatCurrency(pt.totalAccumulated)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sky-400">Total aportado:</span>
                              <span className="font-mono font-semibold text-frost">
                                {formatCurrency(pt.totalContributed)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-400">Intereses ganados:</span>
                              <span className="font-mono font-semibold text-emerald-400">
                                +{formatCurrency(pt.totalInterest)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalContributed"
                    stackId="1"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    fill="url(#grad-contributed)"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalInterest"
                    stackId="1"
                    stroke="#34d399"
                    strokeWidth={1.5}
                    fill="url(#grad-interest)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
