import Link from "next/link";
import { trimCik } from "@/lib/sec/client";
import type { CompanyProfile } from "@/lib/sec/types";
import { cn } from "@/lib/utils";
import { WatchlistTargetButton } from "@/components/watchlist/watchlist-target-button";

const TABS = [
  { href: "", label: "Perfil" },
  { href: "/financials", label: "Estados financieros" },
  { href: "/valuation", label: "Valoración" },
  { href: "/technical", label: "Análisis técnico" },
  { href: "/ai", label: "Copiloto" },
];

export function CompanyHeader({
  profile,
  ticker,
  active,
}: {
  profile: CompanyProfile;
  ticker: string;
  active: string;
}) {
  return (
    <div className="bg-carbon-surface/60 border-gunmetal border-b">
      <div className="mx-auto max-w-[1200px] px-5 pt-10">
        <p className="text-periwinkle-glow font-display text-[12px] uppercase tracking-wider font-semibold">
          {profile.sector} · {profile.sicDescription || "Sin clasificar"}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display text-pure-white text-[36px] font-medium leading-[1.1] tracking-tight">
            {profile.name}
          </h1>
          <span className="border-gunmetal bg-void-black text-periwinkle-glow font-mono rounded-full border px-3 py-0.5 text-[13px] font-medium">
            {ticker}
          </span>
          {profile.exchanges[0] ? (
            <span className="text-muted-steel text-[13px] font-mono">{profile.exchanges[0]}</span>
          ) : null}
          <WatchlistTargetButton ticker={ticker} companyName={profile.name} />
        </div>

        <dl className="text-muted-steel mt-4 flex flex-wrap items-center gap-x-8 gap-y-1.5 text-[13px]">
          <Dato termino="SIC" valor={profile.sic || "—"} />
          {profile.cik ? <Dato
            termino="CIK"
            valor={
              <a
                href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${profile.cik}&type=10-K`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-periwinkle-glow hover:underline font-mono"
              >
                {trimCik(profile.cik)}
              </a>
            }
          /> : null}
          {profile.lei ? <Dato termino="LEI" valor={<span className="font-mono text-periwinkle-glow">{profile.lei}</span>} /> : null}
          {profile.stateOfIncorporation ? (
            <Dato termino="Constitución" valor={profile.stateOfIncorporation} />
          ) : null}
        </dl>

        <nav className="mt-8 flex gap-8">
          {TABS.map((t) => {
            const href = `/ticker/${ticker}${t.href}`;
            const esActiva = active === (t.href || "/");
            return (
              <Link
                key={t.label}
                href={href}
                className={cn(
                  "font-display border-b-2 pb-3.5 text-[14px] font-medium tracking-tight transition-colors",
                  esActiva
                    ? "border-periwinkle-glow text-pure-white"
                    : "border-transparent text-muted-steel hover:text-frost",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function Dato({ termino, valor }: { termino: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <dt>{termino}</dt>
      <dd className="text-steel">{valor}</dd>
    </div>
  );
}
