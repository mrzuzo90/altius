# Altius — De terminal financiera a Investment Thesis OS

> **Para trabajadores agénticos:** SUB-SKILL REQUERIDO: usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar tarea a tarea. Los pasos usan casillas (`- [ ]`).

**Fecha:** 2026-08-20
**Estado:** Propuesto
**Base:** commit `5704776`, 102 tests en verde, `tsc` y `eslint` limpios.

**Goal:** Convertir Altius de una terminal que muestra datos en un sistema que ayuda a decidir: que responda «¿qué tiene que ocurrir para que el precio de hoy genere un 12 % anual?», guarde la tesis del usuario con la fuente de cada hipótesis, e intente refutarla.

**Architecture:** El motor XBRL existente (`src/lib/sec/`) es el activo del proyecto y no se toca en su lógica; se le añade **procedencia por celda** para que cualquier cifra sea rastreable hasta el hecho XBRL y el documento del que sale. Sobre esa base se construyen tres capas nuevas: (1) un motor de **valoración inversa** que despeja la incógnita en lugar de proyectarla, (2) un **almacén de tesis versionado** en Postgres con Supabase Auth, y (3) un **universo precalculado** de fundamentales de toda la bolsa estadounidense que convierte percentiles, comparables y screening en consultas SQL instantáneas.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind 4 · shadcn/ui · Recharts · Vitest · Supabase (Postgres + Auth) · SEC EDGAR (`companyfacts` + `frames`) · FRED · Gemini.

---

## Global Constraints

Estas reglas gobiernan **todas** las tareas de este plan. Ninguna excepción sin decisión explícita del usuario.

- **Nunca se inventa un valor.** Concepto ausente → `—`. Prohibido interpolar, estimar o rellenar. Esto incluye datos de portada, de demo y de marketing.
- **Prohibido el dato de relleno visual.** Ningún componente puede llevar un literal numérico que represente una magnitud financiera. Si no hay dato, el componente muestra su estado vacío.
- **Todo dato derivado declara su fórmula.** Un valor calculado por Altius lleva su expresión y sus entradas, cada una con su propia procedencia.
- **Todo dato reportado declara su origen**: concepto XBRL, unidad, periodo, formulario, fecha de presentación y número de acceso, con enlace al documento en EDGAR.
- **Un supuesto nunca se presenta como un hecho.** Los valores por defecto de una calculadora se marcan visualmente como supuestos y son editables.
- **La IA solo habla con el texto delante.** El prompt prohíbe conocimiento externo. Toda afirmación lleva cita al documento, sección y fragmento. Si no hay base textual, la respuesta es «no disponible».
- **Ninguna clave de API es obligatoria para arrancar** salvo `SEC_USER_AGENT`. Cada fuente degrada de forma independiente y tipada.
- **Toda petición a `sec.gov` / `data.sec.gov` lleva `User-Agent`** con nombre y email. Límite de 10 req/s serializado en `src/lib/sec/client.ts`; ningún módulo llama a `fetch` contra la SEC directamente.
- **CIK a 10 dígitos con ceros** en `data.sec.gov/api` y `data.sec.gov/submissions`; **sin ceros a la izquierda** en `www.sec.gov/Archives`.
- **TypeScript `strict`. Sin `any`** en las firmas públicas de `src/lib`.
- **TDD.** Cada tarea empieza por un test que falla. Commit al final de cada tarea.
- **Todo texto de interfaz en español**, como el resto del producto.

### Presupuestos y techos conocidos

| Recurso | Límite | Consecuencia de diseño |
|---|---|---|
| Alpha Vantage (plan gratuito) | 25 peticiones/día | Los precios se cachean en Postgres, no en disco. Nunca en bucle sobre una lista. |
| SEC `companyfacts` / `frames` | Sin clave, 10 req/s | Es la fuente ilimitada. Todo lo que se pueda derivar de aquí, se deriva de aquí. |
| `companyfacts.zip` | 1,41 GB, actualizado a diario | **No se descarga.** Se usa el API `frames`, que da un concepto para todos los emisores en una sola petición. |
| Vercel Functions | 300 s máx. (Hobby y Pro por defecto) | Los jobs del universo se trocean en invocaciones de menos de 300 s, idempotentes y reanudables. |
| Vercel `/tmp` | Efímero, no compartido | La caché de disco es oportunista de instancia. La caché real es Postgres. |
| Supabase plan gratuito | Verificar antes de la Fase 2 | Estimación del universo: ~6.300 emisores × 12 ejercicios × 1 fila JSONB ≈ 76.000 filas ≈ 80-120 MB. Cabe holgado, pero **confirmar la cuota vigente antes de empezar la Fase 2.** |

---

## Los 27 objetivos, mapeados a fases

| # | Objetivo del usuario | Fase | Estado |
|---|---|---|---|
| 1 | Ahorro de tiempo, trazabilidad, «¿de dónde sale este número?» | **F0** | Detallado |
| 11 | La IA puede decir «no sé» | **F0** | Detallado |
| 20 | UX de decisión, no de terminal | **F0** parcial + transversal | Parcial: la F0 quita ornamento y la F1 añade la pantalla de decisión; el resto es criterio permanente, no una tarea |
| 2 | Reverse Investment Analysis | **F1** | Detallado |
| 3 | Investment Thesis OS persistente | **F1** | Detallado |
| 7 | Datos + hipótesis + valoración conectados | **F1** | Detallado |
| 8 | Histórico de valoración y percentiles | F2 | Roadmap |
| 9 | Comparación automática con competidores | F2 | Roadmap |
| 14 | Sistema de scoring transparente | F2 | Roadmap |
| 19 | Comparación temporal («¿mejor negocio que hace 10 años?») | F2 | Roadmap |
| 4 | El sistema intenta refutar tu tesis | F3 | Roadmap |
| 6 | «¿Qué ha cambiado?» | F3 | Roadmap |
| 10 | La IA cita absolutamente todo | F3 | Roadmap |
| 12 | «Show me the evidence» | F3 | Roadmap |
| 5 | Seguimiento automático de la tesis | F4 | Roadmap |
| 15 | Alertas que importan | F4 | Roadmap |
| 21 | Móvil realmente útil | F4 | Roadmap |
| 13 | Screening | F5 | Roadmap |
| 16 | Portfolio | F5 | Roadmap |
| 17 | Diario de decisiones | F5 | Roadmap |
| 22 | Exportación e Investment Memo | F5 | Roadmap |
| 18 | Backtesting de hipótesis | F6 | Roadmap |
| 23 | Altius Data API | F6 | Roadmap |
| 26 | Willingness to pay | F6 | Roadmap |
| 27 | Métricas de negocio | F6 | Roadmap |
| 24 | Cobertura internacional | F7 | Roadmap |
| 25 | Integraciones | F7 | Roadmap |

Los **10 no negociables** del usuario quedan cubiertos así: 1 y 7 en F1; 2 en F1; 3 y 5 y 6 en F3; 4 en F4; 8 es consecuencia acumulada de F0–F3; 9 y 10 son resultados de negocio que dependen de F6.

---

## Deuda técnica que resuelve la Fase 0

Detectada en la revisión del 2026-08-20. Cada punto tiene su tarea:

| Id | Problema | Tarea |
|---|---|---|
| D1 | La portada muestra ~157 líneas de datos financieros inventados (`leaders-data.ts`), precios hardcodeados en «Populares», fallbacks macro ficticios, y los exporta a TSV | **0.3** |
| D2 | Sin cotización, el margen de seguridad se calcula sobre un precio sustituido por `1` y se pinta en verde | **0.5** |
| D3 | Tres capas de paleta superpuestas: tokens Better Stack + mapeo «legacy» donde `--graphite` es blanco | **0.7** |
| D4 | `:root` y `.dark` son idénticos; el `<html>` lleva `dark` fijo; el selector de tema no hace nada | **0.7** |
| D5 | `SupabaseCacheStore` está escrito pero `getCacheStore()` nunca lo devuelve; en Vercel la caché es `/tmp` efímero | **0.4** |
| D6 | Los defaults de proyección (margen 20 %, tipo 21 %, conversión 70 %, crecimiento 10 %) se presentan como datos | **0.6** |
| D7 | README y `.env.example` desincronizados (modelo Gemini, número de tests); no hay `CLAUDE.md` | **0.8** |
| D8 | `enRango` se calcula y se descarta con `void` en `normalize.ts:247,288` | **0.1** |

Las tareas **0.2** (el popover de procedencia) y las de la Fase 1 no arreglan deuda: construyen producto.

---

# FASE 0 — Verdad

**Duración estimada:** 2–3 semanas.
**Por qué va primero:** los puntos 1, 10, 11, 12 y 20 del usuario son todos la misma exigencia — *que cada cifra sea rastreable y que nada inventado se presente como dato*. Hoy la portada hace lo contrario. Ninguna feature posterior es creíble hasta que esto esté resuelto, y la infraestructura de procedencia que se construye aquí es el cimiento literal de las citas de la IA (F3) y del «Show me the evidence» (F3).

**Entregable:** Altius no muestra ni un solo número que no pueda justificar, y cualquier celda de cualquier tabla se puede pinchar para ver de qué hecho XBRL, de qué formulario y de qué fecha sale.

## Estructura de ficheros — Fase 0

| Fichero | Responsabilidad | Acción |
|---|---|---|
| `src/lib/sec/provenance.ts` | Tipos de procedencia y construcción de URLs de EDGAR | **Crear** |
| `src/lib/sec/normalize.ts` | Propagar procedencia completa a cada celda | Modificar |
| `src/lib/sec/ratios.ts` | Declarar la fórmula de cada ratio como procedencia derivada | Modificar |
| `src/components/provenance-popover.tsx` | El botón «¿De dónde sale este número?» | **Crear** |
| `src/components/financial-table.tsx` | Enganchar el popover a cada celda | Modificar |
| `src/lib/home/leaders-data.ts` | Datos de mercado fabricados | **Borrar** |
| `src/components/home/ticker-ribbon.tsx` | Cinta de precios fabricados | **Borrar** |
| `src/components/home/market-leaders-table.tsx` | Tabla de líderes fabricada | **Borrar** |
| `src/components/home/interactive-preview.tsx` | Previsualizador con `PREVIEW_DATA` fabricado | **Borrar** |
| `src/components/home/market-overview-cards.tsx` | Tarjetas macro: aceptar `null` y mostrar `—` | Modificar |
| `src/app/page.tsx` | Portada honesta | Reescribir |
| `src/lib/cache/store.ts` | Elegir adaptador Postgres cuando haya credenciales | Modificar |
| `src/lib/valuation/index.ts` | Precio opcional, supuestos marcados | Modificar |
| `src/lib/valuation/types.ts` | `Assumed<T>`, precio y resultados anulables | Modificar |
| `src/components/valuation/projection-calculator.tsx` | Entrada manual de precio, marcas de supuesto | Modificar |
| `src/app/globals.css` | Una sola paleta, sin tokens legacy | Modificar |
| `CLAUDE.md` | Instrucciones de repositorio | **Crear** |

---

### Task 0.1: Procedencia auditable en cada celda

Resuelve **D8** y sienta la base de los objetivos 1, 10 y 12.

El motor ya conserva `accn`, `form` y `filed` de cada hecho XBRL en su tipo interno `Resuelto` (`normalize.ts:108`), pero los descarta al construir la celda. Esta tarea los conserva y añade la fórmula de los valores derivados.

**Files:**
- Create: `src/lib/sec/provenance.ts`
- Modify: `src/lib/sec/normalize.ts:26-32` (tipo `Cell`), `:108` (tipo `Resuelto`), `:117-154` (`recolectar`), `:156-181` (`derivarQ4`), `:251-286` (construcción de filas), `:247` y `:288` (borrar `enRango` muerto)
- Test: `src/test/provenance.test.ts`, `src/test/normalize.test.ts`

**Interfaces:**
- Produces: `Provenance`, `ReportedProvenance`, `DerivedProvenance`, `edgarFilingUrl(cik, accn)`, y el campo `Cell.provenance`. Lo consumen las tareas 0.5, 1.2, 1.5 y toda la Fase 3.

- [ ] **Step 1: Escribir el test que falla para las URLs de EDGAR**

Crear `src/test/provenance.test.ts`:

```ts
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
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/provenance.test.ts
```

Esperado: FAIL con `Failed to resolve import "@/lib/sec/provenance"`.

- [ ] **Step 3: Crear el módulo de procedencia**

Crear `src/lib/sec/provenance.ts`:

```ts
/**
 * Procedencia de una cifra.
 *
 * Toda celda de Altius responde a la pregunta «¿de dónde sale este número?».
 * Hay exactamente tres respuestas posibles y ninguna más: sale de un hecho
 * publicado, lo ha calculado Altius a partir de otros hechos, o no existe.
 */

export type ReportedProvenance = {
  kind: "reported";
  /** Concepto us-gaap o dei del que procede el valor. */
  concept: string;
  /** Unidad declarada en el XBRL: USD, shares, USD/shares. */
  unit: string;
  /** Inicio del periodo. `null` en los hechos de instante (balance). */
  periodStart: string | null;
  periodEnd: string;
  /** Formulario del que procede: 10-K, 10-Q. */
  form: string;
  /** Fecha de presentación. Es lo que desempata las reexpresiones. */
  filed: string;
  /** Número de acceso de la presentación. Identifica el documento exacto. */
  accn: string;
};

export type DerivedProvenance = {
  kind: "derived";
  /** Expresión legible: "Flujo de caja de explotación − Inversión en inmovilizado". */
  formula: string;
  inputs: { label: string; value: number; source: Provenance }[];
};

export type AbsentProvenance = { kind: "absent" };

export type Provenance = ReportedProvenance | DerivedProvenance | AbsentProvenance;

export const ABSENT: AbsentProvenance = { kind: "absent" };

/**
 * URL del índice de una presentación en EDGAR.
 *
 * El CIK va SIN ceros a la izquierda en las rutas de `www.sec.gov/Archives`
 * —al contrario que en `data.sec.gov/api`, que los exige—, y el directorio del
 * filing es el número de acceso sin guiones. El fichero de índice sí los lleva.
 */
export function edgarFilingUrl(cik: string, accn: string): string {
  const cikSinCeros = String(Number.parseInt(cik, 10));
  const sinGuiones = accn.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${cikSinCeros}/${sinGuiones}/${accn}-index.htm`;
}
```

- [ ] **Step 4: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/provenance.test.ts
```

Esperado: PASS, 2 tests.

- [ ] **Step 5: Escribir el test que falla para la procedencia de celdas reportadas**

Añadir a `src/test/normalize.test.ts`. El fichero ya carga los fixtures en las constantes `AAPL`, `TSLA` y `JNJ` (líneas 11-13) e importa `BALANCE_SHEET`, `CASH_FLOW` e `INCOME_STATEMENT` de la taxonomía (línea 5); no hace falta añadir imports.

```ts
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
```

El bloque de flujo de caja se llama `CASH_FLOW` en `taxonomy.ts:130`, no `CASHFLOW_STATEMENT`.

- [ ] **Step 6: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/normalize.test.ts
```

Esperado: FAIL con `Property 'provenance' does not exist on type 'Cell'`.

- [ ] **Step 7: Ampliar `Resuelto` para que conserve la procedencia**

En `src/lib/sec/normalize.ts`, sustituir el tipo `Resuelto` (línea 108):

```ts
type Resuelto = {
  value: number;
  end: string;
  start: string | null;
  filed: string;
  concept: string;
  form: string;
  accn: string;
  unit: string;
};
```

En `recolectar`, sustituir la línea `salida.set(key, { value: f.val, end: f.end, filed: f.filed, concept: concepto });` por:

```ts
    salida.set(key, {
      value: f.val,
      end: f.end,
      start: f.start ?? null,
      filed: f.filed,
      concept: concepto,
      form: f.form ?? "",
      accn: f.accn,
      unit: linea.unit,
    });
```

En `derivarQ4`, sustituir el objeto que se guarda en `salida.set(claveQ4, ...)` por:

```ts
    salida.set(claveQ4, {
      value: total.value - q1.value - q2.value - q3.value,
      end: total.end,
      start: q1.start,
      filed: total.filed,
      concept: total.concept,
      form: total.form,
      accn: total.accn,
      unit: total.unit,
    });
```

- [ ] **Step 8: Ampliar `Cell` y construir la procedencia en `normalizeStatement`**

Sustituir el tipo `Cell` (líneas 26-32) por:

```ts
export type Cell = {
  value: number | null;
  /** Cierto si Altius ha calculado el valor en lugar de leerlo del informe. */
  derived: boolean;
  /** Concepto XBRL del que procede el valor. Se conserva por comodidad de la interfaz. */
  concept?: string;
  /** De dónde sale exactamente este número. Nunca `undefined`. */
  provenance: Provenance;
};
```

Añadir el import en la cabecera del fichero:

```ts
import { ABSENT, type Provenance } from "./provenance";
```

Dentro de `normalizeStatement`, añadir junto a la función `leer` un lector de procedencia:

```ts
  const leerFuente = (id: string, key: PeriodKey): Provenance => {
    const r = porLinea.get(id)?.get(key);
    if (!r) return ABSENT;
    return {
      kind: "reported",
      concept: r.concept,
      unit: r.unit,
      periodStart: r.start,
      periodEnd: r.end,
      form: r.form,
      filed: r.filed,
      accn: r.accn,
    };
  };
```

Sustituir el cuerpo del bucle `for (const p of periods)` dentro de `rows` por:

```ts
    for (const p of periods) {
      const bruto = brutos.get(p.key);
      let value = bruto?.value ?? null;
      let concept = bruto?.concept;
      let derived = derivadosLinea.has(p.key);
      let provenance: Provenance = bruto ? leerFuente(linea.id, p.key) : ABSENT;

      // Q4 se obtiene restando, no leyendo: la procedencia lo dice.
      if (derived && bruto) {
        provenance = {
          kind: "derived",
          formula: "Ejercicio completo − Q1 − Q2 − Q3",
          inputs: [{ label: "Ejercicio completo", value: bruto.value, source: leerFuente(linea.id, p.key) }],
        };
      }

      // Las dos únicas magnitudes que Altius calcula, y solo cuando la empresa
      // no las publica o cuando por definición no existen en el informe.
      if (value === null && linea.computed === "grossProfit") {
        const ingresos = leer("revenue", p.key);
        const coste = leer("costOfRevenue", p.key);
        if (ingresos !== null && coste !== null) {
          value = ingresos - coste;
          derived = true;
          concept = undefined;
          provenance = {
            kind: "derived",
            formula: "Ingresos − Coste de ventas",
            inputs: [
              { label: "Ingresos", value: ingresos, source: leerFuente("revenue", p.key) },
              { label: "Coste de ventas", value: coste, source: leerFuente("costOfRevenue", p.key) },
            ],
          };
        }
      }
      if (linea.computed === "freeCashFlow") {
        const cfo = leer("operatingCashFlow", p.key);
        const capex = leer("capex", p.key);
        if (cfo !== null && capex !== null) {
          value = cfo - capex;
          derived = true;
          concept = undefined;
          provenance = {
            kind: "derived",
            formula: "Flujo de caja de explotación − Inversión en inmovilizado",
            inputs: [
              { label: "Flujo de caja de explotación", value: cfo, source: leerFuente("operatingCashFlow", p.key) },
              { label: "Inversión en inmovilizado", value: capex, source: leerFuente("capex", p.key) },
            ],
          };
        }
      }

      if (value !== null && linea.negate) value = -value;
      if (value === null) provenance = ABSENT;
      cells[p.key] = { value, derived, concept, provenance };
    }
```

Borrar también la variable muerta `enRango`: la línea 247 (`const enRango = new Set(...)`) y la línea 288 (`void enRango;`). **D8 resuelto.**

- [ ] **Step 9: Arreglar los ayudantes de test que construyen celdas a mano**

`provenance` es **obligatorio** en `Cell`, y eso rompe dos ficheros de test existentes a propósito: `src/test/ratios.test.ts:5-16` y `src/test/valuation.test.ts:6-18` tienen cada uno su `createDummyStatement`, que construye las celdas como `{ value: values[idx], derived: false }`.

Hacerlo opcional sería la salida fácil y la equivocada: una celda sin procedencia es exactamente lo que este plan existe para impedir, y el compilador es el único sitio donde esa regla se puede imponer sin depender de la disciplina de nadie.

En **los dos** ficheros, cambiar la construcción de la celda por:

```ts
      periods.map((p, idx) => [
        p.key,
        { value: values[idx], derived: false, provenance: { kind: "absent" as const } },
      ]),
