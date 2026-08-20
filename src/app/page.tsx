import Link from "next/link";
import { HomeSearch } from "@/components/home-search";

const DESTACADOS = ["AAPL", "MSFT", "NVDA", "TSLA", "JNJ", "AMZN", "GOOGL", "JPM"];

export default function Home() {
  return (
    <div>
      {/* Héroe: dos columnas, tipografía de póster sobre lienzo blanco. */}
      <section className="mx-auto grid max-w-[1200px] gap-x-16 gap-y-12 px-5 pt-16 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div>
          <p className="font-display text-brass mb-5 text-[13px] tracking-[-0.02em]">
            Datos públicos · SEC EDGAR · Reserva Federal
          </p>
          <h1 className="font-display text-graphite text-[44px] leading-[0.94] tracking-[-0.88px] text-balance sm:text-[56px] sm:leading-[0.91] sm:tracking-[-1.12px] lg:text-[66px] lg:tracking-[-1.32px]">
            Los números que las empresas presentan de verdad
          </h1>
          <p className="text-steel mt-6 max-w-lg text-[18px] leading-[1.5] text-pretty">
            Estados financieros leídos directamente del XBRL de la Comisión de Bolsa y Valores de
            Estados Unidos. Sin estimaciones, sin relleno y con las reexpresiones ya aplicadas.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/ticker/AAPL/financials"
              className="bg-graphite text-canvas-white font-display px-5 py-2.5 text-[16px] leading-none tracking-[-0.02em] transition-opacity hover:opacity-85"
            >
              Ver un ejemplo
            </Link>
            <Link
              href="/macro"
              className="border-graphite text-graphite font-display hover:bg-ash border px-5 py-2.5 text-[16px] leading-none tracking-[-0.02em] transition-colors"
            >
              Panel macro
            </Link>
          </div>

          <div className="mt-10 max-w-md">
            <HomeSearch />
          </div>
        </div>

        {/* Racimo de tarjetas de datos: la única imaginería del sistema. */}
        <div className="relative flex flex-col gap-5 self-center">
          <DataCard
            titulo="Apple Inc."
            meta="FY 2025 · 10-K"
            filas={[
              ["Ingresos", "416.161"],
              ["Resultado de explotación", "133.050"],
              ["Resultado neto", "112.010"],
              ["Flujo de caja libre", "98.767"],
            ]}
          />
          <div className="flex gap-5">
            <StatCard etiqueta="Ejercicios anuales" valor="10" nota="por empresa" />
            <StatCard etiqueta="Trimestres" valor="8" nota="con Q4 derivado" />
          </div>
        </div>
      </section>

      {/* Banda Ash: el sistema separa secciones alternando superficies. */}
      <section className="bg-ash">
        <div className="mx-auto max-w-[1200px] px-5 py-20">
          <h2 className="font-display text-graphite text-[32px] leading-[1.19] tracking-[-0.64px]">
            Tres superficies, una sola fuente de verdad
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Panel
              indice="01"
              titulo="Fundamentales"
              texto="Balance, cuenta de resultados y flujo de caja normalizados desde EDGAR. El motor resuelve los cambios de etiqueta XBRL periodo a periodo, así que el histórico no se corta cuando una empresa cambia de norma contable."
              href="/ticker/AAPL/financials"
              cta="Abrir la terminal"
            />
            <Panel
              indice="02"
              titulo="Copiloto"
              texto="Resume el análisis de la dirección del último informe anual usando solo el texto de ese apartado. Sin conocimiento externo, sin hechos posteriores a la presentación."
              href="/ticker/AAPL/ai"
              cta="Leer un resumen"
            />
            <Panel
              indice="03"
              titulo="Contexto macro"
              texto="Inflación, tipo de los fondos federales y desempleo, servidos directamente por la Reserva Federal de San Luis y sin transformar salvo donde se indica."
              href="/macro"
              cta="Ver el panel"
            />
          </div>
        </div>
      </section>

      {/* Tira de tickers, en el papel de la barra de logotipos. */}
      <section className="mx-auto max-w-[1200px] px-5 py-20">
        <p className="font-display text-brass text-[13px] tracking-[-0.02em]">
          Más de 10.000 empresas registradas en la SEC
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4">
          {DESTACADOS.map((t) => (
            <Link
              key={t}
              href={`/ticker/${t}`}
              className="font-display text-graphite text-[20px] tracking-[-0.02em] opacity-70 transition-opacity hover:opacity-100"
            >
              {t}
            </Link>
          ))}
        </div>
      </section>

      {/* Bloque editorial sobre marfil, con el radio asimétrico de la firma. */}
      <section className="mx-auto max-w-[1200px] px-5 pb-20">
        <div className="bg-ivory card-asymmetric px-8 py-14 sm:px-[60px] sm:pt-[70px] sm:pb-14">
          <h2 className="font-display text-graphite max-w-2xl text-[32px] leading-[1.19] tracking-[-0.64px] text-balance">
            Una raya no es un cero
          </h2>
          <p className="text-steel mt-5 max-w-2xl text-[18px] leading-[1.5] text-pretty">
            Cuando una empresa no publica un concepto, Altius muestra una raya. Cuando reexpresa un
            ejercicio, muestra la versión vigente y no la original: Johnson &amp; Johnson rebajó sus
            ingresos de 2022 de 94.943 a 79.990 millones tras escindir Kenvue, y aquí verás la cifra
            que la empresa sostiene hoy. Solo tres magnitudes se calculan —beneficio bruto, flujo de
            caja libre y el cuarto trimestre— y las tres van marcadas.
          </p>
          <Link
            href="/ticker/JNJ/financials"
            className="font-display text-graphite link-ember mt-8 inline-block text-[16px] tracking-[-0.02em]"
          >
            Ver el caso de Johnson &amp; Johnson
          </Link>
        </div>
      </section>
    </div>
  );
}

