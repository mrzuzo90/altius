import Link from "next/link";
import { ArrowUpRight, Activity, Percent, Users, Layers } from "lucide-react";

export function MarketOverviewCards({
  cpiValue,
  fedFundsValue,
  unrateValue,
}: {
  cpiValue?: number;
  fedFundsValue?: number;
  unrateValue?: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Inflación IPC */}
      <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5 flex flex-col justify-between hover:border-steel-border/40 transition-colors group">
        <div className="flex items-center justify-between">
          <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="size-3.5 text-periwinkle-glow" />
            Inflación IPC (YoY)
          </span>
          <span className="text-[11px] font-mono text-periwinkle-glow bg-void-black px-2 py-0.5 rounded-full border border-gunmetal">
            FRED
          </span>
        </div>
        <div className="my-3">
          <div className="font-display text-pure-white text-[30px] font-medium tracking-tight tabular">
            {cpiValue !== undefined ? `${cpiValue.toFixed(1)} %` : "—"}
          </div>
          <p className="text-muted-steel text-[12px]">Variación interanual IPC EE. UU.</p>
        </div>
        <div className="flex items-center justify-between border-t border-gunmetal/60 pt-3 text-[12px]">
          <span className="text-frost/80">Tendencia 12 meses</span>
          <Link href="/macro" className="text-periwinkle-glow group-hover:underline inline-flex items-center gap-0.5">
            <span>Ver serie</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Tipo Fondos Federales */}
      <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5 flex flex-col justify-between hover:border-steel-border/40 transition-colors group">
        <div className="flex items-center justify-between">
          <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="size-3.5 text-periwinkle-glow" />
            Tipo de la Fed
          </span>
          <span className="text-[11px] font-mono text-periwinkle-glow bg-void-black px-2 py-0.5 rounded-full border border-gunmetal">
            FEDFUNDS
          </span>
        </div>
        <div className="my-3">
          <div className="font-display text-pure-white text-[30px] font-medium tracking-tight tabular">
            {fedFundsValue !== undefined ? `${fedFundsValue.toFixed(2)} %` : "—"}
          </div>
          <p className="text-muted-steel text-[12px]">Tipo efectivo interbancario</p>
        </div>
        <div className="flex items-center justify-between border-t border-gunmetal/60 pt-3 text-[12px]">
          <span className="text-frost/80">Política monetaria</span>
          <Link href="/macro" className="text-periwinkle-glow group-hover:underline inline-flex items-center gap-0.5">
            <span>Ver serie</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Desempleo */}
      <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5 flex flex-col justify-between hover:border-steel-border/40 transition-colors group">
        <div className="flex items-center justify-between">
          <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Users className="size-3.5 text-periwinkle-glow" />
            Desempleo EE. UU.
          </span>
          <span className="text-[11px] font-mono text-periwinkle-glow bg-void-black px-2 py-0.5 rounded-full border border-gunmetal">
            UNRATE
          </span>
        </div>
        <div className="my-3">
          <div className="font-display text-pure-white text-[30px] font-medium tracking-tight tabular">
            {unrateValue !== undefined ? `${unrateValue.toFixed(1)} %` : "—"}
          </div>
          <p className="text-muted-steel text-[12px]">Tasa de paro desestacionalizada</p>
        </div>
        <div className="flex items-center justify-between border-t border-gunmetal/60 pt-3 text-[12px]">
          <span className="text-frost/80">Mercado laboral</span>
          <Link href="/macro" className="text-periwinkle-glow group-hover:underline inline-flex items-center gap-0.5">
            <span>Ver serie</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Cobertura fundamental regulatoria */}
      <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5 flex flex-col justify-between hover:border-steel-border/40 transition-colors group">
        <div className="flex items-center justify-between">
          <span className="text-muted-steel font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="size-3.5 text-periwinkle-glow" />
            Universo Fundamental
          </span>
          <span className="text-[11px] font-mono text-periwinkle-glow bg-void-black px-2 py-0.5 rounded-full border border-gunmetal">
            SEC + ESEF
          </span>
        </div>
        <div className="my-3">
          <div className="font-display text-pure-white text-[30px] font-medium tracking-tight tabular">
            XBRL
          </div>
          <p className="text-muted-steel text-[12px]">Emisores con filings estructurados</p>
        </div>
        <div className="flex items-center justify-between border-t border-gunmetal/60 pt-3 text-[12px]">
          <span className="text-frost/80">10-K, 10-Q e informes ESEF</span>
          <span className="text-muted-steel font-mono text-[11px]">100% oficial</span>
        </div>
      </div>
    </div>
  );
}
