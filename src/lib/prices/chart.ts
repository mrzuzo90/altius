import type { PricePoint } from "./types";

export type Timestamped<T> = T & { timestamp: number };

export function timestampPricePoints<T extends { date: string }>(points: T[]): Timestamped<T>[] {
  return points.flatMap((point) => {
    const timestamp = Date.parse(`${point.date}T00:00:00Z`);
    return Number.isFinite(timestamp) ? [{ ...point, timestamp }] : [];
  });
}

export function chartSpanDays(points: Array<{ timestamp: number }>): number {
  if (points.length < 2) return 0;
  return Math.max(0, (points.at(-1)!.timestamp - points[0].timestamp) / 86_400_000);
}

export function chartTimeTicks(
  points: Array<{ timestamp: number }>,
  count = 6,
): number[] {
  if (points.length === 0) return [];
  const first = points[0].timestamp;
  const last = points.at(-1)!.timestamp;
  if (first === last || count <= 1) return [first];
  const step = (last - first) / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.round(first + step * index));
}

export function formatPriceChartTick(timestamp: number, spanDays: number): string {
  const date = new Date(timestamp);
  if (spanDays <= 120) {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }).format(date);
  }
  if (spanDays <= 1_500) {
    return new Intl.DateTimeFormat("es-ES", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(date);
  }
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatPriceChartDate(timestamp: number): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function priceDigits(value: number, axis: boolean): number {
  const absolute = Math.abs(value);
  if (!axis) return absolute >= 1 ? 2 : absolute >= 0.01 ? 3 : 4;
  if (absolute >= 100) return 0;
  if (absolute >= 10) return 1;
  if (absolute >= 1) return 2;
  if (absolute >= 0.01) return 3;
  return 4;
}

export function formatPriceQuote(
  value: number,
  currency: string | null,
  axis = false,
): string {
  const digits = priceDigits(value, axis);
  if (!currency || currency === "PTS") {
    return value.toLocaleString("es-ES", { maximumFractionDigits: digits });
  }
  try {
    return value.toLocaleString("es-ES", {
      style: "currency",
      currency,
      maximumFractionDigits: digits,
    });
  } catch {
    return `${value.toLocaleString("es-ES", { maximumFractionDigits: digits })} ${currency}`;
  }
}

export function priceChartDomain(points: PricePoint[]): [number, number] {
  if (points.length === 0) return [0, 1];
  const values = points.map((point) => point.close).filter(Number.isFinite);
  if (values.length === 0) return [0, 1];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = maximum - minimum;
  const padding = span > 0 ? span * 0.08 : Math.max(Math.abs(maximum) * 0.03, 0.01);
  const lowerPadding = minimum > 0 ? Math.min(padding, minimum * 0.2) : padding;
  return [Math.max(0, minimum - lowerPadding), maximum + padding];
}
