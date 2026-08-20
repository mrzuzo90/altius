import { FRED_SERIES, getFredSeries, yoyChange, type FredSeriesId } from "@/lib/fred/client";
import { MacroChart } from "@/components/macro-chart";
import { DataSourceBadge } from "@/components/data-source-badge";
import { formatDate } from "@/lib/format";

export const revalidate = 86400;
export const metadata = { title: "Macro" };

/* Solo los dos acentos cálidos del sistema; el resto de series van en grafito. */
const COLORES: Record<string, string> = {
  CPIAUCSL: "var(--color-ember)",
  FEDFUNDS: "var(--color-brass)",
  UNRATE: "var(--color-graphite)",
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
          <h1 className="font-display text-graphite text-[40px] leading-[1.2] tracking-[-0.8px]">Panel macroeconómico</h1>
          <p className="text-steel mt-3 max-w-xl text-[18px] leading-[1.5]">
            Series oficiales de la Reserva Federal de San Luis, sin transformar salvo donde se indica.
          </p>
        </div>
        <DataSourceBadge
          source="FRED"
          detail="Federal Reserve Economic Data del Banco de la Reserva Federal de San Luis."
          href="https://fred.stlouisfed.org/"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {series.map(({ id, puntos, error }) => {
          const meta = FRED_SERIES[id];
          const ultimo = puntos.at(-1);
          const yoy = meta.yoy ? yoyChange(puntos) : null;
          const ultimoYoy = yoy?.at(-1);

          return (
            <section key={id} className="bg-canvas-white border-mist rounded-[20px] border p-8">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-graphite text-[18px] tracking-[-0.02em]">{meta.label}</h2>
                <a
                  href={`https://fred.stlouisfed.org/series/${id}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brass font-display text-[12px] tracking-[-0.02em] transition-opacity hover:opacity-70"
                >
                  {id}
                </a>
              </div>

              {error ? (
                <p className="text-slate py-10 text-center text-[15px]">{error}</p>
              ) : !ultimo ? (
                <p className="text-slate py-10 text-center text-[15px]">Sin observaciones.</p>
              ) : (
                <>
                  <div className="mb-5 flex items-baseline gap-3">
                    <span className="tabular font-display text-graphite text-[40px] leading-[1.2] tracking-[-0.8px]">
                      {ultimoYoy
                        ? `${ultimoYoy.value >= 0 ? "+" : "−"}${Math.abs(ultimoYoy.value).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`
                        : ultimo.value.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-slate text-[13px]">
                      {ultimoYoy ? "interanual" : meta.unit} · {formatDate(ultimo.date)}
                    </span>
                  </div>
                  <MacroChart
                    points={(yoy ?? puntos).slice(-360)}
                    unidad={yoy ? "%" : meta.unit}
                    color={COLORES[id]}
                  />
                  <p className="text-steel mt-4 text-[13px] leading-[1.5] text-pretty">
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
