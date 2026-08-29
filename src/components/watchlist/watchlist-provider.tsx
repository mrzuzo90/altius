"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { BellRing, Check, X } from "lucide-react";
import {
  isTargetReached,
  MAX_WATCHLIST_ITEMS,
  sanitizeStoredWatchlist,
  WATCHLIST_STORAGE_KEY,
} from "@/lib/watchlist/calculations";
import type {
  WatchlistItem,
  WatchlistQuote,
  WatchlistTargetInput,
} from "@/lib/watchlist/types";

type NotificationState = NotificationPermission | "unsupported";

type TargetToast = {
  id: string;
  item: WatchlistItem;
  quote: WatchlistQuote;
};

type WatchlistContextValue = {
  items: WatchlistItem[];
  quotes: Record<string, WatchlistQuote>;
  ready: boolean;
  isRefreshing: boolean;
  lastCheckedAt: string | null;
  notificationPermission: NotificationState;
  upsertItem: (input: WatchlistTargetInput) => void;
  removeItem: (ticker: string) => void;
  getItem: (ticker: string) => WatchlistItem | null;
  refreshQuotes: (tickers?: string[]) => Promise<void>;
  requestNotifications: () => Promise<NotificationState>;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);
const WATCHLIST_CHANGE_EVENT = "altius:watchlist-change";
const NOTIFICATION_CHANGE_EVENT = "altius:notification-permission-change";
const EMPTY_WATCHLIST = "[]";
let volatileWatchlist = EMPTY_WATCHLIST;

function storeItems(items: WatchlistItem[]): void {
  const serialized = JSON.stringify(items);
  volatileWatchlist = serialized;
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, serialized);
  } catch {
    // La lista sigue operativa en memoria si el navegador bloquea el almacenamiento.
  }
  window.dispatchEvent(new Event(WATCHLIST_CHANGE_EVENT));
}

function getWatchlistSnapshot(): string {
  try {
    return localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? volatileWatchlist;
  } catch {
    return volatileWatchlist;
  }
}

