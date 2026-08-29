import { mergeStatementBundles } from "@/lib/financials/merge";
import { fetchYahooAnnualFacts } from "@/lib/yahoo/fundamentals";
import type { EsefCompany } from "@/lib/esef/companies";
import { normalizeStatement } from "@/lib/sec/normalize";
import { buildRatiosStatement } from "@/lib/sec/ratios";
import {
  detectReportingCurrency,
  type StatementBlock,
  type StatementBundle,
} from "@/lib/sec/statements";
import { STATEMENTS, type StatementId } from "@/lib/sec/taxonomy";

export type YahooSupplementIdentity = {
  ticker: string;
  name: string;
  country?: string;
  sector?: string;
};

function isFinancialSector(sector: string | undefined): boolean {
  return /bank|financ|insurance/i.test(sector ?? "");
}

/**
 * Completa únicamente celdas anuales que falten en la fuente regulatoria.
 * `mergeStatementBundles` conserva siempre SEC/ESEF como fuente prioritaria y
 * rechaza la mezcla si Yahoo expresa el ejercicio en otra divisa.
 */
export async function supplementAnnualStatements(
  primary: StatementBundle,
  identity: YahooSupplementIdentity,
): Promise<StatementBundle> {
  if (primary.frequency !== "annual" || isFinancialSector(identity.sector)) return primary;

  const company: EsefCompany = {
    ticker: identity.ticker,
    name: identity.name,
    exchange: primary.profile.exchanges[0] ?? "Mercado principal",
    country: identity.country ?? primary.profile.stateOfIncorporation ?? "Global",
    sector: identity.sector ?? primary.profile.sector,
    aliases: [identity.ticker, identity.name],
    lei: primary.profile.lei ?? "",
  };
  const supplement = await fetchYahooAnnualFacts(company, "");
  if (!supplement) return primary;

  const currency = detectReportingCurrency(supplement.facts);
  const baseBlocks: StatementBlock[] = (Object.keys(STATEMENTS) as Array<keyof typeof STATEMENTS>).map((id) => {
    const definition = STATEMENTS[id];
    return {
      id,
      label: definition.label,
      ...normalizeStatement(supplement.facts, [...definition.lines], "annual", 6, currency),
    };
  });
  const income = baseBlocks.find((block) => block.id === "income")!;
  const balance = baseBlocks.find((block) => block.id === "balance")!;
  const cashflow = baseBlocks.find((block) => block.id === "cashflow")!;
  const ratios: StatementBlock = {
    id: "ratios" as StatementId,
    label: "Ratios y márgenes",
    ...buildRatiosStatement(income, balance, cashflow, "annual"),
  };
  const blocks = [...baseBlocks, ratios];
  const secondary: StatementBundle = {
    profile: primary.profile,
    frequency: "annual",
    currency,
    blocks,
    latestPeriodEnd: blocks.flatMap((block) => block.periods.map((period) => period.end)).sort().at(-1) ?? null,
    source: {
      label: "Yahoo Finance · estados normalizados",
      detail: "Se utiliza exclusivamente para celdas ausentes en la fuente regulatoria principal.",
      href: supplement.sourceUrl,
    },
  };

  return mergeStatementBundles(primary, secondary);
}
