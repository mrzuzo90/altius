"use client";

import { useState } from "react";
import Link from "next/link";
import { MARKET_LEADERS, type MarketLeader } from "@/lib/home/leaders-data";
import { Sparkline } from "@/components/sparkline";
import { TrendingUp, TrendingDown, Table, Copy, Check } from "lucide-react";

export function MarketLeadersTable({ leaders: providedLeaders }: { leaders?: MarketLeader[] }) {
  const leadersList = providedLeaders && providedLeaders.length > 0 ? providedLeaders : MARKET_LEADERS;
  const [regionFilter, setRegionFilter] = useState<"all" | "us" | "europe">("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [copiado, setCopiado] = useState(false);

  const sectores = ["all", "Technology", "Semiconductors", "Software & Cloud", "Pharmaceuticals", "Banking & Finance"];

  const filtered = leadersList.filter((m) => {
    const matchRegion = regionFilter === "all" || m.region === regionFilter;
    const matchSector = sectorFilter === "all" || m.sector === sectorFilter;
    return matchRegion && matchSector;
  });

  const copiarTabla = () => {
    const cabecera = ["Ticker", "Empresa", "Sector", "Precio", "Var %", "Market Cap ($M)", "PER", "EV/EBITDA", "Margen FCF %", "ROIC %", "Crecimiento %"].join("\t");
    const filas = filtered.map((m) => [
      m.ticker,
      m.name,
      m.sector,
      m.price > 0 ? m.price : "—",
      m.price > 0 ? m.changePct : "—",
      m.marketCap > 0 ? m.marketCap : "—",
      m.pe ?? "—",
      m.evEbitda ?? "—",
      m.fcfMargin !== null ? m.fcfMargin : "—",
      m.roic !== null ? m.roic : "—",
      m.revenueGrowth !== null ? m.revenueGrowth : "—",
    ].join("\t"));
    navigator.clipboard.writeText([cabecera, ...filas].join("\n"));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gunmetal pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Table className="size-4 text-periwinkle-glow" />
            <h3 className="font-display text-pure-white text-[18px] font-medium tracking-tight">
              Líderes de Mercado y Múltiplos en Vivo
            </h3>
          </div>
          <p className="text-muted-steel text-[13px] mt-1">
            Métricas fundamentales, rentabilidad sobre capital y valoración LTM de las mayores cotizadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copiarTabla}
            className="border-gunmetal bg-void-black hover:border-steel-border/50 text-muted-steel hover:text-pure-white font-display flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-all shadow-xs"
          >
            {copiado ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copiada</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copiar tabla</span>
              </>
            )}
          </button>

          {/* Filtro Geográfico */}
          <div className="bg-void-black border-gunmetal rounded-full border p-0.5 flex items-center">
            <button
              type="button"
              onClick={() => setRegionFilter("all")}
              className={`rounded-full px-3 py-1 text-[12px] font-display transition-colors ${
                regionFilter === "all"
                  ? "bg-gunmetal text-pure-white"
                  : "text-muted-steel hover:text-frost"
              }`}
            >
              Global
            </button>
            <button
              type="button"
              onClick={() => setRegionFilter("us")}
              className={`rounded-full px-3 py-1 text-[12px] font-display transition-colors ${
                regionFilter === "us"
                  ? "bg-gunmetal text-pure-white"
                  : "text-muted-steel hover:text-frost"
              }`}
            >
              EE. UU.
            </button>
            <button
              type="button"
              onClick={() => setRegionFilter("europe")}
              className={`rounded-full px-3 py-1 text-[12px] font-display transition-colors ${
                regionFilter === "europe"
                  ? "bg-gunmetal text-pure-white"
                  : "text-muted-steel hover:text-frost"
              }`}
            >
              Europa
            </button>
          </div>

          {/* Filtro por Sector */}
          <div className="bg-void-black border-gunmetal rounded-full border p-0.5 flex flex-wrap gap-1 max-w-full overflow-x-auto">
            {sectores.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSectorFilter(sec)}
                className={`rounded-full px-3 py-1 text-[12px] font-display transition-colors ${
                  sectorFilter === sec
                    ? "bg-gunmetal text-pure-white"
                    : "text-muted-steel hover:text-frost"
                }`}
              >
                {sec === "all" ? "Todos los sectores" : sec}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse tabular font-sans">
          <thead>
            <tr className="border-b border-gunmetal/80 text-muted-steel font-mono text-[11px] uppercase tracking-wider">
              <th className="pb-3 pl-2 font-medium">Ticker</th>
              <th className="pb-3 font-medium">Empresa</th>
              <th className="pb-3 text-right font-medium">Precio</th>
              <th className="pb-3 text-right font-medium">Var %</th>
              <th className="pb-3 text-right font-medium">Market Cap</th>
              <th className="pb-3 text-right font-medium">PER (LTM)</th>
              <th className="pb-3 text-right font-medium">EV/EBITDA</th>
              <th className="pb-3 text-right font-medium">Margen FCF</th>
              <th className="pb-3 text-right font-medium">ROIC</th>
              <th className="pb-3 text-right font-medium">Crec. Ventas</th>
              <th className="pb-3 text-center font-medium w-20">Histórico</th>
              <th className="pb-3 text-right pr-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gunmetal/40">
            {filtered.map((item) => {
              const isUp = item.changePct >= 0;
              const hasPrice = item.price > 0;

              return (
                <tr key={item.ticker} className="hover:bg-gunmetal/30 transition-colors group">
                  <td className="py-3.5 pl-2 font-mono font-bold text-pure-white">
                    <Link href={`/ticker/${item.ticker}`} className="hover:text-periwinkle-glow transition-colors">
                      {item.ticker}
                    </Link>
                  </td>
                  <td className="py-3.5 text-frost font-medium truncate max-w-[160px]">
                    <Link href={`/ticker/${item.ticker}`} className="hover:text-pure-white transition-colors">
                      {item.name}
                    </Link>
                  </td>
                  <td className="py-3.5 text-right font-mono text-pure-white font-medium">
                    {hasPrice ? `$${item.price.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-3.5 text-right font-mono">
                    {hasPrice ? (
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                          isUp
                            ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
                            : "text-rose-400 bg-rose-950/40 border border-rose-800/40"
                        }`}
                      >
                        {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {isUp ? "+" : ""}{item.changePct.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-muted-steel">—</span>
                    )}
                  </td>
                  <td className="py-3.5 text-right font-mono text-frost">
                    {item.marketCap > 0 ? `$${(item.marketCap / 1000).toFixed(1)} B` : "—"}
                  </td>
                  <td className="py-3.5 text-right font-mono text-pure-white font-medium">
                    {item.pe !== null ? `${item.pe.toFixed(1)}x` : "—"}
                  </td>
                  <td className="py-3.5 text-right font-mono text-frost">
                    {item.evEbitda !== null ? `${item.evEbitda.toFixed(1)}x` : "—"}
                  </td>
                  <td className="py-3.5 text-right font-mono text-frost">
                    {item.fcfMargin !== null ? `${item.fcfMargin.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-3.5 text-right font-mono text-emerald-400 font-semibold">
                    {item.roic !== null ? `${item.roic.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-3.5 text-right font-mono text-frost">
                    {item.revenueGrowth !== null ? `+${item.revenueGrowth.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-3.5 text-center">
                    <div className="w-16 mx-auto">
                      {item.trend.length > 2 ? (
                        <Sparkline values={item.trend} color={isUp ? "#34d399" : "#f87171"} />
                      ) : (
                        <span className="text-muted-steel text-[11px]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 text-right pr-2 font-mono">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/ticker/${item.ticker}/financials`}
                        title="Abrir Estados Financieros"
                        className="text-muted-steel hover:text-periwinkle-glow transition-colors text-[11px] border border-gunmetal hover:border-steel-border/50 bg-void-black px-2 py-1 rounded"
                      >
                        XBRL
                      </Link>
                      <Link
                        href={`/ticker/${item.ticker}/valuation`}
                        title="Abrir Calculadora de Valoración"
                        className="text-muted-steel hover:text-periwinkle-glow transition-colors text-[11px] border border-gunmetal hover:border-steel-border/50 bg-void-black px-2 py-1 rounded"
                      >
                        DCF
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
