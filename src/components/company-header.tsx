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
    <div className="border-border/60 border-b">
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
          <span className="bg-muted rounded px-2 py-0.5 font-mono text-sm font-semibold">
            {ticker}
          </span>
          {profile.exchanges[0] ? (
            <span className="text-muted-foreground text-xs">{profile.exchanges[0]}</span>
          ) : null}
        </div>

        <dl className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          <Dato termino="Sector" valor={profile.sector} />
          <Dato termino="Industria" valor={profile.sicDescription || "—"} />
          <Dato termino="SIC" valor={profile.sic || "—"} />
          <Dato
            termino="CIK"
            valor={
              <a
                href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${profile.cik}&type=10-K`}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-foreground underline underline-offset-2"
              >
                {trimCik(profile.cik)}
              </a>
            }
          />
          {profile.stateOfIncorporation ? (
            <Dato termino="Constitución" valor={profile.stateOfIncorporation} />
          ) : null}
        </dl>

        <nav className="mt-5 flex gap-1">
          {TABS.map((t) => {
            const href = `/ticker/${ticker}${t.href}`;
            const esActiva = active === (t.href || "/");
            return (
              <Link
                key={t.label}
                href={href}
                className={cn(
                  "rounded-t-md border-b-2 px-3 py-2 text-sm transition-colors",
                  esActiva
                    ? "border-foreground text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground border-transparent",
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
    <div className="flex items-center gap-1.5">
      <dt className="opacity-60">{termino}</dt>
      <dd className="text-foreground/90">{valor}</dd>
    </div>
  );
}
