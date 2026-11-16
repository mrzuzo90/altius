import type { SplitEvent } from "@/lib/prices/types";
import type { Cell, Period } from "@/lib/sec/normalize";
import { buildRatiosStatement } from "@/lib/sec/ratios";
import type { StatementBlock, StatementBundle } from "@/lib/sec/statements";

function validSplits(splits: SplitEvent[] | undefined): SplitEvent[] {
  return (splits ?? []).filter(
    (split) =>
      Boolean(split.date) &&
      Number.isFinite(split.numerator) &&
      Number.isFinite(split.denominator) &&
      split.numerator > 0 &&
      split.denominator > 0 &&
      split.numerator !== split.denominator,
  );
}

function cellValue(block: StatementBlock | undefined, lineId: string, key: string): number | null {
  const val = block?.rows.find((row) => row.line.id === lineId)?.cells[key]?.value;
  return val !== null && val !== undefined && Number.isFinite(val) ? val : null;
}

function estimatePostSplitShares(
  income: StatementBlock,
  balance: StatementBlock,
  splits: SplitEvent[],
): Map<string, number> {
  const byPeriod = new Map<string, number>();
  const latestSplitDate = splits.map((s) => s.date).sort().at(-1) ?? "";

  let fallbackPostShares: number | null = null;
  for (const period of income.periods) {
    const yahooShares = cellValue(income, "sharesDiluted", period.key);
    const netIncome = cellValue(income, "netIncome", period.key);
    const eps = cellValue(income, "epsDiluted", period.key) ?? cellValue(income, "epsBasic", period.key);
    const bsShares = cellValue(balance, "sharesOutstanding", period.key);
    const epsCell =
      income.rows.find((r) => r.line.id === "epsDiluted")?.cells[period.key] ??
      income.rows.find((r) => r.line.id === "epsBasic")?.cells[period.key];
    const sharesCell = income.rows.find((r) => r.line.id === "sharesDiluted")?.cells[period.key];

    const isYahooShares = sharesCell?.provenance.kind === "reported" && sharesCell.provenance.form === "YAHOO-ANNUAL";
    const isYahooEps = epsCell?.provenance.kind === "reported" && epsCell.provenance.form === "YAHOO-ANNUAL";

    let refShares: number | null = null;
    if (yahooShares && yahooShares > 0 && (isYahooShares || period.end >= latestSplitDate)) {
      refShares = yahooShares;
    } else if (netIncome !== null && eps !== null && eps !== 0 && (isYahooEps || period.end >= latestSplitDate)) {
      refShares = Math.abs(netIncome / eps);
    } else if (bsShares && bsShares > 0 && period.end >= latestSplitDate) {
      refShares = bsShares;
    }

    if (refShares !== null) {
      byPeriod.set(period.key, refShares);
      if (fallbackPostShares === null && period.end >= latestSplitDate) fallbackPostShares = refShares;
    }
  }

  if (fallbackPostShares !== null) {
    for (const period of income.periods) {
      if (!byPeriod.has(period.key)) byPeriod.set(period.key, fallbackPostShares);
    }
  }
  return byPeriod;
}

function unadjustedSplitFactor(
  cell: Cell | undefined,
  period: Period,
  splits: SplitEvent[],
  netIncome: number | null,
  postShares: number | undefined,
  kind: "perShare" | "shares",
): number {
  if (!cell || cell.value === null || !Number.isFinite(cell.value) || cell.splitAdjusted) return 1;
  if (cell.provenance.kind === "reported" && cell.provenance.form === "YAHOO-ANNUAL") return 1;

  const filed = cell.provenance.kind === "reported" ? cell.provenance.filed : period.end;
  let totalFactor = 1;

  for (const split of splits) {
    if (period.end >= split.date) continue;
    const factor = split.numerator / split.denominator;
    if (filed <= split.date) {
      totalFactor *= factor;
      continue;
    }
    // En ESEF/SEC los comparativos del primer informe posterior al split suelen
    // venir unas veces reexpresados y otras sin reexpresar (p. ej. Aena 2024 en
    // el informe 2025: 12,89 € frente a 1,42 €). Comprobamos el número implícito de acciones.
    if (postShares && postShares > 0) {
      const impliedShares =
        kind === "shares"
          ? Math.abs(cell.value)
          : netIncome !== null && cell.value !== 0
            ? Math.abs(netIncome / cell.value)
            : null;
      if (impliedShares && impliedShares > 0) {
        const ratio = postShares / impliedShares;
        if (ratio >= factor * 0.45 && ratio <= factor * 2.2) {
          totalFactor *= factor;
        }
      }
    }
  }

  return totalFactor;
}

