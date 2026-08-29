import { describe, expect, it } from "vitest";
import { extractBusinessSection, extractBusinessSummary, extractMdna, htmlToText, limpiarMobiliarioDePagina } from "@/lib/sec/mdna";

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

describe("extractBusinessSummary", () => {
  it("extrae una descripción operativa del Item 1 del 10-K", () => {
    const summary = extractBusinessSummary(DIEZ_K, "10-K");

    expect(summary).toContain("designs, manufactures and markets smartphones");
    expect(summary).not.toContain("MARCADOR_CUERPO_INICIO");
  });

  it("usa el Item 4 para emisores internacionales con 20-F", () => {
    const veinteF = `<html><body>
      <table><tr><td>Item 4. Information on the Company</td></tr><tr><td>Item 5. Operating and Financial Review</td></tr></table>
      <h2>Item 4. Information on the Company</h2>
      <p>We design and manufacture advanced lithography systems that semiconductor customers use to produce integrated circuits at industrial scale.</p>
      <p>Our installed base is supported through upgrades, maintenance services and computational software sold across global markets.</p>
      <h2>Item 5. Operating and Financial Review</h2><p>FUERA_DEL_NEGOCIO</p>
    </body></html>`;

    const summary = extractBusinessSummary(veinteF, "20-F");
    expect(summary).toContain("lithography systems");
    expect(summary).not.toContain("FUERA_DEL_NEGOCIO");
  });

  it("encuentra una frase operativa aunque el 40-F no conserve un índice estándar", () => {
    const cuarentaF = `<html><body>
      <p>Annual report to shareholders</p>
      <p>The bank provides personal and commercial banking, wealth management and capital markets services to millions of customers across Canada.</p>
      <p>Forward-looking statements involve risks and uncertainties described elsewhere.</p>
    </body></html>`;

    expect(extractBusinessSummary(cuarentaF, "40-F")).toContain("commercial banking");
  });

  it("conserva contexto suficiente del negocio para traducirlo a lenguaje sencillo", () => {
    const section = extractBusinessSection(DIEZ_K, "10-K", 20_000);
    expect(section?.text).toContain("designs, manufactures and markets smartphones");
    expect(section?.text).not.toContain("RISK_FACTORS_FUERA");
  });

  it("tolera letras separadas por el maquetador Inline XBRL en los encabezados", () => {
    const html = `<html><body>
      <h2>ITEM 1. B USINESS</h2>
      <p>Microsoft develops Windows, Azure and Microsoft 365 for consumers and companies around the world.</p>
      <p>Customers pay for licenses, subscriptions and cloud usage across these products and services.</p>
      <h2>ITEM 1A. RIS K FACTORS</h2><p>FUERA</p>
    </body></html>`;
    const section = extractBusinessSection(html, "10-K");
    expect(section?.text).toContain("Windows, Azure and Microsoft 365");
    expect(section?.text).not.toContain("FUERA");
  });
});

describe("limpieza del mobiliario de página", () => {
  it("elimina los encabezados repetidos que los 10-K llevan en cada página", () => {
    // Así es como aparece de verdad tras aplanar el HTML: en su propia línea.
    const conRuido = [
      "Net sales increased.",
      "Apple Inc. | 2025 Form 10-K | 21",
      "Tariffs were announced in 2025.",
    ].join("\n");
    const limpio = limpiarMobiliarioDePagina(conRuido);
    expect(limpio).not.toContain("Form 10-K");
    expect(limpio).not.toContain("| 21");
    expect(limpio).toContain("Net sales increased.");
    expect(limpio).toContain("Tariffs were announced in 2025.");
  });

  it("elimina los rótulos de índice y los números de página sueltos", () => {
    const limpio = limpiarMobiliarioDePagina("Ingresos\nTable of Contents\n21\nsiguientes");
    expect(limpio).not.toContain("Table of Contents");
    expect(limpio.split("\n")).toEqual(["Ingresos", "siguientes"]);
  });

  it("no toca la prosa que menciona el formulario sin ser encabezado", () => {
    const prosa = "This should be read in conjunction with Part II, Item 8 of this Form 10-K.";
    expect(limpiarMobiliarioDePagina(prosa)).toBe(prosa);
  });

  it("deja intacto un texto sin mobiliario", () => {
    const limpio = "Net sales increased during 2025 driven by higher demand.";
    expect(limpiarMobiliarioDePagina(limpio)).toBe(limpio);
  });
});

describe("decodificación de entidades", () => {
  it("decodifica las entidades numéricas que usan los 10-K", () => {
    // Antes, el orden de sustitución dejaba "&#174;" literal en el texto: se
    // decodificaba &amp; primero y ninguna regla posterior tocaba las numéricas.
    expect(htmlToText("<p>iPhone &#174; y iPhone Air&#8482;</p>")).toBe("iPhone ® y iPhone Air™");
  });

  it("decodifica entidades hexadecimales", () => {
    expect(htmlToText("<p>caf&#xe9;</p>")).toBe("café");
  });

  it("conserva el ampersand real", () => {
    expect(htmlToText("<p>Johnson &amp; Johnson</p>")).toBe("Johnson & Johnson");
  });
})
