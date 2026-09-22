"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CalendarRange } from "lucide-react";

export type GlobalTimeRangeId = "1y" | "3y" | "10y" | "custom";

export const GLOBAL_RANGES: { id: GlobalTimeRangeId; label: string; years: number | null }[] = [
  { id: "1y", label: "1 Año (1Y)", years: 1 },
  { id: "3y", label: "3 Años (3Y)", years: 3 },
  { id: "10y", label: "10 Años (10Y)", years: 10 },
];

export interface UseTimeRangeFilterProps<T> {
  data: T[];
  dateSelector: (item: T) => string; // Devuelve un string de fecha ISO como "YYYY-MM-DD" o solo "YYYY"
  defaultRange?: GlobalTimeRangeId;
  keepBaseline?: boolean; // Mantiene el último punto de datos antes del rango como base para cálculos
}

/**
 * Hook para gestionar el filtrado temporal global de los datos de un gráfico.
 * Soporta rangos predefinidos (1Y, 3Y, 10Y) y rangos personalizados (por año).
 * 
 * Si la acción tiene menos historial que el solicitado, el filtro simplemente
 * devolverá todos los datos disponibles desde la fecha de corte hacia adelante.
 */
export function useTimeRangeFilter<T>({
  data,
  dateSelector,
  defaultRange = "10y",
  keepBaseline = false,
}: UseTimeRangeFilterProps<T>) {
  const [range, setRange] = useState<GlobalTimeRangeId>(defaultRange);
  
  // Por defecto, inicializamos el rango personalizado de hace 10 años al año actual
  const currentYear = new Date().getUTCFullYear();
  const [customFrom, setCustomFrom] = useState<number>(currentYear - 10);
  const [customTo, setCustomTo] = useState<number>(currentYear);

  const filteredData = useMemo(() => {
    if (data.length === 0) return data;

    let cutoffDateStr: string | null = null;
    let cutoffYear: number | null = null;

    if (range !== "custom") {
      const rangeConfig = GLOBAL_RANGES.find(r => r.id === range);
      if (rangeConfig && rangeConfig.years !== null) {
        const lastItem = data.at(-1);
        if (lastItem) {
          const lastDateStr = dateSelector(lastItem);
          const isOnlyYear = lastDateStr.length === 4;
          const lastDate = new Date(`${isOnlyYear ? `${lastDateStr}-12-31` : lastDateStr}T00:00:00Z`);
          
          const cutoffDate = new Date(lastDate);
          cutoffDate.setUTCFullYear(cutoffDate.getUTCFullYear() - rangeConfig.years);
          cutoffDateStr = cutoffDate.toISOString().slice(0, 10);
          cutoffYear = cutoffDate.getUTCFullYear();
        }
      }
    }

    const filterLogic = (item: T) => {
      const dateStr = dateSelector(item);
      if (range === "custom") {
        const year = parseInt(dateStr.slice(0, 4), 10);
        if (isNaN(year)) return true;
        return year >= customFrom && year <= customTo;
      }
      if (cutoffDateStr !== null && cutoffYear !== null) {
        if (dateStr.length >= 10) return dateStr >= cutoffDateStr;
        const year = parseInt(dateStr.slice(0, 4), 10);
        return year >= cutoffYear;
      }
      return true; // Fallback
    };

    const selected = data.filter(filterLogic);
    
    if (keepBaseline && selected.length > 0 && selected.length < data.length) {
      const firstSelectedIndex = data.findIndex(filterLogic);
      if (firstSelectedIndex > 0) {
        const baseline = data[firstSelectedIndex - 1];
        
        const baselineDateStr = dateSelector(baseline);
        const selectedDateStr = dateSelector(selected[0]);
        if (baselineDateStr.length >= 10 && selectedDateStr.length >= 10) {
          const gapDays = (Date.parse(selectedDateStr) - Date.parse(baselineDateStr)) / 86_400_000;
          if (gapDays <= 35) return [baseline, ...selected];
        } else {
          return [baseline, ...selected];
        }
      }
    }

    return selected;
  }, [data, range, customFrom, customTo, dateSelector, keepBaseline]);

  return {
    range,
    setRange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    filteredData,
  };
}

export interface TimeRangeSelectorProps {
  range: GlobalTimeRangeId;
  setRange: (range: GlobalTimeRangeId) => void;
  customFrom: number;
  setCustomFrom: (year: number) => void;
  customTo: number;
  setCustomTo: (year: number) => void;
  className?: string;
}

/**
 * Componente visual global para el selector de rango de tiempo interactivo.
 * Se sitúa encima de cualquier gráfico financiero en la aplicación.
 */
export function TimeRangeSelector({
  range,
  setRange,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex max-w-full flex-wrap gap-2">
        {GLOBAL_RANGES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={range === item.id}
            onClick={() => setRange(item.id)}
            className={cn(
              "border-gunmetal font-display rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
              range === item.id
                ? "bg-periwinkle-glow text-void-black border-transparent"
                : "bg-void-black text-muted-steel hover:text-frost",
            )}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={range === "custom"}
          onClick={() => setRange("custom")}
          className={cn(
            "border-gunmetal font-display rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
            range === "custom"
              ? "bg-periwinkle-glow text-void-black border-transparent"
              : "bg-void-black text-muted-steel hover:text-frost",
          )}
        >
          Rango Personalizado
        </button>
      </div>

      {range === "custom" && (
        <div className="border-gunmetal flex flex-wrap items-center gap-3 border-t pt-3 mt-1">
          <div className="text-muted-steel flex items-center gap-2 text-[12px] font-medium">
            <CalendarRange className="size-4 text-periwinkle-glow" />
            Periodo personalizado
          </div>
          <label className="text-muted-steel text-[11px] uppercase tracking-wider flex items-center gap-2 ml-2">
            Desde
            <input
              type="number"
              value={customFrom}
              onChange={(e) => setCustomFrom(parseInt(e.target.value, 10))}
              className="border-gunmetal bg-void-black text-pure-white w-20 rounded border px-2 py-1 font-mono text-[12px] outline-none focus:border-periwinkle-glow/50"
            />
          </label>
          <label className="text-muted-steel text-[11px] uppercase tracking-wider flex items-center gap-2">
            Hasta
            <input
              type="number"
              value={customTo}
              onChange={(e) => setCustomTo(parseInt(e.target.value, 10))}
              className="border-gunmetal bg-void-black text-pure-white w-20 rounded border px-2 py-1 font-mono text-[12px] outline-none focus:border-periwinkle-glow/50"
            />
          </label>
        </div>
      )}
    </div>
  );
}
