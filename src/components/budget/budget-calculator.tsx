"use client";

import { useMemo, useState } from "react";
import {
  Home,
  PiggyBank,
  Utensils,
  Smile,
  Zap,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import {
  calculateBudgetBreakdown,
  type BudgetBreakdownItem,
} from "@/lib/budget/calculations";
import {
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_ORDER,
  type BudgetCategoryId,
} from "@/lib/budget/types";
import { CompoundInterestDialog } from "./compound-interest-dialog";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(val);

const formatExactCurrency = (val: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

const CATEGORY_ICONS: Record<BudgetCategoryId, React.ComponentType<{ className?: string }>> = {
  vivienda: Home,
  ahorro: PiggyBank,
  comida: Utensils,
  ocio: Smile,
  suministros: Zap,
  otros: HelpCircle,
};

export function BudgetCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(2500);
  const [customPcts, setCustomPcts] = useState<Partial<Record<BudgetCategoryId, number>>>({});
  const [isCompoundDialogOpen, setIsCompoundDialogOpen] = useState<boolean>(false);

  const breakdown = useMemo(() => {
    return calculateBudgetBreakdown(monthlyIncome, customPcts);
  }, [monthlyIncome, customPcts]);

  const handlePctChange = (id: BudgetCategoryId, value: number) => {
    setCustomPcts((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(100, Math.round(value))),
    }));
  };

  const handleResetSingle = (id: BudgetCategoryId) => {
    setCustomPcts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleResetAll = () => {
    setCustomPcts({});
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-gunmetal bg-carbon-surface p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-periwinkle-glow/40 bg-periwinkle-glow/10 px-3.5 py-1 text-[12px] font-medium text-periwinkle-glow mb-3">
              <Sparkles className="size-3.5" />
              <span>Regla Económica Recomendada de Gestión Financiera</span>
            </div>
            <h1 className="font-display text-pure-white text-[28px] sm:text-[36px] font-bold tracking-tight leading-tight">
              Calculador de Presupuesto Personal
            </h1>
            <p className="text-muted-steel text-[14px] sm:text-[15px] mt-2 leading-relaxed">
              Introduce tus ingresos mensuales para desglosar automáticamente tus gastos e inversión según las proporciones recomendadas. Puedes ajustar cada porcentaje libremente.
            </p>
          </div>

          {/* Quick CTA to Compound Interest */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
            <button
              type="button"
              onClick={() => setIsCompoundDialogOpen(true)}
              className="btn-primary-gradient font-display flex items-center gap-2.5 px-5 py-3 text-[14px] leading-none shadow-lg cursor-pointer"
            >
              <TrendingUp className="size-4" />
              <span>Simular Interés Compuesto</span>
              <ArrowRight className="size-4" />
            </button>
            <p className="text-[12px] text-muted-steel">
              Ahorro actual: <span className="font-mono font-bold text-emerald-400">{formatCurrency(breakdown.savingItem.amount)}/mes</span>
            </p>
          </div>
        </div>
      </div>

      {/* Income Input Card */}
      <div className="rounded-2xl border border-gunmetal bg-carbon-surface p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <label htmlFor="monthly-income" className="font-display text-[16px] font-semibold text-pure-white flex items-center gap-2">
              <Wallet className="size-4 text-periwinkle-glow" />
              Ingresos Mensuales Totales (100%)
            </label>
            <p className="text-muted-steel text-[13px]">
              Sueldo neto mensual tras impuestos o ingresos regulares de tu unidad familiar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <input
                id="monthly-income"
                type="number"
                min="0"
                step="50"
                value={monthlyIncome || ""}
                onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value) || 0))}
                placeholder="2500"
                className="w-full rounded-xl border border-gunmetal bg-void-black px-4 py-2.5 text-[20px] font-bold font-mono text-pure-white focus:border-periwinkle-glow focus:outline-none transition-colors"
              />
              <span className="absolute right-4 top-3 text-muted-steel font-bold text-[16px]">€ / mes</span>
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[1500, 2000, 2500, 3000, 4000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMonthlyIncome(val)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[12px] font-mono transition-colors cursor-pointer",
                    monthlyIncome === val
                      ? "border border-periwinkle-glow bg-periwinkle-glow/20 text-periwinkle-glow font-bold"
                      : "border border-gunmetal bg-void-black text-muted-steel hover:text-frost",
                  )}
                >
                  {formatCurrency(val)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Allocation Status Bar */}
        <div className="mt-6 pt-6 border-t border-gunmetal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {breakdown.isBalanced ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[12px] font-semibold text-emerald-400">
                <CheckCircle2 className="size-4" />
                <span>100% Asignado · Presupuesto equilibrado</span>
              </div>
            ) : breakdown.remainingPct > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[12px] font-semibold text-sky-400">
                <AlertCircle className="size-4" />
                <span>
                  {breakdown.totalPct}% asignado · Resta un {breakdown.remainingPct}% ({formatCurrency(breakdown.remainingAmount)}) por asignar
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[12px] font-semibold text-rose-400">
                <AlertCircle className="size-4" />
                <span>
                  {breakdown.totalPct}% asignado · Sobrepasa un {Math.abs(breakdown.remainingPct)}% ({formatCurrency(Math.abs(breakdown.remainingAmount))})
                </span>
              </div>
            )}

            <span className="text-[12px] text-muted-steel hidden md:inline">
              Ingreso anual: <span className="font-mono text-frost font-medium">{formatCurrency(breakdown.annualIncome)}/año</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetAll}
            className="text-[12px] text-muted-steel hover:text-frost flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Restablecer porcentajes recomendados</span>
          </button>
        </div>

        {/* Visual Stacked Progress Bar */}
        <div className="mt-4 h-3 w-full rounded-full bg-void-black overflow-hidden flex">
          {breakdown.items.map((item) => (
            <div
              key={item.config.id}
              style={{
                width: `${breakdown.totalPct > 0 ? (item.pct / Math.max(100, breakdown.totalPct)) * 100 : 0}%`,
                backgroundColor: item.config.color,
              }}
              title={`${item.config.label}: ${item.pct}% (${formatCurrency(item.amount)})`}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            />
          ))}
        </div>
      </div>

      {/* 6 Budget Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {breakdown.items.map((item) => {
          const IconComponent = CATEGORY_ICONS[item.config.id];
          const isSaving = item.config.id === "ahorro";

          return (
            <div
              key={item.config.id}
              className={cn(
                "rounded-2xl border p-5 flex flex-col justify-between transition-all bg-carbon-surface",
                isSaving
                  ? "border-emerald-500/50 shadow-[0_0_20px_rgba(52,211,153,0.08)] bg-gradient-to-b from-emerald-500/5 to-carbon-surface"
                  : "border-gunmetal hover:border-gunmetal/80",
              )}
            >
              <div>
                {/* Header of category card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${item.config.color}15`,
                        borderColor: `${item.config.color}35`,
                        color: item.config.color,
                      }}
                    >
                      <IconComponent className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="font-display text-[15px] font-semibold text-pure-white leading-tight">
                        {item.config.label}
                      </h3>
                      <p className="text-muted-steel text-[11px] leading-none mt-0.5">
                        {item.config.examples}
                      </p>
                    </div>
                  </div>

                  {/* Percentage Pill */}
                  <div className="text-right">
                    <span
                      className="font-mono text-[16px] font-bold block"
                      style={{ color: item.config.color }}
                    >
                      {item.pct}%
                    </span>
                    {!item.isDefaultPct && (
                      <button
                        type="button"
                        onClick={() => handleResetSingle(item.config.id)}
                        className="text-[10px] text-muted-steel hover:text-frost underline leading-none"
                      >
                        Reset ({item.config.defaultPct}%)
                      </button>
                    )}
                  </div>
                </div>

                {/* Amount Output */}
                <div className="mt-4 pt-4 border-t border-gunmetal/60">
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-steel text-[11px] uppercase tracking-wider font-medium">
                      Límite Máximo Asignado
                    </span>
                    <span className="text-muted-steel text-[11px] font-mono">
                      {formatCurrency(item.annualAmount)}/año
                    </span>
                  </div>
                  <p className="font-display text-pure-white text-[24px] font-bold tracking-tight mt-0.5">
                    {formatExactCurrency(item.amount)}
                    <span className="text-[13px] font-normal text-muted-steel ml-1">/ mes</span>
                  </p>
                </div>

                {/* Slider with Highlighted Recommended Percentage */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-steel">0%</span>
                    {/* Highlighted original recommended value in BOLD */}
                    <button
                      type="button"
                      onClick={() => handlePctChange(item.config.id, item.config.defaultPct)}
                      className={cn(
                        "rounded px-2 py-0.5 font-mono cursor-pointer transition-colors",
                        item.isDefaultPct
                          ? "bg-gunmetal/70 text-pure-white font-bold border border-muted-steel/40"
                          : "text-muted-steel hover:text-pure-white font-bold border border-dashed border-gunmetal",
                      )}
                      title={`Hacer clic para restablecer al recomendado (${item.config.defaultPct}%)`}
                    >
                      Recomendado: <strong className="font-extrabold text-pure-white underline">{item.config.defaultPct}%</strong>
                    </button>
                    <span className="text-muted-steel">60%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="1"
                    value={item.pct}
                    onChange={(e) => handlePctChange(item.config.id, Number(e.target.value))}
                    className="w-full cursor-pointer accent-periwinkle-glow"
                    style={{
                      accentColor: item.config.color,
                    }}
                  />
                </div>
              </div>

              {/* Special Action Callout for Saving & Investment */}
              {isSaving && (
                <div className="mt-5 pt-4 border-t border-emerald-500/20">
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[12px]">
                      <Sparkles className="size-3.5 shrink-0" />
                      <span>¿Cuánto valdrá este ahorro invertido?</span>
                    </div>
                    <p className="text-muted-steel text-[11px] leading-relaxed">
                      Si inviertes estos <strong className="text-pure-white font-mono">{formatCurrency(item.amount)}/mes</strong> a largo plazo, el interés compuesto puede multiplicar tu patrimonio.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCompoundDialogOpen(true)}
                      className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-void-black font-display font-semibold text-[12px] py-2 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <TrendingUp className="size-3.5" />
                      <span>Calcular con {formatCurrency(item.amount)}/mes</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compound Interest Dialog Modal */}
      <CompoundInterestDialog
        open={isCompoundDialogOpen}
        onOpenChange={setIsCompoundDialogOpen}
        initialMonthlyContribution={breakdown.savingItem.amount}
      />
    </div>
  );
}