/**
 * Normaliza los importes por acción y recuentos de acciones anteriores a un split
 * para que toda la serie histórica (ratios YoY, CAGR, P/E histórico y tablas)
 * esté en la misma base post-split que la cotización actual.
 */
export function applySplitsToStatementBundle(
  bundle: StatementBundle,
  splits: SplitEvent[] | undefined,
): StatementBundle {
  const cleanSplits = validSplits(splits);
  if (cleanSplits.length === 0) return bundle;

  const income = bundle.blocks.find((block) => block.id === "income");
  const balance = bundle.blocks.find((block) => block.id === "balance");
  const cashflow = bundle.blocks.find((block) => block.id === "cashflow");
  if (!income || !balance || !cashflow) return bundle;

  const postSharesByPeriod = estimatePostSplitShares(income, balance, cleanSplits);
  let changed = false;

  const adjustBlock = (block: StatementBlock, lineIds: string[], kind: "perShare" | "shares"): StatementBlock => {
    let blockChanged = false;
    const rows = block.rows.map((row) => {
      if (!lineIds.includes(row.line.id)) return row;
      const nextCells: Record<string, Cell> = { ...row.cells };
      for (const period of block.periods) {
        const cell = nextCells[period.key];
        if (!cell || cell.value === null) continue;
        const netIncome = cellValue(income, "netIncome", period.key);
        const postShares = postSharesByPeriod.get(period.key);
        const factor = unadjustedSplitFactor(cell, period, cleanSplits, netIncome, postShares, kind);
        if (factor === 1) continue;

        const scale = kind === "perShare" ? 1 / factor : factor;
        let nextFirst = cell.firstReported;
        if (nextFirst) {
          const firstBeforeSplit = cleanSplits.some((s) => s.date > nextFirst!.filed);
          const sameAsUnadjusted = Math.abs(cell.value) > 0 && Math.abs(nextFirst.value / cell.value - 1) < 0.05;
          if (firstBeforeSplit || sameAsUnadjusted) {
            nextFirst = { ...nextFirst, value: nextFirst.value * scale };
          }
        }
        nextCells[period.key] = {
          ...cell,
          value: cell.value * scale,
          firstReported: nextFirst,
          splitAdjusted: true,
        };
        blockChanged = true;
      }
      return blockChanged ? { ...row, cells: nextCells } : row;
    });
    if (blockChanged) changed = true;
    return blockChanged ? { ...block, rows } : block;
  };

  let nextIncome = adjustBlock(income, ["epsBasic", "epsDiluted"], "perShare");
  nextIncome = adjustBlock(nextIncome, ["sharesDiluted"], "shares");
  const nextBalance = adjustBlock(balance, ["sharesOutstanding"], "shares");

  if (!changed) return bundle;

  const ratios: StatementBlock = {
    id: "ratios",
    label: "Ratios y márgenes",
    ...buildRatiosStatement(nextIncome, nextBalance, cashflow, bundle.frequency),
  };
  const blocks = bundle.blocks.map((block) => {
    if (block.id === "income") return nextIncome;
    if (block.id === "balance") return nextBalance;
    if (block.id === "ratios") return ratios;
    return block;
  });

  return { ...bundle, blocks };
}
