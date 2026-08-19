import { FRED_SERIES, getFredSeries, yoyChange, type FredSeriesId } from "@/lib/fred/client";
import { MacroChart } from "@/components/macro-chart";
import { DataSourceBadge } from "@/components/data-source-badge";
import { formatDate } from "@/lib/format";

export const revalidate = 86400;
export const metadata = { title: "Macro" };

const COLORES: Record<string, string> = {
  CPIAUCSL: "var(--color-chart-2)",
  FEDFUNDS: "var(--color-chart-1)",
  UNRATE: "var(--color-chart-4)",
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
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panel macroeconómico</h1>
          <p className="text-muted-foreground mt-1 text-sm">
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
            <section key={id} className="border-border/60 rounded-lg border p-5">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium">{meta.label}</h2>
                <a
                  href={`https://fred.stlouisfed.org/series/${id}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-muted-foreground hover:text-foreground font-mono text-[11px] transition-colors"
                >
                  {id}
                </a>
              </div>

              {error ? (
                <p className="text-muted-foreground py-8 text-center text-sm">{error}</p>
              ) : !ultimo ? (
                <p className="text-muted-foreground py-8 text-center text-sm">Sin observaciones.</p>
              ) : (
                <>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="tabular text-2xl font-semibold">
                      {ultimoYoy
                        ? `${ultimoYoy.value >= 0 ? "+" : "−"}${Math.abs(ultimoYoy.value).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`
                        : ultimo.value.toLocaleString("es-ES", { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {ultimoYoy ? "interanual" : meta.unit} · {formatDate(ultimo.date)}
                    </span>
                  </div>
                  <MacroChart
                    points={(yoy ?? puntos).slice(-360)}
                    unidad={yoy ? "%" : meta.unit}
                    color={COLORES[id]}
                  />
                  <p className="text-muted-foreground mt-3 text-[11px] text-pretty">
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
