import Link from "next/link";
import { HomeSearch } from "@/components/home-search";
import { ArrowRight, ShieldCheck, Zap, Database, TrendingUp } from "lucide-react";

const DESTACADOS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "JNJ", "JPM", "BRK.B"];

export default function Home() {
  return (
    <div className="bg-void-black text-frost min-h-screen">
      {/* Hero Section — Midnight SRE Console Split */}
      <section className="mx-auto grid max-w-[1200px] gap-x-16 gap-y-12 px-5 pt-16 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24 lg:pb-28">
        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gunmetal bg-carbon-surface px-3 py-1 text-[12px] font-medium text-periwinkle-glow mb-6 w-fit">
            <span className="size-1.5 rounded-full bg-periwinkle-glow animate-pulse" />
            <span>Terminal Fundamental · Datos XBRL de la SEC en Tiempo Real</span>
          </div>

          <h1 className="font-display text-pure-white text-[42px] leading-[1.06] tracking-[-0.01em] text-balance sm:text-[50px] lg:text-[53px]">
            Los números que las empresas presentan de verdad.
          </h1>

          <p className="text-frost/90 mt-6 max-w-lg text-[18px] leading-[1.55] text-pretty font-sans font-normal">
            Estados financieros leídos directamente del XBRL de la Comisión de Bolsa y Valores de
            EE. UU. Sin estimaciones de terceros, sin relleno y con las reexpresiones ya consolidadas.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/ticker/AAPL/financials"
              className="btn-primary-gradient inline-flex items-center gap-2 px-6 py-3 text-[15px] font-medium"
            >
              <span>Explorar Terminal</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/macro"
              className="btn-ghost-pill inline-flex items-center gap-2 px-5 py-3 text-[15px] font-medium"
            >
              <span>Panel Macroeconómico</span>
            </Link>
          </div>

          <div className="mt-10 max-w-md">
            <HomeSearch />
          </div>
        </div>

        {/* Hero Product Screenshot Mockup / Observability Card */}
        <div className="flex flex-col gap-4 self-center">
          <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gunmetal pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gunmetal/80 text-pure-white font-mono text-xs font-semibold">
                  AAPL
                </div>
                <div>
                  <h3 className="font-display text-pure-white text-[16px] font-medium">Apple Inc.</h3>
                  <p className="text-muted-steel text-[12px]">NASDAQ · Hardware & Services</p>
                </div>
              </div>
              <span className="border-gunmetal bg-void-black text-periwinkle-glow rounded-full border px-2.5 py-0.5 text-[11px] font-mono">
                FY 2025 · 10-K
              </span>
            </div>

            <dl className="space-y-3">
              <MetricRow label="Ingresos Totales" value="$416.161 M" change="+6.2% YoY" />
              <MetricRow label="Resultado de Explotación (EBIT)" value="$133.050 M" change="+9.5% YoY" />
              <MetricRow label="Flujo de Caja Libre (FCF)" value="$98.767 M" change="+12.1% YoY" />
              <MetricRow label="Retorno sobre Capital (ROIC)" value="56.4 %" highlight />
            </dl>

            <div className="mt-5 flex items-center justify-between border-t border-gunmetal pt-4 text-[12px] text-muted-steel">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-periwinkle-glow" />
                Auditoría XBRL Exacta
              </span>
              <span>10 ejercicios normalizados</span>
            </div>
          </div>

          {/* Mini Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5">
              <p className="text-muted-steel text-[12px]">Histórico Anual</p>
              <p className="font-display text-pure-white mt-1.5 text-[32px] font-medium tracking-tight">10 Años</p>
              <p className="text-periwinkle-glow text-[12px] mt-0.5">Reexpresiones vigentes</p>
            </div>
            <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-5">
              <p className="text-muted-steel text-[12px]">Trimestres</p>
              <p className="font-display text-pure-white mt-1.5 text-[32px] font-medium tracking-tight">8 Periodos</p>
              <p className="text-periwinkle-glow text-[12px] mt-0.5">Q4 derivado exacto</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tickers Bar — Monochrome Logo Trust Bar Style */}
      <section className="border-y border-gunmetal bg-carbon-surface/50 py-8">
        <div className="mx-auto max-w-[1200px] px-5">
          <p className="text-muted-steel text-center text-[12px] font-medium tracking-wider uppercase mb-5">
            Cobertura directa de más de 10.000 empresas registradas en la SEC
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[14px]">
            {DESTACADOS.map((t) => (
              <Link
                key={t}
                href={`/ticker/${t}`}
                className="text-muted-steel hover:text-pure-white transition-colors px-2 py-1 rounded hover:bg-gunmetal/50"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Blocks — 3 Columns Midnight Cards */}
      <section className="mx-auto max-w-[1200px] px-5 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-pure-white text-[36px] leading-[1.17] tracking-tight">
            Infraestructura fundamental de nivel institucional
          </h2>
          <p className="text-frost mt-3 text-[16px] leading-[1.6]">
            Tres superficies de análisis diseñadas como una consola SRE: cero latencia, datos sin procesar de fuentes oficiales y máxima densidad visual.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Database className="size-5 text-periwinkle-glow" />}
            index="01"
            title="Estados Financieros XBRL"
            text="Balance, cuenta de resultados, flujo de caja y ratios calculados. El motor resuelve los cambios de etiqueta contable para que el histórico no se corte al cambiar la taxonomía GAAP."
            href="/ticker/AAPL/financials"
            cta="Abrir estados financieros"
          />

          <FeatureCard
            icon={<Zap className="size-5 text-periwinkle-glow" />}
            index="02"
            title="Modelo de Valoración DCF"
            text="Calculadora interactiva de proyecciones a 5 años en tiempo real. Ajusta estimaciones de crecimiento, margen EBIT, tasa impositiva y múltiplos de salida con cálculo instantáneo de Margen de Seguridad."
            href="/ticker/AAPL/valuation"
            cta="Explorar valoración"
          />

          <FeatureCard
            icon={<TrendingUp className="size-5 text-periwinkle-glow" />}
            index="03"
            title="Contexto Macroeconómico"
            text="Inflación IPC, tipo de interés efectivo de los fondos federales (FEDFUNDS) y tasa de desempleo servidos directamente por la Reserva Federal de San Luis (FRED)."
            href="/macro"
            cta="Ver panel macro"
          />
        </div>
      </section>

      {/* Comparison / Case Study Card */}
      <section className="mx-auto max-w-[1200px] px-5 pb-24">
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="text-periwinkle-glow font-display text-[12px] uppercase tracking-wider font-semibold">
              Rigor Metodológico
            </span>
            <h2 className="font-display text-pure-white text-[32px] leading-[1.2] tracking-tight mt-2">
              Una raya no es un cero
            </h2>
            <p className="text-frost mt-4 text-[16px] leading-[1.6]">
              Cuando una empresa no publica un concepto, Altius muestra una raya en lugar de un dato inventado. Cuando reexpresa un ejercicio, muestra la versión vigente: Johnson &amp; Johnson rebajó sus ingresos de 2022 de 94.943 a 79.990 millones tras escindir Kenvue, y aquí verás la cifra que la empresa sostiene hoy.
            </p>
            <Link
              href="/ticker/JNJ/financials"
              className="text-periwinkle-glow hover:underline inline-flex items-center gap-1.5 text-[15px] font-medium mt-6"
            >
              <span>Ver el caso práctico de Johnson &amp; Johnson</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricRow({
  label,
  value,
  change,
  highlight,
}: {
  label: string;
  value: string;
  change?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gunmetal/60 pb-2.5 last:border-0 last:pb-0">
      <dt className="text-frost text-[13px]">{label}</dt>
      <div className="flex items-center gap-2">
        <dd className={`tabular font-display font-medium text-[15px] ${highlight ? "text-periwinkle-glow" : "text-pure-white"}`}>
          {value}
        </dd>
        {change ? <span className="text-[11px] text-muted-steel font-mono">{change}</span> : null}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  index,
  title,
  text,
  href,
  cta,
}: {
  icon: React.ReactNode;
  index: string;
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-8 flex flex-col justify-between hover:border-steel-border/40 transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="size-9 rounded-xl bg-gunmetal/60 flex items-center justify-center border border-gunmetal">
            {icon}
          </div>
          <span className="font-mono text-muted-steel text-[12px]">{index}</span>
        </div>
        <h3 className="font-display text-pure-white text-[20px] font-medium tracking-tight mb-3">
          {title}
        </h3>
        <p className="text-frost/80 text-[14px] leading-[1.6]">
          {text}
        </p>
      </div>

      <Link
        href={href}
        className="text-periwinkle-glow hover:underline inline-flex items-center gap-1 text-[14px] font-medium mt-6"
      >
        <span>{cta}</span>
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
