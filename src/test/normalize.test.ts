import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { classifyPeriod, fiscalYearEndAnchor, normalizeStatement } from "@/lib/sec/normalize";
import { BALANCE_SHEET, CASH_FLOW, INCOME_STATEMENT, type LineDef } from "@/lib/sec/taxonomy";
import type { CompanyFacts } from "@/lib/sec/types";

const cargar = (t: string): CompanyFacts =>
  JSON.parse(readFileSync(join(__dirname, `fixtures/companyfacts-${t}.json`), "utf8"));

const AAPL = cargar("aapl");
const TSLA = cargar("tsla");
const JNJ = cargar("jnj");

const valor = (
  facts: CompanyFacts,
  lines: LineDef[],
  id: string,
  periodo: string,
  freq: "annual" | "quarterly" = "annual",
) => {
  const st = normalizeStatement(facts, lines, freq, 15);
  return st.rows.find((r) => r.line.id === id)?.cells[periodo] ?? null;
};

describe("clasificación de periodos a partir de la fecha de cierre", () => {
  it("deriva el ejercicio del cierre, nunca del campo fy de la presentación", () => {
    // El mismo periodo aparece con fy 2023, 2024 y 2025 según quién lo reexprese.
    const ancla = fiscalYearEndAnchor(AAPL);
    expect(classifyPeriod("2023-09-30", ancla)).toEqual({ fiscalYear: 2023, quarter: 4 });
  });

  it("asigna los trimestres de Apple respecto a un cierre de ejercicio en septiembre", () => {
    const a = fiscalYearEndAnchor(AAPL);
    expect(classifyPeriod("2025-12-27", a)).toEqual({ fiscalYear: 2026, quarter: 1 });
    expect(classifyPeriod("2026-03-28", a)).toEqual({ fiscalYear: 2026, quarter: 2 });
    expect(classifyPeriod("2026-06-27", a)).toEqual({ fiscalYear: 2026, quarter: 3 });
  });

  it("absorbe el desplazamiento del calendario de 52/53 semanas de JNJ", () => {
    // El ejercicio 2022 de JNJ cerró el 1 de enero de 2023, no el 31 de diciembre.
    const a = fiscalYearEndAnchor(JNJ);
    expect(classifyPeriod("2023-01-01", a)).toEqual({ fiscalYear: 2022, quarter: 4 });
    expect(classifyPeriod("2023-12-31", a)).toEqual({ fiscalYear: 2023, quarter: 4 });
  });
});