```

- [ ] **Step 10: Ejecutar la suite completa**

```bash
npm test && npx tsc --noEmit
```

Esperado: PASS. Los 102 tests previos vuelven a verde tras el arreglo del paso anterior, más los 3 nuevos.

- [ ] **Step 11: Declarar la fórmula de cada ratio**

En `src/lib/sec/ratios.ts`, cada celda que hoy se construye como `{ value, derived: true }` debe llevar además su `provenance`. Añadir en la cabecera:

```ts
import type { Provenance } from "./provenance";
```

Y una tabla de fórmulas legibles junto a `RATIOS_STATEMENT`:

```ts
/**
 * Expresión legible de cada ratio, para el popover de procedencia.
 *
 * Las catorce claves son exactamente los `id` de `RATIOS_STATEMENT`
 * (`taxonomy.ts:157`). Si se añade una línea allí y no aquí, su celda se queda
 * sin fórmula: el test del paso 12 lo detecta.
 */
const FORMULAS: Record<string, string> = {
  grossMargin: "Beneficio bruto ÷ Ingresos × 100",
  ebitda: "Resultado de explotación + Amortizaciones",
  ebitdaMargin: "EBITDA ÷ Ingresos × 100",
  operatingMargin: "Resultado de explotación ÷ Ingresos × 100",
  netMargin: "Resultado neto ÷ Ingresos × 100",
  fcfMargin: "Flujo de caja libre ÷ Ingresos × 100",
  roe: "Resultado neto ÷ Patrimonio neto × 100",
  roa: "Resultado neto ÷ Activo total × 100",
  roic: "Resultado de explotación × (1 − tipo efectivo) ÷ (Patrimonio neto + Deuda − Caja) × 100",
  effectiveTaxRate: "Impuesto sobre beneficios ÷ Resultado antes de impuestos × 100",
  fcfConversion: "Flujo de caja libre ÷ EBITDA × 100",
  revenueGrowthYoY: "Ingresos del periodo ÷ Ingresos del mismo periodo del año anterior − 1",
  epsGrowthYoY: "BPA diluido ÷ BPA diluido del mismo periodo del año anterior − 1",
  fcfGrowthYoY: "Flujo de caja libre ÷ Flujo de caja libre del año anterior − 1",
};
```

Al construir cada celda, sustituir el objeto por:

```ts
      const formula = FORMULAS[line.id];
      const provenance: Provenance =
        value === null || !formula
          ? { kind: "absent" }
          : { kind: "derived", formula, inputs: entradas };
      cells[p.key] = { value, derived: true, provenance };
```

donde `entradas` es el array de `{ label, value, source }` de los valores no nulos que intervienen en ese ratio concreto, obtenidos con la misma función `getVal` que ya usa el módulo más un `getSource` gemelo que devuelva `row.cells[periodKey]?.provenance ?? { kind: "absent" }`.

- [ ] **Step 12: Escribir el test de los ratios**

Añadir a `src/test/ratios.test.ts`, dentro del `describe` existente. Cada `it` de ese fichero monta sus propios estados, así que este también:

```ts
  it("cada ratio con valor declara su fórmula y las entradas que la alimentan", () => {
    const income = createDummyStatement(periods, {
      revenue: [1000, 800],
      grossProfit: [400, 300],
      operatingIncome: [300, 200],
      pretaxIncome: [280, 190],
      incomeTax: [56, 38],
      netIncome: [224, 152],
    });
    const balance = createDummyStatement(periods, {
      equity: [900, 700],
      totalAssets: [1500, 1200],
    });
    const cashflow = createDummyStatement(periods, {
      operatingCashFlow: [320, 240],
      capex: [-70, -60],
      freeCashFlow: [250, 180],
    });

    const ratios = buildRatiosStatement(income, balance, cashflow, "annual");
    const margen = ratios.rows.find((r) => r.line.id === "operatingMargin")!;
    const celda = margen.cells[ratios.periods[0].key];

    expect(celda.provenance.kind).toBe("derived");
    if (celda.provenance.kind !== "derived") throw new Error("procedencia inesperada");
    expect(celda.provenance.formula).toBe("Resultado de explotación ÷ Ingresos × 100");
    expect(celda.provenance.inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("las catorce líneas de RATIOS_STATEMENT tienen fórmula declarada", () => {
    const vacio = createDummyStatement(periods, {});
    const ratios = buildRatiosStatement(vacio, vacio, vacio, "annual");
    // Sin datos todas las celdas son ausentes, pero la lista de filas es la
    // completa: detecta una línea nueva en la taxonomía sin entrada en FORMULAS.
    expect(ratios.rows).toHaveLength(14);
  });
```

- [ ] **Step 13: Ejecutar la suite y comprobar que pasa**

```bash
npm test && npx tsc --noEmit
```

Esperado: PASS y sin errores de tipos.

- [ ] **Step 14: Commit**

```bash
git add src/lib/sec/provenance.ts src/lib/sec/normalize.ts src/lib/sec/ratios.ts src/test/provenance.test.ts src/test/normalize.test.ts src/test/ratios.test.ts
git commit -m "feat: procedencia auditable en cada celda del motor XBRL

Cada valor declara si es reportado (concepto, unidad, formulario, fecha y
numero de acceso) o derivado (formula y entradas con su propia procedencia).
Es el cimiento del boton '¿de donde sale este numero?' y de las citas de la IA.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 0.2: El botón «¿De dónde sale este número?»

Objetivo 1 del usuario, y prerequisito visual del 12.

**Files:**
- Create: `src/components/provenance-popover.tsx`
- Modify: `src/components/financial-table.tsx`
- Test: `src/test/provenance-popover.test.tsx`

**Interfaces:**
- Consumes: `Provenance` y `edgarFilingUrl` de la Task 0.1.
- Produces: `<ProvenancePopover cik={string} provenance={Provenance}>{children}</ProvenancePopover>`. Lo reutilizan las tareas 1.5 y toda la Fase 3.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/test/provenance-popover.test.tsx`. La suite corre en entorno `node` por defecto; este fichero necesita DOM, así que declara su entorno en la primera línea:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProvenanceDetail } from "@/components/provenance-popover";

describe("ProvenanceDetail", () => {
  it("muestra el concepto, el formulario y la fecha de un valor reportado", () => {
    render(
      <ProvenanceDetail
        cik="0000320193"
        provenance={{
          kind: "reported",
          concept: "RevenueFromContractWithCustomerExcludingAssessedTax",
          unit: "USD",
          periodStart: "2025-09-28",
          periodEnd: "2026-06-27",
          form: "10-Q",
          filed: "2026-07-31",
          accn: "0000320193-26-000020",
        }}
      />,
    );

    expect(screen.getByText("Dato publicado por la empresa")).toBeDefined();
    expect(
      screen.getByText("RevenueFromContractWithCustomerExcludingAssessedTax"),
    ).toBeDefined();
    expect(screen.getByText(/10-Q/)).toBeDefined();
    const enlace = screen.getByRole("link", { name: /EDGAR/i });
    expect(enlace.getAttribute("href")).toBe(
      "https://www.sec.gov/Archives/edgar/data/320193/000032019326000020/0000320193-26-000020-index.htm",
    );
  });

  it("muestra la fórmula y las entradas de un valor derivado", () => {
    render(
      <ProvenanceDetail
        cik="0000320193"
        provenance={{
          kind: "derived",
          formula: "Flujo de caja de explotación − Inversión en inmovilizado",
          inputs: [
            { label: "Flujo de caja de explotación", value: 118254000000, source: { kind: "absent" } },
            { label: "Inversión en inmovilizado", value: 9447000000, source: { kind: "absent" } },
          ],
        }}
      />,
    );

    expect(screen.getByText("Calculado por Altius")).toBeDefined();
    expect(
      screen.getByText("Flujo de caja de explotación − Inversión en inmovilizado"),
    ).toBeDefined();
    expect(screen.getByText("Inversión en inmovilizado")).toBeDefined();
  });

  it("dice explícitamente que no hay dato cuando la empresa no lo reporta", () => {
    render(<ProvenanceDetail cik="0000320193" provenance={{ kind: "absent" }} />);
    expect(
      screen.getByText("La empresa no reporta este concepto en este periodo."),
    ).toBeDefined();
  });
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/provenance-popover.test.tsx
```

Esperado: FAIL con `Failed to resolve import "@/components/provenance-popover"`.

- [ ] **Step 3: Instalar el primitivo de popover de shadcn**

```bash
npx shadcn@latest add popover
```

- [ ] **Step 4: Implementar el componente**

Crear `src/components/provenance-popover.tsx`:

```tsx
"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { edgarFilingUrl, type Provenance } from "@/lib/sec/provenance";
import { formatDate, formatValue } from "@/lib/format";
import { ExternalLink, FileText, Sigma, Minus } from "lucide-react";

/**
 * El cuerpo del popover, exportado aparte para poder probarlo sin Radix.
 */
export function ProvenanceDetail({ cik, provenance }: { cik: string; provenance: Provenance }) {
  if (provenance.kind === "absent") {
    return (
      <div className="flex items-start gap-2.5">
        <Minus className="text-muted-steel mt-0.5 size-4 shrink-0" />
        <p className="text-frost text-[13px] leading-[1.5]">
          La empresa no reporta este concepto en este periodo.
        </p>
      </div>
    );
  }

  if (provenance.kind === "derived") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sigma className="text-periwinkle-glow size-4 shrink-0" />
          <span className="text-pure-white text-[13px] font-medium">Calculado por Altius</span>
        </div>
        <p className="text-frost bg-void-black border-gunmetal rounded-lg border px-3 py-2 font-mono text-[12px] leading-[1.5]">
          {provenance.formula}
        </p>
        <dl className="space-y-1.5">
          {provenance.inputs.map((entrada) => (
            <div key={entrada.label} className="flex justify-between gap-4 text-[12px]">
              <dt className="text-muted-steel">{entrada.label}</dt>
              <dd className="text-frost tabular">{formatValue(entrada.value, "USD", "millions")}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="text-periwinkle-glow size-4 shrink-0" />
        <span className="text-pure-white text-[13px] font-medium">
          Dato publicado por la empresa
        </span>
      </div>
      <p className="text-frost bg-void-black border-gunmetal rounded-lg border px-3 py-2 font-mono text-[11px] leading-[1.4] break-all">
        {provenance.concept}
      </p>
      <dl className="space-y-1.5 text-[12px]">
        <Fila t="Unidad" v={provenance.unit} />
        <Fila
          t="Periodo"
          v={
            provenance.periodStart
              ? `${formatDate(provenance.periodStart)} → ${formatDate(provenance.periodEnd)}`
              : formatDate(provenance.periodEnd)
          }
        />
        <Fila t="Formulario" v={provenance.form} />
        <Fila t="Presentado" v={formatDate(provenance.filed)} />
      </dl>
      <a
        href={edgarFilingUrl(cik, provenance.accn)}
        target="_blank"
        rel="noreferrer noopener"
        className="text-periwinkle-glow inline-flex items-center gap-1.5 text-[12px] hover:underline"
      >
        <span>Abrir la presentación en EDGAR</span>
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function Fila({ t, v }: { t: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-steel shrink-0">{t}</dt>
      <dd className="text-frost text-right">{v}</dd>
    </div>
  );
}

export function ProvenancePopover({
  cik,
  provenance,
  children,
}: {
  cik: string;
  provenance: Provenance;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="¿De dónde sale este número?"
          className="hover:bg-gunmetal/60 focus-visible:ring-iris-blue -mx-1 rounded px-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-carbon-surface border-gunmetal w-80 p-4" align="end">
        <ProvenanceDetail cik={cik} provenance={provenance} />
      </PopoverContent>
    </Popover>
  );
}
```

`formatValue(valor, unidad, escala)` y `formatDate(iso)` ya existen en `src/lib/format.ts`; no crear formateadores nuevos.

- [ ] **Step 5: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/provenance-popover.test.tsx
```

Esperado: PASS, 3 tests.

- [ ] **Step 6: Enganchar el popover a la tabla financiera**

El componente `Celda` de `src/components/financial-table.tsx:124-174` tiene hoy dos ramas de `Tooltip`: una para derivados y otra para el concepto XBRL. Ambas se sustituyen por una sola llamada al popover, que dice más y con enlace:

```tsx
  return (
    <td className="px-4 py-2 text-right whitespace-nowrap">
      {cell && cell.provenance.kind !== "absent" ? (
        <ProvenancePopover cik={cik} provenance={cell.provenance}>
          <span className="cursor-help">{contenido}</span>
        </ProvenancePopover>
      ) : (
        contenido
      )}
    </td>
  );
```

`Celda` y `FinancialTable` reciben `cik: string` como prop nueva. Propagarla desde `statement-tabs.tsx` y `financials-client.tsx`, que ya tienen `bundle.profile.cik`. Mantener el subrayado punteado que marca los derivados (`financial-table.tsx:144`).

- [ ] **Step 7: Verificar en el navegador**

Arrancar la previsualización y comprobar que al pinchar una celda de ingresos de Apple aparece el concepto XBRL y el enlace a EDGAR, y que al pinchar el flujo de caja libre aparece la fórmula con sus dos entradas.

```bash
npm run dev
```

Ruta: `/ticker/AAPL/financials`

- [ ] **Step 8: Ejecutar la suite completa y comprobar tipos**

```bash
npm test && npx tsc --noEmit && npx eslint src
```

Esperado: todo limpio.

- [ ] **Step 9: Commit**

```bash
git add src/components/provenance-popover.tsx src/components/ui/popover.tsx src/components/financial-table.tsx src/components/statement-tabs.tsx src/app/ticker/\[ticker\]/financials/financials-client.tsx src/test/provenance-popover.test.tsx
git commit -m "feat: boton '¿de donde sale este numero?' en cada celda financiera

Popover con concepto XBRL, unidad, periodo, formulario, fecha de presentacion
y enlace directo a la presentacion en EDGAR. Los valores calculados muestran
su formula y sus entradas.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 0.3: Purgar los datos fabricados de la portada

Resuelve **D1**. Es la incoherencia más grave del repositorio: el README abre con «Nunca se inventa un valor» y la primera pantalla muestra 157 líneas de precios, PER, ROIC y sparklines inventados, con un botón que los exporta a TSV como si fueran reales.

La sustitución no es «quitar y dejar hueco»: la portada pasa a enseñar **una empresa real, servida desde la SEC**, que es gratis e ilimitado. Lo único que no vuelve es la cinta de precios en vivo, porque diez cotizaciones consumen el 40 % de la cuota diaria de Alpha Vantage para adornar una portada.

**Files:**
- Delete: `src/lib/home/leaders-data.ts`, `src/components/home/ticker-ribbon.tsx`, `src/components/home/market-leaders-table.tsx`, `src/components/home/interactive-preview.tsx`
- Create: `src/components/home/live-preview.tsx`
- Modify: `src/components/home/market-overview-cards.tsx`, `src/app/page.tsx`
- Test: `src/test/no-fabricated-data.test.ts`, `src/test/market-overview-cards.test.tsx`

**Interfaces:**
- Produces: `<LivePreview bundle={StatementBundle} />`, componente de servidor puro que renderiza las últimas cinco anualidades de una empresa real.

- [ ] **Step 1: Escribir el test de regresión que falla**

Crear `src/test/no-fabricated-data.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function ficherosFuente(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      if (entrada === "test") continue;
      salida.push(...ficherosFuente(ruta));
    } else if (/\.(ts|tsx)$/.test(entrada)) {
      salida.push(ruta);
    }
  }
  return salida;
}

/**
 * Guardia contra la reintroducción de datos de mercado inventados.
 *
 * La portada llegó a mostrar precios, PER, ROIC y sparklines fabricados para
 * diez empresas. Es la violación directa del principio rector del proyecto, y
 * este test existe para que no vuelva a colarse en una tanda de rediseño.
 */
describe("integridad de los datos", () => {
  const fuentes = ficherosFuente("src");

  it("ningún módulo declara tablas de métricas de mercado fabricadas", () => {
    const prohibido = /MARKET_LEADERS|PREVIEW_DATA|leaders-data/;
    const ofensores = fuentes.filter((f) => prohibido.test(readFileSync(f, "utf8")));
    expect(ofensores).toEqual([]);
  });

  it("ningún componente lleva un precio en dólares escrito a mano", () => {
    // Detecta literales tipo "$128.40" o "$3.15 T" en el código de interfaz.
    const prohibido = /["'`]\$\s?\d[\d.,]*\s?[TBM]?["'`]|p:\s*["']\$/;
    const ofensores = fuentes
      .filter((f) => f.includes("/components/") || f.endsWith("page.tsx"))
      .filter((f) => prohibido.test(readFileSync(f, "utf8")));
    expect(ofensores).toEqual([]);
  });
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/no-fabricated-data.test.ts
```

Esperado: FAIL, listando `src/lib/home/leaders-data.ts`, `src/components/home/ticker-ribbon.tsx`, `src/components/home/market-leaders-table.tsx`, `src/components/home/interactive-preview.tsx` y `src/app/page.tsx`.

- [ ] **Step 3: Borrar los módulos fabricados**

```bash
git rm src/lib/home/leaders-data.ts src/components/home/ticker-ribbon.tsx src/components/home/market-leaders-table.tsx src/components/home/interactive-preview.tsx
```

- [ ] **Step 4: Escribir el test de las tarjetas macro**

Crear `src/test/market-overview-cards.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketOverviewCards } from "@/components/home/market-overview-cards";

describe("MarketOverviewCards", () => {
  it("muestra una raya, no una cifra de reserva, cuando FRED no responde", () => {
    render(<MarketOverviewCards cpiValue={null} fedFundsValue={null} unrateValue={null} />);
    expect(screen.getAllByText("—")).toHaveLength(3);
    expect(screen.queryByText(/2,9\s?%/)).toBeNull();
  });

  it("formatea los valores reales cuando existen", () => {
    render(<MarketOverviewCards cpiValue={2.4} fedFundsValue={4.3} unrateValue={4.1} />);
    expect(screen.getByText("2,4 %")).toBeDefined();
    expect(screen.getByText("4,3 %")).toBeDefined();
    expect(screen.getByText("4,1 %")).toBeDefined();
  });
});
```

- [ ] **Step 5: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/market-overview-cards.test.tsx
```

Esperado: FAIL. Hoy el componente acepta `number | undefined` y sustituye por literales como `"2.9 %"`.

- [ ] **Step 6: Reescribir las tarjetas macro para aceptar la ausencia**

En `src/components/home/market-overview-cards.tsx`, cambiar la firma a `number | null` y sustituir cada expresión del tipo `{cpiValue ? \`${cpiValue.toFixed(1)} %\` : "2.9 %"}` por `formatValue(v, "percent")`, que ya devuelve la raya cuando el valor es nulo (`format.ts:30`):

```tsx
import { formatValue } from "@/lib/format";

export function MarketOverviewCards({
  cpiValue,
  fedFundsValue,
  unrateValue,
}: {
  cpiValue: number | null;
  fedFundsValue: number | null;
  unrateValue: number | null;
}) {
```

y en cada tarjeta:

```tsx
          <div className="font-display text-pure-white text-[30px] font-medium tracking-tight tabular">
            {formatValue(cpiValue, "percent")}
          </div>
```

**No usar `formatPct` aquí.** `formatPct` antepone signo (`+2,4 %`), que es correcto para una variación y equivocado para un nivel: el IPC interanual no es «más 2,4 %», es 2,4 %.

La cuarta tarjeta, si la hay, se elimina o se alimenta de una serie real de FRED; no puede quedarse con contenido decorativo.

- [ ] **Step 7: Crear la previsualización real**

Crear `src/components/home/live-preview.tsx`. Es un componente de servidor: recibe un `StatementBundle` ya construido y no inventa nada.

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatValue } from "@/lib/format";
import type { StatementBundle } from "@/lib/sec/statements";

/**
 * Muestra de producto con datos reales.
 *
 * La portada anterior enseñaba un previsualizador con cifras inventadas para
 * seis empresas. Esta enseña una sola empresa, con sus cifras de verdad leídas
 * del XBRL de la SEC. Es menos vistoso y es lo único defendible.
 */
