import Link from "next/link";
import { trimCik } from "@/lib/sec/client";
import type { CompanyProfile } from "@/lib/sec/types";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "", label: "Perfil" },
  { href: "/financials", label: "Estados financieros" },
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
    <div className="bg-ash">
      <div className="mx-auto max-w-[1200px] px-5 pt-12">
        <p className="font-display text-brass text-[13px] tracking-[-0.02em]">
          {profile.sector} · {profile.sicDescription || "Sin clasificar"}
        </p>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="font-display text-graphite text-[40px] leading-[1.2] tracking-[-0.8px]">
            {profile.name}
          </h1>
          <span className="border-graphite/25 text-graphite font-display rounded-[20px] border px-3 py-0.5 text-[14px] tracking-[-0.02em]">
            {ticker}
          </span>
          {profile.exchanges[0] ? (
            <span className="text-slate text-[13px]">{profile.exchanges[0]}</span>
          ) : null}
        </div>

        <dl className="text-slate mt-4 flex flex-wrap items-center gap-x-8 gap-y-1.5 text-[13px]">
          <Dato termino="SIC" valor={profile.sic || "—"} />
          <Dato
            termino="CIK"
            valor={
              <a
                href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${profile.cik}&type=10-K`}
                target="_blank"
                rel="noreferrer noopener"
                className="link-ember"
              >
                {trimCik(profile.cik)}
              </a>
            }
          />
          {profile.stateOfIncorporation ? (
            <Dato termino="Constitución" valor={profile.stateOfIncorporation} />
          ) : null}
        </dl>

        <nav className="mt-9 flex gap-6">
          {TABS.map((t) => {
            const href = `/ticker/${ticker}${t.href}`;
            const esActiva = active === (t.href || "/");
            return (
              <Link
                key={t.label}
                href={href}
                className={cn(
                  "font-display border-b-2 pb-3 text-[15px] tracking-[-0.02em] transition-colors",
                  esActiva
                    ? "border-graphite text-graphite"
                    : "text-slate hover:text-graphite border-transparent",
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
