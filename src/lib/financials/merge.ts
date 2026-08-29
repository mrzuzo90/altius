import { buildRatiosStatement } from "@/lib/sec/ratios";
import type { Cell, LineSeries, Period } from "@/lib/sec/normalize";
import type { StatementBlock, StatementBundle } from "@/lib/sec/statements";
import type { StatementId } from "@/lib/sec/taxonomy";

const BASE_BLOCKS: StatementId[] = ["income", "balance", "cashflow"];

function periodUnion(primary: StatementBlock, backfill: StatementBlock, limit: number): Period[] {
  const periods = new Map<string, Period>();
  for (const period of backfill.periods) periods.set(period.key, period);
  for (const period of primary.periods) periods.set(period.key, period);
  return [...periods.values()]
    .sort((a, b) => b.end.localeCompare(a.end))
    .slice(0, limit);
}

function usableCell(primary: Cell | undefined, backfill: Cell | undefined): Cell | undefined {
  if (primary?.value !== null && primary?.value !== undefined) return primary;
  if (backfill?.value !== null && backfill?.value !== undefined) return backfill;
  return primary ?? backfill;
}

function mergeBlock(primary: StatementBlock, backfill: StatementBlock, limit: number): StatementBlock {
  const periods = periodUnion(primary, backfill, limit);
  const primaryRows = new Map(primary.rows.map((row) => [row.line.id, row]));
  const backfillRows = new Map(backfill.rows.map((row) => [row.line.id, row]));
  const lines = new Map<string, LineSeries["line"]>();
  for (const row of backfill.rows) lines.set(row.line.id, row.line);
  for (const row of primary.rows) lines.set(row.line.id, row.line);

  const rows: LineSeries[] = [...lines.values()].map((line) => {
    const current = primaryRows.get(line.id);
    const historical = backfillRows.get(line.id);
    const cells: Record<string, Cell> = {};
    for (const period of periods) {
      const cell = usableCell(current?.cells[period.key], historical?.cells[period.key]);
      if (cell) cells[period.key] = cell;
    }
    return { line, cells };
  });

  return { id: primary.id, label: primary.label, periods, rows };
}

/**
 * Conserva el regulador local como fuente principal y usa otro repositorio
 * únicamente para cubrir ejercicios/celdas ausentes. Si las divisas difieren,
 * no se mezclan los estados.
 */
export function mergeStatementBundles(
  primary: StatementBundle,
  backfill: StatementBundle | null,
  limit = 30,
): StatementBundle {
  if (
    !backfill ||
    primary.frequency !== backfill.frequency ||
    primary.currency !== backfill.currency
  ) return primary;

  const baseBlocks = BASE_BLOCKS.flatMap((id) => {
    const current = primary.blocks.find((block) => block.id === id);
    const historical = backfill.blocks.find((block) => block.id === id);
    return current && historical ? [mergeBlock(current, historical, limit)] : current ? [current] : historical ? [historical] : [];
  });
  const income = baseBlocks.find((block) => block.id === "income");
  const balance = baseBlocks.find((block) => block.id === "balance");
  const cashflow = baseBlocks.find((block) => block.id === "cashflow");
  if (!income || !balance || !cashflow) return primary;

  const ratios: StatementBlock = {
    id: "ratios",
    label: "Ratios y márgenes",
    ...buildRatiosStatement(income, balance, cashflow, primary.frequency),
  };
  const blocks = [...baseBlocks, ratios];

  return {
    ...primary,
    blocks,
    latestPeriodEnd: blocks.flatMap((block) => block.periods.map((period) => period.end)).sort().at(-1) ?? null,
    source: {
      ...primary.source,
      label: `${primary.source?.label ?? "Fuente primaria"} + ${backfill.source?.label ?? "histórico"}`,
      detail: `${primary.source?.detail ?? "Datos regulatorios."} Los huecos históricos se completan con ${backfill.source?.label ?? "una segunda fuente regulatoria"} sin mezclar divisas.`,
    },
  };
}
