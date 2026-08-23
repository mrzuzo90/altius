import Link from "next/link";
import { ArrowRight, ArrowUpRight, Flame, Layers, Sparkles, TrendingDown, TrendingUp, Wheat } from "lucide-react";
import { DataSourceBadge } from "@/components/data-source-badge";
import { Sparkline } from "@/components/sparkline";
import { getAllCommoditiesSummary, type CommodityCategory } from "@/lib/commodities";
import { cn } from "@/lib/utils";

export const revalidate = 3600;
export const metadata = { title: "Materias Primas (Commodities) | Altius" };

const CATEGORIAS: { id: CommodityCategory; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: "energy",
    label: "Energía & Petróleo",
    icon: <Flame className="size-4 text-amber-400" />,
    desc: "Petróleo crudo Brent, WTI y gas natural Henry Hub de referencia internacional.",
  },
  {
    id: "precious_metals",
    label: "Metales Preciosos",
    icon: <Sparkles className="size-4 text-periwinkle-glow" />,
    desc: "Oro y plata física con fijaciones del London Bullion Market (LBMA).",
  },
  {
    id: "industrial_metals",
    label: "Metales Industriales",
    icon: <Layers className="size-4 text-sky-400" />,
    desc: "Cobre y metales básicos de la London Metal Exchange (LME).",
  },
  {
    id: "agriculture",
    label: "Agricultura & Granos",
    icon: <Wheat className="size-4 text-emerald-400" />,
    desc: "Trigo y maíz de referencia en los mercados globales de materias primas.",
  },
];

