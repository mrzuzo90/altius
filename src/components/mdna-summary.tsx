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
      <div className="border-mist flex flex-wrap items-center gap-x-8 gap-y-2 border-y py-4 text-[13px]">
        <span className="text-slate">
          Fuente <span className="text-graphite">{filing.form}</span> presentado el{" "}
          <span className="text-graphite">{formatDate(filing.filingDate)}</span>
        </span>
        <span className="text-slate">
          {chars.toLocaleString("es-ES")} caracteres analizados
        </span>
        <a
          href={filing.documentUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="font-display text-graphite link-ember ml-auto text-[14px] tracking-[-0.02em]"
        >
          Leer el informe original
        </a>
      </div>

      {body.notice ? (
        <div className="bg-ivory card-asymmetric text-steel flex items-start gap-3 px-6 py-4 text-[13px]">
          <AlertTriangle className="text-brass mt-0.5 size-4 shrink-0" />
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

      <p className="text-slate max-w-3xl text-[13px] leading-[1.5] text-pretty">
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
    <section className="bg-ash card-asymmetric p-8">
      <div className="flex items-center gap-3">
        <span className="text-brass">{icono}</span>
        <span className="font-display text-brass text-[13px] tracking-[-0.02em]">{indice}</span>
      </div>
      <h2 className="font-display text-graphite mt-3 text-[20px] leading-[1.15] tracking-[-0.4px]">
        {titulo}
      </h2>
      {puntos.length === 0 ? (
        <p className="text-slate mt-4 text-[15px]">
          El informe no aporta material suficiente para este apartado.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {puntos.map((p, i) => (
            <li key={i} className="text-steel flex gap-3 text-[15px] leading-[1.5] text-pretty">
              <span className="bg-ember mt-2.5 size-1 shrink-0 rounded-full" />
              {p}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
