import type { ValuationMetrics } from "@/lib/valuation/types";

export function ValuationAuditPanel({
  metrics,
  priceSource,
  financialSource = "SEC EDGAR",
}: {
  metrics: ValuationMetrics;
  priceSource: string | null;
  financialSource?: string;
}) {
  return (
    <aside className="border-gunmetal bg-carbon-surface rounded-2xl border p-6">
      <h3 className="font-display text-pure-white text-[16px] font-medium">Cómo se construye esta valoración</h3>
      <p className="text-muted-steel mt-1 text-[12px]">
        Los estados proceden de {financialSource}. Las proyecciones son escenarios editables del usuario.
      </p>
      <dl className="mt-4 grid gap-3 text-[12px] sm:grid-cols-2 lg:grid-cols-4">
        <AuditItem label="Cotización" value={priceSource && metrics.priceDate ? `${priceSource} · ${metrics.priceDate}` : "— · sin dato"} />
        <AuditItem label="Base financiera" value={metrics.lastFiscalYear ? `${financialSource} · FY ${metrics.lastFiscalYear}` : `${financialSource} · sin periodo utilizable`} />
        <AuditItem label="Market Cap" value="Precio × acciones diluidas" />
        <AuditItem label="Enterprise Value" value="Market Cap + deuda neta" />
      </dl>
    </aside>
  );
}

function AuditItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-gunmetal/60 border-l pl-3">
      <dt className="text-muted-steel font-mono uppercase">{label}</dt>
      <dd className="text-frost mt-1">{value}</dd>
    </div>
  );
}
