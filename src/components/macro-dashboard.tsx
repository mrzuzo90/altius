"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, BarChart3, Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { MacroChart } from "@/components/macro-chart";
import { MacroSeriesDialog } from "@/components/macro-series-dialog";
import type { MacroMetricConfig, MacroPoint, MacroRegion } from "@/lib/macro/metrics";

export type MacroSeriesItem = {
  metric: MacroMetricConfig;
  points: MacroPoint[];
  yoyPoints?: MacroPoint[] | null;
  error: string | null;
};

export function MacroDashboard({ series }: { series: MacroSeriesItem[] }) {
  const [selectedRegion, setSelectedRegion] = useState<MacroRegion | "all">("all");
  const [activeSeries, setActiveSeries] = useState<MacroSeriesItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredSeries = useMemo(() => {
    if (selectedRegion === "all") return series;
    return series.filter((item) => item.metric.region === selectedRegion);
  }, [selectedRegion, series]);

  const handleOpenMetric = (item: MacroSeriesItem) => {
    setActiveSeries(item);
    setDialogOpen(true);
  };

  return (
    <div>
      {/* Filtros por región */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-gunmetal pb-4">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-periwinkle-glow" />
          <span className="text-muted-steel text-[13px] font-medium">Filtrar por región económica:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={selectedRegion === "all"}
            onClick={() => setSelectedRegion("all")}
            className={cn(
              "font-display rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors",
              selectedRegion === "all"
                ? "bg-periwinkle-glow text-void-black border-transparent font-semibold shadow-sm"
                : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
            )}
          >
            Todos ({series.length})
          </button>
          <button
            type="button"
            aria-pressed={selectedRegion === "eurozone"}
            onClick={() => setSelectedRegion("eurozone")}
            className={cn(
              "font-display inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors",
              selectedRegion === "eurozone"
                ? "bg-periwinkle-glow text-void-black border-transparent font-semibold shadow-sm"
                : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
            )}
          >
            <span>🇪🇺</span>
            <span>Zona Euro</span>
          </button>
          <button
            type="button"
            aria-pressed={selectedRegion === "us"}
            onClick={() => setSelectedRegion("us")}
            className={cn(
              "font-display inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors",
              selectedRegion === "us"
                ? "bg-periwinkle-glow text-void-black border-transparent font-semibold shadow-sm"
                : "border-gunmetal bg-void-black text-muted-steel hover:text-frost",
            )}
          >
            <span>🇺🇸</span>
            <span>Estados Unidos</span>
          </button>
        </div>
      </div>

      {/* Grid de indicadores */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSeries.map((item) => {
          const { metric, points, yoyPoints, error } = item;
          const displayPoints = yoyPoints ?? points;
          const ultimo = points.at(-1);
          const ultimoYoy = yoyPoints?.at(-1);

          return (
            <article
              key={metric.id}
              className="bg-carbon-surface border-gunmetal rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 hover:border-periwinkle-glow/40 hover:shadow-lg group cursor-pointer"
              onClick={() => handleOpenMetric(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpenMetric(item);
                }
              }}
            >
              <div>
                {/* Cabecera de la tarjeta */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" role="img" aria-label={metric.regionLabel}>
                      {metric.regionFlag}
                    </span>
                    <div>
                      <h2 className="font-display text-pure-white text-[17px] font-medium tracking-tight group-hover:text-periwinkle-glow transition-colors">
                        {metric.label}
                      </h2>
                      <span className="text-muted-steel text-[11px] font-mono">
                        {metric.regionLabel} · {metric.seriesId}
                      </span>
                    </div>
                  </div>

                  <span
                    className="text-muted-steel group-hover:text-periwinkle-glow transition-colors p-1"
                    title="Abrir gráfico con Cid"
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>

                {error ? (
                  <p className="text-muted-steel py-10 text-center text-[14px]">{error}</p>
                ) : !ultimo ? (
                  <p className="text-muted-steel py-10 text-center text-[14px]">Sin observaciones.</p>
                ) : (
                  <>
                    <div className="mb-4 flex items-baseline gap-3">
                      <span className="tabular font-display text-pure-white text-[32px] font-bold leading-none tracking-tight">
                        {ultimoYoy
                          ? `${ultimoYoy.value >= 0 ? "+" : "−"}${Math.abs(ultimoYoy.value).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`
                          : `${ultimo.value.toLocaleString("es-ES", { maximumFractionDigits: 2 })} ${metric.chartUnit}`}
                      </span>
                      <span className="text-muted-steel text-[12px] font-mono">
                        {ultimoYoy ? "interanual" : metric.unit} · {formatDate(ultimo.date)}
                      </span>
                    </div>

                    <MacroChart
                      points={displayPoints.slice(-240)}
                      unidad={metric.chartUnit}
                      color={metric.color}
                    />

                    <p className="text-frost mt-4 text-[12px] leading-[1.6] line-clamp-2">
                      {metric.description}
                    </p>
                  </>
                )}
              </div>

              {/* Botón de acción al pie */}
              <div className="mt-5 pt-3 border-t border-gunmetal/60 flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-1 text-periwinkle-glow font-medium group-hover:underline">
                  <Sparkles className="size-3.5" />
                  <span>Ver análisis e histórico</span>
                </span>
                <span className="text-muted-steel text-[11px] font-mono">
                  {displayPoints.length} datos
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal interactivo con Cid y explicaciones didácticas */}
      <MacroSeriesDialog
        metric={activeSeries?.metric ?? null}
        points={activeSeries ? (activeSeries.yoyPoints ?? activeSeries.points) : []}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
