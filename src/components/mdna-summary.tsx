import { AlertTriangle, Gauge, TrendingUp } from "lucide-react";
import type { MdnaBody } from "@/lib/ai/gemini";
import type { FilingRef } from "@/lib/sec/types";
import { formatDate } from "@/lib/format";

export function MdnaSummary({
  body,
  filing,
  chars,
}: {
  body: MdnaBody;
  filing: FilingRef;
  chars: number;
}) {
  return (
    <div className="space-y-5">
      <div className="border-border/60 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-4 py-3 text-xs">
        <span className="text-muted-foreground">
          Fuente: <span className="text-foreground">{filing.form}</span> presentado el{" "}
          <span className="text-foreground">{formatDate(filing.filingDate)}</span>
        </span>
        <span className="text-muted-foreground">
          {chars.toLocaleString("es-ES")} caracteres de MD&A analizados
        </span>
        <a
          href={filing.documentUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="ml-auto underline underline-offset-4"
        >
          Leer el informe original
        </a>
      </div>

      {body.notice ? (
        <div className="border-derived/40 bg-derived/5 text-derived flex items-start gap-2 rounded-lg border px-4 py-3 text-xs">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <p className="text-pretty">{body.notice}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Bloque
          icono={<TrendingUp className="size-4" />}
          titulo="Impulsores de ingresos"
          puntos={body.drivers}
        />
        <Bloque
          icono={<AlertTriangle className="size-4" />}
          titulo="Riesgos operativos"
          puntos={body.risks}
        />
        <Bloque
          icono={<Gauge className="size-4" />}
          titulo="Tono de la directiva"
          puntos={body.tone ? [body.tone] : []}
        />
      </div>

      <p className="text-muted-foreground text-[11px] text-pretty">
        {body.source === "gemini"
          ? "Resumen generado por Gemini a partir exclusivamente del texto del apartado MD&A del informe. No incorpora conocimiento externo ni hechos posteriores a la presentación."
          : "Frases seleccionadas literalmente del informe, sin intervención de un modelo de lenguaje."}
      </p>
    </div>
  );
}

function Bloque({
  icono,
  titulo,
  puntos,
}: {
  icono: React.ReactNode;
  titulo: string;
  puntos: string[];
}) {
  return (
    <section className="border-border/60 rounded-lg border p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
        <span className="text-muted-foreground">{icono}</span>
        {titulo}
      </h2>
      {puntos.length === 0 ? (
        <p className="text-muted-foreground/70 text-sm">
          El informe no aporta material suficiente para este apartado.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {puntos.map((p, i) => (
            <li key={i} className="text-muted-foreground flex gap-2.5 text-sm text-pretty">
              <span className="bg-muted-foreground/40 mt-2 size-1 shrink-0 rounded-full" />
              {p}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
