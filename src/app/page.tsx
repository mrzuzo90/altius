import Link from "next/link";
import { HomeSearch } from "@/components/home-search";
import { TickerRibbon } from "@/components/home/ticker-ribbon";
import { MarketOverviewCards } from "@/components/home/market-overview-cards";
import { MarketLeadersTable } from "@/components/home/market-leaders-table";
import { InteractivePreview } from "@/components/home/interactive-preview";
import { getFredSeries, yoyChange } from "@/lib/fred/client";
import { getAllIndicesSummary } from "@/lib/indices";
import { getAllCommoditiesSummary } from "@/lib/commodities";
import { getAllCurrenciesSummary } from "@/lib/currencies";
import { getDynamicMarketLeaders } from "@/lib/home/leaders-server";
import { ArrowRight, ShieldCheck, Zap, Database, Sparkles } from "lucide-react";
import type { RibbonItem } from "@/components/home/ticker-ribbon";

export const revalidate = 3600;

export default async function Home() {
  const [
    cpiData,
    fedData,
    unrateData,
    indicesSummaries,
    commoditiesSummaries,
    currenciesSummaries,
    realLeaders,
  ] = await Promise.all([
    getFredSeries("CPIAUCSL").catch(() => []),
    getFredSeries("FEDFUNDS").catch(() => []),
    getFredSeries("UNRATE").catch(() => []),
    getAllIndicesSummary().catch(() => []),
    getAllCommoditiesSummary().catch(() => []),
    getAllCurrenciesSummary().catch(() => []),
    getDynamicMarketLeaders().catch(() => []),
  ]);

  const cpiValue = yoyChange(cpiData).at(-1)?.value;
  const fedFundsValue = fedData.at(-1)?.value;
  const unrateValue = unrateData.at(-1)?.value;

  const ribbonItems: RibbonItem[] = [
    ...indicesSummaries.map((idx) => ({
      type: "index" as const,
      ticker: idx.shortName,
      price: idx.currentValue,
      changePct: idx.change1D ?? 0,
      href: `/indices/${idx.slug}`,
      isVix: idx.symbol === "VIXCLS",
    })),
    ...commoditiesSummaries.map((com) => ({
      type: "commodity" as const,
      ticker: com.shortName,
      price: com.currentValue,
      changePct: com.change1D ?? 0,
      href: `/commodities/${com.slug}`,
      unit: com.unit,
    })),
    ...currenciesSummaries.map((cur) => ({
      type: "commodity" as const,
      ticker: cur.shortName,
      price: cur.currentValue,
      changePct: cur.change1D ?? 0,
      href: `/divisas/${cur.slug}`,
    })),
  ];

  return (
    <div className="bg-void-black text-frost min-h-screen pb-20">
      {/* 1. Live Market Ticker Tape Ribbon */}
      <TickerRibbon items={ribbonItems} />

      {/* 2. Hero Section — Wall Street Terminal Console */}
      <section className="mx-auto max-w-[1200px] px-5 pt-12 pb-14 sm:pt-16 sm:pb-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-gunmetal bg-carbon-surface px-4 py-1 text-[12px] font-mono text-periwinkle-glow shadow-xs">
            <span className="size-2 rounded-full bg-periwinkle-glow animate-pulse" />
            <span>TERMINAL INSTITUCIONAL · 100% DATOS XBRL OFICIALES</span>
          </div>

          <h1 className="font-display text-pure-white text-[44px] leading-[1.05] tracking-tight sm:text-[54px] lg:text-[60px] font-medium text-balance">
            La terminal fundamental de Wall Street sin ruido.
          </h1>

          <p className="text-frost/90 max-w-2xl mx-auto text-[18px] leading-[1.55] text-pretty font-normal">
            Múltiplos LTM, 10 años de estados financieros XBRL consolidados y calculadora de valoración a 5 años leídos directamente de la SEC y la Reserva Federal.
          </p>

          <div className="pt-2 max-w-xl mx-auto">
            <HomeSearch />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[12px] text-muted-steel font-mono">
              <span>Populares:</span>
              {[
                { t: "NVDA", label: "NVIDIA" },
                { t: "AAPL", label: "Apple" },
                { t: "MSFT", label: "Microsoft" },
                { t: "ASML", label: "ASML" },
                { t: "SAN", label: "Santander" },
                { t: "TSLA", label: "Tesla" },
              ].map((item) => (
                <Link
                  key={item.t}
                  href={`/ticker/${item.t}`}
                  className="bg-carbon-surface hover:bg-gunmetal text-frost hover:text-pure-white px-2.5 py-0.5 rounded border border-gunmetal transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="font-bold text-pure-white">{item.t}</span>
                  <span className="text-muted-steel text-[11px] font-sans">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Market & Macro Overview Cards */}
      <section className="mx-auto max-w-[1200px] px-5 mb-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-pure-white text-[16px] font-medium tracking-tight uppercase font-mono text-muted-steel">
            Pulso Macroeconómico y de Mercado
          </h2>
          <Link href="/macro" className="text-periwinkle-glow hover:underline text-[13px] font-medium inline-flex items-center gap-1">
            <span>Ver observatorio macro completo</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <MarketOverviewCards
          cpiValue={cpiValue}
          fedFundsValue={fedFundsValue}
          unrateValue={unrateValue}
        />
      </section>

      {/* 4. Interactive Terminal Preview Showcase */}
      <section className="mx-auto max-w-[1200px] px-5 mb-14">
        <InteractivePreview />
      </section>

      {/* 5. Market Leaders & Valuation Table (TIKR Screener Style) */}
      <section className="mx-auto max-w-[1200px] px-5 mb-20">
        <MarketLeadersTable leaders={realLeaders} />
      </section>

      {/* 6. Feature Blocks */}
      <section className="mx-auto max-w-[1200px] px-5 py-12 border-t border-gunmetal/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-periwinkle-glow font-mono text-[11px] uppercase tracking-wider font-semibold">
            Arquitectura de Análisis
          </span>
          <h2 className="font-display text-pure-white text-[32px] font-medium tracking-tight mt-1">
            Todo lo que un analista necesita en una sola pantalla
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Database className="size-5 text-periwinkle-glow" />}
            index="01"
            title="Estados Financieros XBRL"
            text="Balance, cuenta de resultados y flujo de caja normalizados. El motor resuelve los cambios de etiqueta periodo a periodo para mantener el histórico intacto."
            href="/ticker/AAPL/financials"
            cta="Abrir terminal XBRL"
          />

          <FeatureCard
            icon={<Zap className="size-5 text-periwinkle-glow" />}
            index="02"
            title="Calculadora de Valoración DCF"
            text="Simulación interactiva de proyecciones a 5 años con cálculo en tiempo real de Precio Objetivo, Margen de Seguridad (%) y rentabilidad CAGR esperada."
            href="/ticker/AAPL/valuation"
            cta="Proyectar valoración"
          />

          <FeatureCard
            icon={<Sparkles className="size-5 text-periwinkle-glow" />}
            index="03"
            title="Auditoría de Calidad (Moats)"
            text="Checklist automatizado de 6 filtros cuantitativos (ROIC > 15%, márgenes, conversión de FCF y recompras de acciones) para detectar Compounders al instante."
            href="/ticker/AAPL"
            cta="Ver scorecard de calidad"
          />
        </div>
      </section>

      {/* 7. Methodology & Integrity Banner */}
      <section className="mx-auto max-w-[1200px] px-5">
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-periwinkle-glow text-[13px] font-medium font-mono">
              <ShieldCheck className="size-4" />
              <span>GARANTÍA DE VERACIDAD DE DATOS</span>
            </div>
            <h3 className="font-display text-pure-white text-[24px] font-medium tracking-tight">
              Una raya en Altius significa que la empresa no reporta ese concepto.
            </h3>
            <p className="text-frost/80 text-[14px] leading-[1.6]">
              No introducimos ceros ficticios ni extrapolaciones no auditadas. Cuando Johnson &amp; Johnson rebajó sus ingresos de 2022 de 94.943 a 79.990 millones tras escindir Kenvue, Altius muestra la cifra reexpresada que la compañía sostiene ante la SEC.
            </p>
          </div>
          <Link
            href="/ticker/JNJ/financials"
            className="btn-primary-gradient shrink-0 px-6 py-3 text-[14px] font-medium inline-flex items-center gap-2"
          >
            <span>Ver caso Johnson &amp; Johnson</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
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
    <div className="bg-carbon-surface border-gunmetal rounded-2xl border p-7 flex flex-col justify-between hover:border-steel-border/40 transition-colors group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="size-9 rounded-xl bg-void-black flex items-center justify-center border border-gunmetal">
            {icon}
          </div>
          <span className="font-mono text-muted-steel text-[12px]">{index}</span>
        </div>
        <h3 className="font-display text-pure-white text-[18px] font-medium tracking-tight mb-2.5">
          {title}
        </h3>
        <p className="text-frost/80 text-[13px] leading-[1.6]">
          {text}
        </p>
      </div>

      <Link
        href={href}
        className="text-periwinkle-glow group-hover:underline inline-flex items-center gap-1 text-[13px] font-medium mt-6"
      >
        <span>{cta}</span>
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
