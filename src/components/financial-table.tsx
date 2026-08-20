"use client";

import { cn } from "@/lib/utils";
import { formatValue, type Scale } from "@/lib/format";
import type { Cell, LineSeries, Period } from "@/lib/sec/normalize";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Tabla financiera densa.
 *
 * La primera columna queda fija al hacer scroll horizontal, que es lo que hace
 * usable una tabla de doce periodos en una pantalla estrecha. Las celdas
 * derivadas por Altius se marcan en Brass para que no se confundan con lo
 * reportado.
 *
 * Los negativos van entre paréntesis y NO en color: una tabla financiera tiene
 * decenas de negativos, y pintarlos de naranja rompería la regla de mantener la
 * página monocroma al noventa y cinco por ciento.
 *
 * La entrada se anima con CSS y no con JavaScript, a propósito: una animación
 * que arranca desde opacidad cero deja la tabla invisible si el script falla o
 * tarda, y unos estados financieros no pueden depender de eso para verse.
 */
import { Sparkline } from "./sparkline";

export function FinancialTable({
  periods,
  rows,
  scale,
}: {
  periods: Period[];
  rows: LineSeries[];
  scale: Scale;
}) {
  if (periods.length === 0) {
    return (
      <p className="text-slate px-4 py-14 text-center text-[15px]">
        La SEC no publica datos XBRL estructurados para esta combinación.
      </p>
    );
  }

  return (
    <div className="border-mist bg-canvas-white relative overflow-x-auto rounded-[20px] border">
      <table className="tabular w-full border-collapse text-[14px]">
        <thead>
          <tr className="border-mist border-b">
            <th
              scope="col"
              className="altius-sticky-head text-steel sticky left-0 z-20 w-[150px] min-w-[150px] px-4 py-3 text-left text-[12px] font-medium sm:w-[300px] sm:min-w-[300px]"
            >
              Concepto
            </th>
            <th
              scope="col"
              className="bg-ash text-steel font-display w-[76px] min-w-[76px] px-2 py-3 text-center text-[12px] font-medium whitespace-nowrap"
            >
              Tendencia
            </th>
            {periods.map((p) => (
              <th
                key={p.key}
                scope="col"
                className="bg-ash text-steel font-display min-w-[92px] px-4 py-3 text-right text-[13px] tracking-[-0.02em] whitespace-nowrap sm:min-w-[110px]"
              >
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const vacia = periods.every((p) => row.cells[p.key]?.value == null);
            const rowValues = periods.map((p) => row.cells[p.key]?.value ?? null);
            return (
              <tr
                key={row.line.id}
                style={{ animationDelay: `${Math.min(i * 12, 240)}ms` }}
                className={cn(
                  "animate-in fade-in-0 fill-mode-backwards duration-300",
                  "altius-row border-mist group border-b last:border-0",
                  "hover:bg-fog transition-colors",
                  row.line.emphasis === "total" && "bg-fog/60",
                  vacia && "opacity-45",
                )}
              >
                <th
                  scope="row"
                  title={row.line.label}
                  className={cn(
                    "altius-sticky-cell text-graphite sticky left-0 z-10 w-[150px] min-w-[150px] max-w-[150px] truncate px-4 py-2 text-left text-[14px] font-normal whitespace-nowrap transition-colors sm:w-[300px] sm:min-w-[300px] sm:max-w-none",
                    row.line.emphasis === "total" && "font-display tracking-[-0.02em]",
                    row.line.emphasis === "subtotal" && "font-medium",
                  )}
                  style={{ paddingLeft: `${1 + (row.line.indent ?? 0) * 0.85}rem` }}
                >
                  {row.line.label}
                </th>
                <td className="px-2 py-2 text-center whitespace-nowrap">
                  <Sparkline
                    values={rowValues}
                    color={row.line.emphasis === "total" ? "var(--color-ember)" : "auto"}
                  />
                </td>
                {periods.map((p) => (
                  <Celda
                    key={p.key}
                    cell={row.cells[p.key]}
                    unit={row.line.unit}
                    scale={scale}
                    total={row.line.emphasis === "total"}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Celda({
  cell,
  unit,
  scale,
  total,
}: {
  cell: Cell | undefined;
  unit: LineSeries["line"]["unit"];
  scale: Scale;
  total: boolean;
}) {
  const value = cell?.value ?? null;
  const texto = formatValue(value, unit, scale);

  const contenido = (
    <span
      className={cn(
        "text-graphite",
        total && "font-display tracking-[-0.02em]",
        value === null && "text-slate/60",
        cell?.derived && "decoration-brass/70 underline decoration-dotted underline-offset-4",
      )}
    >
      {texto}
    </span>
  );

  return (
    <td className="px-4 py-2 text-right whitespace-nowrap">
      {cell?.derived ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="cursor-help">{contenido}</button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-[12px]">
            Valor calculado por Altius, no reportado directamente en el informe.
          </TooltipContent>
        </Tooltip>
      ) : cell?.concept ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="cursor-help">{contenido}</button>
          </TooltipTrigger>
          <TooltipContent className="font-mono text-[11px]">{cell.concept}</TooltipContent>
        </Tooltip>
      ) : (
        contenido
      )}
    </td>
  );
}
