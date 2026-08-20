import { describe, expect, it } from "vitest";
import { edgarFilingUrl } from "@/lib/sec/provenance";

describe("edgarFilingUrl", () => {
  it("quita los ceros a la izquierda del CIK y los guiones del número de acceso", () => {
    // Las rutas de www.sec.gov/Archives usan el CIK SIN ceros y el directorio
    // del filing sin guiones, pero el fichero de índice sí los lleva.
    expect(edgarFilingUrl("0000320193", "0000320193-26-000020")).toBe(
      "https://www.sec.gov/Archives/edgar/data/320193/000032019326000020/0000320193-26-000020-index.htm",
    );
  });

  it("acepta el CIK ya sin ceros", () => {
    expect(edgarFilingUrl("1318605", "0001318605-25-000045")).toBe(
      "https://www.sec.gov/Archives/edgar/data/1318605/000131860525000045/0001318605-25-000045-index.htm",
    );
  });
});