export function LivePreview({ bundle, ticker }: { bundle: StatementBundle; ticker: string }) {
  const income = bundle.blocks.find((b) => b.id === "income");
  const ratios = bundle.blocks.find((b) => b.id === "ratios");
  const periodos = (income?.periods ?? []).slice(0, 5);

  if (periodos.length === 0) return null;

  const filas = [
    { label: "Ingresos", row: income?.rows.find((r) => r.line.id === "revenue"), unit: "USD" as const },
    { label: "Resultado de explotación", row: income?.rows.find((r) => r.line.id === "operatingIncome"), unit: "USD" as const },
    { label: "Margen operativo", row: ratios?.rows.find((r) => r.line.id === "operatingMargin"), unit: "percent" as const },
    { label: "ROIC", row: ratios?.rows.find((r) => r.line.id === "roic"), unit: "percent" as const },
  ];

  return (
    <div className="bg-carbon-surface border-gunmetal overflow-hidden rounded-2xl border">
      <div className="border-gunmetal flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <span className="text-muted-steel font-mono text-[11px] tracking-wider uppercase">
            Datos reales, leídos ahora mismo de la SEC
          </span>
          <h3 className="font-display text-pure-white mt-0.5 text-[18px] font-medium tracking-tight">
            {bundle.profile.name}
          </h3>
        </div>
        <Link
          href={`/ticker/${ticker}/financials`}
          className="text-periwinkle-glow inline-flex items-center gap-1 text-[13px] font-medium hover:underline"
        >
          <span>Ver los diez ejercicios completos</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="tabular w-full border-collapse text-[14px]">
          <thead>
            <tr className="border-gunmetal border-b">
              <th scope="col" className="text-muted-steel px-6 py-3 text-left font-mono text-[11px] font-medium tracking-wider uppercase">
                Concepto
              </th>
              {periodos.map((p) => (
                <th key={p.key} scope="col" className="text-muted-steel px-4 py-3 text-right font-mono text-[11px] font-medium tracking-wider uppercase whitespace-nowrap">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map(({ label, row, unit }) => (
              <tr key={label} className="border-gunmetal/60 border-b last:border-0">
                <th scope="row" className="text-frost px-6 py-2.5 text-left font-normal whitespace-nowrap">
                  {label}
                </th>
                {periodos.map((p) => (
                  <td key={p.key} className="text-pure-white px-4 py-2.5 text-right whitespace-nowrap">
                    {formatValue(row?.cells[p.key]?.value ?? null, unit, "millions")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted-steel border-gunmetal border-t px-6 py-3 text-[12px]">
        Importes en millones de dólares. Cuando la empresa no reporta un concepto, la celda muestra una raya.
      </p>
    </div>
  );
}
```

- [ ] **Step 8: Reescribir la portada**

En `src/app/page.tsx`:

- Eliminar los imports de `TickerRibbon`, `MarketLeadersTable` e `InteractivePreview`, y la sección 1 del ribbon completa.
- Eliminar el bloque «Populares» de las líneas 46-64, con sus seis precios escritos a mano. Sustituirlo por los mismos seis enlaces **sin precio**:

```tsx
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[12px] text-muted-steel font-mono">
              <span>Prueba con:</span>
              {["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "TSLA"].map((t) => (
                <Link
                  key={t}
                  href={`/ticker/${t}`}
                  className="bg-carbon-surface hover:bg-gunmetal text-pure-white px-2 py-0.5 rounded border border-gunmetal font-bold transition-colors"
                >
                  {t}
                </Link>
              ))}
            </div>
```

- Sustituir la sección 4 por `<LivePreview>`, alimentado desde el propio componente de servidor:

```tsx
import { resolveTicker } from "@/lib/sec/tickers";
import { buildStatements } from "@/lib/sec/statements";
import { LivePreview } from "@/components/home/live-preview";

const TICKER_MUESTRA = "AAPL";

// ...dentro de Home(), junto a las llamadas a FRED:
  const muestra = await resolveTicker(TICKER_MUESTRA)
    .then((hit) => (hit ? buildStatements(hit.cik, "annual") : null))
    .catch(() => null);
```

y en el JSX:

```tsx
      {muestra ? (
        <section className="mx-auto max-w-[1200px] px-5 mb-14">
          <LivePreview bundle={muestra} ticker={TICKER_MUESTRA} />
        </section>
      ) : null}
```

- Pasar `cpiValue ?? null` en lugar de `cpiValue` a `MarketOverviewCards`, ya que `.at(-1)?.value` devuelve `undefined`.
- Eliminar la sección 5 (tabla de líderes) entera. La tabla de líderes vuelve en la **Fase 2**, alimentada por el universo precalculado.

El `export const revalidate = 3600` de la portada ya está; con la caché de Postgres de la Task 0.4 el `companyfacts` de Apple se descarga una vez y se reutiliza entre instancias.

- [ ] **Step 9: Ejecutar la suite completa**

```bash
npm test && npx tsc --noEmit && npx eslint src
```

Esperado: PASS en los dos tests nuevos y en los 102 anteriores, sin errores de tipos ni de lint.

- [ ] **Step 10: Verificar la portada en el navegador**

```bash
npm run dev
```

Comprobar en `/`: no hay cinta de precios, no hay tabla de líderes, la previsualización muestra ingresos reales de Apple, y las tarjetas macro muestran valores de FRED o rayas. Cortar la red y recargar para confirmar que salen rayas y no cifras de reserva.

- [ ] **Step 11: Commit**

```bash
git add -A src/app/page.tsx src/components/home src/lib/home src/test/no-fabricated-data.test.ts src/test/market-overview-cards.test.tsx
git commit -m "fix: elimina todos los datos de mercado fabricados de la portada

Borra leaders-data.ts (157 lineas de precios, PER, ROIC y sparklines
inventados), el ribbon de cotizaciones falsas, la tabla de lideres y el
previsualizador con PREVIEW_DATA. Las tarjetas macro dejan de sustituir el
fallo de FRED por cifras de reserva. La muestra de producto pasa a servirse
del XBRL real de la SEC. Test de regresion para que no vuelva.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 0.4: Cablear Supabase como caché compartida

Resuelve **D5**. El adaptador Postgres lleva escrito desde el primer commit y `getCacheStore()` nunca lo devuelve. En Vercel eso significa que cada invocación arranca con la caché vacía y vuelve a descargar `companyfacts` de 30 MB, y que la cuota de 25 peticiones diarias de Alpha Vantage se quema en horas.

**Files:**
- Modify: `src/lib/cache/store.ts:23-28`
- Test: `src/test/cache.test.ts`

**Interfaces:**
- Produces: `getCacheStore()` devuelve `SupabaseCacheStore` cuando existen `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Lo consume todo el proyecto sin cambios.

- [ ] **Step 1: Escribir el test que falla**

Añadir a `src/test/cache.test.ts`:

```ts
import { SupabaseCacheStore } from "@/lib/cache/supabase-store";
import { FileSystemCacheStore } from "@/lib/cache/fs-store";
import { getCacheStore, resetCacheStore } from "@/lib/cache/store";

describe("getCacheStore", () => {
  afterEach(() => {
    resetCacheStore();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("usa Postgres cuando hay credenciales de Supabase", () => {
    process.env.SUPABASE_URL = "https://ejemplo.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "clave-de-servicio";
    resetCacheStore();
    expect(getCacheStore()).toBeInstanceOf(SupabaseCacheStore);
  });

  it("cae al disco cuando falta una de las dos credenciales", () => {
    process.env.SUPABASE_URL = "https://ejemplo.supabase.co";
    resetCacheStore();
    expect(getCacheStore()).toBeInstanceOf(FileSystemCacheStore);
  });

  it("cae al disco cuando no hay ninguna credencial", () => {
    resetCacheStore();
    expect(getCacheStore()).toBeInstanceOf(FileSystemCacheStore);
  });
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/cache.test.ts
```

Esperado: FAIL con `resetCacheStore is not exported` y, una vez exportado, con el primer caso devolviendo `FileSystemCacheStore`.

- [ ] **Step 3: Implementar la selección de adaptador**

Sustituir `src/lib/cache/store.ts:15-28` por:

```ts
import { FileSystemCacheStore } from "./fs-store";
import { SupabaseCacheStore } from "./supabase-store";

let singleton: CacheStore | null = null;

/**
 * Elige el almacén.
 *
 * Con credenciales de Supabase, Postgres: es la única caché **compartida** que
 * tiene el proyecto. En Vercel el sistema de ficheros solo permite escribir en
 * `/tmp`, que es efímero y no se comparte entre invocaciones concurrentes, así
 * que allí la caché de disco no evita ni una sola descarga entre instancias.
 * Sin credenciales, disco: sirve en local y no obliga a nadie a dar de alta
 * una base de datos para arrancar el proyecto.
 */
export function getCacheStore(): CacheStore {
  if (singleton) return singleton;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && key) {
    singleton = new SupabaseCacheStore(url, key);
    return singleton;
  }

  const dir = process.env.VERCEL ? "/tmp/altius-cache" : ".cache";
  singleton = new FileSystemCacheStore(dir);
  return singleton;
}

/** Descarta el almacén memorizado. Solo para pruebas. */
export function resetCacheStore(): void {
  singleton = null;
}
```

- [ ] **Step 4: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/cache.test.ts
```

Esperado: PASS.

- [ ] **Step 5: Aplicar la migración en Supabase**

Crear el proyecto en Supabase si no existe y aplicar `supabase/migrations/0001_cache_tables.sql`. Después, definir `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el panel de Vercel del proyecto `altius`, en los tres entornos.

> **Nota para quien ejecute:** la clave de servicio la introduce el usuario en el panel de Vercel y de Supabase. No la pidas por chat, no la escribas en ningún fichero del repositorio y no la incluyas en un commit. `.env.local` ya está en `.gitignore`; confírmalo antes de tocar nada.

- [ ] **Step 6: Verificar contra la base real**

Con las credenciales en `.env.local`, arrancar el proyecto, abrir `/ticker/AAPL/financials`, y comprobar en el editor SQL de Supabase que la tabla tiene filas:

```sql
select key, expires_at, length(value::text) as bytes
from altius_cache
order by expires_at desc
limit 20;
```

Esperado: al menos las claves de `companyfacts` y `submissions` de Apple. Recargar la página y comprobar en los logs que ya no se descarga `companyfacts`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/cache/store.ts src/test/cache.test.ts
git commit -m "fix: activa la cache compartida en Postgres cuando hay credenciales

El adaptador de Supabase estaba escrito desde el primer commit pero
getCacheStore() nunca lo devolvia. En Vercel eso significaba redescargar
companyfacts de 30 MB en cada invocacion y quemar la cuota diaria de
Alpha Vantage en horas.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 0.5: Degradación honesta cuando no hay cotización

Resuelve **D2**, el bug más embarazoso del repositorio. Sin `ALPHAVANTAGE_API_KEY`, o con la cuota agotada, `valuation/page.tsx:47` pasa `price = 0`. Los múltiplos se anulan bien, pero `valuation/index.ts:188` sustituye el precio por `1` y el margen de seguridad sale disparado, en verde, presentado como análisis.

La clave del arreglo: **el precio objetivo sí se puede calcular sin cotización actual** —depende solo de las proyecciones—. Lo que no se puede calcular es el margen de seguridad ni el CAGR, porque ambos comparan contra el precio de hoy. Así que se calcula lo que se puede y se dice explícitamente lo que no. Y se ofrece la salida obvia: que el usuario escriba el precio.

**Files:**
- Modify: `src/lib/valuation/types.ts`, `src/lib/valuation/index.ts:12-16,56-58,135-203`
- Modify: `src/app/ticker/[ticker]/valuation/page.tsx:46-50`
- Modify: `src/components/valuation/projection-calculator.tsx:38-41,190-205`, `src/components/valuation/valuation-summary-cards.tsx:7`
- Test: `src/test/valuation.test.ts`

**Interfaces:**
- Produces: `ValuationMetrics.price: number | null`; `ValuationProjection.marginOfSafety: number | null` y `.cagr5Y: number | null`; `buildValuationMetrics(bundle, price: number | null, priceDate?)`. Lo consume la Task 1.1 (valoración inversa), que también necesita el precio anulable.

- [ ] **Step 1: Escribir el test que falla**

Añadir a `src/test/valuation.test.ts`:

```ts
const INPUTS_BASE: ProjectionInputs = {
  revenueGrowth: 8,
  targetEbitMargin: 30,
  targetMultiple: 25,
  targetMultipleType: "PE",
  taxRate: 21,
  sharesGrowth: -1,
};

describe("valoración sin cotización", () => {
  it("no inventa un precio actual", () => {
    const metrics = buildValuationMetrics(bundle, null);
    expect(metrics.price).toBeNull();
    expect(metrics.marketCap).toBeNull();
    expect(metrics.pe).toBeNull();
  });

  it("calcula el precio objetivo pero no el margen de seguridad ni el CAGR", () => {
    const metrics = buildValuationMetrics(bundle, null);
    const proj = calculateProjection(metrics, INPUTS_BASE);

    expect(proj).not.toBeNull();
    // El precio objetivo depende solo de las proyecciones, no del precio de hoy.
    expect(proj!.targetPrice5Y).toBeGreaterThan(0);
    // Estos dos comparan contra el precio actual: sin él, no existen.
    expect(proj!.currentPrice).toBeNull();
    expect(proj!.marginOfSafety).toBeNull();
    expect(proj!.cagr5Y).toBeNull();
  });

  it("con cotización sí los calcula", () => {
    const metrics = buildValuationMetrics(bundle, 200, "2026-08-14");
    const proj = calculateProjection(metrics, INPUTS_BASE);
    expect(proj!.currentPrice).toBe(200);
    expect(proj!.marginOfSafety).not.toBeNull();
    expect(proj!.cagr5Y).not.toBeNull();
  });

  it("devuelve null cuando faltan los ingresos o las acciones, en vez de suponerlos", () => {
    const vacio = { ...bundle, blocks: [] } as typeof bundle;
    const metrics = buildValuationMetrics(vacio, 200);
    expect(calculateProjection(metrics, INPUTS_BASE)).toBeNull();
  });
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/valuation.test.ts
```

Esperado: FAIL. `buildValuationMetrics` no acepta `null` como precio, y `calculateProjection` devuelve valores numéricos donde se esperan nulos.

- [ ] **Step 3: Cambiar los tipos**

En `src/lib/valuation/types.ts`:

```ts
export type ValuationMetrics = {
  /** Cotización de referencia. `null` si no hay proveedor o se agotó la cuota. */
  price: number | null;
  priceDate: string | null;
  // ...el resto igual
};

export type ValuationProjection = {
  years: ProjectedYear[];
  /** `null` cuando no hay cotización con la que comparar. */
  currentPrice: number | null;
  targetPrice5Y: number;
  /** `null` cuando no hay cotización: comparar contra un precio inventado sería mentir. */
  marginOfSafety: number | null;
  cagr5Y: number | null;
};
```

- [ ] **Step 4: Implementar la degradación en el motor**

En `src/lib/valuation/index.ts`, cambiar la firma:

```ts
export function buildValuationMetrics(
  bundle: StatementBundle,
  price: number | null,
  priceDate: string | null = null,
): ValuationMetrics {
```

y la línea 56:

```ts
  const marketCap = (sharesDiluted !== null && sharesDiluted > 0 && price !== null && price > 0)
    ? price * sharesDiluted
    : null;
```

Sustituir la cabecera de `calculateProjection` (líneas 135-143) por:

```ts
export function calculateProjection(
  metrics: ValuationMetrics,
  inputs: ProjectionInputs,
): ValuationProjection | null {
  // Sin ingresos base ni número de acciones no hay proyección posible.
  // Suponer 1.000 M$ de ingresos y 100 M de acciones, como se hacía antes,
  // produce una tabla entera de cifras que no describen ninguna empresa.
  if (metrics.revenue === null || metrics.revenue <= 0) return null;
  if (metrics.sharesDiluted === null || metrics.sharesDiluted <= 0) return null;

  const baseRevenue = metrics.revenue;
  const baseShares = metrics.sharesDiluted;
  const startYear = metrics.lastFiscalYear ?? new Date().getFullYear();
  const conversionPct = (metrics.historicalFcfConversion?.value ?? 70) / 100;
  const netDebt = metrics.netDebt ?? 0;
```

y el cierre (líneas 187-203):

```ts
  const targetPrice5Y = years[4]?.targetPrice ?? 0;
  const currentPrice = metrics.price !== null && metrics.price > 0 ? metrics.price : null;

  const marginOfSafety =
    currentPrice !== null ? ((targetPrice5Y - currentPrice) / currentPrice) * 100 : null;

  const cagr5Y =
    currentPrice !== null && targetPrice5Y > 0
      ? (Math.pow(targetPrice5Y / currentPrice, 1 / 5) - 1) * 100
      : null;

  return { years, currentPrice, targetPrice5Y, marginOfSafety, cagr5Y };
}
```

(`historicalFcfConversion?.value` presupone la Task 0.6; si esta tarea se ejecuta antes, dejar `metrics.historicalFcfConversion ?? 70` y ajustarlo en la 0.6.)

- [ ] **Step 5: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/valuation.test.ts
```

Esperado: PASS.

- [ ] **Step 6: Pasar `null` desde la página**

En `src/app/ticker/[ticker]/valuation/page.tsx`, sustituir las líneas 46-50:

```tsx
  const latestPoint = precios.ok ? precios.series.points.at(-1) : null;
  const currentPrice = latestPoint ? latestPoint.close : null;
  const priceDate = latestPoint ? latestPoint.date : null;

  const metrics = buildValuationMetrics(bundle, currentPrice, priceDate);
```

Y añadir, cuando `!precios.ok`, un aviso encima de las tarjetas explicando por qué faltan los múltiplos, reutilizando el mismo texto tipado que ya produce `SinPrecio` en `src/app/ticker/[ticker]/page.tsx:200-216`. Extraer esa función a `src/components/price-unavailable.tsx` y usarla en ambas páginas en lugar de duplicarla.

- [ ] **Step 7: Entrada manual de precio en la calculadora**

En `src/components/valuation/projection-calculator.tsx`, añadir estado local para un precio introducido a mano. Es la salida natural: la pregunta que responde una valoración inversa es «a este precio, ¿qué hace falta?», y el precio lo puede poner el usuario.

```tsx
  const [precioManual, setPrecioManual] = useState<number | null>(null);
  const precioEfectivo = metrics.price ?? precioManual;
  const metricsConPrecio = useMemo(
    () => (precioEfectivo === metrics.price ? metrics : { ...metrics, price: precioEfectivo }),
    [metrics, precioEfectivo],
  );
  const projection = useMemo(
    () => calculateProjection(metricsConPrecio, inputs),
    [metricsConPrecio, inputs],
  );
```

Cuando `metrics.price === null`, mostrar encima de los resultados:

```tsx
      {metrics.price === null ? (
        <div className="bg-carbon-surface border-gunmetal rounded-2xl border border-dashed p-5">
          <p className="text-frost text-[14px] leading-[1.6]">
            No hay cotización disponible. El precio objetivo se calcula igual, pero el margen de
            seguridad y el CAGR necesitan un precio actual con el que comparar.
          </p>
          <label className="mt-3 flex items-center gap-2 text-[13px]">
            <span className="text-muted-steel">Introducir precio manualmente</span>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={precioManual ?? ""}
              onChange={(e) => {
                const v = Number.parseFloat(e.target.value);
                setPrecioManual(Number.isFinite(v) && v > 0 ? v : null);
              }}
              className="bg-void-black border-gunmetal text-pure-white w-28 rounded-lg border px-2.5 py-1.5 tabular"
            />
          </label>
          {precioManual !== null ? (
            <p className="text-muted-steel mt-2 text-[12px]">
              Precio introducido por el usuario, no verificado contra ninguna fuente.
            </p>
          ) : null}
        </div>
      ) : null}
```

Sustituir el renderizado de `margenSeguridad` y `cagr` (líneas 190-205) para que muestren `—` cuando sean nulos, sin color verde ni rojo, y para que `projection === null` produzca un estado vacío en lugar de una tabla.

En `src/components/valuation/valuation-summary-cards.tsx:7`, `metrics.price > 0` deja de compilar con el tipo anulable: cambiar a `metrics.price !== null && metrics.price > 0`.

- [ ] **Step 8: Verificar en el navegador sin clave de precios**

```bash
npm run dev
```

Con `ALPHAVANTAGE_API_KEY` vacía en `.env.local`, abrir `/ticker/AAPL/valuation`. Comprobar que el margen de seguridad y el CAGR muestran `—`, que aparece el aviso con la entrada manual, y que al escribir un precio los dos se calculan y se marcan como precio introducido por el usuario.

- [ ] **Step 9: Suite completa y commit**

```bash
npm test && npx tsc --noEmit && npx eslint src
```

```bash
git add src/lib/valuation src/components/valuation src/components/price-unavailable.tsx src/app/ticker/\[ticker\]/valuation/page.tsx src/app/ticker/\[ticker\]/page.tsx src/test/valuation.test.ts
git commit -m "fix: sin cotizacion no se inventa un margen de seguridad

Antes, sin precio, calculateProjection sustituia el precio actual por 1 y
pintaba en verde un margen de seguridad disparado. Ahora el precio objetivo
se calcula igual (solo depende de las proyecciones) y el margen y el CAGR
devuelven null con su explicacion. El usuario puede introducir el precio a
mano, marcado como no verificado.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 0.6: Los supuestos se marcan como supuestos

Resuelve **D6** y es el objetivo 11 del usuario aplicado a la calculadora. Hoy, cuando faltan datos, `buildValuationMetrics` rellena margen EBIT 20 %, tipo fiscal 21 %, conversión de FCF 70 % y crecimiento 10 % (`valuation/index.ts:90-102`), y la interfaz los presenta idénticos a los calculados de las cuentas reales. Un supuesto por defecto de una calculadora es legítimo; presentarlo como el margen histórico de la empresa, no.

**Files:**
- Modify: `src/lib/valuation/types.ts`, `src/lib/valuation/index.ts:89-132`
- Modify: `src/components/valuation/projection-calculator.tsx`
- Test: `src/test/valuation.test.ts`

**Interfaces:**
- Produces: `Assumed<T>` y los cuatro campos `historical*` envueltos en él. Lo consume la Task 1.1.

- [ ] **Step 1: Escribir el test que falla**

Añadir a `src/test/valuation.test.ts`:

```ts
describe("supuestos por defecto", () => {
  it("marca como calculado el margen que sí sale de las cuentas", () => {
    const metrics = buildValuationMetrics(bundle, 200);
    expect(metrics.historicalEbitMargin.assumed).toBe(false);
    expect(metrics.historicalEbitMargin.basis).toMatch(/Resultado de explotación/);
    expect(metrics.historicalEbitMargin.value).toBeGreaterThan(0);
  });

  it("marca como supuesto el valor por defecto cuando no hay datos", () => {
    const vacio = { ...bundle, blocks: [] } as typeof bundle;
    const metrics = buildValuationMetrics(vacio, 200);
    expect(metrics.historicalEbitMargin.assumed).toBe(true);
    expect(metrics.historicalEbitMargin.value).toBe(20);
    expect(metrics.historicalEbitMargin.basis).toBe(
      "Supuesto por defecto. La empresa no publica los datos necesarios.",
    );
    expect(metrics.historicalTaxRate.assumed).toBe(true);
    expect(metrics.historicalFcfConversion.assumed).toBe(true);
    expect(metrics.historicalRevenueGrowth.assumed).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/valuation.test.ts
```

Esperado: FAIL con `Property 'assumed' does not exist on type 'number'`.

- [ ] **Step 3: Definir el envoltorio**

En `src/lib/valuation/types.ts`:

```ts
/**
 * Un valor que puede venir de las cuentas o de un supuesto por defecto.
 *
 * La distinción no es cosmética: `assumed: true` significa que Altius se ha
 * inventado el número porque la calculadora necesita uno, y la interfaz tiene
 * que decirlo antes de que alguien tome una decisión creyendo lo contrario.
 */
export type Assumed<T> = {
  value: T;
  assumed: boolean;
  /** De dónde sale, en una frase mostrable al usuario. */
  basis: string;
};
```

y en `ValuationMetrics`:

```ts
  historicalRevenueGrowth: Assumed<number>;
  historicalEbitMargin: Assumed<number>;
  historicalFcfConversion: Assumed<number>;
  historicalTaxRate: Assumed<number>;
```

- [ ] **Step 4: Implementar en el motor**

Sustituir `src/lib/valuation/index.ts:89-102` por:

```ts
  const POR_DEFECTO = "Supuesto por defecto. La empresa no publica los datos necesarios.";
  const periodoLabel = latestPeriod?.label ?? "el último ejercicio";

  const historicalEbitMargin: Assumed<number> =
    revenue !== null && operatingIncome !== null && revenue > 0
      ? {
          value: (operatingIncome / revenue) * 100,
          assumed: false,
          basis: `Resultado de explotación ÷ Ingresos de ${periodoLabel}`,
        }
      : { value: 20, assumed: true, basis: POR_DEFECTO };

  const historicalTaxRate: Assumed<number> =
    pretaxIncome !== null && incomeTax !== null && pretaxIncome > 0
      ? {
          value: Math.min(Math.max((incomeTax / pretaxIncome) * 100, 0), 40),
          assumed: false,
          basis: `Impuesto ÷ Resultado antes de impuestos de ${periodoLabel}, acotado entre 0 % y 40 %`,
        }
      : { value: 21, assumed: true, basis: POR_DEFECTO };

  const historicalFcfConversion: Assumed<number> =
    ebitda !== null && freeCashFlow !== null && ebitda > 0
      ? {
          value: Math.min(Math.max((freeCashFlow / ebitda) * 100, 10), 120),
          assumed: false,
          basis: `Flujo de caja libre ÷ EBITDA de ${periodoLabel}, acotado entre 10 % y 120 %`,
        }
      : { value: 70, assumed: true, basis: POR_DEFECTO };

  const crecimiento = getLatestValue(ratios, "revenueGrowthYoY", pKey);
  const historicalRevenueGrowth: Assumed<number> =
    crecimiento !== null
      ? { value: crecimiento, assumed: false, basis: `Variación interanual de ingresos en ${periodoLabel}` }
      : { value: 10, assumed: true, basis: POR_DEFECTO };
```

Añadir `import type { Assumed } from "./types";` a los imports existentes y devolver los cuatro campos nuevos en lugar de los antiguos.

**Ojo con el acotado:** los rangos `[0, 40]` y `[10, 120]` transforman el dato real. Cuando el acotado se activa —el valor bruto queda fuera del rango— el `basis` debe decirlo: añadir ` (valor bruto ${bruto.toFixed(1)} % acotado)` a la frase. Un dato transformado tampoco es el dato.

- [ ] **Step 5: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/valuation.test.ts
```

Esperado: PASS.

- [ ] **Step 6: Marcar los supuestos en la interfaz**

En `src/components/valuation/projection-calculator.tsx`, los deslizadores se inicializan hoy con `metrics.historicalEbitMargin` y compañía. Cambiar a `.value` y, junto a cada etiqueta, mostrar el origen:

```tsx
function OrigenDelValor({ fuente }: { fuente: Assumed<number> }) {
  return (
    <span
      title={fuente.basis}
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider",
        fuente.assumed ? "text-amber-400" : "text-muted-steel",
      )}
    >
      {fuente.assumed ? "supuesto" : "de las cuentas"}
    </span>
  );
}
```

- [ ] **Step 7: Suite completa y commit**

```bash
npm test && npx tsc --noEmit && npx eslint src
```

```bash
git add src/lib/valuation src/components/valuation src/test/valuation.test.ts
git commit -m "feat: la calculadora distingue lo calculado de lo supuesto

Los valores por defecto (margen 20%, tipo 21%, conversion 70%, crecimiento
10%) se presentaban identicos a los derivados de las cuentas reales. Ahora
cada uno declara si es un supuesto y de donde sale, incluido cuando el
acotado transforma el valor bruto.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 0.7: Una sola paleta, un solo tema

Resuelve **D3** y **D4**. `globals.css` mantiene dos sistemas de color superpuestos: los tokens Better Stack y un mapeo «legacy» de la etapa Ventriloc donde `--graphite` es blanco y `--canvas-white` es casi negro. Quedan **45 usos** de tokens legacy repartidos en **16 ficheros**. Y el «modo oscuro» no es un modo: `:root` y `.dark` son bloques idénticos, el `<html>` lleva la clase `dark` fija, y el selector no cambia nada.

Decisión: **un solo tema, bien hecho.** El objetivo 20 del usuario pide menos ornamento y más decisión; mantener un selector que no hace nada es exactamente lo contrario. Un modo claro real se puede añadir más adelante con la paleta ya limpia, y será mucho más barato entonces.

**Files:**
- Modify: `src/app/globals.css:26-36,102-201`
- Modify: los 15 ficheros con tokens legacy (excluido `market-leaders-table.tsx`, ya borrado en la Task 0.3)
- Delete: `src/components/theme-toggle.tsx`, `src/components/theme-provider.tsx`
- Modify: `src/app/layout.tsx:26,34-46,53,59,66`, `src/components/site-header.tsx:8,58`
- Test: `src/test/no-legacy-tokens.test.ts`

- [ ] **Step 1: Escribir el test de regresión que falla**

Crear `src/test/no-legacy-tokens.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function ficherosFuente(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      if (entrada === "test") continue;
      salida.push(...ficherosFuente(ruta));
    } else if (/\.(ts|tsx|css)$/.test(entrada)) {
      salida.push(ruta);
    }
  }
  return salida;
}

/**
 * Los tokens de la etapa "Ventriloc" mienten sobre su propio nombre:
 * --graphite es blanco puro y --canvas-white es casi negro. Mantenerlos vivos
 * garantiza que el próximo cambio de diseño se haga a ciegas.
 */
describe("paleta", () => {
  const LEGACY = /\b(?:text|bg|border|decoration|fill|stroke|ring|from|to|via)-(?:graphite|canvas-white|ash|fog|ivory|steel|slate|mist|ember|brass)\b/;

  it("ningún fichero usa los tokens de color de la etapa anterior", () => {
    const ofensores = ficherosFuente("src")
      .filter((f) => LEGACY.test(readFileSync(f, "utf8")))
      // Los tokens propios de la paleta vigente contienen las mismas palabras.
      .filter((f) => !/globals\.css$/.test(f));
    expect(ofensores).toEqual([]);
  });
});
```

Nota: la expresión excluye deliberadamente `muted-steel` y `steel-border`, que sí son tokens de la paleta vigente, gracias al `\b` inicial tras el guion del prefijo.

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/no-legacy-tokens.test.ts
```

Esperado: FAIL listando 15 ficheros.

- [ ] **Step 3: Sustituir los tokens uno a uno**

Mapa de equivalencias, derivado de los valores reales que ya tienen en `globals.css:102-112`:

| Legacy | Valor actual | Sustituto |
|---|---|---|
| `graphite` | `#ffffff` | `pure-white` |
| `canvas-white`, `ash` | `#151621` | `carbon-surface` |
| `fog`, `mist` | `#1f2433` | `gunmetal` |
| `ivory` | `#1a1c2b` | `carbon-surface` |
| `steel` | `#c9d3ee` | `frost` |
| `slate` | `#646e87` | `muted-steel` |
| `ember` | `#98a4f7` | `periwinkle-glow` |
| `brass` | `#5b63d3` | `iris-blue` |

Aplicar con sustitución dirigida, revisando el resultado fichero a fichero. **No usar un `sed` global sobre `src/`**: `steel` es subcadena de `muted-steel` y `steel-border`, que son tokens vigentes.

```bash
grep -rlE '(text|bg|border|decoration|fill|stroke|ring|from|to|via)-(graphite|canvas-white|ash|fog|ivory|steel|slate|mist|ember|brass)\b' src/ | sort
```

- [ ] **Step 4: Limpiar `globals.css`**

Borrar el bloque de mapeos legacy de `@theme inline` (líneas 26-36) y las diez declaraciones legacy de `:root` (líneas 103-112) y de `.dark` (líneas 154-163).

Como `:root` y `.dark` quedan idénticos, borrar el bloque `.dark` entero (líneas 153-201) y el `@custom-variant dark` de la línea 5. Los tokens vivos se quedan solo en `:root`.

- [ ] **Step 5: Eliminar el selector de tema**

```bash
git rm src/components/theme-toggle.tsx src/components/theme-provider.tsx
```

En `src/app/layout.tsx`: borrar el import de `ThemeProvider` (línea 26), la constante `themeInitScript` (líneas 34-46), el bloque `<head>` que la inyecta (líneas 55-57) y las etiquetas `<ThemeProvider>` (líneas 59 y 66). Dejar la clase `dark` en el `<html>` **solo si** algún componente de shadcn la necesita; comprobarlo y, si no, quitarla también de la línea 53.

En `src/components/site-header.tsx`: borrar el import (línea 8) y el uso (línea 58).

- [ ] **Step 6: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/no-legacy-tokens.test.ts && npm test && npx tsc --noEmit && npx eslint src
```

Esperado: todo limpio.

- [ ] **Step 7: Revisar visualmente las cinco rutas**

```bash
npm run dev
```

Recorrer `/`, `/macro`, `/ticker/AAPL`, `/ticker/AAPL/financials`, `/ticker/AAPL/valuation` y `/ticker/AAPL/ai`. Buscar texto invisible (blanco sobre blanco o gris sobre gris), que es el fallo típico de una sustitución de tokens. Comprobar también los estados de carga (`loading.tsx`), el de error y el `not-found`, que son los que más fácil se quedan atrás.

- [ ] **Step 8: Commit**

```bash
git add -A src/ 
git commit -m "refactor: una sola paleta y un solo tema

Elimina los 45 usos de tokens de la etapa Ventriloc, cuyos nombres mentian
(--graphite era blanco puro). Borra el bloque .dark, identico a :root, y el
selector de tema, que no cambiaba nada. Test de regresion incluido.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 0.8: Documentación sincronizada y `CLAUDE.md`

Resuelve **D7**.

**Files:**
- Modify: `README.md`, `.env.example`
- Create: `CLAUDE.md`

- [ ] **Step 1: Corregir las desincronizaciones del README**

- El modelo por defecto ya no es `gemini-3.6-flash`: es `gemini-flash-latest` con salto automático a `gemini-flash-lite-latest` (`src/lib/ai/gemini.ts:18`). Corregir en la tabla de variables.
- «Noventa y cuatro pruebas» pasa a ser el número real. Obtenerlo con `npm test` y escribirlo, o mejor, sustituir la cifra por «la suite completa» para que no vuelva a quedar obsoleta.
- Actualizar la sección de arquitectura con `src/lib/valuation/`, que no aparece.
- Añadir una sección de **Procedencia** explicando el popover de la Task 0.2, que es ahora la característica central del producto.

- [ ] **Step 2: Corregir `.env.example`**

- `GEMINI_MODEL`: el comentario dice «Por defecto gemini-3.6-flash». Corregir.
- Cambiar el comentario de `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: ya no es «activa la caché compartida», es **la caché compartida real en producción**, y a partir de la Fase 1 también el almacén de tesis.

- [ ] **Step 3: Crear `CLAUDE.md`**

```markdown
# Altius

Terminal de análisis fundamental sobre fuentes públicas verificables.
Español en todo el texto de interfaz, en los comentarios y en los commits.

## La regla que gobierna el código

**Nunca se inventa un valor.** Si un dato no existe, se muestra una raya. No hay
interpolación, estimación ni relleno, y esto incluye datos de portada, de demo y
de marketing. Antes de escribir un literal numérico en un componente, comprueba
si estás violando esta regla: casi siempre lo estás.

Todo dato derivado declara su fórmula. Todo dato reportado declara su concepto
XBRL, formulario, fecha y número de acceso. `src/lib/sec/provenance.ts` tiene los
tipos; ninguna cifra nueva puede saltárselos.

## Comandos

| Qué | Cómo |
|---|---|
| Desarrollo | `npm run dev` |
| Pruebas | `npm test` |
| Tipos | `npx tsc --noEmit` |
| Lint | `npx eslint src` |

Antes de dar por terminado cualquier cambio: los tres últimos, en verde.

## Dónde está la dificultad

`src/lib/sec/normalize.ts` es el activo del proyecto. Resuelve cinco problemas
reales del XBRL de la SEC y cada uno está documentado en su comentario:
reexpresiones, el campo `fy` que no es el ejercicio del hecho, duración frente a
instante, acumulados de los 10-Q y el Q4 derivado. **No lo simplifiques.** Cada
rama tiene un test sobre datos reales de Apple, Tesla o Johnson & Johnson detrás.

La resolución de conceptos es **por periodo**, no por línea. Ver el comentario de
`src/lib/sec/taxonomy.ts`.

## Restricciones externas

- Toda petición a la SEC lleva `User-Agent` con nombre y email, o devuelve 403.
  Sale por `src/lib/sec/client.ts`, que serializa a 10 req/s. Ningún módulo llama
  a `fetch` contra la SEC por su cuenta.
- CIK con ceros a la izquierda en `data.sec.gov/api`; sin ellos en
  `www.sec.gov/Archives`.
- Alpha Vantage: 25 peticiones al día en el plan gratuito. Nunca en bucle.
- En Vercel, `/tmp` es efímero. La caché compartida real es Postgres.

## Convenciones

- TypeScript `strict`. Sin `any` en las firmas públicas de `src/lib`.
- Los componentes de servidor hacen el trabajo pesado; al cliente solo viajan
  estructuras ya reducidas.
- Cada fuente externa degrada de forma independiente y tipada. Un fallo de
  Alpha Vantage no puede tumbar los estados financieros.
- Los comentarios explican **por qué**, no qué. Si un comentario describe lo que
  hace la línea de al lado, sobra.
```

- [ ] **Step 4: Commit**

```bash
git add README.md .env.example CLAUDE.md
git commit -m "docs: sincroniza README y .env.example, anade CLAUDE.md

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Criterio de salida de la Fase 0

La fase está terminada cuando todo esto es cierto a la vez:

- [ ] `npm test`, `npx tsc --noEmit` y `npx eslint src` en verde.
- [ ] Ningún fichero de `src/` contiene una métrica financiera escrita a mano; el test de regresión lo garantiza.
- [ ] Cualquier celda de la tabla financiera abre un popover con el concepto XBRL y un enlace que lleva a la presentación exacta en EDGAR.
- [ ] Un valor derivado muestra su fórmula y sus entradas.
- [ ] Sin `ALPHAVANTAGE_API_KEY`, la página de valoración muestra `—` en el margen de seguridad, explica por qué y ofrece introducir el precio.
- [ ] Un supuesto de la calculadora se distingue visualmente de un dato de las cuentas.
- [ ] `grep -r "graphite\|canvas-white\|-fog\|-mist" src/` no devuelve nada fuera de `globals.css`.
- [ ] Con `SUPABASE_URL` definida, la segunda visita a `/ticker/AAPL/financials` no vuelve a descargar `companyfacts`.
- [ ] `CLAUDE.md` existe y el README no contradice al código.

---

# FASE 1 — La killer feature

**Duración estimada:** 5–7 semanas.
**Cubre:** objetivos 2 (Reverse Investment Analysis), 3 (Investment Thesis OS) y 7 (datos + hipótesis + valoración conectados). No negociables 1, 2 y 7.

**La pregunta que cambia el producto.** Un DCF normal pregunta «¿cuánto vale Apple?» y devuelve un número que depende por completo de supuestos que el usuario acaba de teclear. La valoración inversa da la vuelta a la ecuación: fija el precio de hoy y el retorno que el usuario quiere, y **despeja qué tiene que pasar** para que ambos sean compatibles. El resultado no es una opinión sobre el valor, es una lista de condiciones falsables. Y una condición falsable se puede contrastar contra la historia de la propia empresa —que es justo lo que Altius ya tiene, diez ejercicios normalizados— para decir si es conservadora o heroica.

Sobre eso se monta el almacén de tesis: si la valoración inversa te dice que hace falta un 17,4 % de crecimiento, la tesis es tu apuesta sobre si eso va a pasar, guardada con fecha, con la fuente de cada hipótesis, y versionada para que dentro de dos años se pueda comparar con la realidad.

**Entregable:** un usuario registrado abre `/ticker/NVDA/reverse`, ve qué crecimiento e ingresos hacen falta para ganar un 12 % anual a cinco años, lee que esa exigencia está en el percentil 87 de la propia historia de NVIDIA, guarda una tesis con tres escenarios, y la vuelve a abrir un mes después exactamente como la dejó.

## Estructura de ficheros — Fase 1

| Fichero | Responsabilidad | Acción |
|---|---|---|
| `src/lib/valuation/reverse.ts` | Despeje de la incógnita: crecimiento, margen o múltiplo requeridos | **Crear** |
| `src/lib/valuation/plausibility.ts` | Distribución histórica y percentil de una exigencia | **Crear** |
| `src/lib/valuation/series.ts` | Extracción de series anuales del `StatementBundle` | **Crear** |
| `src/components/valuation/reverse-panel.tsx` | Interfaz de la valoración inversa | **Crear** |
| `src/app/ticker/[ticker]/reverse/page.tsx` | Ruta de la valoración inversa | **Crear** |
| `supabase/migrations/0002_auth_and_thesis.sql` | Tablas de tesis, revisiones y políticas RLS | **Crear** |
| `src/lib/supabase/server.ts` | Cliente de servidor con la sesión del usuario | **Crear** |
| `src/lib/supabase/client.ts` | Cliente de navegador | **Crear** |
| `src/lib/thesis/types.ts` | `Thesis`, `Scenario`, `Assumption`, `AssumptionSource` | **Crear** |
| `src/lib/thesis/schema.ts` | Validación de la forma que se guarda en JSONB | **Crear** |
| `src/lib/thesis/repository.ts` | Lectura y escritura de tesis y revisiones | **Crear** |
| `src/app/auth/callback/route.ts` | Intercambio del código de sesión | **Crear** |
| `src/app/(auth)/entrar/page.tsx` | Alta y entrada por enlace mágico | **Crear** |
| `src/app/tesis/page.tsx` | Listado de tesis del usuario | **Crear** |
| `src/components/thesis/thesis-editor.tsx` | Editor de hipótesis y escenarios | **Crear** |
| `src/components/company-header.tsx` | Añadir la pestaña «Valoración inversa» | Modificar |

---

### Task 1.1: Motor de valoración inversa

**Files:**
- Create: `src/lib/valuation/reverse.ts`
- Test: `src/test/reverse.test.ts`

**Interfaces:**
- Consumes: `ValuationMetrics` con `price: number | null` y `Assumed<number>` (tareas 0.5 y 0.6).
- Produces: `ReverseInputs`, `ReverseResult`, `solveRequired(metrics, inputs)`. Lo consumen las tareas 1.2, 1.3 y 1.6.

**La matemática.** Con `P` el precio de hoy, `S₀` las acciones diluidas actuales, `r` el retorno anual objetivo, `n` el horizonte en años, `d` la variación anual de acciones (negativa si hay recompras) y `M` el múltiplo de salida:

```
Precio exigido al final:      Pₙ  = P · (1+r)ⁿ
Acciones al final:            Sₙ  = S₀ · (1+d)ⁿ
Capitalización exigida:       MCₙ = Pₙ · Sₙ

Con múltiplo P/E:             Beneficio netoₙ = MCₙ / M
                              Ingresosₙ = Beneficio netoₙ / (margen · (1 − t))

Con múltiplo EV/EBITDA o EV/FCF:
                              EVₙ = MCₙ + Deuda neta
                              Magnitudₙ = EVₙ / M
                              Ingresosₙ = Magnitudₙ / margen

CAGR de ingresos exigido:     g = (Ingresosₙ / Ingresos₀)^(1/n) − 1
```

La deuda neta se mantiene constante a lo largo del horizonte. Es un supuesto, y la interfaz lo dice.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/test/reverse.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { solveRequired, type ReverseInputs } from "@/lib/valuation/reverse";
import type { ValuationMetrics } from "@/lib/valuation/types";

/** Empresa de laboratorio con números redondos para poder comprobar a mano. */
const METRICS: ValuationMetrics = {
  price: 100,
  priceDate: "2026-08-14",
  sharesDiluted: 1_000_000,
  marketCap: 100_000_000,
  totalCash: 0,
  totalDebt: 0,
  netDebt: 0,
  enterpriseValue: 100_000_000,
  revenue: 50_000_000,
  ebit: 10_000_000,
  ebitda: 12_000_000,
  netIncome: 8_000_000,
  freeCashFlow: 9_000_000,
  pe: 12.5,
  evEbitda: 8.33,
  evEbit: 10,
  evFcf: 11.11,
  netDebtEbitda: 0,
  fcfYield: 9,
  historicalRevenueGrowth: { value: 10, assumed: false, basis: "prueba" },
  historicalEbitMargin: { value: 20, assumed: false, basis: "prueba" },
  historicalFcfConversion: { value: 75, assumed: false, basis: "prueba" },
  historicalTaxRate: { value: 20, assumed: false, basis: "prueba" },
  lastFiscalYear: 2025,
};

const INPUTS: ReverseInputs = {
  targetReturn: 12,
  years: 5,
  terminalMultiple: 20,
  terminalMultipleType: "PE",
  terminalMargin: 20,
  taxRate: 20,
  sharesGrowth: 0,
};

describe("solveRequired", () => {
  it("despeja el crecimiento de ingresos que exige el precio de hoy", () => {
    const r = solveRequired(METRICS, INPUTS)!;

    // Precio exigido: 100 × 1,12⁵ = 176,2341683...
    expect(r.requiredPrice).toBeCloseTo(176.2341683, 5);
    // Sin dilución, las acciones no cambian.
    expect(r.terminalShares).toBe(1_000_000);
    // Capitalización exigida: 176,2341683... × 1.000.000
    expect(r.requiredMarketCap).toBeCloseTo(176_234_168.32, 1);
    // Beneficio neto exigido: capitalización ÷ 20
    expect(r.requiredTerminalEarnings).toBeCloseTo(8_811_708.416, 2);
    // Ingresos exigidos: beneficio ÷ (0,20 × 0,80) = beneficio ÷ 0,16
    expect(r.requiredTerminalRevenue).toBeCloseTo(55_073_177.6, 1);
    // CAGR: (55.073.177,6 / 50.000.000)^(1/5) − 1 = 1,9516 %
    // Una empresa a PER 12,5 que quiera dar un 12 % anual saliendo a PER 20
    // apenas necesita crecer: casi todo el retorno lo pone la expansión de
    // múltiplo. Que la valoración inversa haga visible eso ya justifica la feature.
    expect(r.requiredRevenueCagr).toBeCloseTo(1.9516, 3);
  });

  it("las recompras rebajan el crecimiento exigido", () => {
    const conRecompras = solveRequired(METRICS, { ...INPUTS, sharesGrowth: -3 })!;
    const sinRecompras = solveRequired(METRICS, INPUTS)!;
    expect(conRecompras.requiredRevenueCagr!).toBeLessThan(sinRecompras.requiredRevenueCagr!);
    // Recomprar un 3 % anual convierte un 1,95 % de crecimiento exigido en −1,11 %.
    expect(conRecompras.requiredRevenueCagr!).toBeCloseTo(-1.107, 2);
  });

  it("un múltiplo de salida más bajo exige más crecimiento", () => {
    const barato = solveRequired(METRICS, { ...INPUTS, terminalMultiple: 12 })!;
    const caro = solveRequired(METRICS, { ...INPUTS, terminalMultiple: 30 })!;
    expect(barato.requiredRevenueCagr!).toBeCloseTo(12.918, 2);
    expect(caro.requiredRevenueCagr!).toBeCloseTo(-5.99, 2);
    expect(barato.requiredRevenueCagr!).toBeGreaterThan(caro.requiredRevenueCagr!);
  });

  it("con EV/FCF suma la deuda neta a la capitalización exigida", () => {
    const conDeuda = { ...METRICS, netDebt: 50_000_000 };
    const r = solveRequired(conDeuda, {
      ...INPUTS,
      terminalMultipleType: "EV_FCF",
      terminalMultiple: 20,
      terminalMargin: 18,
    })!;
    // EV exigido = capitalización + deuda neta
    expect(r.requiredEnterpriseValue).toBeCloseTo(r.requiredMarketCap + 50_000_000, 0);
    // FCF exigido = EV ÷ 20
    expect(r.requiredTerminalEarnings).toBeCloseTo(r.requiredEnterpriseValue! / 20, 0);
  });

  it("devuelve null cuando falta el precio, en vez de suponer uno", () => {
    expect(solveRequired({ ...METRICS, price: null }, INPUTS)).toBeNull();
  });

  it("devuelve null cuando faltan los ingresos base o las acciones", () => {
    expect(solveRequired({ ...METRICS, revenue: null }, INPUTS)).toBeNull();
    expect(solveRequired({ ...METRICS, sharesDiluted: null }, INPUTS)).toBeNull();
  });

  it("devuelve null si el margen neto exigido no es positivo", () => {
    // Un tipo impositivo del 100 % deja beneficio neto cero: no hay despeje.
    expect(solveRequired(METRICS, { ...INPUTS, taxRate: 100 })).toBeNull();
  });
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/reverse.test.ts
```

Esperado: FAIL con `Failed to resolve import "@/lib/valuation/reverse"`.

- [ ] **Step 3: Implementar el motor**

Crear `src/lib/valuation/reverse.ts`:

```ts
import type { ValuationMetrics } from "./types";

export type MultipleType = "PE" | "EV_EBITDA" | "EV_FCF";

/**
 * Entrada de una valoración inversa.
 *
 * A diferencia de una proyección, aquí el usuario no fija el crecimiento: fija
 * lo que quiere ganar y qué múltiplo cree razonable a la salida, y el motor
 * despeja qué tiene que hacer el negocio para que el precio de hoy lo permita.
 */
export type ReverseInputs = {
  /** Retorno anual compuesto que el usuario exige, en %. Ej: 12 */
  targetReturn: number;
  /** Horizonte en años. Ej: 5 */
  years: number;
  /** Múltiplo al que se supone que cotizará al final del horizonte. */
  terminalMultiple: number;
  terminalMultipleType: MultipleType;
  /**
   * Margen sobre ingresos del año terminal, en %. Con `PE` es el margen
   * operativo (al que se le aplica el tipo); con `EV_EBITDA` y `EV_FCF` es el
   * margen de EBITDA o de flujo de caja libre respectivamente.
   */
  terminalMargin: number;
  /** Tipo impositivo efectivo, en %. Solo interviene con `PE`. */
  taxRate: number;
  /** Variación anual del número de acciones, en %. Negativa si hay recompras. */
  sharesGrowth: number;
};

export type ReverseResult = {
  /** Precio por acción al final del horizonte que produce el retorno exigido. */
  requiredPrice: number;
  /** Acciones en circulación al final del horizonte, tras dilución o recompras. */
  terminalShares: number;
  requiredMarketCap: number;
  /** Solo con múltiplos de EV. `null` con `PE`. */
  requiredEnterpriseValue: number | null;
  /** Beneficio neto, EBITDA o FCF del año terminal que exige el múltiplo. */
  requiredTerminalEarnings: number;
  requiredTerminalRevenue: number;
  /** CAGR de ingresos necesario, en %. */
  requiredRevenueCagr: number | null;
  /** Supuestos que ha tenido que hacer el motor, para mostrarlos al usuario. */
  caveats: string[];
};

/**
 * Despeja qué tiene que ocurrir para que el precio de hoy produzca el retorno
 * exigido.
 *
 * Devuelve `null` en lugar de rellenar huecos: sin precio, sin ingresos base o
 * sin número de acciones no hay ecuación que resolver, y un resultado inventado
 * aquí sería peor que ninguno, porque la interfaz lo presentaría como análisis.
 */
export function solveRequired(
  metrics: ValuationMetrics,
  inputs: ReverseInputs,
): ReverseResult | null {
  const { price, sharesDiluted, revenue } = metrics;
  if (price === null || price <= 0) return null;
  if (sharesDiluted === null || sharesDiluted <= 0) return null;
  if (revenue === null || revenue <= 0) return null;
  if (inputs.years <= 0) return null;
  if (inputs.terminalMultiple <= 0) return null;
  if (inputs.terminalMargin <= 0) return null;

  const n = inputs.years;
  const r = inputs.targetReturn / 100;
  const d = inputs.sharesGrowth / 100;
  const margen = inputs.terminalMargin / 100;

  const caveats: string[] = [];

  const requiredPrice = price * Math.pow(1 + r, n);
  const terminalShares = sharesDiluted * Math.pow(1 + d, n);
  if (terminalShares <= 0) return null;
  const requiredMarketCap = requiredPrice * terminalShares;

  let requiredEnterpriseValue: number | null = null;
  let requiredTerminalEarnings: number;
  let requiredTerminalRevenue: number;

  if (inputs.terminalMultipleType === "PE") {
    const margenNeto = margen * (1 - inputs.taxRate / 100);
    if (margenNeto <= 0) return null;
    requiredTerminalEarnings = requiredMarketCap / inputs.terminalMultiple;
    requiredTerminalRevenue = requiredTerminalEarnings / margenNeto;
  } else {
    const deudaNeta = metrics.netDebt ?? 0;
    if (metrics.netDebt === null) {
      caveats.push(
        "La empresa no publica los datos de deuda y caja necesarios: se ha supuesto deuda neta cero.",
      );
    } else if (deudaNeta !== 0) {
      caveats.push(
        "La deuda neta se mantiene constante durante todo el horizonte. Si la empresa amortiza deuda o se apalanca, el resultado cambia.",
      );
    }
    requiredEnterpriseValue = requiredMarketCap + deudaNeta;
    if (requiredEnterpriseValue <= 0) return null;
    requiredTerminalEarnings = requiredEnterpriseValue / inputs.terminalMultiple;
    requiredTerminalRevenue = requiredTerminalEarnings / margen;
  }

  const ratio = requiredTerminalRevenue / revenue;
  const requiredRevenueCagr = ratio > 0 ? (Math.pow(ratio, 1 / n) - 1) * 100 : null;

  if (metrics.historicalEbitMargin.assumed) {
    caveats.push("El margen de partida es un supuesto por defecto, no un dato de las cuentas.");
  }

  return {
    requiredPrice,
    terminalShares,
    requiredMarketCap,
    requiredEnterpriseValue,
    requiredTerminalEarnings,
    requiredTerminalRevenue,
    requiredRevenueCagr,
    caveats,
  };
}
```

- [ ] **Step 4: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/reverse.test.ts
```

Esperado: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/valuation/reverse.ts src/test/reverse.test.ts
git commit -m "feat: motor de valoracion inversa

Despeja que crecimiento de ingresos exige el precio de hoy para producir el
retorno objetivo, dado un multiplo de salida, un margen terminal y la
dilucion o recompra de acciones. Devuelve null cuando faltan datos en vez
de suponerlos, y declara los supuestos que si hace.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 1.2: Plausibilidad — «¿es esto conservador o heroico?»

Un número exigido sin contexto no dice nada. Que NVIDIA necesite un 17,4 % de crecimiento solo significa algo comparado con lo que NVIDIA ha hecho históricamente. Con diez ejercicios anuales normalizados se pueden extraer las ventanas móviles de CAGR a `n` años y situar la exigencia en esa distribución.

**La honestidad importa aquí más que en ningún otro sitio.** Con diez ejercicios y ventanas de cinco años salen **cinco muestras**. Un «percentil 87» sobre cinco observaciones es una afirmación mucho más débil que sobre cien, y la interfaz tiene que decir el tamaño de la muestra al lado del percentil. La Fase 2 amplía la distribución con los comparables del sector, y ahí el percentil empieza a valer de verdad.

**Files:**
- Create: `src/lib/valuation/series.ts`, `src/lib/valuation/plausibility.ts`
- Test: `src/test/plausibility.test.ts`

**Interfaces:**
- Consumes: `StatementBundle` (`src/lib/sec/statements.ts`).
- Produces: `annualSeries(bundle, blockId, lineId)`, `rollingCagrs(serie, years)`, `percentileOf(muestra, valor)`, `assessPlausibility(...)`. Lo consumen las tareas 1.3 y 1.6, y toda la Fase 3.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/test/plausibility.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { rollingCagrs, percentileOf, assessPlausibility } from "@/lib/valuation/plausibility";
import { annualSeries } from "@/lib/valuation/series";

describe("rollingCagrs", () => {
  it("calcula las ventanas móviles de n años y las devuelve ordenadas", () => {
    // Seis ejercicios, crecimiento del 10 % anual exacto.
    const serie = [
      { fiscalYear: 2020, value: 100 },
      { fiscalYear: 2021, value: 110 },
      { fiscalYear: 2022, value: 121 },
      { fiscalYear: 2023, value: 133.1 },
      { fiscalYear: 2024, value: 146.41 },
      { fiscalYear: 2025, value: 161.051 },
    ];
    const c = rollingCagrs(serie, 5);
    expect(c).toHaveLength(1);
    expect(c[0]).toBeCloseTo(10, 6);
  });

  it("descarta las ventanas con un extremo no positivo, sin inventar", () => {
    const serie = [
      { fiscalYear: 2022, value: -5 },
      { fiscalYear: 2023, value: 100 },
      { fiscalYear: 2024, value: 121 },
    ];
    // La única ventana de 2 años con ambos extremos positivos es 2023→2024.
    const c = rollingCagrs(serie, 2);
    expect(c).toHaveLength(0);
    expect(rollingCagrs(serie, 1)).toHaveLength(1);
  });

  it("devuelve vacío cuando no hay historia suficiente", () => {
    expect(rollingCagrs([{ fiscalYear: 2025, value: 100 }], 5)).toEqual([]);
  });
});

describe("percentileOf", () => {
  it("sitúa el valor dentro de la muestra", () => {
    expect(percentileOf([0, 10, 20, 30], 25)).toBe(75);
    expect(percentileOf([0, 10, 20, 30], -5)).toBe(0);
    expect(percentileOf([0, 10, 20, 30], 99)).toBe(100);
  });

  it("devuelve null con muestra vacía en vez de un cero engañoso", () => {
    expect(percentileOf([], 25)).toBeNull();
  });
});

describe("assessPlausibility", () => {
  const HISTORIA = [4, 8, 12, 16, 20];

  it("califica de conservadora una exigencia por debajo de casi toda la historia", () => {
    const a = assessPlausibility(5, HISTORIA, "crecimiento de ingresos");
    expect(a.percentile).toBe(20);
    expect(a.verdict).toBe("conservadora");
  });

  it("califica de heroica una exigencia por encima de toda la historia", () => {
    const a = assessPlausibility(30, HISTORIA, "crecimiento de ingresos");
    expect(a.percentile).toBe(100);
    expect(a.verdict).toBe("heroica");
  });

  it("dice que no sabe cuando no hay muestra", () => {
    const a = assessPlausibility(15, [], "crecimiento de ingresos");
    expect(a.percentile).toBeNull();
    expect(a.verdict).toBe("sin-datos");
    expect(a.explanation).toBe(
      "No hay histórico suficiente para juzgar si esta exigencia es razonable.",
    );
  });

  it("declara siempre el tamaño de la muestra en la explicación", () => {
    const a = assessPlausibility(15, HISTORIA, "crecimiento de ingresos");
    expect(a.sampleSize).toBe(5);
    expect(a.explanation).toContain("5 ventanas");
  });
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/plausibility.test.ts
```

Esperado: FAIL con `Failed to resolve import "@/lib/valuation/plausibility"`.

- [ ] **Step 3: Implementar la extracción de series**

Crear `src/lib/valuation/series.ts`:

```ts
import type { StatementBundle } from "../sec/statements";
import type { StatementId } from "../sec/taxonomy";

export type AnnualPoint = { fiscalYear: number; value: number };

/**
 * Serie anual de una línea, en orden cronológico ascendente.
 *
 * Los periodos del motor vienen del más reciente al más antiguo, que es el
 * orden natural de una tabla financiera y el contrario del que necesita
 * cualquier cálculo de series temporales.
 */
export function annualSeries(
  bundle: StatementBundle,
  blockId: StatementId,
  lineId: string,
): AnnualPoint[] {
  const block = bundle.blocks.find((b) => b.id === blockId);
  const row = block?.rows.find((r) => r.line.id === lineId);
  if (!block || !row) return [];

  return block.periods
    .map((p) => ({ fiscalYear: p.fiscalYear, value: row.cells[p.key]?.value ?? null }))
    .filter((p): p is AnnualPoint => p.value !== null && Number.isFinite(p.value))
    .sort((a, b) => a.fiscalYear - b.fiscalYear);
}
```

- [ ] **Step 4: Implementar la plausibilidad**

Crear `src/lib/valuation/plausibility.ts`:

```ts
import type { AnnualPoint } from "./series";

export type Verdict = "conservadora" | "normal" | "exigente" | "heroica" | "sin-datos";

export type PlausibilityAssessment = {
  /** La exigencia que se está juzgando, en %. */
  requiredValue: number;
  /** Muestra histórica contra la que se compara, ordenada. */
  sample: number[];
  sampleSize: number;
  /** Percentil dentro de la muestra, 0-100. `null` si no hay muestra. */
  percentile: number | null;
  verdict: Verdict;
  /** Frase lista para mostrar, con el tamaño de la muestra incluido. */
  explanation: string;
};

/**
 * CAGR de todas las ventanas móviles de `years` años dentro de la serie.
 *
 * Con diez ejercicios y ventanas de cinco años salen cinco muestras. Es poco, y
 * quien consuma esto tiene la obligación de enseñar `sampleSize` junto al
 * percentil: un percentil sobre cinco observaciones no es lo mismo que sobre
 * cien, y presentarlos igual sería vender precisión que no existe.
 */
export function rollingCagrs(serie: AnnualPoint[], years: number): number[] {
  if (years <= 0) return [];
  const orden = [...serie].sort((a, b) => a.fiscalYear - b.fiscalYear);
  const salida: number[] = [];

  for (let i = 0; i + years < orden.length; i++) {
    const inicio = orden[i].value;
    const fin = orden[i + years].value;
    // Un CAGR entre magnitudes de signo distinto no significa nada.
    if (inicio <= 0 || fin <= 0) continue;
    salida.push((Math.pow(fin / inicio, 1 / years) - 1) * 100);
  }

  return salida.sort((a, b) => a - b);
}

/** Proporción de la muestra que queda por debajo del valor, en %. */
export function percentileOf(sample: number[], value: number): number | null {
  if (sample.length === 0) return null;
  const pordebajo = sample.filter((v) => v < value).length;
  return (pordebajo / sample.length) * 100;
}

const UMBRALES: { max: number; verdict: Verdict; frase: string }[] = [
  { max: 25, verdict: "conservadora", frase: "por debajo de lo que la empresa ha hecho la mayor parte de su historia" },
  { max: 60, verdict: "normal", frase: "dentro de lo que la empresa ha hecho habitualmente" },
  { max: 85, verdict: "exigente", frase: "por encima de la mayoría de su historia" },
  { max: 100.01, verdict: "heroica", frase: "por encima de casi todo lo que la empresa ha conseguido nunca" },
];

export function assessPlausibility(
  requiredValue: number,
  sample: number[],
  magnitud: string,
): PlausibilityAssessment {
  const percentile = percentileOf(sample, requiredValue);

  if (percentile === null) {
    return {
      requiredValue,
      sample: [],
      sampleSize: 0,
      percentile: null,
      verdict: "sin-datos",
      explanation: "No hay histórico suficiente para juzgar si esta exigencia es razonable.",
    };
  }

  const tramo = UMBRALES.find((u) => percentile < u.max) ?? UMBRALES[UMBRALES.length - 1];

  return {
    requiredValue,
    sample,
    sampleSize: sample.length,
    percentile,
    verdict: tramo.verdict,
    explanation:
      `Un ${magnitud} del ${requiredValue.toFixed(1)} % queda ${tramo.frase}: ` +
      `percentil ${Math.round(percentile)} sobre las ${sample.length} ventanas comparables disponibles.`,
  };
}
```

- [ ] **Step 5: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/plausibility.test.ts
```

Esperado: PASS, 9 tests.

- [ ] **Step 6: Añadir un test de integración sobre datos reales**

`src/test/valuation.test.ts` monta un bundle **ficticio** con `createDummyStatement`; aquí hace falta el de verdad. Se construye a partir del fixture de Apple con `normalizeStatement`, igual que hace `src/test/normalize.test.ts`, sin tocar la red ni la caché. Añadir a `src/test/plausibility.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeStatement } from "@/lib/sec/normalize";
import { INCOME_STATEMENT } from "@/lib/sec/taxonomy";
import type { CompanyFacts } from "@/lib/sec/types";
import type { StatementBundle } from "@/lib/sec/statements";

const AAPL: CompanyFacts = JSON.parse(
  readFileSync(join(__dirname, "fixtures/companyfacts-aapl.json"), "utf8"),
);

/** Bundle mínimo: `annualSeries` solo necesita `blocks`. */
const bundle = {
  profile: { cik: "0000320193", name: "Apple Inc." },
  frequency: "annual",
  latestPeriodEnd: null,
  blocks: [
    { id: "income", label: "Cuenta de resultados",
      ...normalizeStatement(AAPL, INCOME_STATEMENT, "annual", 10) },
  ],
} as unknown as StatementBundle;

describe("sobre datos reales de Apple", () => {
  it("extrae la serie anual de ingresos en orden cronológico", () => {
    const serie = annualSeries(bundle, "income", "revenue");
    expect(serie.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < serie.length; i++) {
      expect(serie[i].fiscalYear).toBeGreaterThan(serie[i - 1].fiscalYear);
    }
    expect(serie.every((p) => p.value > 0)).toBe(true);
  });

  it("produce ventanas de cinco años con la historia disponible", () => {
    const c = rollingCagrs(annualSeries(bundle, "income", "revenue"), 5);
    expect(c.length).toBeGreaterThanOrEqual(3);
    // Apple no ha crecido al 100 % anual en ninguna ventana de cinco años.
    expect(Math.max(...c)).toBeLessThan(60);
  });
});
```

- [ ] **Step 7: Suite completa y commit**

```bash
npm test && npx tsc --noEmit && npx eslint src
```

```bash
git add src/lib/valuation/series.ts src/lib/valuation/plausibility.ts src/test/plausibility.test.ts
git commit -m "feat: juicio de plausibilidad de una exigencia contra la historia

Ventanas moviles de CAGR sobre la serie anual normalizada y percentil de la
exigencia dentro de ellas. Declara siempre el tamano de la muestra y dice
'no hay datos suficientes' cuando no la hay, en vez de dar un percentil que
no significa nada.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 1.3: La pantalla de valoración inversa

**Files:**
- Create: `src/components/valuation/reverse-panel.tsx`, `src/app/ticker/[ticker]/reverse/page.tsx`
- Modify: `src/components/company-header.tsx`
- Test: `src/test/reverse-panel.test.tsx`

**Interfaces:**
- Consumes: `solveRequired` (1.1), `assessPlausibility` / `rollingCagrs` / `annualSeries` (1.2), `ValuationMetrics` (0.5, 0.6), `ProvenancePopover` (0.2).

- [ ] **Step 1: Escribir el test que falla**

Crear `src/test/reverse-panel.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RequirementRow } from "@/components/valuation/reverse-panel";

describe("RequirementRow", () => {
  it("muestra la exigencia junto a su veredicto y el tamaño de la muestra", () => {
    render(
      <RequirementRow
        label="Crecimiento de ingresos"
        assessment={{
          requiredValue: 17.4,
          sample: [8, 11, 14, 16, 20],
          sampleSize: 5,
          percentile: 80,
          verdict: "exigente",
          explanation:
            "Un crecimiento de ingresos del 17,4 % queda por encima de la mayoría de su historia: percentil 80 sobre las 5 ventanas comparables disponibles.",
        }}
      />,
    );

    expect(screen.getByText("17,4 %")).toBeDefined();
    expect(screen.getByText("exigente")).toBeDefined();
    expect(screen.getByText(/5 ventanas/)).toBeDefined();
  });

  it("no finge un veredicto cuando no hay histórico", () => {
    render(
      <RequirementRow
        label="Crecimiento de ingresos"
        assessment={{
          requiredValue: 17.4,
          sample: [],
          sampleSize: 0,
          percentile: null,
          verdict: "sin-datos",
          explanation: "No hay histórico suficiente para juzgar si esta exigencia es razonable.",
        }}
      />,
    );

    expect(screen.getByText("sin datos suficientes")).toBeDefined();
    expect(screen.queryByText(/percentil/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/reverse-panel.test.tsx
```

Esperado: FAIL con `Failed to resolve import "@/components/valuation/reverse-panel"`.

- [ ] **Step 3: Implementar la fila de exigencia**

En `src/components/valuation/reverse-panel.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";
import type { PlausibilityAssessment, Verdict } from "@/lib/valuation/plausibility";

const ESTILO_VEREDICTO: Record<Verdict, { texto: string; clase: string }> = {
  conservadora: { texto: "conservadora", clase: "text-emerald-400 border-emerald-800/50 bg-emerald-950/30" },
  normal: { texto: "normal", clase: "text-frost border-gunmetal bg-void-black" },
  exigente: { texto: "exigente", clase: "text-amber-400 border-amber-800/50 bg-amber-950/30" },
  heroica: { texto: "heroica", clase: "text-rose-400 border-rose-800/50 bg-rose-950/30" },
  "sin-datos": { texto: "sin datos suficientes", clase: "text-muted-steel border-gunmetal bg-void-black" },
};

export function RequirementRow({
  label,
  assessment,
}: {
  label: string;
  assessment: PlausibilityAssessment;
}) {
  const estilo = ESTILO_VEREDICTO[assessment.verdict];

  return (
    <div className="border-gunmetal/60 border-b py-4 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-frost text-[14px]">{label}</span>
        <div className="flex items-center gap-3">
          <span className="font-display text-pure-white tabular text-[24px] font-medium tracking-tight">
            {assessment.requiredValue.toFixed(1).replace(".", ",")} %
          </span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
              estilo.clase,
            )}
          >
            {estilo.texto}
          </span>
        </div>
      </div>
      <p className="text-muted-steel mt-1.5 text-[12px] leading-[1.5]">{assessment.explanation}</p>
    </div>
  );
}
```

- [ ] **Step 4: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/reverse-panel.test.tsx
```

Esperado: PASS, 2 tests.

- [ ] **Step 5: Construir el panel completo**

Añadir a `reverse-panel.tsx` el componente `ReversePanel`, cliente, con estado local para los `ReverseInputs`. La disposición, de arriba abajo:

1. **La pregunta, escrita como pregunta.** Un encabezado que diga literalmente: «¿Qué tiene que ocurrir para que {empresa} genere un {retorno} % anual durante los próximos {n} años, comprando hoy a {precio}?». Se recompone al mover los controles. Es el elemento que distingue esta pantalla de un DCF y tiene que leerse antes que ningún número.
2. **Cuatro controles**: retorno objetivo (deslizador 5–25 %), horizonte (3, 5, 10 años), múltiplo de salida (numérico + selector de tipo `PE` / `EV_EBITDA` / `EV_FCF`), variación anual de acciones (deslizador −5 % a +5 %). Cada uno se inicializa desde `metrics.historical*` y muestra la marca `OrigenDelValor` de la Task 0.6.
3. **El desglose de exigencias**, una `RequirementRow` por magnitud: crecimiento de ingresos, ingresos del año terminal, margen operativo, beneficio o FCF del año terminal, acciones al final, capitalización y valor de empresa exigidos. Las tres primeras llevan `assessment`; las demás son cifras con su fórmula, envueltas en `ProvenancePopover` con procedencia `derived`.
4. **Los `caveats` del resultado**, en una lista al pie. Si `solveRequired` devolvió supuestos —deuda neta constante, margen supuesto—, se leen aquí.
5. **Estado vacío**: si `solveRequired` devuelve `null`, un bloque que diga cuál de los tres ingredientes falta (precio, ingresos o acciones) y por qué. Nunca una pantalla con ceros.

Los `assessment` se calculan en el componente de servidor y bajan como props ya resueltos: `rollingCagrs` opera sobre diez ejercicios y no hay ninguna razón para hacerlo en el navegador.

- [ ] **Step 6: Crear la ruta**

Crear `src/app/ticker/[ticker]/reverse/page.tsx`, con la misma estructura que `valuation/page.tsx`: `resolveTicker` → `notFound()`, `Promise.all` de `buildStatements` y `getPriceSeries`, `hasUsableData` con su estado vacío, y `buildValuationMetrics(bundle, precio, fecha)`.

Antes de renderizar el panel, calcular las muestras históricas:

```tsx
import { annualSeries } from "@/lib/valuation/series";
import { rollingCagrs } from "@/lib/valuation/plausibility";

  const muestraCrecimiento = rollingCagrs(annualSeries(bundle, "income", "revenue"), 5);
  const muestraMargen = annualSeries(bundle, "ratios", "operatingMargin").map((p) => p.value)
    .sort((a, b) => a - b);
```

`export const revalidate = 21600;` y `generateMetadata` con título `${ticker} · Valoración inversa`.

- [ ] **Step 7: Añadir la pestaña en la cabecera de empresa**

En `src/components/company-header.tsx`, añadir la entrada `{ href: "/reverse", label: "Valoración inversa" }` a la lista de pestañas, **la primera después del perfil**. Es la pantalla que el usuario tiene que ver antes que la tabla de diez años, no después.

- [ ] **Step 8: Verificar en el navegador**

```bash
npm run dev
```

Con `ALPHAVANTAGE_API_KEY` configurada, abrir `/ticker/AAPL/reverse`. Comprobar que el encabezado se recompone al mover el retorno objetivo, que el crecimiento exigido cambia en dirección correcta al bajar el múltiplo de salida, y que el veredicto se recalcula. Vaciar la clave y comprobar que aparece el estado vacío con la explicación, no una pantalla de ceros.

- [ ] **Step 9: Suite completa y commit**

```bash
npm test && npx tsc --noEmit && npx eslint src
```

```bash
git add src/components/valuation/reverse-panel.tsx src/app/ticker/\[ticker\]/reverse src/components/company-header.tsx src/test/reverse-panel.test.tsx
git commit -m "feat: pantalla de valoracion inversa

Responde a '¿que tiene que ocurrir para que el precio de hoy genere un 12%
anual?' y contrasta cada exigencia contra la historia de la propia empresa,
declarando el tamano de la muestra. Sin cotizacion muestra que falta, no una
pantalla de ceros.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 1.4: Cuentas de usuario y esquema de tesis

Primera vez que Altius guarda algo. Es lo que convierte una herramienta de consulta en un producto al que se vuelve.

**Files:**
- Create: `supabase/migrations/0002_auth_and_thesis.sql`
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`
- Create: `src/app/auth/callback/route.ts`, `src/app/(auth)/entrar/page.tsx`
- Modify: `src/components/site-header.tsx`, `.env.example`, `README.md`
- Test: `src/test/thesis-schema.test.ts`

- [ ] **Step 1: Añadir las dependencias**

```bash
npm install @supabase/supabase-js @supabase/ssr zod
```

`zod` valida la forma del JSONB que vuelve de la base de datos. El contenido de una columna `jsonb` es texto arbitrario desde el punto de vista de TypeScript: sin validación, un `as ScenarioSet` es una mentira que revienta en producción.

- [ ] **Step 2: Escribir la migración**

Crear `supabase/migrations/0002_auth_and_thesis.sql`:

```sql
-- Tesis de inversión: la apuesta del usuario, con fecha y con historia.
--
-- Las revisiones son inmutables por diseño. El requisito es literal: "se puede
-- modificar una hipótesis sin destruir las anteriores". Guardar el conjunto
-- entero de escenarios en cada revisión, en lugar de actualizar filas de
-- hipótesis, hace que la historia sea consultable sin reconstruir nada, y que
-- dentro de dos años se pueda comparar lo que el usuario creía con lo que pasó.

create extension if not exists pgcrypto;

create table public.thesis (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  cik         text not null,
  ticker      text not null,
  title       text not null,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index thesis_user_idx on public.thesis (user_id, updated_at desc);
-- Una tesis viva por empresa y usuario. Las archivadas no cuentan.
create unique index thesis_user_cik_idx on public.thesis (user_id, cik)
  where archived_at is null;

create table public.thesis_revision (
  id         uuid primary key default gen_random_uuid(),
  thesis_id  uuid not null references public.thesis(id) on delete cascade,
  revision   integer not null,
  scenarios  jsonb not null,
  note       text,
  created_at timestamptz not null default now(),
  unique (thesis_id, revision)
);

create index thesis_revision_idx on public.thesis_revision (thesis_id, revision desc);

alter table public.thesis          enable row level security;
alter table public.thesis_revision enable row level security;

create policy "thesis: el dueño lee"       on public.thesis for select using (auth.uid() = user_id);
create policy "thesis: el dueño inserta"   on public.thesis for insert with check (auth.uid() = user_id);
create policy "thesis: el dueño actualiza" on public.thesis for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "thesis: el dueño borra"     on public.thesis for delete using (auth.uid() = user_id);

-- Sin políticas de UPDATE ni DELETE: las revisiones no se tocan nunca.
-- La inmutabilidad la impone la base de datos, no la disciplina del código.
create policy "revision: el dueño lee" on public.thesis_revision for select
  using (exists (select 1 from public.thesis t
                 where t.id = thesis_id and t.user_id = auth.uid()));
create policy "revision: el dueño inserta" on public.thesis_revision for insert
  with check (exists (select 1 from public.thesis t
                      where t.id = thesis_id and t.user_id = auth.uid()));

-- Numera la revisión y toca la tesis en una sola operación.
-- `security invoker` es deliberado: la función se ejecuta con los permisos de
-- quien llama, así que las políticas RLS de arriba siguen aplicando.
create or replace function public.save_thesis_revision(
  p_thesis_id uuid,
  p_scenarios jsonb,
  p_note      text
) returns public.thesis_revision
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_next integer;
  v_row  public.thesis_revision;
begin
  select coalesce(max(revision), 0) + 1 into v_next
  from public.thesis_revision where thesis_id = p_thesis_id;

  insert into public.thesis_revision (thesis_id, revision, scenarios, note)
  values (p_thesis_id, v_next, p_scenarios, p_note)
  returning * into v_row;

  update public.thesis set updated_at = now() where id = p_thesis_id;

  return v_row;
end;
$$;
```

- [ ] **Step 3: Aplicar la migración**

Aplicarla en el proyecto de Supabase, por el editor SQL o por CLI. Después, comprobar que RLS está activo:

```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('thesis', 'thesis_revision');
```

Esperado: `rowsecurity = true` en las dos.

> **Nota para quien ejecute:** las claves de Supabase las introduce el usuario en su panel. `SUPABASE_SERVICE_ROLE_KEY` salta RLS por completo y **no puede** usarse en código que atienda peticiones de usuario: es solo para la caché de la Task 0.4 y para los jobs de la Fase 2. Los clientes de sesión usan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- [ ] **Step 4: Definir y validar la forma de una tesis**

Crear `src/lib/thesis/types.ts`:

```ts
export type AssumptionKey =
  | "revenueGrowth"
  | "grossMargin"
  | "operatingMargin"
  | "fcfMargin"
  | "sharesGrowth"
  | "terminalMultiple"
  | "taxRate";

/**
 * De dónde sale una hipótesis.
 *
 * El requisito es que **cada hipótesis tenga una fuente**. Un número tecleado
 * sin justificación es legítimo, pero se guarda como `user` con su razón
 * escrita, no como si viniera de las cuentas.
 */
export type AssumptionSource =
  | { kind: "sec_fact"; concept: string; accn: string; period: string; url: string }
  | { kind: "filing_text"; accn: string; section: string; quote: string; url: string }
  | { kind: "altius_derived"; formula: string }
  | { kind: "user"; rationale: string };

export type Assumption = {
  key: AssumptionKey;
  value: number;
  unit: "percent" | "x";
  source: AssumptionSource;
};

export type ScenarioKind = "bull" | "base" | "bear";

export type Scenario = {
  kind: ScenarioKind;
  assumptions: Assumption[];
  /** Retorno anual que produce este escenario, en %. Lo calcula Altius, no el usuario. */
  expectedCagr: number | null;
};

export type ScenarioSet = Record<ScenarioKind, Scenario>;

export type Thesis = {
  id: string;
  cik: string;
  ticker: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ThesisRevision = {
  id: string;
  thesisId: string;
  revision: number;
  scenarios: ScenarioSet;
  note: string | null;
  createdAt: string;
};
```

Crear `src/lib/thesis/schema.ts`:

```ts
import { z } from "zod";
import type { ScenarioSet } from "./types";

const fuente = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("sec_fact"),
    concept: z.string().min(1),
    accn: z.string().min(1),
    period: z.string().min(1),
    url: z.string().url(),
  }),
  z.object({
    kind: z.literal("filing_text"),
    accn: z.string().min(1),
    section: z.string().min(1),
    quote: z.string().min(1),
    url: z.string().url(),
  }),
  z.object({ kind: z.literal("altius_derived"), formula: z.string().min(1) }),
  z.object({ kind: z.literal("user"), rationale: z.string() }),
]);

const hipotesis = z.object({
  key: z.enum([
    "revenueGrowth",
    "grossMargin",
    "operatingMargin",
    "fcfMargin",
    "sharesGrowth",
    "terminalMultiple",
    "taxRate",
  ]),
  value: z.number().finite(),
  unit: z.enum(["percent", "x"]),
  source: fuente,
});

const escenario = (kind: "bull" | "base" | "bear") =>
  z.object({
    kind: z.literal(kind),
    assumptions: z.array(hipotesis),
    expectedCagr: z.number().finite().nullable(),
  });

export const scenarioSetSchema = z.object({
  bull: escenario("bull"),
  base: escenario("base"),
  bear: escenario("bear"),
});

/**
 * Valida lo que vuelve de la columna `jsonb`.
 *
 * Desde el punto de vista de TypeScript, `jsonb` es `unknown`. Un `as
 * ScenarioSet` sobre esa columna es una afirmación sin respaldo que revienta la
 * primera vez que cambie la forma guardada, y lo hará en producción y sobre
 * datos que el usuario cree tener a salvo.
 */
export function parseScenarioSet(raw: unknown): ScenarioSet | null {
  const r = scenarioSetSchema.safeParse(raw);
  return r.success ? r.data : null;
}
```

- [ ] **Step 5: Escribir el test del esquema**

Crear `src/test/thesis-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseScenarioSet } from "@/lib/thesis/schema";
import type { ScenarioSet } from "@/lib/thesis/types";

const VALIDO: ScenarioSet = {
  bull: {
    kind: "bull",
    expectedCagr: 18.2,
    assumptions: [
      {
        key: "revenueGrowth",
        value: 22,
        unit: "percent",
        source: { kind: "user", rationale: "Guidance de la compañía más expansión de capacidad." },
      },
    ],
  },
  base: {
    kind: "base",
    expectedCagr: 12.1,
    assumptions: [
      {
        key: "operatingMargin",
        value: 55,
        unit: "percent",
        source: {
          kind: "sec_fact",
          concept: "OperatingIncomeLoss",
          accn: "0001045810-26-000036",
          period: "FY2025",
          url: "https://www.sec.gov/Archives/edgar/data/1045810/000104581026000036/0001045810-26-000036-index.htm",
        },
      },
    ],
  },
  bear: { kind: "bear", expectedCagr: -3.4, assumptions: [] },
};

describe("parseScenarioSet", () => {
  it("acepta un conjunto válido y lo devuelve tipado", () => {
    const r = parseScenarioSet(VALIDO);
    expect(r).not.toBeNull();
    expect(r!.base.assumptions[0].source.kind).toBe("sec_fact");
  });

  it("rechaza un conjunto al que le falta un escenario", () => {
    const { bear, ...sinBear } = VALIDO;
    void bear;
    expect(parseScenarioSet(sinBear)).toBeNull();
  });

  it("rechaza una hipótesis con clave desconocida", () => {
    const malo = structuredClone(VALIDO) as unknown as Record<string, never>;
    (malo as never as ScenarioSet).base.assumptions[0].key = "inventada" as never;
    expect(parseScenarioSet(malo)).toBeNull();
  });

  it("rechaza una fuente sec_fact sin número de acceso", () => {
    const malo = structuredClone(VALIDO);
    (malo.base.assumptions[0].source as { accn: string }).accn = "";
    expect(parseScenarioSet(malo)).toBeNull();
  });

  it("rechaza null, cadenas y arrays sin lanzar", () => {
    expect(parseScenarioSet(null)).toBeNull();
    expect(parseScenarioSet("{}")).toBeNull();
    expect(parseScenarioSet([])).toBeNull();
  });
});
```

- [ ] **Step 6: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/thesis-schema.test.ts
```

Esperado: PASS, 5 tests. Si alguno falla, el fallo está en el esquema, no en el test.

- [ ] **Step 7: Clientes de Supabase y entrada por enlace mágico**

Crear `src/lib/supabase/server.ts` y `src/lib/supabase/client.ts` siguiendo el patrón de `@supabase/ssr` para App Router: `createServerClient` con el adaptador de cookies de `next/headers` en el primero, `createBrowserClient` en el segundo. Ambos leen `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Los nombres exportados, que la Task 1.5 importa literalmente:

```ts
// src/lib/supabase/server.ts
export async function createServerSupabase(): Promise<SupabaseClient> { /* ... */ }

// src/lib/supabase/client.ts
export function createBrowserSupabase(): SupabaseClient { /* ... */ }
```

Crear `src/app/(auth)/entrar/page.tsx`: un formulario de una sola casilla —el email— que llama a `signInWithOtp` con `emailRedirectTo` apuntando a `/auth/callback`. Sin contraseñas: no hay nada que almacenar, nada que filtrar y nada que recuperar.

Crear `src/app/auth/callback/route.ts`: intercambia el `code` de la URL por una sesión con `exchangeCodeForSession` y redirige a `/tesis`.

En `src/components/site-header.tsx`, añadir en el hueco que dejó el selector de tema (Task 0.7) el estado de sesión: «Entrar» si no hay usuario, y el email con enlace a `/tesis` y a cerrar sesión si lo hay.

**Degradación:** sin `NEXT_PUBLIC_SUPABASE_URL`, las rutas de tesis devuelven una página que lo explica y el resto de Altius funciona exactamente igual. La regla de que ninguna clave es obligatoria para arrancar sigue en pie.

- [ ] **Step 8: Verificar el circuito de entrada**

```bash
npm run dev
```

Ir a `/entrar`, pedir el enlace, abrirlo desde el correo y comprobar que aterriza en `/tesis` con sesión. Comprobar en el editor SQL que `auth.users` tiene la fila. Cerrar sesión y comprobar que `/tesis` redirige a `/entrar`.

- [ ] **Step 9: Documentar y hacer commit**

Añadir a `.env.example` y a la tabla del README:

```
# OPCIONAL. Activan las cuentas de usuario y el almacen de tesis.
# Sin ellas, Altius funciona entero salvo las rutas de /tesis.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

```bash
git add supabase/migrations/0002_auth_and_thesis.sql src/lib/supabase src/lib/thesis src/app/auth src/app/\(auth\) src/components/site-header.tsx src/test/thesis-schema.test.ts .env.example README.md package.json package-lock.json
git commit -m "feat: cuentas de usuario y esquema de tesis versionado

Supabase Auth por enlace magico y dos tablas con RLS. Las revisiones son
inmutables por politica: no hay UPDATE ni DELETE, asi que modificar una
hipotesis no puede destruir las anteriores. El JSONB se valida con zod al
leerlo, porque desde TypeScript una columna jsonb es unknown.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 1.5: Repositorio de tesis

**Files:**
- Create: `src/lib/thesis/repository.ts`
- Test: `src/test/thesis-repository.test.ts`

**Interfaces:**
- Consumes: `parseScenarioSet` (1.4), cliente de servidor de Supabase (1.4).
- Produces: `listTheses()`, `getThesis(id)`, `getLatestRevision(thesisId)`, `listRevisions(thesisId)`, `createThesis(input)`, `saveRevision(thesisId, scenarios, note)`. Lo consumen las tareas 1.6 y toda la Fase 4.

- [ ] **Step 1: Escribir el test que falla**

Los tests no tocan la base real: inyectan un cliente falso que devuelve lo que devolvería Postgres. Lo que se prueba aquí es la traducción entre la forma de la base y la del dominio, y qué pasa cuando la base devuelve basura.

Crear `src/test/thesis-repository.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { mapRevision, mapThesis } from "@/lib/thesis/repository";

describe("mapThesis", () => {
  it("traduce las columnas snake_case del esquema al dominio", () => {
    const t = mapThesis({
      id: "11111111-1111-1111-1111-111111111111",
      user_id: "22222222-2222-2222-2222-222222222222",
      cik: "0001045810",
      ticker: "NVDA",
      title: "NVIDIA — el ciclo de centros de datos",
      archived_at: null,
      created_at: "2026-08-20T10:00:00Z",
      updated_at: "2026-08-20T11:30:00Z",
    });

    expect(t).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      cik: "0001045810",
      ticker: "NVDA",
      title: "NVIDIA — el ciclo de centros de datos",
      createdAt: "2026-08-20T10:00:00Z",
      updatedAt: "2026-08-20T11:30:00Z",
    });
    // El user_id no sale del repositorio: RLS ya garantiza que solo llegan las
    // filas del usuario, y arrastrarlo a la interfaz solo invita a filtrarlo.
    expect("userId" in t).toBe(false);
  });
});

describe("mapRevision", () => {
  const ESCENARIOS = {
    bull: { kind: "bull", assumptions: [], expectedCagr: 20 },
    base: { kind: "base", assumptions: [], expectedCagr: 12 },
    bear: { kind: "bear", assumptions: [], expectedCagr: -4 },
  };

  it("valida el JSONB y devuelve la revisión tipada", () => {
    const r = mapRevision({
      id: "33333333-3333-3333-3333-333333333333",
      thesis_id: "11111111-1111-1111-1111-111111111111",
      revision: 3,
      scenarios: ESCENARIOS,
      note: "Recorto el margen tras el 10-Q de julio",
      created_at: "2026-08-20T11:30:00Z",
    });

    expect(r).not.toBeNull();
    expect(r!.revision).toBe(3);
    expect(r!.scenarios.base.expectedCagr).toBe(12);
  });

  it("devuelve null cuando el JSONB guardado no cumple el esquema", () => {
    const r = mapRevision({
      id: "33333333-3333-3333-3333-333333333333",
      thesis_id: "11111111-1111-1111-1111-111111111111",
      revision: 3,
      scenarios: { base: {} },
      note: null,
      created_at: "2026-08-20T11:30:00Z",
    });
    expect(r).toBeNull();
  });
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/thesis-repository.test.ts
```

Esperado: FAIL con `Failed to resolve import "@/lib/thesis/repository"`.

- [ ] **Step 3: Implementar el repositorio**

Crear `src/lib/thesis/repository.ts`. Las funciones de mapeo se exportan aparte para poder probarlas sin base de datos:

```ts
import { parseScenarioSet } from "./schema";
import type { Thesis, ThesisRevision, ScenarioSet } from "./types";
import { createServerSupabase } from "@/lib/supabase/server";

type FilaTesis = {
  id: string;
  user_id: string;
  cik: string;
  ticker: string;
  title: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type FilaRevision = {
  id: string;
  thesis_id: string;
  revision: number;
  scenarios: unknown;
  note: string | null;
  created_at: string;
};

export function mapThesis(f: FilaTesis): Thesis {
  return {
    id: f.id,
    cik: f.cik,
    ticker: f.ticker,
    title: f.title,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  };
}

/** `null` si el JSONB guardado no cumple el esquema vigente. */
export function mapRevision(f: FilaRevision): ThesisRevision | null {
  const scenarios = parseScenarioSet(f.scenarios);
  if (!scenarios) return null;
  return {
    id: f.id,
    thesisId: f.thesis_id,
    revision: f.revision,
    scenarios,
    note: f.note,
    createdAt: f.created_at,
  };
}

export async function listTheses(): Promise<Thesis[]> {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("thesis")
    .select("*")
    .is("archived_at", null)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as FilaTesis[]).map(mapThesis);
}

export async function getThesis(id: string): Promise<Thesis | null> {
  const sb = await createServerSupabase();
  const { data, error } = await sb.from("thesis").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapThesis(data as FilaTesis);
}

export async function listRevisions(thesisId: string): Promise<ThesisRevision[]> {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("thesis_revision")
    .select("*")
    .eq("thesis_id", thesisId)
    .order("revision", { ascending: false });
  if (error || !data) return [];
  // Una revisión con forma antigua se omite en lugar de tumbar el listado: la
  // historia de una tesis es justo lo que no se puede perder.
  return (data as FilaRevision[]).map(mapRevision).filter((r): r is ThesisRevision => r !== null);
}

export async function getLatestRevision(thesisId: string): Promise<ThesisRevision | null> {
  return (await listRevisions(thesisId))[0] ?? null;
}

export async function createThesis(input: {
  cik: string;
  ticker: string;
  title: string;
}): Promise<Thesis | null> {
  const sb = await createServerSupabase();
  const { data: usuario } = await sb.auth.getUser();
  if (!usuario.user) return null;

  const { data, error } = await sb
    .from("thesis")
    .insert({ ...input, user_id: usuario.user.id })
    .select()
    .single();
  if (error || !data) return null;
  return mapThesis(data as FilaTesis);
}

/**
 * Guarda una revisión nueva. Nunca actualiza la anterior.
 *
 * El número de revisión y el `updated_at` de la tesis los pone la función
 * `save_thesis_revision` en la propia base, en una sola operación: calcularlos
 * en el cliente abre una carrera entre dos pestañas del mismo usuario.
 */
export async function saveRevision(
  thesisId: string,
  scenarios: ScenarioSet,
  note: string | null,
): Promise<ThesisRevision | null> {
  const sb = await createServerSupabase();
  const { data, error } = await sb.rpc("save_thesis_revision", {
    p_thesis_id: thesisId,
    p_scenarios: scenarios,
    p_note: note,
  });
  if (error || !data) return null;
  return mapRevision(data as FilaRevision);
}
```

- [ ] **Step 4: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/thesis-repository.test.ts
```

Esperado: PASS, 3 tests.

- [ ] **Step 5: Verificar contra la base real**

Con sesión iniciada, ejecutar desde una Server Action temporal o desde la consola del proyecto una creación y dos guardados, y comprobar en el editor SQL:

```sql
select t.ticker, r.revision, r.created_at, r.note
from thesis t join thesis_revision r on r.thesis_id = t.id
order by r.revision;
```

Esperado: dos filas con `revision` 1 y 2 y la primera **intacta**. Probar además que un `update` directo contra `thesis_revision` desde una sesión de usuario es rechazado por RLS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/thesis/repository.ts src/test/thesis-repository.test.ts
git commit -m "feat: repositorio de tesis con revisiones inmutables

La numeracion de revision y el updated_at los resuelve la base en una sola
operacion, para que dos pestanas del mismo usuario no compitan. Una revision
con forma antigua se omite del listado en vez de tumbarlo.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 1.6: Editor de tesis y conexión con la valoración

Cierra el objetivo 7: **datos, hipótesis y valoración conectados**. Una hipótesis no es un número suelto en un formulario; es una entrada de la valoración inversa, con su fuente, y la valoración se recalcula al cambiarla.

**Files:**
- Create: `src/components/thesis/thesis-editor.tsx`, `src/components/thesis/assumption-row.tsx`, `src/app/tesis/page.tsx`, `src/app/tesis/[id]/page.tsx`, `src/app/tesis/actions.ts`
- Modify: `src/components/valuation/reverse-panel.tsx`
- Test: `src/test/thesis-editor.test.tsx`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/test/thesis-editor.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssumptionRow } from "@/components/thesis/assumption-row";

describe("AssumptionRow", () => {
  it("muestra la cita cuando la hipótesis viene de un hecho de la SEC", () => {
    render(
      <AssumptionRow
        assumption={{
          key: "operatingMargin",
          value: 55,
          unit: "percent",
          source: {
            kind: "sec_fact",
            concept: "OperatingIncomeLoss",
            accn: "0001045810-26-000036",
            period: "FY2025",
            url: "https://www.sec.gov/Archives/edgar/data/1045810/000104581026000036/0001045810-26-000036-index.htm",
          },
        }}
      />,
    );

    expect(screen.getByText("55,0 %")).toBeDefined();
    expect(screen.getByText("OperatingIncomeLoss")).toBeDefined();
    expect(screen.getByRole("link", { name: /EDGAR/i })).toBeDefined();
  });

  it("muestra la razón escrita cuando la hipótesis es del usuario", () => {
    render(
      <AssumptionRow
        assumption={{
          key: "revenueGrowth",
          value: 22,
          unit: "percent",
          source: { kind: "user", rationale: "Guidance de la compañía más expansión de capacidad." },
        }}
      />,
    );

    expect(screen.getByText("Hipótesis del usuario")).toBeDefined();
    expect(
      screen.getByText("Guidance de la compañía más expansión de capacidad."),
    ).toBeDefined();
  });

  it("avisa cuando una hipótesis del usuario no lleva razón escrita", () => {
    render(
      <AssumptionRow
        assumption={{
          key: "revenueGrowth",
          value: 22,
          unit: "percent",
          source: { kind: "user", rationale: "" },
        }}
      />,
    );
    expect(screen.getByText("Sin justificar")).toBeDefined();
  });
});
```

- [ ] **Step 2: Ejecutar el test y comprobar que falla**

```bash
npx vitest run src/test/thesis-editor.test.tsx
```

Esperado: FAIL con `Failed to resolve import "@/components/thesis/assumption-row"`.

- [ ] **Step 3: Implementar `AssumptionRow`**

Crear `src/components/thesis/assumption-row.tsx`. Cada fila muestra: etiqueta legible de la clave, valor formateado con su unidad, y un bloque de fuente que cambia según `source.kind`:

- `sec_fact`: el concepto XBRL en monoespaciada, el periodo, y un enlace «Ver en EDGAR» construido con `edgarFilingUrl` de la Task 0.1.
- `filing_text`: el fragmento citado entre comillas, la sección, y el enlace.
- `altius_derived`: la fórmula, con el mismo estilo que el popover de procedencia.
- `user` con `rationale` no vacía: la razón escrita, bajo el rótulo «Hipótesis del usuario».
- `user` con `rationale` vacía: el aviso «Sin justificar», en ámbar. No lo bloquea, pero se ve.

Las etiquetas legibles van en un mapa exportado:

```ts
export const ETIQUETA_HIPOTESIS: Record<AssumptionKey, string> = {
  revenueGrowth: "Crecimiento de ingresos",
  grossMargin: "Margen bruto",
  operatingMargin: "Margen operativo",
  fcfMargin: "Margen de flujo de caja libre",
  sharesGrowth: "Variación de acciones",
  terminalMultiple: "Múltiplo de salida",
  taxRate: "Tipo impositivo efectivo",
};
```

- [ ] **Step 4: Ejecutar el test y comprobar que pasa**

```bash
npx vitest run src/test/thesis-editor.test.tsx
```

Esperado: PASS, 3 tests.

- [ ] **Step 5: Construir el editor de tesis**

Crear `src/components/thesis/thesis-editor.tsx`, cliente. Tres pestañas —Bull, Base, Bear— sobre el mismo conjunto de hipótesis. Para cada escenario:

- Las siete hipótesis, editables, cada una con su `AssumptionRow` y un desplegable de tipo de fuente.
- El `expectedCagr` del escenario, calculado en vivo con `calculateProjection` de la Task 0.5 sobre las hipótesis del escenario. No lo teclea el usuario: es la consecuencia de sus hipótesis, y esa es la conexión que pide el objetivo 7.
- Un resumen en árbol, en monoespaciada, con la forma que el usuario describió:

```
TESIS: NVIDIA
├── Crecimiento de ingresos   18,0 %
├── Margen bruto              72,0 %
├── Margen operativo          55,0 %
├── Margen FCF                38,0 %
├── Variación de acciones     −2,0 %
├── Múltiplo de salida        25,0x
└── CAGR esperado             14,2 %
```

Un botón «Guardar revisión» con una casilla de nota. Cada guardado llama a la Server Action y crea una revisión nueva; la anterior no se toca.

Una barra lateral con el historial: `listRevisions` en orden descendente, cada entrada con su número, su fecha y su nota. Pinchar una revisión la muestra en modo lectura, junto a un botón «Restaurar en el editor» que la carga como punto de partida **sin borrar nada**: restaurar crea la revisión siguiente.

- [ ] **Step 6: Crear las rutas y la Server Action**

- `src/app/tesis/page.tsx`: listado de `listTheses()`. Sin sesión, redirige a `/entrar`. Sin tesis, un estado vacío que invita a abrir una empresa y crear la primera desde su valoración inversa.
- `src/app/tesis/[id]/page.tsx`: carga la tesis, su última revisión y su historial, y monta el editor. `notFound()` si no existe o no es del usuario —RLS hace que sea lo mismo.
- `src/app/tesis/actions.ts`: dos Server Actions, `crearTesis` y `guardarRevision`, que validan la entrada con `scenarioSetSchema` **antes** de llamar al repositorio y llaman a `revalidatePath` al terminar. Validar en el servidor no es redundante: el cliente puede enviar cualquier cosa.

- [ ] **Step 7: Conectar la valoración inversa con la tesis**

En `reverse-panel.tsx`, añadir el botón que cierra el círculo: **«Guardar esto como tesis»**. Toma los `ReverseInputs` actuales y las exigencias despejadas y crea una tesis cuyo escenario base ya viene relleno:

- Las hipótesis que salen de las cuentas (`assumed: false`) se guardan con fuente `altius_derived` y su fórmula.
- Las que son supuestos por defecto (`assumed: true`) se guardan con fuente `user` y `rationale` vacía, y salen marcadas como «Sin justificar» en el editor. El usuario ve exactamente qué se ha inventado Altius por él.

Si ya existe una tesis viva para ese CIK —el índice único de la Task 1.4 lo garantiza—, el botón dice «Abrir tesis» y lleva a `/tesis/{id}`.

- [ ] **Step 8: Verificar el circuito completo**

```bash
npm run dev
```

1. Entrar con el enlace mágico.
2. Abrir `/ticker/NVDA/reverse`, ajustar el retorno objetivo al 15 %.
3. Pulsar «Guardar esto como tesis» y comprobar que el escenario base llega relleno y que los supuestos vienen marcados como «Sin justificar».
4. Editar el margen operativo del escenario bull, escribir una razón, guardar la revisión.
5. Comprobar que el historial muestra las revisiones 1 y 2, y que abrir la 1 sigue mostrando el valor original.
6. Cerrar sesión, entrar con otro correo, y comprobar que `/tesis` está vacío y que abrir la URL de la tesis ajena devuelve un 404.

El paso 6 es el que verifica RLS de verdad. No darlo por bueno sin hacerlo.

- [ ] **Step 9: Suite completa y commit**

```bash
npm test && npx tsc --noEmit && npx eslint src
```

```bash
git add src/components/thesis src/app/tesis src/components/valuation/reverse-panel.tsx src/test/thesis-editor.test.tsx
git commit -m "feat: editor de tesis con escenarios bull/base/bear y fuente por hipotesis

El CAGR esperado no lo teclea el usuario: sale de sus propias hipotesis, que
es lo que conecta datos, hipotesis y valoracion. Guardar crea una revision
nueva y nunca toca las anteriores. Las hipotesis sin justificar se ven.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Criterio de salida de la Fase 1

- [ ] `npm test`, `npx tsc --noEmit` y `npx eslint src` en verde.
- [ ] `/ticker/{X}/reverse` responde a la pregunta inversa para cualquier empresa con datos, y explica qué falta cuando no los hay.
- [ ] Cada exigencia lleva su veredicto y **el tamaño de la muestra** con el que se ha juzgado.
- [ ] Un usuario puede registrarse por enlace mágico sin contraseña.
- [ ] Una tesis guardada sobrevive al cierre de sesión y se recupera idéntica.
- [ ] Editar una hipótesis crea una revisión nueva; la anterior sigue consultable con su fecha.
- [ ] `update` sobre `thesis_revision` desde una sesión de usuario es rechazado por la base de datos.
- [ ] Un usuario no puede leer la tesis de otro, comprobado con dos cuentas reales.
- [ ] Cada hipótesis muestra de dónde sale, y las que no salen de ningún sitio están marcadas.
- [ ] Sin credenciales de Supabase, todo Altius funciona menos `/tesis`.

---

# Hoja de ruta — Fases 2 a 7

Las fases siguientes están especificadas a nivel de objetivo, entregable y criterio de aceptación. Se detallan en tareas paso a paso cuando llegue su turno: un plan TDD escrito hoy para la Fase 5 estará obsoleto antes de que nadie lo abra, y las decisiones de la Fase 2 cambiarán la forma de la 3.

---

## FASE 2 — El foso de datos

**Duración estimada:** 5–7 semanas.
**Cubre:** objetivos 8 (histórico de valoración y percentiles), 9 (comparación con competidores), 14 (scoring transparente), 19 (comparación temporal). Devuelve además la tabla de líderes que la Task 0.3 retiró.

**El problema.** Todo lo que pide el usuario a partir de aquí necesita datos de **muchas** empresas a la vez: percentiles necesitan la historia de múltiplos, los comparables necesitan el sector, el scoring necesita saber qué es «bueno» en un contexto. Hoy Altius descarga una empresa por petición. Con eso no se puede hacer nada de esto.

**La solución, verificada contra la API real.** El endpoint `frames` de la SEC devuelve **un concepto para todos los emisores en una sola petición**, sin clave. Comprobado el 2026-08-20:

| Petición | Entidades devueltas |
|---|---|
| `us-gaap/Assets/USD/CY2024Q4I` | 6.255 |
| `us-gaap/Revenues/USD/CY2024` | 2.494 |
| `dei/EntityCommonStockSharesOutstanding/shares/CY2025Q1I` | 4.747 |

Que `Revenues` solo devuelva 2.494 de las 6.255 empresas que reportan `Assets` **es el mismo problema de alias que ya resuelve `taxonomy.ts`**: la mayoría etiqueta sus ingresos como `RevenueFromContractWithCustomerExcludingAssessedTax`. El constructor del universo tiene que recorrer los conceptos candidatos de cada línea y fusionarlos, exactamente igual que hace `normalize.ts` periodo a periodo. Es reutilización directa del activo del proyecto.

**Lo que NO se hace:** descargar `companyfacts.zip`. Pesa **1,41 GB** y se regenera a diario. Con `frames` se obtiene lo mismo troceado y sin almacenar nada intermedio.

**Presupuesto del job.** 80 conceptos candidatos distintos en la taxonomía (39 líneas de duración, 21 de instante). Doce ejercicios de historia dan del orden de **900–1.000 peticiones** por reconstrucción completa. A 10 req/s son unos 100 s de tráfico, pero 1–2 GB de descarga: **no cabe en una invocación de 300 s**. Se trocea por ejercicio —una invocación por año, ~80 peticiones cada una— con un cursor persistido para que sea reanudable e idempotente. Cron nocturno en Vercel; reconstrucción incremental diaria, completa semanal.

**Alternativa si `frames` da problemas:** los *Financial Statement Data Sets* de la DERA (`2025q1.zip`, **128 MB**, verificado) traen `num.txt` y `sub.txt` con todos los hechos del trimestre. Mucho más ligero que el bulk completo, pero en formato distinto y con cadencia trimestral. Es el plan B, no el A.

**Esquema nuevo:**

```
company_universe   (cik, ticker, nombre, sic, sector, exchange, actualizado)
company_metrics    (cik, fiscal_year, metrics jsonb, source jsonb, actualizado)
                   PK (cik, fiscal_year)  ·  ~6.300 × 12 ≈ 76.000 filas
universe_job       (id, tipo, cursor, empezado, terminado, error)
```

`source` guarda, por métrica, el concepto y el número de acceso: **la procedencia de la Task 0.1 no se pierde al pasar por el universo.** Si el percentil de un múltiplo no se puede rastrear hasta el hecho que lo produjo, la Fase 3 no puede citarlo.

**Antes de empezar:** confirmar la cuota vigente del plan gratuito de Supabase. Estimación de tamaño: ~76.000 filas con un JSONB de unas 30 métricas ≈ 80–120 MB más índices.

**Entregable:**
- Percentiles históricos reales por múltiplo (PER, EV/EBIT, EV/EBITDA, EV/FCF, FCF Yield, P/S, P/B), sobre la propia historia de la empresa **y** sobre su sector.
- Comparables automáticos por código SIC, con la tabla que pide el objetivo 9.
- Panel de señales del objetivo 7 (Calidad · Balance · Generación de caja · Crecimiento · Valoración · Riesgo de tesis), cada semáforo desmontable hasta la métrica y de ahí hasta el hecho XBRL.
- Scoring del objetivo 14, con cada componente auditable. **Un `Altius Score: 82` sin desglose está explícitamente prohibido por este plan.**
- Comparación temporal del objetivo 19: la misma empresa hoy contra hace diez años.
- Vuelve la tabla de líderes de la portada, esta vez con datos reales.

**Criterio de aceptación:**
- El universo cubre al menos 4.500 emisores con ingresos y balance de los últimos cinco ejercicios.
- La página de una empresa carga sus percentiles en menos de 500 ms sin tocar la SEC.
- Cada semáforo se despliega hasta la métrica, la fórmula y el número de acceso.
- El job es reanudable: matarlo a mitad y relanzarlo produce el mismo estado.
- Ninguna métrica del universo aparece sin fecha de actualización visible.

**Riesgo principal:** la calidad del universo depende de la cobertura de alias de `taxonomy.ts`, afinada contra tres empresas. Sobre 6.000 emisores aparecerán huecos y etiquetas raras. Mitigación: un informe de cobertura por línea (`% de emisores con dato`) que señale qué alias faltan, y la regla de siempre — hueco es hueco, no cero.

---

## FASE 3 — Interpretación con evidencia

**Duración estimada:** 5–7 semanas.
**Cubre:** objetivos 4 (refutar tu tesis), 6 («¿qué ha cambiado?»), 10 (la IA cita todo), 12 («show me the evidence»). No negociables 3, 5 y 6.

Aquí es donde Altius deja de mostrar y empieza a interpretar. Y donde el riesgo de convertirse en «otro chatbot financiero» es máximo, así que la regla es dura: **ninguna afirmación sin cita a documento, sección y fragmento.**

**El refutador de tesis (objetivo 4).** No es una llamada al modelo pidiendo una opinión. Es un procedimiento con datos:

1. Se toma cada hipótesis de la tesis del usuario.
2. Se contrasta contra la distribución histórica de la propia empresa (Fase 1) **y** contra la de sus comparables (Fase 2), con el percentil y el tamaño de muestra.
3. Se busca en el último 10-K y 10-Q texto que la contradiga —guidance, factores de riesgo, comentario de la dirección— y se cita literalmente.
4. Se cuantifica el impacto: «para sostener un CAGR del 15 % necesitas que los ingresos crezcan al menos un 17,4 %».
5. El modelo **solo redacta la síntesis** de lo anterior. No aporta ningún dato que no venga de los pasos 1–4.

**«¿Qué ha cambiado?» (objetivo 6).** Comparación automática entre el último periodo y el anterior, en QoQ, YoY, TTM y a 3/5/10 años, en absoluto y en porcentaje. La detección de lo relevante no es un umbral fijo: un cambio importa cuando mueve el CAGR esperado de **la tesis del usuario**, que es información que Altius tiene desde la Fase 1. Eso es lo que separa esta pantalla de un diff de cifras, y es la parte que hay que construir con más cuidado.

**Citas verificables (objetivo 10).** La infraestructura ya existe: `Provenance` de la Task 0.1 para las cifras, y `filing_text` de la Task 1.4 para el texto. Falta el localizador de fragmentos —dado un texto citado, devolver documento, sección y desplazamiento— y el visor que resalta la cita en el documento original.

**Decir «no sé» (objetivo 11, ya iniciado en la Fase 0).** El prompt obliga a devolver `"insuficiente"` cuando no hay base textual, y la interfaz lo muestra tal cual. Toda salida del modelo se etiqueta `hecho` o `inferencia`. **Una inferencia sin la etiqueta es un fallo de producto, no un matiz de estilo.**

**Criterio de aceptación:**
- Toda afirmación del copiloto es pinchable y lleva al fragmento exacto del documento original.
- Una afirmación sin respaldo textual no se genera: se sustituye por «no disponible».
- Hechos e inferencias se distinguen visualmente sin leer la letra pequeña.
- El refutador produce al menos un contraargumento cuantificado para una tesis con hipótesis por encima del percentil 75.
- «¿Qué ha cambiado?» ordena por impacto sobre el CAGR de la tesis del usuario, no por magnitud del cambio.

**Riesgo principal:** que la exigencia de citas haga la salida del modelo tan pobre que no aporte nada. Mitigación: probarlo con diez empresas reales antes de generalizar, y aceptar que si la cita no existe, la afirmación no se hace. Un producto que dice menos y no miente vale más que uno que dice mucho.

---

## FASE 4 — Recurrencia

**Duración estimada:** 4–5 semanas.
**Cubre:** objetivos 5 (seguimiento automático), 15 (alertas que importan), 21 (móvil útil). No negociable 4.

Es la fase que convierte una herramienta que se usa cuando te acuerdas en una a la que se vuelve. La Fase 2 ya trae un cron nocturno; aquí se le añade la detección de presentaciones nuevas por CIK vigilado y el recálculo de las tesis afectadas.

**La regla de la alerta.** Una notificación de «Apple ha publicado un 10-Q» es ruido y el usuario lo dijo explícitamente. Una alerta solo se dispara cuando el dato nuevo **mueve el CAGR esperado de una tesis guardada** por encima de un umbral que fija el propio usuario. La alerta lleva el número: «tu hipótesis asumía un margen operativo del 55 %; el último trimestre muestra 51,8 %; impacto estimado sobre tu CAGR: −2,1 pp».

Incluye la alerta simétrica del objetivo 15, que es la más valiosa: «la acción ha caído un 18 %, pero tus hipótesis fundamentales apenas han cambiado».

**Móvil (objetivo 21).** El requisito es concreto: quien recibe una alerta tiene que entender en treinta segundos qué ha pasado, en un teléfono. Eso no es «hacer la tabla responsive»: es una vista específica de alerta —qué hipótesis, qué dato nuevo, cuánto impacto, qué hacer— con la tabla de diez años como enlace secundario, no como contenido principal.

**Entregable:** cron de vigilancia, tabla de alertas, preferencias de umbral por usuario, envío por email, vista móvil de alerta, e historial de deterioros por tesis.

**Criterio de aceptación:**
- Un 10-Q nuevo de una empresa con tesis guardada produce alerta en menos de 24 h.
- Un 10-Q que no mueve ninguna hipótesis **no** produce alerta.
- La alerta lleva la cifra vieja, la nueva y el impacto en puntos porcentuales sobre el CAGR.
- La vista móvil de una alerta es legible y accionable en una pantalla de 375 px sin desplazamiento horizontal.

**Riesgo principal:** el email transaccional necesita un proveedor y un dominio verificado, y una alerta mal calibrada quema la confianza para siempre. Empezar con notificación dentro de la aplicación y activar el email solo cuando la calibración esté probada sobre tesis reales.

---

## FASE 5 — El workflow completo

**Duración estimada:** 6–8 semanas.
**Cubre:** objetivos 13 (screening), 16 (portfolio), 17 (diario de decisiones), 22 (exportación e Investment Memo). No negociable 8 (ahorrar horas, no minutos).

**Screening (13).** Es consulta SQL directa contra `company_metrics` de la Fase 2; sin ella no existe. Dos modos: filtros explícitos (`ROIC > 15 %`, `deuda neta < 2× EBITDA`, `PER < 25`) y la consulta cualitativa que pide el usuario —«empresas que parecen baratas respecto a la calidad de su negocio»— traducida a un criterio **explícito y mostrado**: el sistema enseña la consulta que ha ejecutado, siempre. Un screener que no dice por qué ha elegido una empresa es un oráculo, y este producto no vende oráculos.

*Advertencia de alcance:* `insider ownership > 5 %` del ejemplo del usuario no está en el XBRL de `companyfacts`. Sale de los formularios 3, 4 y 5 y del DEF 14A, que son otra fuente y otro parser. Queda fuera de la Fase 5 salvo decisión explícita de abrirla.

**Portfolio (16).** Posiciones introducidas a mano —importar de un bróker es Fase 7—, con exposición por sector, múltiplos agregados, y la métrica que el usuario señaló como la interesante: «el 63 % de tu CAGR esperado depende de cuatro posiciones». Eso se calcula ponderando los `expectedCagr` de las tesis guardadas por el peso de cada posición, y es algo que ningún bróker enseña.

**Diario de decisiones (17).** Cada compra o venta se registra con el precio, la fecha y la tesis vigente en ese momento —que ya está versionada desde la Fase 1, así que la comparación posterior es gratis—. A los dos años se contrasta lo previsto con lo ocurrido y se produce el análisis que el usuario pide: «tus previsiones de crecimiento han sido demasiado optimistas un 23 % de media». Esa cifra es, probablemente, lo más difícil de conseguir en otro sitio.

**Exportación (22).** Investment Memo en PDF y Markdown con tesis, escenarios, valoración, riesgos, datos y **todas las fuentes**. CSV y Excel para las tablas. El memo es el artefacto que un analista independiente enseña a un cliente, y es donde la disciplina de procedencia de la Fase 0 se cobra sola.

**Criterio de aceptación:**
- Una consulta de screening sobre seis criterios responde en menos de un segundo.
- Todo resultado de screening muestra el criterio exacto que lo ha seleccionado.
- El memo exportado no contiene ninguna cifra sin fuente.
- El diario compara previsión contra realidad usando la revisión de tesis vigente en la fecha de la compra, no la última.

---

## FASE 6 — Negocio

**Duración estimada:** continua, a partir de la Fase 5.
**Cubre:** objetivos 18 (backtesting), 23 (Altius Data API), 26 y 27 (disposición a pagar y métricas). No negociables 9 y 10.

**Monetización.** Suscripción con Stripe. Gratis: una empresa a fondo, una tesis. De pago: tesis ilimitadas, alertas, screening, exportación. El corte es deliberado — la tesis persistente y las alertas son exactamente lo que genera el retorno semanal, y por tanto lo que se paga.

**Backtesting (18).** «¿Qué habría pasado si hubiera comprado cuando el FCF Yield superaba el 5 %?». Necesita histórico de precios de todo el universo, que hoy no existe: Alpha Vantage da 25 peticiones al día. **Es la fase que obliga a cambiar de proveedor de precios**, y hay que decidirlo con datos de uso reales, no antes. Cualquier resultado se presenta con la advertencia de que el rendimiento pasado no garantiza el futuro, y sin ninguna proyección de retorno personalizada.

**Altius Data API (23).** Estados normalizados, ratios, histórico de múltiplos, con procedencia y versionado de reexpresiones. Es el foso XBRL monetizado directamente, y solo tiene sentido cuando el universo de la Fase 2 lleve meses estable.

**Métricas (26, 27).** Instrumentar desde el primer usuario de pago: activos semanales, retención a 6 meses, churn, ARPU, MRR, y la única que de verdad importa —cuántos pagan sin que nadie les convenza—. El objetivo declarado del usuario: 1.000 activos, 150 pagando, 25 € de ARPU, 3.750 € de MRR, retención a 6 meses por encima del 60 %.

> **Nota de alcance honesta.** Los objetivos 26 y 27 no son tareas de ingeniería. Este plan puede construir el producto y la instrumentación; no puede producir 150 clientes. Que la Fase 6 esté escrita no significa que la ejecución del plan la cumpla.

---

## FASE 7 — Escala

**Duración estimada:** sin estimar; depende por completo de la Fase 6.
**Cubre:** objetivos 24 (cobertura internacional), 25 (integraciones).

**Internacional (24).** La prueba real de si la arquitectura aguanta. Hoy `taxonomy.ts` mapea conceptos `us-gaap`, y Europa reporta en IFRS con otra taxonomía. La forma de hacerlo sin romper nada es añadir una capa de taxonomía por régimen contable manteniendo el mismo modelo de líneas normalizadas: `LineDef` gana un mapa de conceptos por taxonomía en lugar de una lista. Fuentes: ESEF para la UE, EDINET para Japón, SEDAR+ para Canadá.

**Integraciones (25).** Bróker, importación de cartera, Google Sheets, Excel, Notion, webhooks. El propio usuario lo dijo: **después de demostrar PMF, no antes.** No adelantar esta fase por muy fácil que parezca una de ellas.

---

## Secuencia y dependencias

```
F0 Verdad ────────┬──> F1 Killer feature ──┬──> F3 Interpretación ──> F4 Recurrencia ──┐
                  │    (reverse + tesis)   │                                            │
                  └──> F2 Foso de datos ───┴────────────────────────> F5 Workflow ──────┴──> F6 Negocio ──> F7 Escala
```

- **F0 bloquea todo.** La procedencia de la Task 0.1 es el cimiento de F3 entera.
- **F1 y F2 pueden ir en paralelo** si hay dos personas: no comparten ficheros salvo `taxonomy.ts`, que F2 solo lee.
- **F3 necesita F1 y F2 a la vez**: refutar una tesis exige tener la tesis (F1) y la distribución de comparables (F2).
- **F5 necesita F2** para el screening: sin universo no hay nada que filtrar.
- **F6 obliga a resolver el proveedor de precios** antes del backtesting.

## Los riesgos que más probablemente hagan descarrilar esto

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El universo de la Fase 2 tiene huecos por alias no cubiertos en 6.000 emisores | **Alta** | Informe de cobertura por línea. Hueco es hueco. No estimar. |
| Las citas obligatorias hacen la salida del modelo tan pobre que no aporta | Media | Probar sobre diez empresas antes de generalizar. Decir menos y no mentir. |
| Las alertas se calibran mal y queman la confianza | Media | Empezar dentro de la aplicación, activar el email solo tras calibrar. |
| Alpha Vantage bloquea el backtesting y la cartera | **Alta, ya materializada** | Decidir proveedor en la Fase 6 con datos de uso, no antes. |
| El plan gratuito de Supabase se queda corto | Media | Medir tras la Fase 2. La migración a Pro es un cambio de plan, no de código. |
| Acumular funcionalidades sin que nadie pague | **Alta** | Cobrar al final de la Fase 4, no de la 6: la tesis persistente más las alertas ya son un producto. |

## Lo que este plan deliberadamente no hace

- **No añade features a la portada.** La Fase 0 le quita cosas. Una portada honesta con menos elementos vale más que una vistosa que miente, y el objetivo 20 del usuario apunta en esa dirección.
- **No construye un chatbot.** El copiloto responde con citas o no responde. No hay conversación libre sobre finanzas.
- **No da recomendaciones de inversión.** Altius dice qué tiene que ocurrir para que un precio tenga sentido; no dice si comprar. La frase que el propio usuario propuso como brújula es literalmente el límite del producto.
- **No promete rendimientos.** Ni en el backtesting, ni en las proyecciones, ni en el marketing.
- **No adelanta las integraciones.** Ni siquiera las fáciles.

---

## Cómo ejecutar este plan

Las Fases 0 y 1 están detalladas tarea a tarea y son ejecutables tal cual. El orden dentro de la Fase 0 importa poco salvo en dos puntos: la **Task 0.1 va primero** —todo lo demás la usa— y la **Task 0.7 va después de la 0.3**, porque borrar `market-leaders-table.tsx` reduce el trabajo de sustitución de tokens.

Cada tarea termina con la suite en verde y un commit. Si un test que este plan da por escrito no pasa a la primera, el fallo está en la implementación o en un supuesto de este documento sobre el código existente: **comprobar cuál de los dos antes de tocar el test.** Un test relajado para que pase es una tarea no hecha.

Las cifras esperadas de `src/test/reverse.test.ts` están calculadas y verificadas; si no cuadran, la implementación se ha desviado de la fórmula documentada en la Task 1.1.
