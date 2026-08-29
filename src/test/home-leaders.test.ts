import { describe, expect, it } from "vitest";
import { buildMarketLeaderFundamentals } from "@/lib/home/leaders-server";
import { MARKET_LEADER_CONFIGS } from "@/lib/home/leaders-data";
import { previousTradingCloseFromChart } from "@/lib/quotes/client";
import type { StatementBundle } from "@/lib/sec/statements";
import type { LineSeries, NormalizedStatement, Period } from "@/lib/sec/normalize";

function unix(date: string) {
  return Date.parse(`${date}T20:00:00Z`) / 1_000;
}

function statement(periods: Period[], valuesByLine: Record<string, number[]>): NormalizedStatement {
  const rows: LineSeries[] = Object.entries(valuesByLine).map(([id, values]) => ({
    line: { id, label: id, concepts: [], kind: "duration", unit: "USD" },
    cells: Object.fromEntries(periods.map((period, index) => [
      period.key,
      { value: values[index] ?? null, derived: false, provenance: { kind: "absent" as const } },
    ])),
  }));
  return { periods, rows };
}

describe("tabla de líderes de mercado", () => {
  it("usa la cotización europea de Iberdrola y no aplica la antigua relación ADR a AstraZeneca", () => {
    expect(MARKET_LEADER_CONFIGS.some((company) => company.ticker === "IBE.MC")).toBe(true);
    expect(MARKET_LEADER_CONFIGS.find((company) => company.ticker === "AZN")?.sharesPerListing).toBeUndefined();
  });

  it("calcula la variación contra la sesión anterior, no contra el inicio del rango", () => {
    const timestamps = [unix("2026-08-21"), unix("2026-08-24"), unix("2026-08-25"), unix("2026-08-26")];
    const closes = [190, 195, 200, 202];

    expect(previousTradingCloseFromChart(unix("2026-08-26"), timestamps, closes)).toBe(200);
  });

  it("ignora cierres nulos al buscar la sesión anterior", () => {
    const timestamps = [unix("2026-08-24"), unix("2026-08-25"), unix("2026-08-26")];
    const closes = [195, null, 202];

    expect(previousTradingCloseFromChart(unix("2026-08-26"), timestamps, closes)).toBe(195);
  });

  it("construye los múltiplos mostrados a partir del precio y los estados XBRL", () => {
    const periods: Period[] = [{
      key: "FY2025",
      label: "FY 2025",
      end: "2025-12-31",
      fiscalYear: 2025,
      quarter: 4,
      derived: false,
    }];
    const bundle: StatementBundle = {
      profile: {
        cik: "0000000001",
        name: "Test Corp",
        tickers: ["TEST"],
        sector: "Technology",
        sic: "3571",
        sicDescription: "Computers",
        exchanges: ["NASDAQ"],
        fiscalYearEnd: "1231",
        website: null,
        address: null,
        stateOfIncorporation: "DE",
      },
      frequency: "annual",
      currency: "USD",
      latestPeriodEnd: "2025-12-31",
      blocks: [
        {
          id: "income",
          label: "Income",
          ...statement(periods, {
            revenue: [10_000_000_000],
            operatingIncome: [3_000_000_000],
            netIncome: [2_320_000_000],
            sharesDiluted: [100_000_000],
            epsDiluted: [23.2],
          }),
        },
        {
          id: "balance",
          label: "Balance",
          ...statement(periods, {
            cash: [800_000_000],
            shortTermInvestments: [200_000_000],
            longTermDebt: [1_200_000_000],
            shortTermDebt: [300_000_000],
          }),
        },
        {
          id: "cashflow",
          label: "Cash flow",
          ...statement(periods, {
            depreciation: [500_000_000],
            freeCashFlow: [2_450_000_000],
          }),
        },
        {
          id: "ratios",
          label: "Ratios",
          ...statement(periods, {
            fcfMargin: [24.5],
            roic: [18],
            revenueGrowthYoY: [12.3],
          }),
        },
      ],
    };

    const result = buildMarketLeaderFundamentals(bundle, 50, "2026-08-26");

    expect(result.marketCap).toBe(5_000);
    expect(result.fundamentalCurrency).toBe("USD");
    expect(result.pe).toBeCloseTo(50 / 23.2);
    expect(result.evEbitda).toBeCloseTo(5_500_000_000 / 3_500_000_000);
    expect(result.fcfMargin).toBe(24.5);
    expect(result.roic).toBe(18);
    expect(result.revenueGrowth).toBe(12.3);
  });
});
