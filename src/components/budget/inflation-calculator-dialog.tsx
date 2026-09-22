"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  Coins,
  Flame,
  HelpCircle,
  PiggyBank,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  calculatePersonalInflation,
  INFLATION_PRESETS,
  INVESTMENT_PRESETS,
} from "@/lib/budget/inflation";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(val);

const AMOUNT_PRESETS = [3000, 10000, 25000, 50000, 100000];
const YEAR_PRESETS = [3, 5, 10, 15, 20, 30];

export function InflationCalculatorDialog({
  open,
  onOpenChange,
  defaultAmount = 10000,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAmount?: number;
}) {
  const [initialAmount, setInitialAmount] = useState<number>(defaultAmount);
  const [years, setYears] = useState<number>(10);
  const [inflationRate, setInflationRate] = useState<number>(2.8);
  const [investmentRate, setInvestmentRate] = useState<number>(7.0);
  const [compareInvestment, setCompareInvestment] = useState<boolean>(true);

  const result = useMemo(() => {
    return calculatePersonalInflation(
      initialAmount,
      years,
      inflationRate,
      compareInvestment ? investmentRate : 0,
    );
  }, [initialAmount, years, inflationRate, investmentRate, compareInvestment]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-carbon-surface border-gunmetal p-0 sm:max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Cabecera del diálogo */}
        <DialogHeader className="border-gunmetal border-b px-6 py-4 flex flex-row items-center justify-between space-y-0 sticky top-0 bg-carbon-surface/95 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Flame className="size-5 text-rose-400" />
            </div>
            <div>
              <DialogTitle className="font-display text-pure-white text-[20px] font-bold tracking-tight">
                Calculadora de Inflación Personal
              </DialogTitle>
              <DialogDescription className="text-muted-steel text-[12px] mt-0.5">
                Comprueba la pérdida real de poder adquisitivo de tu dinero en cuenta bancaria y cómo protegerlo invirtiendo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Panel de Controles y Parámetros */}
          <div className="grid gap-5 md:grid-cols-2 bg-void-black/50 border border-gunmetal p-5 rounded-2xl">
            {/* 1. Cantidad inicial */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-frost text-[13px] font-medium flex items-center gap-1.5">
                  <Wallet className="size-4 text-periwinkle-glow" />
                  <span>Dinero ahorrado / Capital:</span>
                </label>
                <span className="font-mono text-pure-white text-[15px] font-bold">
                  {formatCurrency(initialAmount)}
                </span>
              </div>
              <input
                type="number"
                min={100}
                step={500}
                value={initialAmount}
                onChange={(e) => setInitialAmount(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-gunmetal bg-carbon-surface px-3.5 py-2 text-pure-white font-mono text-[14px] focus:border-periwinkle-glow focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {AMOUNT_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialAmount(amt)}
                    className={cn(
                      "font-display rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                      initialAmount === amt
                        ? "bg-periwinkle-glow text-void-black border-transparent font-semibold"
                        : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
                    )}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Horizonte temporal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-frost text-[13px] font-medium flex items-center gap-1.5">
                  <Coins className="size-4 text-emerald-400" />
                  <span>Horizonte temporal:</span>
                </label>
                <span className="font-mono text-pure-white text-[15px] font-bold">
                  {years} {years === 1 ? "año" : "años"}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={35}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-periwinkle-glow cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {YEAR_PRESETS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYears(y)}
                    className={cn(
                      "font-display rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                      years === y
                        ? "bg-periwinkle-glow text-void-black border-transparent font-semibold"
                        : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
                    )}
                  >
                    {y}a
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Tasa de inflación */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-frost text-[13px] font-medium flex items-center gap-1.5">
                  <Flame className="size-4 text-rose-400" />
                  <span>Inflación anual esperada:</span>
                </label>
                <span className="font-mono text-rose-300 text-[15px] font-bold">
                  {inflationRate.toFixed(1)} % / año
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {INFLATION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setInflationRate(p.rate)}
                    className={cn(
                      "text-left rounded-lg border p-2 text-[11px] transition-colors cursor-pointer",
                      inflationRate === p.rate
                        ? "border-rose-400/60 bg-rose-500/10 text-rose-200 font-semibold"
                        : "border-gunmetal bg-carbon-surface text-muted-steel hover:text-frost",
                    )}
                  >
                    <p className="font-medium truncate">{p.label}</p>
                    <p className="text-[10px] text-muted-steel truncate">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Comparar con inversión alternativa */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-frost text-[13px] font-medium flex items-center gap-1.5">
                  <TrendingUp className="size-4 text-sky-400" />
                  <span>Rentabilidad inversión (opcional):</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCompareInvestment((prev) => !prev)}
                    className="text-[11px] font-mono text-periwinkle-glow hover:underline cursor-pointer"
                  >
                    {compareInvestment ? "Activado" : "Desactivado"}
                  </button>
                  <span className="font-mono text-emerald-400 text-[15px] font-bold">
                    {compareInvestment ? `${investmentRate.toFixed(1)} %` : "0,0 %"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {INVESTMENT_PRESETS.slice(1).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setCompareInvestment(true);
                      setInvestmentRate(p.rate);
                    }}
                    className={cn(
                      "text-left rounded-lg border p-2 text-[11px] transition-colors cursor-pointer",
                      compareInvestment && investmentRate === p.rate
                        ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200 font-semibold"
                        : "border-gunmetal bg-carbon-surface text-muted-steel hover:text-frost",
                    )}
                  >
                    <p className="font-medium truncate">{p.label}</p>
                    <p className="text-[10px] text-muted-steel truncate">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tarjetas de Resultados Clave con Figuras de Cid (SIN nombres ni etiquetas) */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Tarjeta 1: Dinero parado en cuenta (Pérdida silenciosa) */}
            <div className="bg-void-black/70 border border-rose-500/30 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-rose-300">
                  En cuenta corriente (0 %)
                </span>
                <p className="text-muted-steel text-[12px] mt-0.5">
                  Poder de compra real en {years} años
                </p>
                <p className="tabular font-display text-rose-400 text-[26px] font-bold mt-2">
                  {formatCurrency(result.futurePurchasingPower)}
                </p>
                <p className="text-[12px] font-mono text-rose-300 mt-1">
                  Pierdes {formatCurrency(result.silentLoss)} ({result.silentLossPct.toFixed(1)} %)
                </p>
              </div>

              {/* Figura de Cid (solo figura, sin etiquetas) */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-rose-500/20">
                <img
                  src={result.mascotCash.src}
                  alt=""
                  className="size-14 sm:size-16 object-contain shrink-0 filter drop-shadow-[0_2px_6px_rgba(244,63,94,0.4)]"
                />
                <span className="text-[11px] text-muted-steel leading-tight">
                  Erosión acumulada por no rentabilizar
                </span>
              </div>
            </div>

            {/* Tarjeta 2: Coste de la vida equivalente */}
            <div className="bg-void-black/70 border border-gunmetal rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-steel">
                  Coste futuro equivalente
                </span>
                <p className="text-muted-steel text-[12px] mt-0.5">
                  Para comprar lo que hoy cuesta {formatCurrency(initialAmount)}
                </p>
                <p className="tabular font-display text-pure-white text-[26px] font-bold mt-2">
                  {formatCurrency(result.futureEquivalentCost)}
                </p>
                <p className="text-[12px] font-mono text-muted-steel mt-1">
                  Necesitarás +{formatCurrency(result.extraCostNeeded)} (+{((result.futureEquivalentCost / initialAmount - 1) * 100).toFixed(1)} %)
                </p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gunmetal/60 text-[11px] text-muted-steel">
                <HelpCircle className="size-4 text-periwinkle-glow shrink-0" />
                <span>Encarecimiento de la misma cesta de compras</span>
              </div>
            </div>

            {/* Tarjeta 3: Escenario Invertido (Protección y crecimiento) */}
            <div className="bg-void-black/70 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-300">
                  Invirtiendo al {investmentRate.toFixed(1)} %
                </span>
                <p className="text-muted-steel text-[12px] mt-0.5">
                  Poder de compra real (ajustado a inflación)
                </p>
                <p className="tabular font-display text-emerald-400 text-[26px] font-bold mt-2">
                  {formatCurrency(result.futureInvestedReal)}
                </p>
                <p className="text-[12px] font-mono text-emerald-300 mt-1">
                  Saldo nominal: {formatCurrency(result.futureInvestedNominal)} (+{result.realNetProfitPct >= 0 ? "+" : ""}{result.realNetProfitPct.toFixed(1)} % real)
                </p>
              </div>

              {/* Figura de Cid (solo figura, sin etiquetas) */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-emerald-500/20">
                <img
                  src={result.mascotInvested.src}
                  alt=""
                  className="size-14 sm:size-16 object-contain shrink-0 filter drop-shadow-[0_2px_6px_rgba(52,211,153,0.4)]"
                />
                <span className="text-[11px] text-muted-steel leading-tight">
                  Patrimonio protegido y multiplicado
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico comparativo de evolución temporal */}
          <div className="bg-void-black/50 border border-gunmetal p-5 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="size-4 text-rose-400" />
                <span className="text-pure-white text-[14px] font-medium">
                  Evolución del poder de compra real a lo largo de los años
                </span>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-muted-steel">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-rose-400" />
                  <span>Dinero en cuenta (0 %)</span>
                </div>
                {compareInvestment && (
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-emerald-400" />
                    <span>Inversión real ({investmentRate.toFixed(1)} %)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-[260px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.timeline} margin={{ top: 12, right: 12, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id="grad-cash-loss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#1f2433" strokeDasharray="3 4" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10, fill: "#646e87" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(y) => `Año ${y}`}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#646e87" }}
                    tickLine={false}
                    axisLine={false}
                    width={64}
                    tickFormatter={(v: number) => formatCurrency(v)}
                  />
                  <ReferenceLine
                    y={initialAmount}
                    stroke="#646e87"
                    strokeDasharray="4 4"
                    label={{
                      value: `Capital inicial: ${formatCurrency(initialAmount)}`,
                      position: "insideTopLeft",
                      fill: "#98a4f7",
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#151621",
                      border: "1px solid #1f2433",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "#ffffff",
                    }}
                    labelFormatter={(y) => `Año ${y}`}
                    formatter={(val, name) => {
                      const v = Number(val);
                      if (name === "cashReal") {
                        return [
                          `${formatCurrency(v)} (Pérdida: −${formatCurrency(initialAmount - v)})`,
                          "Poder real en cuenta corriente",
                        ];
                      }
                      if (name === "investedReal") {
                        return [
                          `${formatCurrency(v)} (Ganancia real: +${formatCurrency(v - initialAmount)})`,
                          "Poder real invertido",
                        ];
                      }
                      return [formatCurrency(v), String(name)];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cashReal"
                    stroke="#fb7185"
                    strokeWidth={2.2}
                    fill="url(#grad-cash-loss)"
                    dot={false}
                    isAnimationActive={false}
                  />
                  {compareInvestment && (
                    <Line
                      type="monotone"
                      dataKey="investedReal"
                      stroke="#34d399"
                      strokeWidth={2.4}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Guía didáctica al pie */}
          <div className="border-t border-gunmetal pt-4 grid gap-3 sm:grid-cols-2 text-[12px] text-muted-steel">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-pure-white">La regla para proteger tu ahorro:</strong> La única manera demostrada de no perder riqueza a largo plazo es mantener el dinero en activos productivos cuya rentabilidad neta supere la inflación.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-rose-400 shrink-0 mt-0.5" />
              <p>
                <strong className="text-pure-white">Cero riesgo nominal no es cero riesgo real:</strong> Tener el dinero &quot;seguro&quot; en la cuenta corriente garantiza una pérdida segura del 100 % de la inflación acumulada.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
