import { getCompanyFacts } from "./company-facts";
import { getCompanyProfile } from "./submissions";
import { normalizeStatement, type Frequency, type NormalizedStatement } from "./normalize";
import { STATEMENTS, type StatementId } from "./taxonomy";
import { buildRatiosStatement } from "./ratios";
import type { CompanyProfile } from "./types";

export type StatementBlock = NormalizedStatement & { id: StatementId; label: string };

export type StatementBundle = {
  profile: CompanyProfile;
  frequency: Frequency;
  blocks: StatementBlock[];
  /** Última fecha de cierre con datos, para mostrar la vigencia de la tabla. */
  latestPeriodEnd: string | null;
};

const MAX_PERIODOS: Record<Frequency, number> = { annual: 10, quarterly: 8 };

export async function buildStatements(
  cik: string,
  frequency: Frequency,
  fallbackName?: string,
  fallbackTicker?: string,
): Promise<StatementBundle> {
  const [profile, facts] = await Promise.all([
    getCompanyProfile(cik, fallbackName, fallbackTicker),
    getCompanyFacts(cik),
  ]);

  const baseBlocks: StatementBlock[] = (Object.keys(STATEMENTS) as (keyof typeof STATEMENTS)[]).map((id) => {
    const def = STATEMENTS[id];
    const normalized = normalizeStatement(facts, [...def.lines], frequency, MAX_PERIODOS[frequency]);
    return { id, label: def.label, ...normalized };
  });

  const income = baseBlocks.find((b) => b.id === "income")!;
  const balance = baseBlocks.find((b) => b.id === "balance")!;
  const cashflow = baseBlocks.find((b) => b.id === "cashflow")!;

  const ratios = buildRatiosStatement(income, balance, cashflow, frequency);
  const ratiosBlock: StatementBlock = {
    id: "ratios",
    label: "Ratios y márgenes",
    ...ratios,
  };

  const blocks: StatementBlock[] = [...baseBlocks, ratiosBlock];

  const latestPeriodEnd =
    blocks.flatMap((b) => b.periods.map((p) => p.end)).sort().at(-1) ?? null;

  return { profile, frequency, blocks, latestPeriodEnd };
}

/** Indica si la empresa publica XBRL utilizable. Las extranjeras con 20-F, no. */
export function hasUsableData(bundle: StatementBundle): boolean {
  return bundle.blocks.some((b) => b.periods.length > 0);
}
