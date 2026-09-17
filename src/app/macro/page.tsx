import { getFredSeries, yoyChange, type FredSeriesId } from "@/lib/fred/client";
import { MACRO_METRICS, type MacroMetricConfig } from "@/lib/macro/metrics";
import { MacroDashboard, type MacroSeriesItem } from "@/components/macro-dashboard";
import { PurchasingPowerCard } from "@/components/macro/purchasing-power-card";
import { DataSourceBadge } from "@/components/data-source-badge";

export const revalidate = 86400;
export const metadata = {
  title: "Macro · Eurozona y EE.UU.",
  description:
    "Indicadores macroeconómicos oficiales de la Eurozona y Estados Unidos, gráfico de pérdida de poder adquisitivo del dinero y análisis educativo con Cid.",
};

const ORDERED_SERIES_IDS: FredSeriesId[] = [
  // Eurozona
  "CP0000EZ19M086NEST",
  "ECBMRRFR",
  "EZ_UNRATE",
  // Estados Unidos
  "CPIAUCSL",
  "FEDFUNDS",
  "UNRATE",
];

export default async function MacroPage() {
  const series: MacroSeriesItem[] = await Promise.all(
    ORDERED_SERIES_IDS.map(async (id) => {
      const metric: MacroMetricConfig = MACRO_METRICS[id];
      try {
        const puntos = await getFredSeries(id);
        const yoyPoints = metric.yoy ? yoyChange(puntos) : null;
        return {
          metric,
          points: puntos,
          yoyPoints,
          error: null,
        };
      } catch (error) {
        return {
          metric,
          points: [],
          yoyPoints: null,
          error: error instanceof Error ? error.message : "Error desconocido al cargar serie",
        };
      }
    }),
  );

  const europeInflationPoints =
    series.find((s) => s.metric.id === "CP0000EZ19M086NEST")?.points ?? [];
  const usInflationPoints =
    series.find((s) => s.metric.id === "CPIAUCSL")?.points ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-pure-white text-[36px] font-medium leading-[1.2] tracking-tight">
            Panel Macroeconómico
          </h1>
          <p className="text-frost mt-2 max-w-2xl text-[16px] leading-[1.6]">
            Series oficiales del Banco Central Europeo, Eurostat y la Reserva Federal. Abre cualquier indicador para ver la evolución completa con Cid, el rendimiento anualizado y la guía didáctica.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <DataSourceBadge
            source="Eurostat / BCE"
            detail="Oficina Estadística de la Unión Europea y Banco Central Europeo."
            href="https://ec.europa.eu/eurostat/"
          />
          <DataSourceBadge
            source="FRED"
            detail="Federal Reserve Economic Data del Banco de la Reserva Federal de San Luis."
            href="https://fred.stlouisfed.org/"
          />
        </div>
      </div>

      <MacroDashboard series={series} />

      {/* Gráfico interactivo: ¿Cuánto vale tu dinero? Pérdida de poder adquisitivo */}
      <PurchasingPowerCard
        europeRawPoints={europeInflationPoints}
        usRawPoints={usInflationPoints}
      />
    </div>
  );
}