function subscribeWatchlist(onStoreChange: () => void): () => void {
  const syncLocalChange = () => onStoreChange();
  const syncStorageChange = (event: StorageEvent) => {
    if (event.key === WATCHLIST_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener(WATCHLIST_CHANGE_EVENT, syncLocalChange);
  window.addEventListener("storage", syncStorageChange);
  return () => {
    window.removeEventListener(WATCHLIST_CHANGE_EVENT, syncLocalChange);
    window.removeEventListener("storage", syncStorageChange);
  };
}

function getNotificationSnapshot(): NotificationState {
  return "Notification" in window ? Notification.permission : "unsupported";
}

function subscribeNotification(onStoreChange: () => void): () => void {
  window.addEventListener(NOTIFICATION_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(NOTIFICATION_CHANGE_EVENT, onStoreChange);
}

function formatAlertPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${price.toFixed(2)} ${currency}`;
  }
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const serializedItems = useSyncExternalStore(
    subscribeWatchlist,
    getWatchlistSnapshot,
    () => EMPTY_WATCHLIST,
  );
  const items = useMemo(() => {
    try {
      return sanitizeStoredWatchlist(JSON.parse(serializedItems));
    } catch {
      return [];
    }
  }, [serializedItems]);
  const ready = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const notificationPermission = useSyncExternalStore(
    subscribeNotification,
    getNotificationSnapshot,
    () => "unsupported" as const,
  );
  const [quotes, setQuotes] = useState<Record<string, WatchlistQuote>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [toasts, setToasts] = useState<TargetToast[]>([]);
  const itemsRef = useRef<WatchlistItem[]>([]);
  const requestInFlight = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const commitItems = useCallback((next: WatchlistItem[]) => {
    const limited = next.slice(0, MAX_WATCHLIST_ITEMS);
    itemsRef.current = limited;
    storeItems(limited);
  }, []);

  const showSystemNotification = useCallback((item: WatchlistItem, quote: WatchlistQuote) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const direction = item.targetDirection === "above" ? "ha superado" : "ha caído hasta";
      const notification = new Notification(`Objetivo alcanzado · ${item.ticker}`, {
        body: `${item.companyName} ${direction} ${formatAlertPrice(item.targetPrice!, quote.currency)}. Cotiza en ${formatAlertPrice(quote.price, quote.currency)}.`,
        tag: `altius-target-${item.ticker}-${item.targetPrice}`,
      });
      notification.onclick = () => {
        window.focus();
        router.push(`/ticker/${encodeURIComponent(item.ticker)}`);
      };
    } catch {
      // El aviso dentro de Altius permanece aunque el sistema operativo lo bloquee.
    }
  }, [router]);

  const refreshQuotes = useCallback(async (requestedTickers?: string[]) => {
    const tickers = [...new Set(
      (requestedTickers?.length ? requestedTickers : itemsRef.current.map((item) => item.ticker))
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean),
    )].slice(0, 25);
    if (tickers.length === 0 || requestInFlight.current) return;
    requestInFlight.current = true;
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/quotes?tickers=${encodeURIComponent(tickers.join(","))}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json() as { quotes?: WatchlistQuote[]; asOf?: string };
      const received = payload.quotes ?? [];
      if (received.length === 0) return;
      const receivedMap = Object.fromEntries(received.map((quote) => [quote.ticker.toUpperCase(), quote]));
      setQuotes((current) => ({ ...current, ...receivedMap }));
      setLastCheckedAt(payload.asOf ?? new Date().toISOString());

      const now = new Date().toISOString();
      const triggered: TargetToast[] = [];
      const nextItems = itemsRef.current.map((item) => {
        const quote = receivedMap[item.ticker];
        if (
          !quote || item.status === "triggered" ||
          !isTargetReached(quote.price, item.targetPrice, item.targetDirection)
        ) return item;
        const next: WatchlistItem = {
          ...item,
          status: "triggered",
          triggeredAt: now,
          triggeredPrice: quote.price,
          updatedAt: now,
        };
        triggered.push({ id: `${item.ticker}-${now}`, item: next, quote });
        return next;
      });
      if (triggered.length > 0) {
        commitItems(nextItems);
        setToasts((current) => [...triggered, ...current].slice(0, 4));
        for (const alert of triggered) showSystemNotification(alert.item, alert.quote);
      }
    } catch {
      // El siguiente ciclo reintentará la consulta.
    } finally {
      requestInFlight.current = false;
      setIsRefreshing(false);
    }
  }, [commitItems, showSystemNotification]);

  const tickerKey = items.map((item) => item.ticker).sort().join(",");
  useEffect(() => {
    if (!ready || !tickerKey) return;
    void refreshQuotes();
    const interval = window.setInterval(() => void refreshQuotes(), 60_000);
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") void refreshQuotes();
    };
    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [ready, tickerKey, refreshQuotes]);

  const upsertItem = useCallback((input: WatchlistTargetInput) => {
    const ticker = input.ticker.trim().toUpperCase();
    const now = new Date().toISOString();
    const current = itemsRef.current.find((item) => item.ticker === ticker);
    const targetChanged = !current ||
      current.targetPrice !== input.targetPrice ||
      current.targetDirection !== input.targetDirection;
    const next: WatchlistItem = {
      ticker,
      companyName: input.companyName.trim() || ticker,
      targetPrice: input.targetPrice,
      targetDirection: input.targetPrice === null ? null : input.targetDirection,
      referencePrice: targetChanged ? input.referencePrice : current.referencePrice,
      currency: input.currency ?? current?.currency ?? null,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
      status: targetChanged ? "watching" : current?.status ?? "watching",
      triggeredAt: targetChanged ? null : current?.triggeredAt ?? null,
      triggeredPrice: targetChanged ? null : current?.triggeredPrice ?? null,
    };
    const withoutCurrent = itemsRef.current.filter((item) => item.ticker !== ticker);
    commitItems([next, ...withoutCurrent]);
    window.setTimeout(() => void refreshQuotes([ticker]), 0);
  }, [commitItems, refreshQuotes]);

  const removeItem = useCallback((tickerInput: string) => {
    const ticker = tickerInput.trim().toUpperCase();
    commitItems(itemsRef.current.filter((item) => item.ticker !== ticker));
    setQuotes((current) => {
      const next = { ...current };
      delete next[ticker];
      return next;
    });
  }, [commitItems]);

  const getItem = useCallback((tickerInput: string) =>
    itemsRef.current.find((item) => item.ticker === tickerInput.trim().toUpperCase()) ?? null, []);

  const requestNotifications = useCallback(async (): Promise<NotificationState> => {
    if (!("Notification" in window)) {
      return "unsupported";
    }
    const permission = await Notification.requestPermission();
    window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT));
    return permission;
  }, []);

  const context = useMemo<WatchlistContextValue>(() => ({
    items,
    quotes,
    ready,
    isRefreshing,
    lastCheckedAt,
    notificationPermission,
    upsertItem,
    removeItem,
    getItem,
    refreshQuotes,
    requestNotifications,
  }), [
    items,
    quotes,
    ready,
    isRefreshing,
    lastCheckedAt,
    notificationPermission,
    upsertItem,
    removeItem,
    getItem,
    refreshQuotes,
    requestNotifications,
  ]);

  return (
    <WatchlistContext.Provider value={context}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[min(390px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto border-emerald-700/50 bg-[#101c1b]/95 rounded-2xl border p-4 shadow-2xl backdrop-blur-md">
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                <BellRing className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-emerald-300 font-mono text-[10px] uppercase tracking-wider">Objetivo alcanzado</p>
                    <p className="text-pure-white mt-0.5 font-display text-[15px] font-medium">{toast.item.companyName} · {toast.item.ticker}</p>
                  </div>
                  <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="text-muted-steel hover:text-pure-white cursor-pointer p-1" aria-label="Cerrar aviso">
                    <X className="size-4" />
                  </button>
                </div>
                <p className="text-frost/80 mt-1.5 text-[12px]">
                  Cotiza en {formatAlertPrice(toast.quote.price, toast.quote.currency)} y ha alcanzado tu objetivo de {formatAlertPrice(toast.item.targetPrice!, toast.quote.currency)}.
                </p>
                <Link href={`/ticker/${toast.item.ticker}`} className="text-periwinkle-glow mt-2 inline-flex items-center gap-1 text-[11px] font-medium hover:underline">
                  <Check className="size-3" /> Ver empresa
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error("useWatchlist debe utilizarse dentro de WatchlistProvider");
  return context;
}