export default async function CommoditiesPage() {
  const allSummaries = await getAllCommoditiesSummary();

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-14 space-y-12">
      {/* Cabecera de Sección */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gunmetal bg-carbon-surface px-3.5 py-1 text-[12px] font-mono text-periwinkle-glow shadow-xs mb-3">
            <span className="size-2 rounded-full bg-periwinkle-glow animate-pulse" />
            <span>MERCADOS GLOBALES · PRECIOS SPOT Y FIXINGS OFICIALES</span>
          </div>
          <h1 className="font-display text-pure-white text-[36px] font-medium leading-[1.15] tracking-tight sm:text-[42px]">
            Observatorio de Materias Primas
          </h1>
          <p className="text-frost mt-2 max-w-2xl text-[16px] leading-[1.6]">
            Cotizaciones oficiales de petróleo crudo (Brent / WTI), gas natural, metales preciosos (oro, plata), cobre e insumos agrícolas leídos de la EIA, LBMA, FMI y Banco Mundial vía FRED.
          </p>
        </div>

        <DataSourceBadge
          source="EIA, LBMA, FMI & FRED"
          detail="Series continuas de precios al contado y fijaciones de Londres provistas por organismos oficiales."
          href="https://fred.stlouisfed.org/"
        />
      </div>

      {/* Secciones por Categoría */}
      <div className="space-y-12">
        {CATEGORIAS.map((cat) => {
          const items = allSummaries.filter((s) => s.category === cat.id);
          if (items.length === 0) return null;

          return (
            <section key={cat.id} className="space-y-4">
              <div className="border-b border-gunmetal/80 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-carbon-surface border border-gunmetal flex items-center justify-center">
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className="font-display text-pure-white text-[20px] font-medium tracking-tight">
                      {cat.label}
                    </h2>
                    <p className="text-muted-steel text-[12px]">{cat.desc}</p>
                  </div>
                </div>
                <span className="text-muted-steel font-mono text-[12px]">
                  {items.length} {items.length === 1 ? "activo" : "activos"}
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => {
                  const isUp = (s.change1D ?? 0) >= 0;

                  return (
                    <Link
                      key={s.symbol}
                      href={`/commodities/${s.slug}`}
                      className="bg-carbon-surface border-gunmetal rounded-2xl border p-6 flex flex-col justify-between hover:border-steel-border/50 transition-all group relative"
                    >
                      <div>
                        <div className="flex items-baseline justify-between gap-3 mb-2">
                          <span className="font-mono text-amber-300 font-bold text-[13px] bg-void-black px-2.5 py-0.5 rounded-md border border-gunmetal">
                            {s.shortName}
                          </span>
                          <span className="text-muted-steel text-[11px] font-mono">
                            {s.unit}
                          </span>
                        </div>

                        <h3 className="font-display text-pure-white text-[17px] font-medium tracking-tight mb-2.5 line-clamp-1">
                          {s.name}
                        </h3>

                        <div className="flex items-baseline gap-3 mb-4">
                          <span className="tabular font-display text-pure-white text-[30px] font-medium leading-none tracking-tight">
                            ${s.currentValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
                          </span>
                          {s.change1D !== undefined && (
                            <span
                              className={cn(
                                "tabular text-[12px] font-mono font-medium px-2 py-0.5 rounded flex items-center gap-1",
                                isUp
                                  ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
                                  : "text-rose-400 bg-rose-950/40 border border-rose-800/40",
                              )}
                            >
                              {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                              {isUp ? "+" : ""}{s.change1D.toFixed(2)}%
                            </span>
                          )}
                        </div>

                        {/* Sparkline */}
                        {s.recentSparkline.length > 2 && (
                          <div className="my-3 py-2 border-y border-gunmetal/60">
                            <div className="flex items-center justify-between text-[11px] font-mono text-muted-steel mb-1">
                              <span>30 sesiones</span>
                              <span className={cn(s.recentSparkline.at(-1)! >= s.recentSparkline[0] ? "text-emerald-400" : "text-rose-400")}>
                                {s.recentSparkline.at(-1)! >= s.recentSparkline[0] ? "+" : ""}
                                {(
                                  ((s.recentSparkline.at(-1)! - s.recentSparkline[0]) /
                                    s.recentSparkline[0]) *
                                  100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                            <Sparkline
                              values={s.recentSparkline}
                              color={s.recentSparkline.at(-1)! >= s.recentSparkline[0] ? "#34d399" : "#f87171"}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-3">
                          <div className="bg-void-black/70 border border-gunmetal/80 p-2 rounded-lg">
                            <span className="text-muted-steel block text-[10px]">1 AÑO</span>
                            <span className={cn("font-medium", (s.change1Y ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                              {s.change1Y !== undefined ? `${(s.change1Y >= 0 ? "+" : "")}${s.change1Y.toFixed(1)}%` : "—"}
                            </span>
                          </div>
                          <div className="bg-void-black/70 border border-gunmetal/80 p-2 rounded-lg">
                            <span className="text-muted-steel block text-[10px]">MÁX. 52S</span>
                            <span className="text-pure-white font-medium">
                              ${s.high52w.toLocaleString("es-ES", { maximumFractionDigits: 1 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-gunmetal/60 flex items-center justify-between text-[12px]">
                        <span className="text-muted-steel group-hover:text-frost transition-colors">
                          Análisis técnico e indicadores
                        </span>
                        <span className="text-periwinkle-glow inline-flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition-transform">
                          <span>Ver {s.shortName}</span>
                          <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Banner de Garantía de Fuentes */}
      <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <h4 className="font-display text-pure-white text-[18px] font-medium tracking-tight">
            Metodología y Fuentes Verificables
          </h4>
          <p className="text-frost/80 text-[14px] leading-[1.6]">
            Altius sincroniza directamente las fijaciones spot oficiales publicadas por la Administración de Información Energética de EE. UU. (EIA), la Asociación del Mercado de Lingotes de Londres (LBMA) y el Fondo Monetario Internacional.
          </p>
        </div>
        <Link
          href="/indices"
          className="btn-primary-gradient shrink-0 px-5 py-2.5 text-[14px] font-medium inline-flex items-center gap-2"
        >
          <span>Explorar Índices Bursátiles</span>
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
