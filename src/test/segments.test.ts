import { describe, expect, it } from "vitest";
import { extractMostProfitableSegment } from "@/lib/financials/segments";

function context(id: string, member: string, end = "2024-12-31") {
  return `<xbrli:context id="${id}">
    <xbrli:entity><xbrli:identifier scheme="test">1</xbrli:identifier>
      <xbrli:segment><xbrldi:explicitMember dimension="us-gaap:StatementBusinessSegmentsAxis">amzn:${member}Member</xbrldi:explicitMember></xbrli:segment>
    </xbrli:entity>
    <xbrli:period><xbrli:startDate>2024-01-01</xbrli:startDate><xbrli:endDate>${end}</xbrli:endDate></xbrli:period>
  </xbrli:context>`;
}

function fact(contextRef: string, concept: string, value: string) {
  return `<ix:nonfraction name="us-gaap:${concept}" contextref="${contextRef}" unitref="usd" scale="6">${value}</ix:nonfraction>`;
}

describe("extractMostProfitableSegment", () => {
  it("elige por beneficio operativo, no por ingresos", () => {
    const html = `<html><body>
      <xbrli:unit id="usd"><xbrli:measure>iso4217:USD</xbrli:measure></xbrli:unit>
      ${context("north", "NorthAmerica")}${context("aws", "AWS")}${context("intl", "International")}
      ${fact("north", "OperatingIncomeLoss", "25,000")}${fact("north", "RevenueFromContractWithCustomerExcludingAssessedTax", "387,000")}
      ${fact("aws", "OperatingIncomeLoss", "39,800")}${fact("aws", "RevenueFromContractWithCustomerExcludingAssessedTax", "107,500")}
      ${fact("intl", "OperatingIncomeLoss", "3,800")}${fact("intl", "RevenueFromContractWithCustomerExcludingAssessedTax", "143,000")}
    </body></html>`;

    const result = extractMostProfitableSegment(html);
    expect(result?.name).toBe("AWS");
    expect(result?.profit).toBe(39_800_000_000);
    expect(result?.marginPct).toBeCloseTo(37.02, 1);
    expect(result?.comparedSegments).toBe(3);
  });

  it("no proclama un ganador si el informe no permite comparar dos divisiones", () => {
    const html = `<html><body>${context("only", "Cloud")}${fact("only", "OperatingIncomeLoss", "100")}</body></html>`;
    expect(extractMostProfitableSegment(html)).toBeNull();
  });

  it("no presenta regiones geográficas como si fueran líneas de negocio", () => {
    const html = `<html><body>
      ${context("americas", "Americas")}${context("europe", "Europe")}${context("japan", "Japan")}
      ${fact("americas", "OperatingIncomeLoss", "100")}${fact("europe", "OperatingIncomeLoss", "70")}${fact("japan", "OperatingIncomeLoss", "20")}
    </body></html>`;
    expect(extractMostProfitableSegment(html)).toBeNull();
  });

  it("lee el resultado recurrente por división impreso en un informe ESEF", () => {
    const html = `<html><body>
      <h2>1. Vins et Spiritueux</h2><p>Résultat opérationnel courant (en millions d’euros)</p><p>1 356</p>
      <h2>2. Mode et Maroquinerie</h2><p>Résultat opérationnel courant (en millions d’euros)</p><p>10 577</p>
      <h2>3. Parfums et Cosmétiques</h2><p>Résultat opérationnel courant (en millions d’euros)</p><p>671</p>
    </body></html>`;
    const result = extractMostProfitableSegment(html);
    expect(result?.name).toBe("Moda y marroquinería");
    expect(result?.profit).toBe(10_577_000_000);
    expect(result?.currency).toBe("EUR");
  });
});
