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
  currency?: string;
  source?: { label: string; detail: string; href?: string };
  /** Documento anual legible utilizado para explicar el negocio. */
  annualReport?: { label: string; href: string; form: "10-K" | "20-F" | "40-F" | "ESEF"; periodEnd: string };
};

export function detectReportingCurrency(facts: import("./types").CompanyFacts): string {
  const counts = new Map<string, number>();
  for (const namespace of Object.values(facts.facts ?? {})) {
    for (const concept of Object.values(namespace)) {
      for (const [unit, values] of Object.entries(concept.units ?? {})) {
        if (/^[A-Z]{3}$/.test(unit)) counts.set(unit, (counts.get(unit) ?? 0) + values.length);
      }
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";
}

const MAX_PERIODOS: Record<Frequency, number> = { annual: 30, quarterly: 12 };

export async function buildStatements(
  cik: string,
  frequency: Frequency,
  fallbackName?: string,
  fallbackTicker?: string,
  options?: { maxPeriods?: number },
): Promise<StatementBundle> {
  const [profile, facts] = await Promise.all([
    getCompanyProfile(cik, fallbackName, fallbackTicker),
    getCompanyFacts(cik),
  ]);
  const currency = detectReportingCurrency(facts);

  const baseBlocks: StatementBlock[] = (Object.keys(STATEMENTS) as (keyof typeof STATEMENTS)[]).map((id) => {
    const def = STATEMENTS[id];
    const normalized = normalizeStatement(
      facts,
      [...def.lines],
      frequency,
      options?.maxPeriods ?? MAX_PERIODOS[frequency],
      currency,
    );
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

  return {
    profile,
    frequency,
    blocks,
    latestPeriodEnd,
    currency,
    source: {
      label: "SEC EDGAR",
      detail: "Hechos XBRL US-GAAP o IFRS publicados en SEC EDGAR; se conserva la última reexpresión.",
      href: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${profile.cik}`,
    },
  };
}

/** Indica si la empresa publica XBRL utilizable en cualquiera de los proveedores. */
export function hasUsableData(bundle: StatementBundle): boolean {
  return bundle.blocks.some((b) => b.periods.length > 0);
}