describe("resolución de alias por periodo", () => {
  it("produce una serie de ingresos contigua a través de la transición a ASC 606", () => {
    // Apple etiquetó 2017 como SalesRevenueNet en su 10-K de 2017, como Revenues
    // en el de 2018 y como RevenueFromContractWithCustomer... en el de 2019, con
    // idéntico valor. Lo que importa no es qué concepto gane, sino que ningún
    // ejercicio quede vacío al cruzar la frontera de la norma.
    const st = normalizeStatement(AAPL, INCOME_STATEMENT, "annual", 12);
    const fila = st.rows.find((r) => r.line.id === "revenue")!;
    for (const fy of ["FY2017", "FY2018", "FY2019", "FY2020", "FY2021", "FY2022", "FY2023"]) {
      expect(fila.cells[fy]?.value, `${fy} no debería estar vacío`).not.toBeNull();
    }
    expect(fila.cells["FY2017"]?.value).toBe(229_234_000_000);
    expect(fila.cells["FY2023"]?.value).toBe(383_285_000_000);
  });

  it("resuelve el patrimonio neto de JNJ con el concepto que cubre cada ejercicio", () => {
    // JNJ solo usa StockholdersEquity desde 2023; antes, la variante con minoritarios.
    expect(valor(JNJ, BALANCE_SHEET, "equity", "FY2019")?.value).not.toBeNull();
    expect(valor(JNJ, BALANCE_SHEET, "equity", "FY2024")?.value).not.toBeNull();
  });

  it("las tres empresas producen una línea de ingresos completa pese a etiquetar distinto", () => {
    for (const [nombre, facts] of [["AAPL", AAPL], ["TSLA", TSLA], ["JNJ", JNJ]] as const) {
      const st = normalizeStatement(facts, INCOME_STATEMENT, "annual", 6);
      const fila = st.rows.find((r) => r.line.id === "revenue")!;
      const conDato = st.periods.filter((p) => fila.cells[p.key]?.value != null);
      expect(conDato.length, `${nombre} debería tener al menos 5 ejercicios`).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("valores de control frente a los informes reales", () => {
  it("reproduce cifras auditadas de los 10-K", () => {
    expect(valor(AAPL, INCOME_STATEMENT, "revenue", "FY2023")?.value).toBe(383_285_000_000);
    expect(valor(AAPL, BALANCE_SHEET, "totalAssets", "FY2023")?.value).toBe(352_583_000_000);
    expect(valor(TSLA, BALANCE_SHEET, "totalAssets", "FY2023")?.value).toBe(106_618_000_000);
    // Ojo: 79.990 M$, no los 94.943 M$ del 10-K original. Ver el test de Kenvue.
    expect(valor(JNJ, INCOME_STATEMENT, "revenue", "FY2022")?.value).toBe(79_990_000_000);
    expect(valor(JNJ, BALANCE_SHEET, "totalAssets", "FY2022")?.value).toBe(187_378_000_000);
  });
});

describe("reexpresiones", () => {
  it("adopta la reexpresión de JNJ tras la escisión de Kenvue", () => {
    // JNJ declaró 94.943 M$ de ingresos para 2022 en su 10-K de febrero de 2023.
    // Tras escindir Kenvue reexpresó ese mismo ejercicio a operaciones
    // continuadas: 79.990 M$, confirmado en los 10-K de 2024 y 2025.
    // Mostrar la cifra original sería mostrar un dato que la empresa ya retiró.
    const st = normalizeStatement(JNJ, INCOME_STATEMENT, "annual", 12);
    const ingresos = st.rows.find((r) => r.line.id === "revenue")!;
    expect(ingresos.cells["FY2022"]?.value).toBe(79_990_000_000);
    expect(ingresos.cells["FY2022"]?.value).not.toBe(94_943_000_000);
  });

  it("se queda con la presentación de fecha más reciente", () => {
    const st = normalizeStatement(AAPL, INCOME_STATEMENT, "annual", 15);
    const fila = st.rows.find((r) => r.line.id === "revenue")!;
    // El ingreso de 2023 figura en tres 10-K distintos; el valor es único y estable.
    expect(fila.cells["FY2023"]?.value).toBe(383_285_000_000);
  });
});

describe("separación entre duración e instante", () => {
  it("una línea de balance nunca toma un hecho con fecha de inicio", () => {
    const st = normalizeStatement(AAPL, BALANCE_SHEET, "annual", 8);
    expect(st.rows.find((r) => r.line.id === "totalAssets")!.cells["FY2023"]?.value)
      .toBe(352_583_000_000);
    // Assets es un instante puro: si se colara un hecho de duración, el valor cambiaría.
    expect(st.rows.find((r) => r.line.id === "cash")!.cells["FY2023"]?.value).toBe(29_965_000_000);
  });

  it("una línea de resultados nunca toma un hecho sin fecha de inicio", () => {
    const sinDuracion: CompanyFacts = {
      cik: 1, entityName: "Prueba",
      facts: { "us-gaap": { Revenues: { units: { USD: [
        { end: "2023-12-31", val: 999, accn: "a", filed: "2024-01-01" }, // instante: debe ignorarse
      ] } } } },
    };
    const st = normalizeStatement(sinDuracion, INCOME_STATEMENT, "annual", 5);
    expect(st.rows.find((r) => r.line.id === "revenue")!.cells["FY2023"]?.value ?? null).toBeNull();
  });
});

describe("acumulados de los 10-Q", () => {
  it("descarta los periodos de seis y nueve meses en la vista trimestral", () => {
    const st = normalizeStatement(AAPL, INCOME_STATEMENT, "quarterly", 12);
    const fila = st.rows.find((r) => r.line.id === "revenue")!;
    // Ningún trimestre de Apple ha llegado nunca a 150.000 M$; un acumulado de
    // nueve meses sí. Si se colara uno, este umbral lo detecta.
    for (const p of st.periods) {
      const v = fila.cells[p.key]?.value;
      if (v != null) expect(v).toBeLessThan(150_000_000_000);
    }
  });
});

describe("derivación del cuarto trimestre", () => {
  it("calcula Q4 como el ejercicio menos los tres primeros trimestres y lo marca", () => {
    const st = normalizeStatement(AAPL, INCOME_STATEMENT, "quarterly", 16);
    const fila = st.rows.find((r) => r.line.id === "revenue")!;
    const q4 = fila.cells["2023Q4"];
    expect(q4?.derived).toBe(true);
    // Q4 del ejercicio 2023 de Apple: 383.285 − (117.154 + 94.836 + 81.797) = 89.498 M$
    expect(q4?.value).toBe(89_498_000_000);
  });

  it("no genera Q4 si falta alguno de los tres trimestres", () => {
    const incompleto: CompanyFacts = {
      cik: 1, entityName: "Prueba",
      facts: { "us-gaap": { Revenues: { units: { USD: [
        { start: "2023-01-01", end: "2023-12-31", val: 1000, accn: "a", filed: "2024-01-01", form: "10-K" },
        { start: "2023-01-01", end: "2023-03-31", val: 200, accn: "b", filed: "2023-04-01", form: "10-Q" },
        { start: "2023-07-01", end: "2023-09-30", val: 300, accn: "c", filed: "2023-10-01", form: "10-Q" },
        // Falta el segundo trimestre a propósito.
      ] } } } },
    };
    const st = normalizeStatement(incompleto, INCOME_STATEMENT, "quarterly", 8);
    const fila = st.rows.find((r) => r.line.id === "revenue")!;
    expect(fila.cells["2023Q4"]?.value ?? null).toBeNull();
  });

  it("no deriva Q4 en las líneas de balance, que son instantes reportados", () => {
    const st = normalizeStatement(AAPL, BALANCE_SHEET, "quarterly", 12);
    const fila = st.rows.find((r) => r.line.id === "totalAssets")!;
    expect(fila.cells["2023Q4"]?.derived ?? false).toBe(false);
  });

  it("la procedencia de Q4 declara las cuatro entradas reales: el ejercicio completo y los tres trimestres", () => {
    // No basta con marcar la celda como derivada: la procedencia tiene que
    // mostrar de dónde sale la resta, no repetir el propio resultado de Q4
    // etiquetado como si fuera el ejercicio completo.
    const st = normalizeStatement(AAPL, INCOME_STATEMENT, "quarterly", 16);
    const fila = st.rows.find((r) => r.line.id === "revenue")!;
    const q4 = fila.cells["2023Q4"];

    expect(q4?.provenance.kind).toBe("derived");
    if (q4?.provenance.kind !== "derived") throw new Error("procedencia inesperada");

    expect(q4.provenance.formula).toBe("Ejercicio completo − Q1 − Q2 − Q3");
    expect(q4.provenance.inputs).toHaveLength(4);
    for (const entrada of q4.provenance.inputs) {
      expect(entrada.source.kind).toBe("reported");
    }

    const porEtiqueta = Object.fromEntries(q4.provenance.inputs.map((i) => [i.label, i.value]));
    // Mismas cifras que el test anterior: 383.285 − (117.154 + 94.836 + 81.797) = 89.498 M$
    expect(porEtiqueta["Ejercicio completo"]).toBe(383_285_000_000);
    expect(porEtiqueta["Q1"]).toBe(117_154_000_000);
    expect(porEtiqueta["Q2"]).toBe(94_836_000_000);
    expect(porEtiqueta["Q3"]).toBe(81_797_000_000);

    // La fórmula cuadra con el valor mostrado.
    expect(q4.value).toBe(
      porEtiqueta["Ejercicio completo"] - porEtiqueta["Q1"] - porEtiqueta["Q2"] - porEtiqueta["Q3"],
    );
  });
});

describe("convención de signos", () => {
  it("invierte las salidas de caja que la SEC reporta en positivo", () => {
    const st = normalizeStatement(AAPL, CASH_FLOW, "annual", 8);
    const capex = st.rows.find((r) => r.line.id === "capex")!.cells["FY2023"];
    expect(capex?.value).toBeLessThan(0);
    expect(capex?.value).toBe(-10_959_000_000);
  });
});

describe("líneas calculadas", () => {
  it("calcula el flujo de caja libre y lo marca como derivado", () => {
    const st = normalizeStatement(AAPL, CASH_FLOW, "annual", 8);
    const fcf = st.rows.find((r) => r.line.id === "freeCashFlow")!.cells["FY2023"];
    // 110.543 M$ de explotación − 10.959 M$ de inversión en inmovilizado
    expect(fcf?.value).toBe(99_584_000_000);
    expect(fcf?.derived).toBe(true);
  });

  it("usa el beneficio bruto reportado y no lo recalcula cuando existe", () => {
    const st = normalizeStatement(AAPL, INCOME_STATEMENT, "annual", 8);
    const bruto = st.rows.find((r) => r.line.id === "grossProfit")!.cells["FY2023"];
    expect(bruto?.value).toBe(169_148_000_000);
    expect(bruto?.derived).toBe(false);
  });
});

describe("ausencia de dato", () => {
  it("deja la celda vacía en lugar de inventar un cero", () => {
    // JNJ dejó de publicar resultado de explotación como subtotal tras 2015.
    const st = normalizeStatement(JNJ, INCOME_STATEMENT, "annual", 6);
    const fila = st.rows.find((r) => r.line.id === "operatingIncome")!;
    const reciente = st.periods[0];
    const celda = fila.cells[reciente.key];
    expect(celda?.value ?? null).toBeNull();
    expect(celda?.value).not.toBe(0);
  });
});

describe("integridad contable del balance", () => {
  it("el activo cuadra con pasivo más patrimonio en las tres empresas", () => {
    for (const [nombre, facts] of [["AAPL", AAPL], ["TSLA", TSLA], ["JNJ", JNJ]] as const) {
      const st = normalizeStatement(facts, BALANCE_SHEET, "annual", 6);
      const leer = (id: string, key: string) =>
        st.rows.find((r) => r.line.id === id)?.cells[key]?.value ?? null;

      for (const p of st.periods) {
        const activo = leer("totalAssets", p.key);
        const pasivo = leer("totalLiabilities", p.key);
        const patrimonio = leer("equity", p.key);
        const rescatables = leer("redeemableNci", p.key) ?? 0;
        const temporal = leer("temporaryEquityParent", p.key) ?? 0;
        if (activo === null || pasivo === null || patrimonio === null) continue;

        const suma = pasivo + patrimonio + rescatables + temporal;
        // Tolerancia de un millón por los redondeos de la propia presentación.
        expect(
          Math.abs(activo - suma),
          `${nombre} ${p.key}: activo ${activo} frente a ${suma}`,
        ).toBeLessThan(1_000_000);
      }
    }
  });

  it("incluye los minoritarios en el patrimonio total, no solo la matriz", () => {
    // Tesla 2023: matriz 62.634 M$ + minoritarios 733 M$ = 63.367 M$.
    const st = normalizeStatement(TSLA, BALANCE_SHEET, "annual", 6);
    const leer = (id: string) => st.rows.find((r) => r.line.id === id)!.cells["FY2023"]?.value;
    expect(leer("equityParent")).toBe(62_634_000_000);
    expect(leer("minorityInterest")).toBe(733_000_000);
    expect(leer("equity")).toBe(63_367_000_000);
  });
});

describe("procedencia de cada celda", () => {
  it("cada celda reportada lleva concepto, unidad, formulario, fecha y número de acceso", () => {
    const st = normalizeStatement(AAPL, INCOME_STATEMENT, "annual", 10);
    const ingresos = st.rows.find((r) => r.line.id === "revenue")!;
    const celda = ingresos.cells[st.periods[0].key];

    expect(celda.provenance.kind).toBe("reported");
    if (celda.provenance.kind !== "reported") throw new Error("procedencia inesperada");

    expect(celda.provenance.concept).toBeTruthy();
    expect(celda.provenance.unit).toBe("USD");
    expect(celda.provenance.form).toMatch(/^10-[KQ]$/);
    expect(celda.provenance.accn).toMatch(/^\d{10}-\d{2}-\d{6}$/);
    expect(celda.provenance.filed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(celda.provenance.periodStart).not.toBeNull();
    expect(celda.provenance.periodEnd).toBe(st.periods[0].end);
  });

  it("una celda sin dato declara ausencia, no una procedencia vacía", () => {
    // Ninguna empresa reporta las veintiuna líneas del balance, así que siempre
    // hay celdas vacías con las que comprobar esto sobre datos reales.
    const st = normalizeStatement(AAPL, BALANCE_SHEET, "annual", 10);
    const vacias = st.rows.flatMap((fila) =>
      st.periods.map((p) => fila.cells[p.key]).filter((c) => c && c.value === null),
    );

    expect(vacias.length).toBeGreaterThan(0);
    for (const celda of vacias) expect(celda.provenance.kind).toBe("absent");
  });

  it("el flujo de caja libre derivado declara su fórmula y sus dos entradas", () => {
    const st = normalizeStatement(AAPL, CASH_FLOW, "annual", 10);
    const fcf = st.rows.find((r) => r.line.id === "freeCashFlow")!;
    const celda = fcf.cells[st.periods[0].key];

    expect(celda.derived).toBe(true);
    expect(celda.provenance.kind).toBe("derived");
    if (celda.provenance.kind !== "derived") throw new Error("procedencia inesperada");

    expect(celda.provenance.formula).toBe(
      "Flujo de caja de explotación − Inversión en inmovilizado",
    );
    expect(celda.provenance.inputs).toHaveLength(2);
    // Cada entrada de un derivado arrastra su propia procedencia reportada.
    expect(celda.provenance.inputs[0].source.kind).toBe("reported");
    expect(celda.provenance.inputs[1].source.kind).toBe("reported");
    // La fórmula cuadra con el valor mostrado.
    const [cfo, capex] = celda.provenance.inputs;
    expect(celda.value).toBeCloseTo(cfo.value - capex.value, 0);
  });
});

describe("prioridad de conceptos donde varios candidatos compiten", () => {
  const anual = (facts: CompanyFacts, id: string, fy: string) => {
    const st = normalizeStatement(facts, INCOME_STATEMENT, "annual", 12);
    return st.rows.find((r) => r.line.id === id)?.cells[fy]?.value ?? null;
  };

  it("toma la I+D operativa de JNJ y no los cargos por I+D adquirida", () => {
    // ResearchAndDevelopmentExpense vale 1.841 M$ en 2024 (I+D adquirida);
    // la I+D real de JNJ son 17.232 M$ y vive en la variante "Excluding".
    expect(anual(JNJ, "researchAndDevelopment", "FY2024")).toBe(17_232_000_000);
    expect(anual(JNJ, "researchAndDevelopment", "FY2025")).toBe(14_665_000_000);
  });

  it("no rompe la I+D de quien solo usa el concepto genérico", () => {
    expect(anual(AAPL, "researchAndDevelopment", "FY2025")).toBe(34_550_000_000);
  });

  it("resuelve el gasto financiero con la etiqueta de la cuenta de resultados", () => {
    expect(anual(TSLA, "interestExpense", "FY2023")).toBe(156_000_000);
    expect(anual(JNJ, "interestExpense", "FY2024")).toBe(755_000_000);
    // Apple no usa la variante nonoperating: debe caer en la de reserva.
    expect(anual(AAPL, "interestExpense", "FY2023")).toBe(3_933_000_000);
  });
});
