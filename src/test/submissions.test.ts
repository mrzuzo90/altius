import { describe, expect, it } from "vitest";
import { buildProfile, pickLatestFiling, sectorFromSic, type RawSubmissions } from "@/lib/sec/submissions";

const CRUDO: RawSubmissions = {
  cik: "0000320193",
  name: "Apple Inc.",
  sic: "3571",
  sicDescription: "Electronic Computers",
  tickers: ["AAPL"],
  exchanges: ["Nasdaq"],
  fiscalYearEnd: "0926",
  website: "",
  description: "",
  stateOfIncorporation: "CA",
  addresses: {
    business: { street1: "ONE APPLE PARK WAY", city: "CUPERTINO", stateOrCountry: "CA", zipCode: "95014" },
  },
  filings: {
    recent: {
      accessionNumber: ["0000320193-25-000079", "0000320193-25-000073", "0000320193-24-000123"],
      filingDate: ["2025-10-31", "2025-08-01", "2024-11-01"],
      reportDate: ["2025-09-27", "2025-06-28", "2024-09-28"],
      form: ["10-K", "10-Q", "10-K"],
      primaryDocument: ["aapl-20250927.htm", "aapl-20250628.htm", "aapl-20240928.htm"],
    },
  },
};

describe("sectorFromSic", () => {
  it("mapea cada código a su división oficial del SIC", () => {
    expect(sectorFromSic("3571")).toBe("Manufactura");
    expect(sectorFromSic("6021")).toBe("Finanzas, seguros e inmobiliario");
    expect(sectorFromSic("7372")).toBe("Servicios");
    expect(sectorFromSic("5812")).toBe("Comercio minorista");
    expect(sectorFromSic("1311")).toBe("Minería");
    expect(sectorFromSic("4813")).toBe("Transporte y servicios públicos");
  });

  it("devuelve un valor neutro ante un SIC ausente o desconocido", () => {
    expect(sectorFromSic("")).toBe("No clasificado");
    expect(sectorFromSic("9999")).toBe("No clasificado");
  });
});

describe("buildProfile", () => {
  const p = buildProfile(CRUDO);

  it("extrae la identidad de la empresa", () => {
    expect(p.name).toBe("Apple Inc.");
    expect(p.cik).toBe("0000320193");
    expect(p.tickers).toEqual(["AAPL"]);
    expect(p.exchanges).toEqual(["Nasdaq"]);
  });

  it("usa sicDescription como industria y deriva el sector del código", () => {
    expect(p.sicDescription).toBe("Electronic Computers");
    expect(p.sector).toBe("Manufactura");
  });

  it("convierte una web vacía en null en lugar de cadena vacía", () => {
    expect(p.website).toBeNull();
  });

  it("compone la dirección a partir de las partes disponibles", () => {
    expect(p.address).toBe("ONE APPLE PARK WAY, CUPERTINO, CA 95014");
  });
});

describe("pickLatestFiling", () => {
  it("devuelve el 10-K más reciente e ignora los 10-Q", () => {
    const f = pickLatestFiling(CRUDO, ["10-K"])!;
    expect(f.form).toBe("10-K");
    expect(f.filingDate).toBe("2025-10-31");
    expect(f.reportDate).toBe("2025-09-27");
  });

  it("construye la URL del documento sin ceros en el CIK y sin guiones en el accession", () => {
    const f = pickLatestFiling(CRUDO, ["10-K"])!;
    expect(f.documentUrl).toBe(
      "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm",
    );
  });

  it("admite varios formularios y elige el de fecha mayor entre todos", () => {
    const f = pickLatestFiling(CRUDO, ["10-K", "10-Q"])!;
    expect(f.filingDate).toBe("2025-10-31");
  });

  it("devuelve null si ningún formulario coincide", () => {
    expect(pickLatestFiling(CRUDO, ["20-F"])).toBeNull();
  });
});
