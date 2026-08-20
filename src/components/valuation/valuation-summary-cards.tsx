"use client";

import { formatValue } from "@/lib/format";
import type { ValuationMetrics } from "@/lib/valuation/types";

export function ValuationSummaryCards({ metrics }: { metrics: ValuationMetrics }) {
  const precioFmt = metrics.price > 0 ? "$" + metrics.price.toFixed(2) : "—";
  const peFmt = metrics.pe !== null ? metrics.pe.toFixed(1) + "x" : "—";
  const evEbitdaFmt = metrics.evEbitda !== null ? metrics.evEbitda.toFixed(1) + "x" : "—";
  const evFcfFmt = metrics.evFcf !== null ? metrics.evFcf.toFixed(1) + "x" : "—";
  const fcfYieldFmt = metrics.fcfYield !== null ? metrics.fcfYield.toFixed(1) + " %" : "—";
  const netDebtEbitdaFmt = metrics.netDebtEbitda !== null ? metrics.netDebtEbitda.toFixed(2) + "x" : "—";

  const sharesFmt = metrics.sharesDiluted !== null ? formatValue(metrics.sharesDiluted, "shares", "millions") + " M" : "—";
  const marketCapFmt = metrics.marketCap !== null ? "$" + formatValue(metrics.marketCap, "USD", "millions") + " M" : "—";
  const evFmt = metrics.enterpriseValue !== null ? "$" + formatValue(metrics.enterpriseValue, "USD", "millions") + " M" : "—";
  const cashFmt = metrics.totalCash !== null ? "$" + formatValue(metrics.totalCash, "USD", "millions") + " M" : "—";
  const debtFmt = metrics.totalDebt !== null ? "$" + formatValue(metrics.totalDebt, "USD", "millions") + " M" : "—";
  const netDebtFmt = metrics.netDebt !== null
    ? metrics.netDebt < 0
      ? "$" + formatValue(Math.abs(metrics.netDebt), "USD", "millions") + " M (Caja)"
      : "$" + formatValue(metrics.netDebt, "USD", "millions") + " M"
    : "—";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaMultiplo
          titulo="PER (LTM)"
          valor={peFmt}
          subtitulo="Capitalización / Beneficio Neto"
          descripcion="Años de beneficio neto necesarios para pagar el valor en bolsa actual."
        />
        <TarjetaMultiplo
          titulo="EV / EBITDA"
          valor={evEbitdaFmt}
          subtitulo="Enterprise Value / EBITDA"
          descripcion="Múltiplo operativo total que tiene en cuenta la deuda neta y la caja."
        />
        <TarjetaMultiplo
          titulo="EV / FCF"
          valor={evFcfFmt}
          subtitulo="Enterprise Value / Free Cash Flow"
          descripcion="Valoración frente a la caja libre real que genera el negocio."
        />
        <TarjetaMultiplo
          titulo="FCF Yield"
          valor={fcfYieldFmt}
          subtitulo="Free Cash Flow / Market Cap"
          descripcion="Rentabilidad anual en flujo de caja libre por cada dólar invertido."
        />
      </div>

      <div className="bg-ash card-asymmetric p-6">
        <h3 className="font-display text-graphite mb-4 text-[16px] tracking-[-0.02em]">
          Estructura de Capital y Magnitudes
        </h3>
        <div className="grid gap-y-3 gap-x-8 text-[14px] sm:grid-cols-2 lg:grid-cols-4">
          <Fila etiqueta="Precio acción" valor={precioFmt} />
          <Fila etiqueta="Acciones diluidas" valor={sharesFmt} />
          <Fila etiqueta="Market Cap" valor={marketCapFmt} />
          <Fila etiqueta="Enterprise Value (EV)" valor={evFmt} />
          <Fila etiqueta="Efectivo e inversiones" valor={cashFmt} />
          <Fila etiqueta="Deuda total" valor={debtFmt} />
          <Fila etiqueta={metrics.netDebt !== null && metrics.netDebt < 0 ? "Caja neta" : "Deuda neta"} valor={netDebtFmt} />
          <Fila etiqueta="Deuda Neta / EBITDA" valor={netDebtEbitdaFmt} />
        </div>
      </div>
    </div>
  );
}

function TarjetaMultiplo({
  titulo,
  valor,
  subtitulo,
  descripcion,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
  descripcion: string;
}) {
  return (
    <div className="bg-ash card-asymmetric flex flex-col justify-between p-6">
      <div>
        <span className="text-slate font-display text-[12px] uppercase tracking-wider">
          {titulo}
        </span>
        <div className="font-display text-graphite mt-2 text-[32px] tracking-[-0.03em]">
          {valor}
        </div>
        <p className="text-steel font-display mt-1 text-[13px] tracking-[-0.01em]">{subtitulo}</p>
      </div>
      <p className="text-slate mt-4 text-[12px] leading-relaxed">{descripcion}</p>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="border-mist/60 flex items-center justify-between border-b pb-2">
      <span className="text-slate">{etiqueta}</span>
      <span className="font-display text-graphite font-medium">{valor}</span>
    </div>
  );
}
