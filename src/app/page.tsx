import Link from "next/link";
import { ArrowRight, Database, LineChart, Sparkles } from "lucide-react";
import { HomeSearch } from "@/components/home-search";

const DESTACADOS = ["AAPL", "MSFT", "NVDA", "TSLA", "JNJ", "AMZN", "GOOGL", "JPM"];

export default function Home() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
      <section className="mx-auto max-w-3xl py-20 text-center sm:py-28">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Los números que las empresas presentan de verdad
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base text-pretty">
          Estados financieros leídos directamente del XBRL de la SEC, sin estimaciones ni relleno.
          Si una empresa no reporta un concepto, aquí verás una raya y no un número inventado.
        </p>

        <div className="mt-8">
          <HomeSearch />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {DESTACADOS.map((t) => (
            <Link
              key={t}
              href={`/ticker/${t}`}
              className="border-border/60 bg-muted/30 hover:bg-muted hover:border-border rounded-md border px-2.5 py-1 font-mono text-xs font-medium transition-colors"
            >
              {t}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-3">
        <Tarjeta
          icono={<Database className="size-4" />}
          titulo="Fundamentales de la SEC"
          texto="Balance, cuenta de resultados y flujo de caja normalizados desde EDGAR. Diez ejercicios anuales y ocho trimestres, con las reexpresiones ya aplicadas."
        />
        <Tarjeta
          icono={<Sparkles className="size-4" />}
          titulo="Copiloto del informe"
          texto="Resume el análisis de la dirección del último 10-K a partir del texto literal del informe, sin aportar conocimiento externo."
        />
        <Tarjeta
          icono={<LineChart className="size-4" />}
          titulo="Contexto macro"
          texto="Inflación, tipos de la Reserva Federal y desempleo, servidos directamente por FRED."
          href="/macro"
        />
      </section>
    </div>
  );
}

function Tarjeta({
  icono,
  titulo,
  texto,
  href,
}: {
  icono: React.ReactNode;
  titulo: string;
  texto: string;
  href?: string;
}) {
  const cuerpo = (
    <div className="border-border/60 hover:border-border h-full rounded-lg border p-5 transition-colors">
      <div className="text-muted-foreground mb-3 flex items-center gap-2">
        {icono}
        <h2 className="text-foreground text-sm font-medium">{titulo}</h2>
        {href ? <ArrowRight className="ml-auto size-3.5" /> : null}
      </div>
      <p className="text-muted-foreground text-sm text-pretty">{texto}</p>
    </div>
  );
  return href ? <Link href={href}>{cuerpo}</Link> : cuerpo;
}
