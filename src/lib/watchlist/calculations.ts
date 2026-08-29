import type { TargetDirection, WatchlistItem } from "./types";

export const WATCHLIST_STORAGE_KEY = "altius-watchlist-v1";
export const MAX_WATCHLIST_ITEMS = 25;

export function inferTargetDirection(targetPrice: number, currentPrice: number): TargetDirection {
  return targetPrice >= currentPrice ? "above" : "below";
}

export function isTargetReached(
  currentPrice: number,
  targetPrice: number | null,
  direction: TargetDirection | null,
): boolean {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0 || targetPrice === null || direction === null) return false;
  return direction === "above" ? currentPrice >= targetPrice : currentPrice <= targetPrice;
}

/** Distancia absoluta que falta hasta el objetivo, expresada sobre el precio actual. */
export function targetDistancePct(
  currentPrice: number,
  targetPrice: number | null,
  direction: TargetDirection | null,
): number | null {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0 || targetPrice === null || direction === null) return null;
  if (isTargetReached(currentPrice, targetPrice, direction)) return 0;
  const gap = direction === "above" ? targetPrice - currentPrice : currentPrice - targetPrice;
  return Math.max(0, (gap / currentPrice) * 100);
}

/** Avance desde el precio de referencia hasta el objetivo, limitado a 0-100%. */
export function targetProgressPct(
  currentPrice: number,
  referencePrice: number | null,
  targetPrice: number | null,
  direction: TargetDirection | null,
): number | null {
  if (
    !Number.isFinite(currentPrice) || currentPrice <= 0 ||
    referencePrice === null || referencePrice <= 0 ||
    targetPrice === null || targetPrice <= 0 ||
    direction === null
  ) return null;
  const total = direction === "above" ? targetPrice - referencePrice : referencePrice - targetPrice;
  if (total <= 0) return isTargetReached(currentPrice, targetPrice, direction) ? 100 : 0;
  const covered = direction === "above" ? currentPrice - referencePrice : referencePrice - currentPrice;
  return Math.min(100, Math.max(0, (covered / total) * 100));
}

function isDirection(value: unknown): value is TargetDirection {
  return value === "above" || value === "below";
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Valida el contenido de localStorage para que una entrada manipulada no rompa la aplicación. */
export function sanitizeStoredWatchlist(value: unknown): WatchlistItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const clean: WatchlistItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const ticker = typeof item.ticker === "string" ? item.ticker.trim().toUpperCase() : "";
    if (!/^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(ticker) || seen.has(ticker)) continue;
    const companyName = typeof item.companyName === "string" && item.companyName.trim()
      ? item.companyName.trim().slice(0, 160)
      : ticker;
    const targetPrice = numberOrNull(item.targetPrice);
    const targetDirection = targetPrice !== null && isDirection(item.targetDirection) ? item.targetDirection : null;
    const createdAt = typeof item.createdAt === "string" && !Number.isNaN(Date.parse(item.createdAt))
      ? item.createdAt
      : new Date().toISOString();
    const updatedAt = typeof item.updatedAt === "string" && !Number.isNaN(Date.parse(item.updatedAt))
      ? item.updatedAt
      : createdAt;
    const triggered = item.status === "triggered" && targetPrice !== null && targetDirection !== null;
    clean.push({
      ticker,
      companyName,
      targetPrice,
      targetDirection,
      referencePrice: numberOrNull(item.referencePrice),
      currency: typeof item.currency === "string" ? item.currency.slice(0, 8).toUpperCase() : null,
      createdAt,
      updatedAt,
      status: triggered ? "triggered" : "watching",
      triggeredAt: triggered && typeof item.triggeredAt === "string" ? item.triggeredAt : null,
      triggeredPrice: triggered ? numberOrNull(item.triggeredPrice) : null,
    });
    seen.add(ticker);
    if (clean.length >= MAX_WATCHLIST_ITEMS) break;
  }
  return clean;
}
