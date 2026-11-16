import type { CompanyFacts, XbrlFact } from "@/lib/sec/types";

type MetricSnapshot = {
  end: string;
  filed: string;
  revenue?: number;
  costOfRevenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  depreciation?: number;
  netIncome?: number;
  epsBasic?: number;
  epsDiluted?: number;
  sharesDiluted?: number;
  totalAssets?: number;
  equityParent?: number;
  minorityInterest?: number;
  equity?: number;
  netDebt?: number;
  operatingCashFlow?: number;
  capex?: number;
  dividends?: number;
};

type CompanyArchive = {
  entityName: string;
  sourceUrl: string;
  years: MetricSnapshot[];
};

const ARCHIVES: Record<string, CompanyArchive> = {
  "IBE.MC": {
    entityName: "Iberdrola, S.A.",
    sourceUrl: "https://www.iberdrola.com/accionistas-inversores/informacion-economico-financiera/informes-anuales",
    years: [
      {
        end: "2018-12-31",
        filed: "2019-03-31",
        revenue: 35_075_900_000,
        netIncome: 3_014_100_000,
        epsBasic: 0.471,
        epsDiluted: 0.471,
        totalAssets: 113_037_900_000,
        equity: 43_976_600_000,
        netDebt: 34_149_000_000,
        operatingCashFlow: 7_328_000_000,
        capex: 5_320_000_000,
      },
      {
        end: "2017-12-31",
        filed: "2018-03-31",
        revenue: 31_263_300_000,
        netIncome: 2_804_000_000,
        epsBasic: 0.444,
        epsDiluted: 0.444,
        totalAssets: 110_688_600_000,
        equity: 42_733_000_000,
        netDebt: 32_856_000_000,
        operatingCashFlow: 6_479_000_000,
        capex: 5_891_000_000,
      },
      {
        end: "2016-12-31",
        filed: "2017-03-31",
        revenue: 29_215_400_000,
        netIncome: 2_705_000_000,
        epsBasic: 0.43,
        epsDiluted: 0.43,
        totalAssets: 106_706_200_000,
        equity: 40_687_000_000,
        netDebt: 29_230_000_000,
        operatingCashFlow: 6_311_000_000,
      },
    ],
  },
  "ITX.MC": {
    entityName: "Industria de Diseño Textil, S.A.",
    sourceUrl: "https://www.inditex.com/itxcomweb/en/investors/finance/financial-reports",
    years: [
      {
        end: "2019-01-31",
        filed: "2019-03-31",
        revenue: 26_145_000_000,
        costOfRevenue: 11_329_000_000,
        grossProfit: 14_816_000_000,
        operatingIncome: 4_357_000_000,
        depreciation: 1_100_000_000,
        netIncome: 3_444_000_000,
        epsBasic: 1.106,
        epsDiluted: 1.106,
        sharesDiluted: 3_113_701_857,
        totalAssets: 21_684_000_000,
        equity: 14_682_000_000,
        netDebt: -6_705_000_000,
        operatingCashFlow: 4_029_000_000,
        capex: 1_621_000_000,
        dividends: 2_335_000_000,
      },
      {
        end: "2018-01-31",
        filed: "2018-03-31",
        revenue: 25_336_000_000,
        costOfRevenue: 11_076_000_000,
        grossProfit: 14_260_000_000,
        operatingIncome: 4_314_000_000,
        depreciation: 963_000_000,
        netIncome: 3_368_000_000,
        epsBasic: 1.082,
        epsDiluted: 1.082,
        sharesDiluted: 3_113_218_213,
        totalAssets: 20_231_000_000,
        equityParent: 13_497_000_000,
        minorityInterest: 25_000_000,
        equity: 13_522_000_000,
        netDebt: -6_387_000_000,
        operatingCashFlow: 3_961_000_000,
        capex: 1_772_000_000,
        dividends: 2_127_000_000,
      },
      {
        end: "2017-01-31",
        filed: "2017-03-31",
        revenue: 23_311_000_000,
        operatingIncome: 4_021_000_000,
        depreciation: 1_062_000_000,
        netIncome: 3_157_000_000,
        totalAssets: 19_621_000_000,
        equityParent: 12_713_000_000,
        minorityInterest: 38_000_000,
        equity: 12_752_000_000,
        netDebt: -6_090_000_000,
      },
    ],
  },
  "TEF.MC": {
    entityName: "Telefónica, S.A.",
    sourceUrl: "https://www.telefonica.com/en/shareholders-investors/financial-reports/annual-reports/",
    years: [
      {
        end: "2021-12-31",
        filed: "2022-03-31",
        sharesDiluted: 5_726_631_000,
        netDebt: 26_042_000_000,
        capex: 6_728_000_000,
      },
      {
        end: "2020-12-31",
        filed: "2021-03-31",
        sharesDiluted: 5_813_179_000,
        netDebt: 35_228_000_000,
        capex: 7_529_000_000,
      },
      {
        end: "2019-12-31",
        filed: "2020-03-31",
        sharesDiluted: 5_794_037_000,
        netDebt: 37_744_000_000,
        capex: 8_410_000_000,
      },
      {
        end: "2018-12-31",
        filed: "2019-03-31",
        sharesDiluted: 5_802_455_000,
        totalAssets: 114_047_000_000,
        equityParent: 17_947_000_000,
        minorityInterest: 9_033_000_000,
        equity: 26_980_000_000,
        netDebt: 41_071_000_000,
        capex: 8_585_000_000,
      },
      {
        end: "2017-12-31",
        filed: "2018-03-31",
        revenue: 52_008_000_000,
        operatingIncome: 6_791_000_000,
        depreciation: 9_396_000_000,
        netIncome: 3_132_000_000,
        totalAssets: 115_066_000_000,
        equityParent: 16_920_000_000,
        minorityInterest: 9_698_000_000,
        equity: 26_618_000_000,
        netDebt: 44_230_000_000,
        operatingCashFlow: 10_994_000_000,
      },
      {
        end: "2016-12-31",
        filed: "2017-03-31",
        revenue: 52_036_000_000,
        operatingIncome: 5_469_000_000,
        depreciation: 9_649_000_000,
        netIncome: 2_369_000_000,
        netDebt: 48_595_000_000,
      },
    ],
  },
  "IDR.MC": {
    entityName: "Indra Sistemas, S.A.",
    sourceUrl: "https://www.indragroup.com/es/accionistas-inversores/informacion-economica-financiera",
    years: [
      {
        end: "2018-12-31",
        filed: "2019-03-31",
        revenue: 3_103_700_000,
        operatingIncome: 199_000_000,
        depreciation: 94_000_000,
        netIncome: 120_000_000,
        epsBasic: 0.68,
        epsDiluted: 0.68,
        totalAssets: 3_831_831_000,
        equity: 814_128_000,
        netDebt: 483_000_000,
      },
      {
        end: "2017-12-31",
        filed: "2018-03-31",
        revenue: 3_011_100_000,
        operatingIncome: 196_000_000,
        depreciation: 70_000_000,
        netIncome: 127_000_000,
        epsBasic: 0.738,
        epsDiluted: 0.738,
        netDebt: 588_000_000,
      },
      {
        end: "2016-12-31",
        filed: "2017-03-31",
        revenue: 2_709_100_000,
        netIncome: 70_000_000,
        netDebt: 523_000_000,
      },
    ],
  },
  "AENA.MC": {
    entityName: "Aena S.M.E., S.A.",
    sourceUrl: "https://www.aena.es/es/accionistas-e-inversores/informacion-economico-financiera/informacion-financiera-anual.html",
    years: [
      {
        end: "2021-12-31",
        filed: "2022-03-31",
        sharesDiluted: 150_000_000,
        dividends: 0,
      },
      {
        end: "2020-12-31",
        filed: "2021-03-31",
        sharesDiluted: 150_000_000,
      },
      {
        end: "2019-12-31",
        filed: "2020-03-31",
        sharesDiluted: 150_000_000,
      },
      {
        end: "2018-12-31",
        filed: "2019-03-31",
        revenue: 4_201_406_000,
        operatingIncome: 1_850_203_000,
        depreciation: 806_383_000,
        netIncome: 1_327_900_000,
        epsBasic: 8.85,
        epsDiluted: 8.85,
        sharesDiluted: 150_000_000,
        totalAssets: 14_899_070_000,
        equity: 6_023_805_000,
        netDebt: 6_654_100_000,
        operatingCashFlow: 1_947_700_000,
        capex: 485_400_000,
      },
      {
        end: "2017-12-31",
        filed: "2018-03-31",
        revenue: 3_960_582_000,
        operatingIncome: 1_717_370_000,
        depreciation: 800_035_000,
        netIncome: 1_232_000_000,
        epsBasic: 8.21,
        epsDiluted: 8.21,
        sharesDiluted: 150_000_000,
        totalAssets: 15_307_432_000,
        equity: 5_687_864_000,
        netDebt: 7_156_000_000,
        operatingCashFlow: 2_014_600_000,
        capex: 371_200_000,
      },
      {
        end: "2016-12-31",
        filed: "2017-03-31",
        revenue: 3_709_581_000,
        operatingIncome: 1_650_949_000,
        depreciation: 825_805_000,
        netIncome: 1_164_100_000,
        epsBasic: 7.76,
        epsDiluted: 7.76,
        sharesDiluted: 150_000_000,
        totalAssets: 15_513_774_000,
        equity: 5_025_749_000,
        netDebt: 8_228_000_000,
        operatingCashFlow: 1_834_700_000,
        capex: 307_900_000,
      },
    ],
  },
};

