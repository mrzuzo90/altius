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
 * derivadas por Altius se marcan para que no se confundan con lo reportado.
 *
 * La entrada se anima con CSS y no con JavaScript, a propósito: una animación
 * que arranca desde opacidad cero deja la tabla invisible si el script falla o
 * tarda, y unos estados financieros no pueden depender de eso para verse.
 */
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
      <p className="text-muted-foreground px-4 py-10 text-center text-sm">
        La SEC no publica datos XBRL estructurados para esta combinación.
      </p>
    );
  }

  return (
    <div className="border-border/60 relative overflow-x-auto rounded-lg border">
      <table className="tabular w-full border-collapse text-sm">
        <thead>
          <tr className="border-border/60 bg-muted/30 border-b">
            <th
              scope="col"
              className="bg-muted/30 text-muted-foreground sticky left-0 z-20 min-w-[260px] px-3 py-2 text-left text-xs font-medium backdrop-blur-sm"
            >
              Concepto
            </th>
            {periods.map((p) => (
              <th
                key={p.key}
                scope="col"
                className="text-muted-foreground min-w-[104px] px-3 py-2 text-right text-xs font-medium whitespace-nowrap"
              >
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const vacia = periods.every((p) => row.cells[p.key]?.value == null);
            return (
              <tr
                key={row.line.id}
                style={{ animationDelay: `${Math.min(i * 12, 240)}ms` }}
                className={cn(
                  "animate-in fade-in-0 fill-mode-backwards duration-300",
                  "border-border/40 group border-b last:border-0",
                  "hover:bg-muted/40 transition-colors",
                  row.line.emphasis === "total" && "bg-muted/20 font-semibold",
                  row.line.emphasis === "subtotal" && "font-medium",
                  vacia && "opacity-45",
                )}
              >
                <th
                  scope="row"
                  className={cn(
                    "bg-background group-hover:bg-muted/40 sticky left-0 z-10 px-3 py-1.5 text-left font-normal whitespace-nowrap transition-colors",
                    row.line.emphasis === "total" && "font-semibold",
                    row.line.emphasis === "subtotal" && "font-medium",
                  )}
                  style={{ paddingLeft: `${0.75 + (row.line.indent ?? 0) * 0.85}rem` }}
                >
                  {row.line.label}
                </th>
                {periods.map((p) => (
                  <Celda key={p.key} cell={row.cells[p.key]} unit={row.line.unit} scale={scale} />
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
}: {
  cell: Cell | undefined;
  unit: LineSeries["line"]["unit"];
  scale: Scale;
}) {
  const value = cell?.value ?? null;
  const texto = formatValue(value, unit, scale);

  const contenido = (
    <span
      className={cn(
        value === null && "text-muted-foreground/50",
        value !== null && value < 0 && "text-negative",
        cell?.derived && "decoration-derived/60 underline decoration-dotted underline-offset-4",
      )}
    >
      {texto}
    </span>
  );

  return (
    <td className="px-3 py-1.5 text-right whitespace-nowrap">
      {cell?.derived ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="cursor-help">{contenido}</button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
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
