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
    <div className="space-y-6">
      <div className="border-gunmetal flex flex-wrap items-center gap-x-8 gap-y-2 border-y py-4 text-[13px]">
        <span className="text-muted-steel">
          Fuente <span className="text-pure-white font-medium">{filing.form}</span> presentado el{" "}
          <span className="text-pure-white font-medium">{formatDate(filing.filingDate)}</span>
        </span>
        <span className="text-muted-steel">
          {chars.toLocaleString("es-ES")} caracteres analizados
        </span>
        <a
          href={filing.documentUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="font-display text-periwinkle-glow hover:underline ml-auto text-[14px] font-medium tracking-tight"
        >
          Leer el informe original
        </a>
      </div>

      {body.notice ? (
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border text-frost flex items-start gap-3 px-6 py-4 text-[13px]">
          <AlertTriangle className="text-periwinkle-glow mt-0.5 size-4 shrink-0" />
          <p className="text-pretty">{body.notice}</p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <Bloque
          icono={<TrendingUp className="size-4" />}
          indice="01"
          titulo="Impulsores de ingresos"
          puntos={body.drivers}
        />
        <Bloque
          icono={<AlertTriangle className="size-4" />}
          indice="02"
          titulo="Riesgos operativos"
          puntos={body.risks}
        />
        <Bloque
          icono={<Gauge className="size-4" />}
          indice="03"
          titulo="Tono de la directiva"
          puntos={body.tone ? [body.tone] : []}
        />
      </div>

      <p className="text-muted-steel max-w-3xl text-[13px] leading-[1.6] text-pretty">
        {body.source === "gemini"
          ? "Resumen generado por Gemini a partir exclusivamente del texto del apartado de análisis de la dirección. No incorpora conocimiento externo ni hechos posteriores a la presentación del informe."
          : "Frases seleccionadas literalmente del informe, sin intervención de un modelo de lenguaje."}
      </p>
    </div>
  );
}

function Bloque({
  icono,
  indice,
  titulo,
  puntos,
}: {
  icono: React.ReactNode;
  indice: string;
  titulo: string;
  puntos: string[];
}) {
  return (
    <section className="bg-carbon-surface border-gunmetal rounded-2xl border p-8 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-periwinkle-glow">{icono}</span>
          <span className="font-mono text-muted-steel text-[12px]">{indice}</span>
        </div>
        <h2 className="font-display text-pure-white mt-3 text-[20px] font-medium leading-[1.2] tracking-tight">
          {titulo}
        </h2>
        {puntos.length === 0 ? (
          <p className="text-muted-steel mt-4 text-[14px]">
            El informe no aporta material suficiente para este apartado.
          </p>
        ) : (
          <ul className="mt-5 space-y-3.5">
            {puntos.map((p, i) => (
              <li key={i} className="text-frost flex gap-3 text-[14px] leading-[1.6] text-pretty">
                <span className="bg-periwinkle-glow mt-2.5 size-1 shrink-0 rounded-full" />
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
