import { FRED_SERIES, getFredSeries, yoyChange, type FredSeriesId } from "@/lib/fred/client";
import { MacroChart } from "@/components/macro-chart";
import { DataSourceBadge } from "@/components/data-source-badge";
import { formatDate } from "@/lib/format";

export const revalidate = 86400;
export const metadata = { title: "Macro" };

/* Solo los dos acentos cálidos del sistema; el resto de series van en grafito. */
const COLORES: Record<string, string> = {
  CPIAUCSL: "#98a4f7",
  FEDFUNDS: "#5b63d3",
  UNRATE: "#c9d3ee",
};

const IDS: FredSeriesId[] = ["CPIAUCSL", "FEDFUNDS", "UNRATE"];

export default async function MacroPage() {
  const series = await Promise.all(
    IDS.map(async (id) => {
      try {
        return { id, puntos: await getFredSeries(id), error: null as string | null };
      } catch (error) {
        return {
          id,
          puntos: [],
          error: error instanceof Error ? error.message : "Error desconocido",
        };
      }
    }),
  );

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-16">
      <div className="mb-10 flex flex-wrap items-end gap-5">
        <div>
          <h1 className="font-display text-pure-white text-[36px] font-medium leading-[1.2] tracking-tight">Panel Macroeconómico</h1>
          <p className="text-frost mt-2 max-w-xl text-[16px] leading-[1.6]">
            Series oficiales de la Reserva Federal de San Luis, sin transformar salvo donde se indica.
          </p>
        </div>
        <DataSourceBadge
          source="FRED"
          detail="Federal Reserve Economic Data del Banco de la Reserva Federal de San Luis."
          href="https://fred.stlouisfed.org/"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {series.map(({ id, puntos, error }) => {
          const meta = FRED_SERIES[id];
          const ultimo = puntos.at(-1);
          const yoy = meta.yoy ? yoyChange(puntos) : null;
          const ultimoYoy = yoy?.at(-1);

          return (
            <section key={id} className="bg-carbon-surface border-gunmetal rounded-2xl border p-8">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-pure-white text-[18px] font-medium tracking-tight">{meta.label}</h2>
                <a
                  href={`https://fred.stlouisfed.org/series/${id}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-periwinkle-glow hover:underline font-mono text-[12px]"
                >
                  {id}
                </a>
              </div>

              {error ? (
                <p className="text-muted-steel py-10 text-center text-[15px]">{error}</p>
              ) : !ultimo ? (
                <p className="text-muted-steel py-10 text-center text-[15px]">Sin observaciones.</p>
              ) : (
                <>
                  <div className="mb-5 flex items-baseline gap-3">
                    <span className="tabular font-display text-pure-white text-[36px] font-medium leading-none tracking-tight">
                      {ultimoYoy
                        ? `${ultimoYoy.value >= 0 ? "+" : "−"}${Math.abs(ultimoYoy.value).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`
                        : ultimo.value.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-muted-steel text-[13px] font-mono">
                      {ultimoYoy ? "interanual" : meta.unit} · {formatDate(ultimo.date)}
                    </span>
                  </div>
                  <MacroChart
                    points={(yoy ?? puntos).slice(-360)}
                    unidad={yoy ? "%" : meta.unit}
                    color={COLORES[id]}
                  />
                  <p className="text-frost mt-4 text-[13px] leading-[1.6] text-pretty">
                    {meta.description}
                    {yoy ? " Se representa la variación interanual del índice." : ""}
                  </p>
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
