import { describe, expect, it } from "vitest";
import { extractMdna, htmlToText } from "@/lib/sec/mdna";

const relleno = (n: number) =>
  Array.from(
    { length: n },
    (_, i) =>
      `<p>Net sales increased during the period driven primarily by higher demand across the ` +
      `product portfolio, partially offset by unfavorable foreign exchange movements in segment ${i}.</p>`,
  ).join("\n");

/** Reproduce la estructura real de un 10-K: el encabezado sale en el índice y otra vez en el cuerpo. */
const DIEZ_K = `
<html><body>
  <table>
    <tr><td>Item 7.</td><td>Management's Discussion and Analysis of Financial Condition</td><td>28</td></tr>
    <tr><td>Item 7A.</td><td>Quantitative and Qualitative Disclosures About Market Risk</td><td>44</td></tr>
    <tr><td>Item 8.</td><td>Financial Statements and Supplementary Data</td><td>45</td></tr>
  </table>
  <p>Item 1. Business</p>
  <p>The Company designs, manufactures and markets smartphones and personal computers.</p>
  <h2>Item 7. Management's Discussion and Analysis of Financial Condition and Results of Operations</h2>
  <p>MARCADOR_CUERPO_INICIO</p>
  ${relleno(40)}
  <p>MARCADOR_CUERPO_FIN</p>
  <h2>Item 7A. Quantitative and Qualitative Disclosures About Market Risk</h2>
  <p>MARCADOR_FUERA_DE_SECCION</p>
</body></html>`;

describe("htmlToText", () => {
  it("elimina etiquetas y decodifica las entidades habituales", () => {
    expect(htmlToText("<p>Ventas &amp; costes</p><p>Segundo</p>")).toBe("Ventas & costes\nSegundo");
  });

  it("descarta el contenido de script y style", () => {
    expect(htmlToText("<style>p{color:red}</style><script>var x=1</script><p>Texto</p>")).toBe("Texto");
  });
});

describe("extractMdna", () => {
  const r = extractMdna(DIEZ_K, "10-K");

  it("devuelve el cuerpo del apartado y no la línea del índice", () => {
    expect(r).not.toBeNull();
    expect(r!.text).toContain("MARCADOR_CUERPO_INICIO");
    expect(r!.text).toContain("MARCADOR_CUERPO_FIN");
  });

  it("corta en el Item 7A y no arrastra el apartado siguiente", () => {
    expect(r!.text).not.toContain("MARCADOR_FUERA_DE_SECCION");
  });

  it("no incluye apartados anteriores al MD&A", () => {
    expect(r!.text).not.toContain("Item 1. Business");
  });

  it("devuelve null cuando el documento no tiene el apartado", () => {
    expect(extractMdna("<html><body><p>Item 1. Business</p></body></html>", "10-K")).toBeNull();
  });

  it("devuelve null si solo aparece el índice, sin cuerpo", () => {
    const soloIndice = `<html><body><table>
      <tr><td>Item 7.</td><td>Management's Discussion and Analysis</td><td>28</td></tr>
      <tr><td>Item 7A.</td><td>Quantitative Disclosures</td><td>44</td></tr>
    </table></body></html>`;
    expect(extractMdna(soloIndice, "10-K")).toBeNull();
  });

  it("localiza el Item 2 en los informes trimestrales", () => {
    const diezQ = `<html><body>
      <h2>Item 2. Management's Discussion and Analysis of Financial Condition</h2>
      <p>MARCADOR_Q</p>
      ${relleno(30)}
      <h2>Item 3. Quantitative and Qualitative Disclosures About Market Risk</h2>
      <p>FUERA</p></body></html>`;
    const q = extractMdna(diezQ, "10-Q");
    expect(q!.text).toContain("MARCADOR_Q");
    expect(q!.text).not.toContain("FUERA");
  });
});
