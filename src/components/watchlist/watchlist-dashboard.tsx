"use client";

import Link from "next/link";
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  Clock3,
  Heart,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { targetDistancePct, targetProgressPct } from "@/lib/watchlist/calculations";
import type { WatchlistItem, WatchlistQuote } from "@/lib/watchlist/types";
import { WatchlistTargetButton } from "./watchlist-target-button";
import { useWatchlist } from "./watchlist-provider";

function formatMoney(value: number | null, currency = "USD"): string {
  if (value === null) return "—";
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value.toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${currency}`;
  }
}

function formatCheckTime(value: string | null): string {
  if (!value) return "Aún no comprobado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Aún no comprobado"
    : `Comprobado a las ${new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date)}`;
}

function WatchlistRow({ item, quote, onRemove }: { item: WatchlistItem; quote: WatchlistQuote | null; onRemove: () => void }) {
  const currency = quote?.currency ?? item.currency ?? "USD";
  const distance = quote ? targetDistancePct(quote.price, item.targetPrice, item.targetDirection) : null;
  const progress = quote ? targetProgressPct(quote.price, item.referencePrice, item.targetPrice, item.targetDirection) : null;
  const triggered = item.status === "triggered";
  const directionUp = item.targetDirection === "above";

  return (
    <article className={cn("border-gunmetal bg-carbon-surface overflow-hidden rounded-2xl border transition-colors", triggered && "border-emerald-700/45 bg-emerald-950/10")}>
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3 lg:w-[28%]">
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl border", triggered ? "border-emerald-700/40 bg-emerald-500/10 text-emerald-300" : "border-gunmetal bg-void-black text-periwinkle-glow")}>
            {triggered ? <CheckCircle2 className="size-5" /> : <Heart className="size-5 fill-current" />}
          </div>
          <div className="min-w-0">
            <Link href={`/ticker/${item.ticker}`} className="text-pure-white block truncate font-display text-[16px] font-medium hover:text-periwinkle-glow">{item.companyName}</Link>
            <span className="text-muted-steel mt-0.5 block font-mono text-[11px]">{item.ticker}</span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <span className="text-muted-steel block font-mono text-[9px] uppercase tracking-wider">Cotización</span>
            <strong className="text-pure-white mt-1 block font-mono text-[15px]">{formatMoney(quote?.price ?? null, currency)}</strong>
            {quote?.changePct !== null && quote?.changePct !== undefined ? <span className={cn("mt-0.5 block font-mono text-[10px]", quote.changePct >= 0 ? "text-emerald-300" : "text-rose-300")}>{quote.changePct >= 0 ? "+" : ""}{quote.changePct.toFixed(2)}% hoy</span> : null}
          </div>
          <div>
            <span className="text-muted-steel block font-mono text-[9px] uppercase tracking-wider">Objetivo</span>
            <strong className="text-pure-white mt-1 block font-mono text-[15px]">{formatMoney(item.targetPrice, currency)}</strong>
            <span className={cn("mt-0.5 flex items-center gap-1 text-[10px]", directionUp ? "text-emerald-300" : item.targetDirection === "below" ? "text-rose-300" : "text-muted-steel")}>
              {directionUp ? <TrendingUp className="size-3" /> : item.targetDirection === "below" ? <TrendingDown className="size-3" /> : null}
              {directionUp ? "Avisar al superar" : item.targetDirection === "below" ? "Avisar al caer" : "Sin alerta configurada"}
            </span>
          </div>
          <div>
            <span className="text-muted-steel block font-mono text-[9px] uppercase tracking-wider">Distancia</span>
            <strong className={cn("mt-1 block font-mono text-[15px]", triggered ? "text-emerald-300" : "text-frost")}>{triggered ? "Alcanzado" : distance === null ? "—" : `${distance.toFixed(2)}%`}</strong>
            <span className="text-muted-steel mt-0.5 block text-[10px]">{triggered && item.triggeredPrice ? `en ${formatMoney(item.triggeredPrice, currency)}` : "hasta el objetivo"}</span>
          </div>
          <div>
            <span className="text-muted-steel block font-mono text-[9px] uppercase tracking-wider">Progreso</span>
            <strong className="text-frost mt-1 block font-mono text-[15px]">{triggered ? "100%" : progress === null ? "—" : `${progress.toFixed(0)}%`}</strong>
            <div className="bg-void-black mt-1.5 h-1.5 overflow-hidden rounded-full border border-gunmetal">
              <div className={cn("h-full rounded-full", triggered ? "bg-emerald-400" : directionUp ? "bg-periwinkle-glow" : "bg-rose-400")} style={{ width: `${triggered ? 100 : progress ?? 0}%` }} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:pl-2">
          <WatchlistTargetButton ticker={item.ticker} companyName={item.companyName} compact />
          <button type="button" onClick={onRemove} className="border-gunmetal bg-void-black text-muted-steel hover:border-rose-500/40 hover:text-rose-300 flex size-9 cursor-pointer items-center justify-center rounded-full border transition-colors" aria-label={`Eliminar ${item.companyName}`}>
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function WatchlistDashboard() {
  const {
    items,
    quotes,
    ready,
    isRefreshing,
    lastCheckedAt,
    notificationPermission,
    removeItem,
    refreshQuotes,
    requestNotifications,
  } = useWatchlist();
  const withTargets = items.filter((item) => item.targetPrice !== null);
  const triggered = items.filter((item) => item.status === "triggered");
  const nearest = withTargets
    .map((item) => ({ item, distance: quotes[item.ticker] ? targetDistancePct(quotes[item.ticker].price, item.targetPrice, item.targetDirection) : null }))
    .filter((entry): entry is { item: WatchlistItem; distance: number } => entry.distance !== null)
    .sort((a, b) => a.distance - b.distance)[0] ?? null;

  if (!ready) {
    return <div className="mx-auto max-w-[1200px] px-5 py-12"><div className="bg-carbon-surface border-gunmetal h-72 animate-pulse rounded-2xl border" /></div>;
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-5 py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-periwinkle-glow font-mono text-[10px] uppercase tracking-[0.18em]">Seguimiento personal</span>
          <h1 className="text-pure-white mt-1 flex items-center gap-3 font-display text-[34px] font-medium tracking-tight"><Heart className="size-7 fill-rose-300 text-rose-300" />Mis acciones favoritas</h1>
          <p className="text-frost/75 mt-2 max-w-2xl text-[14px] leading-[1.55]">Guarda empresas, define el precio que esperas y Altius comprobará automáticamente cuándo se alcanza.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => window.dispatchEvent(new Event("altius:open-search"))} className="btn-primary-gradient flex cursor-pointer items-center gap-2 px-4 py-2.5 text-[12px]"><Plus className="size-4" />Añadir empresa</button>
          <button type="button" onClick={() => void refreshQuotes()} disabled={isRefreshing || items.length === 0} className="border-gunmetal bg-carbon-surface text-frost hover:border-periwinkle-glow/40 flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-[12px] disabled:cursor-not-allowed disabled:opacity-40"><RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />Actualizar</button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5"><span className="text-muted-steel flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider"><Heart className="size-3.5 text-rose-300" />Empresas guardadas</span><strong className="text-pure-white mt-2 block font-display text-[30px] font-medium">{items.length}</strong><p className="text-muted-steel mt-1 text-[10px]">máximo 25 por navegador</p></div>
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5"><span className="text-muted-steel flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider"><Target className="size-3.5 text-periwinkle-glow" />Con precio objetivo</span><strong className="text-pure-white mt-2 block font-display text-[30px] font-medium">{withTargets.length}</strong><p className="text-muted-steel mt-1 text-[10px]">{items.length - withTargets.length} solo en seguimiento</p></div>
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5"><span className="text-muted-steel flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider"><CheckCircle2 className="size-3.5 text-emerald-300" />Objetivos alcanzados</span><strong className="text-emerald-300 mt-2 block font-display text-[30px] font-medium">{triggered.length}</strong><p className="text-muted-steel mt-1 text-[10px]">un único aviso por objetivo</p></div>
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5"><span className="text-muted-steel flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider"><Clock3 className="size-3.5 text-amber-300" />Objetivo más cercano</span><strong className="text-pure-white mt-2 block truncate font-display text-[20px] font-medium">{nearest ? `${nearest.item.ticker} · ${nearest.distance.toFixed(1)}%` : "—"}</strong><p className="text-muted-steel mt-1 text-[10px]">{formatCheckTime(lastCheckedAt)}</p></div>
      </section>

      <section className={cn("rounded-2xl border p-5", notificationPermission === "granted" ? "border-emerald-700/40 bg-emerald-950/15" : "border-gunmetal bg-carbon-surface")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", notificationPermission === "granted" ? "bg-emerald-400/10 text-emerald-300" : "bg-void-black text-periwinkle-glow")}>
              {notificationPermission === "granted" ? <BellRing className="size-5" /> : notificationPermission === "denied" ? <BellOff className="size-5" /> : <Bell className="size-5" />}
            </span>
            <div>
              <h2 className="text-pure-white font-display text-[16px] font-medium">{notificationPermission === "granted" ? "Avisos del navegador activados" : notificationPermission === "denied" ? "Avisos bloqueados por el navegador" : "Activa los avisos del navegador"}</h2>
              <p className="text-frost/70 mt-1 max-w-2xl text-[11px] leading-[1.5]">Los avisos dentro de Altius funcionan siempre mientras la página esté abierta. Las notificaciones del sistema también pueden aparecer con otra pestaña activa. Con el navegador completamente cerrado hará falta una futura cuenta con servicio push.</p>
            </div>
          </div>
          {notificationPermission === "default" ? <button type="button" onClick={() => void requestNotifications()} className="border-periwinkle-glow/40 bg-iris-blue/15 text-periwinkle-glow hover:bg-iris-blue/25 shrink-0 cursor-pointer rounded-full border px-4 py-2 text-[11px] font-medium">Permitir notificaciones</button> : null}
        </div>
      </section>

      {items.length === 0 ? (
        <section className="bg-carbon-surface border-gunmetal rounded-2xl border border-dashed px-6 py-16 text-center">
          <span className="bg-void-black border-gunmetal text-muted-steel mx-auto flex size-14 items-center justify-center rounded-2xl border"><Heart className="size-6" /></span>
          <h2 className="text-pure-white mt-4 font-display text-[20px] font-medium">Aún no tienes acciones guardadas</h2>
          <p className="text-muted-steel mx-auto mt-2 max-w-md text-[12px] leading-[1.55]">Busca una empresa y pulsa “Añadir a favoritas”. Puedes guardarla sin objetivo y configurarlo más adelante.</p>
          <button type="button" onClick={() => window.dispatchEvent(new Event("altius:open-search"))} className="btn-primary-gradient mt-5 inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 text-[12px]"><Plus className="size-4" />Buscar mi primera empresa</button>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3"><h2 className="text-pure-white font-display text-[20px] font-medium">Lista de seguimiento</h2><span className="text-muted-steel font-mono text-[10px]">Actualización automática cada minuto · cotización del proveedor</span></div>
          {items.map((item) => <WatchlistRow key={item.ticker} item={item} quote={quotes[item.ticker] ?? null} onRemove={() => removeItem(item.ticker)} />)}
        </section>
      )}
    </div>
  );
}
