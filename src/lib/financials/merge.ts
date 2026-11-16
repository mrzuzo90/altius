import { buildRatiosStatement } from "@/lib/sec/ratios";
import type { Cell, LineSeries, Period, PeriodKey } from "@/lib/sec/normalize";
import { ABSENT, type Provenance } from "@/lib/sec/provenance";
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

function rowById(block: StatementBlock | undefined, id: string): LineSeries | undefined {
  return block?.rows.find((row) => row.line.id === id);
}

function cellValue(row: LineSeries | undefined, key: PeriodKey): number | null {
  const val = row?.cells[key]?.value;
  return val !== null && val !== undefined && Number.isFinite(val) ? val : null;
}

function cellSource(row: LineSeries | undefined, key: PeriodKey): Provenance {
  return row?.cells[key]?.provenance ?? ABSENT;
}

function fillDerivedCell(
  block: StatementBlock | undefined,
  targetId: string,
  firstId: string,
  firstLabel: string,
  secondId: string,
  secondLabel: string,
  formula: string,
  compute: (a: number, b: number) => number,
  normalizeFirst: (a: number) => number = (a) => a,
  normalizeSecond: (b: number) => number = (b) => b,
): void {
  if (!block) return;
  const targetRow = rowById(block, targetId);
  const firstRow = rowById(block, firstId);
  const secondRow = rowById(block, secondId);
  if (!targetRow || !firstRow || !secondRow) return;

  for (const period of block.periods) {
    const existing = targetRow.cells[period.key]?.value;
    if (existing !== null && existing !== undefined && Number.isFinite(existing)) continue;
    const rawFirst = cellValue(firstRow, period.key);
    const rawSecond = cellValue(secondRow, period.key);
    if (rawFirst === null || rawSecond === null) continue;

    targetRow.cells[period.key] = {
      value: compute(rawFirst, rawSecond),
      derived: true,
      provenance: {
        kind: "derived",
        formula,
        inputs: [
          { label: firstLabel, value: normalizeFirst(rawFirst), source: cellSource(firstRow, period.key) },
          { label: secondLabel, value: normalizeSecond(rawSecond), source: cellSource(secondRow, period.key) },
        ],
      },
    };
  }
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

  fillDerivedCell(
    income,
    "grossProfit",
    "revenue",
    "Ingresos",
    "costOfRevenue",
    "Coste de ventas",
    "Ingresos − Coste de ventas",
    (rev, cogs) => rev - cogs,
  );
  fillDerivedCell(
    income,
    "operatingIncome",
    "revenue",
    "Ingresos",
    "operatingExpenses",
    "Total gastos de explotación",
    "Ingresos − Total gastos de explotación",
    (rev, opex) => rev - opex,
  );
  fillDerivedCell(
    balance,
    "cashAndShortTermInvestments",
    "cash",
    "Efectivo y equivalentes",
    "shortTermInvestments",
    "Inversiones a corto plazo",
    "Efectivo y equivalentes + Inversiones a corto plazo",
    (cash, stInv) => cash + stInv,
  );
  fillDerivedCell(
    balance,
    "totalDebt",
    "shortTermDebt",
    "Deuda a corto plazo",
    "longTermDebt",
    "Deuda a largo plazo",
    "Deuda a corto plazo + Deuda a largo plazo",
    (st, lt) => st + lt,
  );
  fillDerivedCell(
    cashflow,
    "freeCashFlow",
    "operatingCashFlow",
    "Flujo de caja de explotación",
    "capex",
    "Inversión en inmovilizado",
    "Flujo de caja de explotación − Inversión en inmovilizado",
    (cfo, capex) => cfo - Math.abs(capex),
    (cfo) => cfo,
    (capex) => Math.abs(capex),
  );

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