function DataCard({
  titulo,
  meta,
  filas,
}: {
  titulo: string;
  meta: string;
  filas: [string, string][];
}) {
  return (
    <div className="bg-canvas-white border-mist rounded-[20px] border p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-graphite text-[18px] tracking-[-0.02em]">{titulo}</h3>
        <span className="text-slate text-[12px]">{meta}</span>
      </div>
      <dl className="mt-6 space-y-3.5">
        {filas.map(([k, v]) => (
          <div key={k} className="border-mist flex items-baseline justify-between gap-4 border-b pb-3.5 last:border-0 last:pb-0">
            <dt className="text-steel text-[14px]">{k}</dt>
            <dd className="tabular font-display text-graphite text-[16px] tracking-[-0.02em]">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-slate mt-6 text-[12px]">Millones de dólares · fuente SEC EDGAR</p>
    </div>
  );
}

function StatCard({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota: string }) {
  return (
    <div className="bg-canvas-white border-mist flex-1 rounded-[20px] border p-6">
      <p className="text-slate text-[12px]">{etiqueta}</p>
      <p className="font-display text-graphite mt-2 text-[40px] leading-[1] tracking-[-0.8px]">
        {valor}
      </p>
      <p className="text-brass mt-1 text-[12px]">{nota}</p>
    </div>
  );
}

function Panel({
  indice,
  titulo,
  texto,
  href,
  cta,
}: {
  indice: string;
  titulo: string;
  texto: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="bg-canvas-white card-asymmetric flex flex-col p-8">
      <span className="font-display text-brass text-[13px] tracking-[-0.02em]">{indice}</span>
      <h3 className="font-display text-graphite mt-3 text-[24px] leading-[1.15] tracking-[-0.48px]">
        {titulo}
      </h3>
      <p className="text-steel mt-4 flex-1 text-[15px] leading-[1.5] text-pretty">{texto}</p>
      <Link
        href={href}
        className="font-display text-graphite link-ember mt-6 inline-block text-[15px] tracking-[-0.02em]"
      >
        {cta}
      </Link>
    </article>
  );
}
