import type { FredPoint } from "@/lib/fred/client";
import {
  CID_MASCOTS,
  elapsedYears,
  type CharacterPhase,
  type MascotPhaseConfig,
} from "@/components/statement-trend-animation";

export type PurchasingPowerRange = "1y" | "3y" | "5y" | "10y" | "15y" | "20y" | "max";

export type PurchasingPowerPoint = {
  date: string;
  value: number; // Valor real restante (ej. 80.94 a partir de 100)
  lossPct: number; // Pérdida porcentual acumulada (ej. -19.06)
  indexValue: number; // Valor bruto del índice de precios
};

export type PurchasingPowerResult = {
  series: PurchasingPowerPoint[];
  initialValue: number; // 100.00
  finalValue: number; // ej. 80.94
  totalLossPct: number; // ej. -19.06 %
  annualInflationRate: number; // ej. 3.55 % / año
  startDate: string;
  endDate: string;
  years: number;
  mascot: MascotPhaseConfig;
};

export const PURCHASING_POWER_RANGES: readonly {
  id: PurchasingPowerRange;
  label: string;
  years: number;
}[] = [
  { id: "1y", label: "1 año", years: 1 },
  { id: "3y", label: "3 años", years: 3 },
  { id: "5y", label: "5 años", years: 5 },
  { id: "10y", label: "10 años", years: 10 },
  { id: "15y", label: "15 años", years: 15 },
  { id: "20y", label: "20 años", years: 20 },
  { id: "max", label: "Máx.", years: 99 },
];

/**
 * Normaliza una serie de precios (CPI / IPCA) para que comience exactamente en 100.00
 * y calcule la erosión real del poder adquisitivo a lo largo del tiempo.
 */
export function calculatePurchasingPower(
  points: readonly FredPoint[],
  range: PurchasingPowerRange,
): PurchasingPowerResult | null {
  const validPoints = points
    .filter((p) => Number.isFinite(p.value) && p.value > 0 && p.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (validPoints.length < 2) return null;

  const lastPoint = validPoints.at(-1)!;
  let filtered: FredPoint[] = [];

  if (range === "max") {
    filtered = [...validPoints];
  } else {
    const rangeConfig = PURCHASING_POWER_RANGES.find((r) => r.id === range);
    const yearsToSubtract = rangeConfig?.years ?? 5;
    const targetDate = new Date(`${lastPoint.date}T00:00:00Z`);
    targetDate.setUTCFullYear(targetDate.getUTCFullYear() - yearsToSubtract);
    const cutoff = targetDate.toISOString().slice(0, 10);

    filtered = validPoints.filter((p) => p.date >= cutoff);
    if (filtered.length < 2) {
      filtered = [...validPoints];
    }
  }

  const basePoint = filtered[0];
  const endPoint = filtered.at(-1)!;
  const baseIndex = basePoint.value;

  const series: PurchasingPowerPoint[] = filtered.map((p) => {
    // Valor real de 100 unidades iniciales: 100 * (P0 / Pt)
    const realVal = Math.round((100 * (baseIndex / p.value)) * 100) / 100;
    const lossPct = Math.round((realVal - 100) * 100) / 100;
    return {
      date: p.date,
      value: realVal,
      lossPct,
      indexValue: p.value,
    };
  });

  const finalValue = series.at(-1)!.value;
  const totalLossPct = Math.round((finalValue - 100) * 100) / 100;
  const years = Math.max(elapsedYears(basePoint.date, endPoint.date), 0.1);

  // Inflación media anual compuesta sufrida: (P_final / P_inicial)^(1/años) - 1
  const annualInflationRate =
    years > 0 ? (Math.pow(endPoint.value / baseIndex, 1 / years) - 1) * 100 : 0;

  // Selección de figura de Cid según la pérdida acumulada de poder de compra
  // (Sin textos ni nombres, solo la postura visual)
  let phase: CharacterPhase = "senor";
  if (totalLossPct > -5) {
    phase = "senor"; // Pérdida leve / casi plana
  } else if (totalLossPct > -15) {
    phase = "caballero"; // Pérdida moderada
  } else if (totalLossPct > -25) {
    phase = "piedra"; // Pérdida notable
  } else if (totalLossPct > -35) {
    phase = "flecha"; // Pérdida severa
  } else {
    phase = "apunalado"; // Desplome total (>35% de pérdida de valor)
  }

  const mascot = CID_MASCOTS[phase] ?? CID_MASCOTS.senor;

  return {
    series,
    initialValue: 100.0,
    finalValue,
    totalLossPct,
    annualInflationRate: Math.round(annualInflationRate * 100) / 100,
    startDate: basePoint.date,
    endDate: endPoint.date,
    years: Math.round(years * 10) / 10,
    mascot,
  };
}