const FIELD_CONCEPT: Array<{
  field: keyof Omit<MetricSnapshot, "end" | "filed">;
  concept: string;
  kind: "duration" | "instant";
  unit: "EUR" | "EUR/shares" | "shares";
}> = [
  { field: "revenue", concept: "Revenue", kind: "duration", unit: "EUR" },
  { field: "costOfRevenue", concept: "CostOfSales", kind: "duration", unit: "EUR" },
  { field: "grossProfit", concept: "GrossProfit", kind: "duration", unit: "EUR" },
  { field: "operatingIncome", concept: "ProfitLossFromOperatingActivities", kind: "duration", unit: "EUR" },
  { field: "depreciation", concept: "DepreciationAndAmortisationExpense", kind: "duration", unit: "EUR" },
  { field: "netIncome", concept: "ProfitLossAttributableToOwnersOfParent", kind: "duration", unit: "EUR" },
  { field: "epsBasic", concept: "BasicEarningsLossPerShare", kind: "duration", unit: "EUR/shares" },
  { field: "epsDiluted", concept: "DilutedEarningsLossPerShare", kind: "duration", unit: "EUR/shares" },
  { field: "sharesDiluted", concept: "WeightedAverageShares", kind: "duration", unit: "shares" },
  { field: "totalAssets", concept: "Assets", kind: "instant", unit: "EUR" },
  { field: "equityParent", concept: "EquityAttributableToOwnersOfParent", kind: "instant", unit: "EUR" },
  { field: "minorityInterest", concept: "NoncontrollingInterests", kind: "instant", unit: "EUR" },
  { field: "equity", concept: "Equity", kind: "instant", unit: "EUR" },
  { field: "netDebt", concept: "NetDebt", kind: "instant", unit: "EUR" },
  { field: "operatingCashFlow", concept: "CashFlowsFromUsedInOperatingActivities", kind: "duration", unit: "EUR" },
  { field: "capex", concept: "PaymentsToAcquirePropertyPlantAndEquipment", kind: "duration", unit: "EUR" },
  { field: "dividends", concept: "DividendsPaid", kind: "duration", unit: "EUR" },
];

