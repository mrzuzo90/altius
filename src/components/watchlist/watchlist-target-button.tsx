"use client";

import { useMemo, useState } from "react";
import { Bell, Heart, LoaderCircle, Target, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { inferTargetDirection } from "@/lib/watchlist/calculations";
import type { TargetDirection } from "@/lib/watchlist/types";
import { cn } from "@/lib/utils";
import { useWatchlist } from "./watchlist-provider";

function formatMoney(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(price);
  } catch {
    return `${price.toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${currency}`;
  }
}

export function WatchlistTargetButton({
  ticker,
  companyName,
  compact = false,
}: {
  ticker: string;
  companyName: string;
  compact?: boolean;
}) {
  const { items, quotes, upsertItem, removeItem, refreshQuotes } = useWatchlist();
  const normalizedTicker = ticker.trim().toUpperCase();
  const existing = items.find((item) => item.ticker === normalizedTicker) ?? null;
  const quote = quotes[normalizedTicker] ?? null;
  const [open, setOpen] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [direction, setDirection] = useState<TargetDirection>("above");
  const parsedTarget = targetInput.trim() ? Number(targetInput.replace(",", ".")) : null;
  const validTarget = parsedTarget === null || (Number.isFinite(parsedTarget) && parsedTarget > 0);

  const openEditor = () => {
    setTargetInput(existing?.targetPrice ? String(existing.targetPrice) : "");
    setDirection(existing?.targetDirection ?? "above");
    setOpen(true);
    void refreshQuotes([normalizedTicker]);
  };

  const targetGap = useMemo(() => {
    if (!quote || parsedTarget === null || !validTarget) return null;
    return ((parsedTarget - quote.price) / quote.price) * 100;
  }, [quote, parsedTarget, validTarget]);

  const updateTarget = (value: string) => {
    setTargetInput(value);
    const target = Number(value.replace(",", "."));
    if (quote && Number.isFinite(target) && target > 0) {
      setDirection(inferTargetDirection(target, quote.price));
    }
  };

  const save = () => {
    if (!validTarget) return;
    upsertItem({
      ticker: normalizedTicker,
      companyName,
      targetPrice: parsedTarget,
      targetDirection: parsedTarget === null ? null : direction,
      referencePrice: quote?.price ?? existing?.referencePrice ?? null,
      currency: quote?.currency ?? existing?.currency ?? null,
    });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className={cn(
          "font-display cursor-pointer rounded-full border transition-all",
          compact ? "inline-flex size-9 items-center justify-center" : "inline-flex items-center gap-2 px-3.5 py-1.5 text-[12px]",
          existing
            ? "border-rose-500/35 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
            : "border-gunmetal bg-void-black text-muted-steel hover:border-periwinkle-glow/40 hover:text-frost",
        )}
        aria-label={existing ? `Editar objetivo de ${companyName}` : `Añadir ${companyName} a favoritas`}
      >
        <Heart className={cn("size-4", existing && "fill-current")} />
        {!compact ? <span>{existing ? "En favoritas" : "Añadir a favoritas"}</span> : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-gunmetal bg-carbon-surface gap-0 overflow-hidden p-0 sm:max-w-[520px]">
          <DialogHeader className="border-gunmetal border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="bg-iris-blue/15 text-periwinkle-glow flex size-10 items-center justify-center rounded-xl">
                <Target className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-pure-white font-display text-[19px]">{companyName}</DialogTitle>
                <DialogDescription className="text-muted-steel mt-0.5 font-mono text-[11px]">{normalizedTicker} · Lista de favoritas</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="border-gunmetal bg-void-black/55 flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <span className="text-muted-steel block font-mono text-[9px] uppercase tracking-wider">Cotización observada</span>
                <strong className="text-pure-white mt-0.5 block font-display text-[22px] font-medium">
                  {quote ? formatMoney(quote.price, quote.currency) : "Consultando…"}
                </strong>
              </div>
              {!quote ? <LoaderCircle className="text-periwinkle-glow size-4 animate-spin" /> : (
                <span className={cn("rounded-full px-2 py-1 font-mono text-[10px]", (quote.changePct ?? 0) >= 0 ? "bg-emerald-950/60 text-emerald-300" : "bg-rose-950/60 text-rose-300")}>
                  {quote.changePct === null ? "—" : `${quote.changePct >= 0 ? "+" : ""}${quote.changePct.toFixed(2)}%`}
                </span>
              )}
            </div>

            <div>
              <label htmlFor={`target-${normalizedTicker}`} className="text-frost text-[12px] font-medium">Precio objetivo <span className="text-muted-steel font-normal">(opcional)</span></label>
              <div className="relative mt-2">
                <Input
                  id={`target-${normalizedTicker}`}
                  type="text"
                  inputMode="decimal"
                  value={targetInput}
                  onChange={(event) => updateTarget(event.target.value)}
                  placeholder="Ej. 250,00"
                  className="border-gunmetal bg-void-black h-11 pr-16 font-mono text-[15px] text-pure-white"
                  aria-invalid={!validTarget}
                />
                <span className="text-muted-steel pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px]">{quote?.currency ?? existing?.currency ?? ""}</span>
              </div>
              {!validTarget ? <p className="mt-1.5 text-[11px] text-rose-300">Introduce un precio positivo o deja el campo vacío.</p> : null}
              {targetGap !== null ? (
                <p className="text-muted-steel mt-1.5 text-[11px]">
                  Está a <span className={targetGap >= 0 ? "text-emerald-300" : "text-rose-300"}>{Math.abs(targetGap).toFixed(2)}%</span> del precio actual.
                </p>
              ) : null}
            </div>

            {parsedTarget !== null && validTarget ? (
              <div>
                <span className="text-frost text-[12px] font-medium">¿Cuándo avisar?</span>
                <div className="bg-void-black border-gunmetal mt-2 grid grid-cols-2 gap-1 rounded-xl border p-1">
                  <button type="button" onClick={() => setDirection("above")} className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[11px] transition-colors", direction === "above" ? "bg-emerald-500/15 text-emerald-300" : "text-muted-steel hover:text-frost")}>
                    <TrendingUp className="size-4" /> Al superar el objetivo
                  </button>
                  <button type="button" onClick={() => setDirection("below")} className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[11px] transition-colors", direction === "below" ? "bg-rose-500/15 text-rose-300" : "text-muted-steel hover:text-frost")}>
                    <TrendingDown className="size-4" /> Al caer hasta el objetivo
                  </button>
                </div>
                <p className="text-muted-steel mt-2 flex items-start gap-1.5 text-[10px] leading-[1.45]"><Bell className="mt-0.5 size-3 shrink-0" />La dirección se propone automáticamente comparando el objetivo con la cotización, pero puedes cambiarla.</p>
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-gunmetal bg-void-black/35 m-0 flex-row items-center justify-between rounded-none px-6 py-4">
            <div>
              {existing ? (
                <button type="button" onClick={() => { removeItem(normalizedTicker); setOpen(false); }} className="text-rose-300 hover:text-rose-200 flex cursor-pointer items-center gap-1.5 text-[11px]">
                  <Trash2 className="size-3.5" /> Eliminar
                </button>
              ) : null}
            </div>
            <button type="button" onClick={save} disabled={!validTarget} className="btn-primary-gradient cursor-pointer px-5 py-2.5 text-[12px] disabled:cursor-not-allowed disabled:opacity-40">
              {existing ? "Guardar cambios" : parsedTarget === null ? "Añadir sin objetivo" : "Añadir y avisarme"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
