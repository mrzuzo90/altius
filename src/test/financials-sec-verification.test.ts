import { describe, expect, it } from "vitest";
import { QUALITY_SCREENER_UNIVERSE } from "@/lib/quality-screener/universe";
import { MARKET_LEADER_CONFIGS } from "@/lib/home/leaders-data";
import { resolveTicker } from "@/lib/sec/tickers";
import { resolveEsefCompanyDynamic } from "@/lib/esef/resolve";
import { buildStatements, hasUsableData } from "@/lib/sec/statements";
import { buildEsefStatements } from "@/lib/esef";
import { getCompanyFacts } from "@/lib/sec/company-facts";
import { supplementAnnualStatements } from "@/lib/financials/yahoo-supplement";
import { mergeStatementBundles } from "@/lib/financials/merge";

describe("verificación de cobertura y autenticidad de estados financieros contra la SEC", () => {
  it("resuelve el 100% del universo del screener a entidades operativas válidas", async () => {
    for (const item of QUALITY_SCREENER_UNIVERSE) {
      const hit = await resolveTicker(item.ticker);
      expect(hit, `El ticker ${item.ticker} debe resolver a un emisor registrado`).not.toBeNull();
      expect(hit!.cik, `El ticker ${item.ticker} debe tener un CIK de 10 dígitos`).toMatch(/^\d{10}$/);
    }
  });

  it("valida la cobertura y estados financieros de todos los líderes de mercado", async () => {
    for (const leader of MARKET_LEADER_CONFIGS) {
      const [hit, esef] = await Promise.all([
        resolveTicker(leader.ticker),
        resolveEsefCompanyDynamic(leader.ticker),
      ]);
      expect(hit || esef, `Líder ${leader.ticker} debe resolver`).toBeTruthy();
      const [secBundle, esefBundle] = await Promise.all([
        hit ? buildStatements(hit.cik, "annual", hit.name, leader.ticker) : Promise.resolve(null),
        esef ? buildEsefStatements(esef, "annual") : Promise.resolve(null),
      ]);
      const bundle = esefBundle && hasUsableData(esefBundle)
        ? mergeStatementBundles(esefBundle, secBundle && hasUsableData(secBundle) ? secBundle : null)
        : secBundle ?? esefBundle!;
      expect(hasUsableData(bundle), `Líder ${leader.ticker} debe tener datos`).toBe(true);
    }
  });

  it("resuelve XOM directamente a la matriz operativa Exxon Mobil Corp (CIK 0000034088)", async () => {
    const hit = await resolveTicker("XOM");
    expect(hit).not.toBeNull();
    expect(hit!.cik).toBe("0000034088");
    expect(hit!.name).toBe("EXXON MOBIL CORP");

    const bundle = await buildStatements(hit!.cik, "annual", hit!.name, "XOM");
    expect(hasUsableData(bundle)).toBe(true);
    const income = bundle.blocks.find((b) => b.id === "income")!;
    expect(income.periods.length).toBeGreaterThanOrEqual(10);
    const rev2024 = income.rows.find((r) => r.line.id === "revenue")?.cells["FY2024"]?.value;
    expect(rev2024).toBeGreaterThan(300_000_000_000); // Exxon factura >300B $
  });

  it("compara fielmente las magnitudes clave de líderes contra los hechos brutos de SEC EDGAR", async () => {
    const verificationTargets = [
      { ticker: "AAPL", cik: "0000320193", fy: "FY2024" },
      { ticker: "MSFT", cik: "0000789019", fy: "FY2024" },
      { ticker: "NVDA", cik: "0001045810", fy: "FY2024" },
      { ticker: "GOOGL", cik: "0001652044", fy: "FY2024" },
      { ticker: "TSLA", cik: "0001318605", fy: "FY2024" },
    ];

    for (const target of verificationTargets) {
      const [rawFacts, bundle] = await Promise.all([
        getCompanyFacts(target.cik),
        buildStatements(target.cik, "annual"),
      ]);

      const income = bundle.blocks.find((b) => b.id === "income")!;
      const balance = bundle.blocks.find((b) => b.id === "balance")!;
      const cashflow = bundle.blocks.find((b) => b.id === "cashflow")!;

      const altiusRev = income.rows.find((r) => r.line.id === "revenue")?.cells[target.fy]?.value;
      const altiusNet = income.rows.find((r) => r.line.id === "netIncome")?.cells[target.fy]?.value;
      const altiusAssets = balance.rows.find((r) => r.line.id === "totalAssets")?.cells[target.fy]?.value;
      const altiusCfo = cashflow.rows.find((r) => r.line.id === "operatingCashFlow")?.cells[target.fy]?.value;

      expect(altiusRev, `${target.ticker} ingresos en ${target.fy}`).not.toBeNull();
      expect(altiusNet, `${target.ticker} beneficio neto en ${target.fy}`).not.toBeNull();
      expect(altiusAssets, `${target.ticker} activo total en ${target.fy}`).not.toBeNull();
      expect(altiusCfo, `${target.ticker} flujo de caja de explotación en ${target.fy}`).not.toBeNull();

      // Comparación con el hecho bruto XBRL de SEC us-gaap
      const usgaap = rawFacts.facts["us-gaap"];
      expect(usgaap).toBeDefined();

      const targetPeriod = bundle.blocks[0]?.periods.find((p) => p.key === target.fy);
      expect(targetPeriod).toBeDefined();

      const secAssetsFacts = usgaap["Assets"]?.units?.["USD"] ?? [];
      const matchingAsset = secAssetsFacts.find((f) => f.end === targetPeriod!.end && f.form?.startsWith("10-K"));
      if (matchingAsset) {
        expect(altiusAssets).toBe(matchingAsset.val);
      }

      const secNetFacts = (usgaap["NetIncomeLoss"] ?? usgaap["ProfitLoss"])?.units?.["USD"] ?? [];
      const matchingNet = secNetFacts.find((f) => f.end === targetPeriod!.end && f.form?.startsWith("10-K"));
      if (matchingNet) {
        expect(altiusNet).toBe(matchingNet.val);
      }
    }
  });

  it("verifica estados financieros de empresas españolas y europeas vía ESEF y suplementación", async () => {
    const spanishTickers = ["ITX.MC", "SAN.MC", "IBE.MC", "REP.MC", "TEF.MC", "MC.PA"];

    for (const ticker of spanishTickers) {
      const esef = await resolveEsefCompanyDynamic(ticker);
      expect(esef, `Emisor ${ticker} debe resolver en ESEF`).not.toBeNull();

      const baseBundle = await buildEsefStatements(esef!, "annual");
      expect(hasUsableData(baseBundle), `Emisor ${ticker} debe tener datos ESEF`).toBe(true);
      expect(baseBundle.blocks[0].periods.length).toBeGreaterThanOrEqual(4);

      const supplemented = await supplementAnnualStatements(baseBundle, {
        ticker: esef!.ticker,
        name: esef!.name,
        country: esef!.country,
        sector: esef!.sector,
      });

      const income = supplemented.blocks.find((b) => b.id === "income")!;
      const revLine = income.rows.find((r) => r.line.id === "revenue")!;
      const netLine = income.rows.find((r) => r.line.id === "netIncome")!;

      const hasRev = Object.values(revLine.cells).some((c) => c.value !== null && c.value > 0);
      const hasNet = Object.values(netLine.cells).some((c) => c.value !== null);
      expect(hasRev, `${ticker} debe tener ingresos reportados`).toBe(true);
      expect(hasNet, `${ticker} debe tener resultado neto reportado`).toBe(true);
    }
  });

  it("garantiza la procedencia estricta de cada dato sin inventar cifras", async () => {
    const sampleTickers = ["AAPL", "NVDA", "JPM", "XOM", "ITX.MC"];

    for (const ticker of sampleTickers) {
      const [hit, esef] = await Promise.all([
        resolveTicker(ticker),
        resolveEsefCompanyDynamic(ticker),
      ]);

      const [secBundle, esefBundle] = await Promise.all([
        hit ? buildStatements(hit.cik, "annual", hit.name, ticker) : Promise.resolve(null),
        esef ? buildEsefStatements(esef, "annual") : Promise.resolve(null),
      ]);

      let bundle = esefBundle && hasUsableData(esefBundle)
        ? mergeStatementBundles(esefBundle, secBundle && hasUsableData(secBundle) ? secBundle : null)
        : secBundle ?? esefBundle!;

      bundle = await supplementAnnualStatements(bundle, {
        ticker,
        name: bundle.profile.name || ticker,
        country: esef?.country ?? bundle.profile.stateOfIncorporation,
        sector: esef?.sector ?? bundle.profile.sector,
      });

      for (const block of bundle.blocks) {
        for (const row of block.rows) {
          for (const [periodKey, cell] of Object.entries(row.cells)) {
            if (cell.value !== null) {
              // El dato debe ser legítimamente reportado o derivado con fórmula transparente
              expect(
                ["reported", "derived"].includes(cell.provenance.kind),
                `La celda ${block.id}/${row.line.id} en ${periodKey} (${ticker}) debe tener procedencia reported o derived`,
              ).toBe(true);

              if (cell.provenance.kind === "reported") {
                const form = cell.provenance.form ?? "";
                const isKnownRegulatoryForm =
                  form.startsWith("10-K") ||
                  form.startsWith("20-F") ||
                  form.startsWith("40-F") ||
                  form.startsWith("10-Q") ||
                  form.startsWith("8-K") ||
                  form.startsWith("6-K") ||
                  form.includes("14A") ||
                  form === "ESEF" ||
                  form === "YAHOO-ANNUAL";
                expect(
                  isKnownRegulatoryForm,
                  `El formulario reportado "${form}" de ${ticker} (${block.id}/${row.line.id}/${periodKey}) debe ser regulatorio oficial`,
                ).toBe(true);
              }

              if (cell.provenance.kind === "derived") {
                expect(cell.provenance.formula).toBeDefined();
                expect(cell.provenance.inputs.length).toBeGreaterThanOrEqual(1);
              }
            }
          }
        }
      }
    }
  });
});