function previousYearStart(end: string): string {
  const date = new Date(`${end}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Devuelve hechos regulatorios históricos oficiales (CNMV / cuentas anuales
 * consolidadas auditadas) previos a la entrada en vigor del formato ESEF
 * obligatorio en 2020 y partidas anuales faltantes en ESEF/Yahoo.
 */
export function cnmvArchiveFactsForCompany(ticker: string): CompanyFacts | null {
  const archive = ARCHIVES[ticker.toUpperCase()];
  if (!archive) return null;

  const facts: CompanyFacts["facts"] = { "ifrs-full": {} };
  const ns = facts["ifrs-full"];

  for (const snapshot of archive.years) {
    const start = previousYearStart(snapshot.end);
    for (const def of FIELD_CONCEPT) {
      const value = snapshot[def.field];
      if (value === undefined || !Number.isFinite(value)) continue;
      const fact: XbrlFact = {
        ...(def.kind === "duration" ? { start } : {}),
        end: snapshot.end,
        val: value,
        accn: `CNMV-${ticker.toUpperCase()}-${snapshot.end}-${def.field}`,
        form: "CNMV",
        filed: snapshot.filed,
        sourceUrl: archive.sourceUrl,
        sourceLabel: "CNMV · cuentas anuales consolidadas",
      };
      const entry = (ns[def.concept] ??= { units: {} });
      (entry.units[def.unit] ??= []).push(fact);
    }
  }

  return { cik: 0, entityName: archive.entityName, facts };
}
