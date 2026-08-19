# Altius MVP — Diseño

**Fecha:** 2026-08-20
**Estado:** Aprobado
**Objetivo:** Terminal de análisis fundamental de acciones (estilo TIKR) construida exclusivamente sobre fuentes públicas, gratuitas y verificables. Usable desde el primer despliegue.

---

## 1. Principio rector: veracidad

Todo dato mostrado debe ser trazable a un documento público. Reglas duras que gobiernan cada decisión de este diseño:

1. **Nunca se inventa un valor.** Si un concepto no existe en el XBRL de la empresa, la celda se muestra vacía (`—`). No hay interpolación, estimación ni relleno.
2. **Lo derivado se marca.** Solo tres magnitudes se calculan: `GrossProfit` (cuando la empresa no lo reporta), `FreeCashFlow` y el trimestre Q4. Las tres llevan indicador visual de "derivado".
3. **Procedencia visible.** Cada bloque de la UI muestra su fuente (SEC EDGAR / FRED / Stooq) y la fecha del dato.
4. **El LLM no habla sin texto delante.** El copiloto solo recibe el texto literal del MD&A extraído del informe; el prompt le prohíbe aportar conocimiento externo.

---

## 2. Stack

| Capa | Elección | Motivo |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Server Components permiten normalizar XBRL en servidor sin enviar 30 MB al cliente |
| Estilos | Tailwind + shadcn/ui, base `slate`, dark por defecto | Densidad informativa con componentes accesibles |
| Gráficos | Recharts | Series temporales, buena integración con React 19 |
| Animación | Framer Motion | Micro-interacciones en carga y transición de tablas |
| LLM | Google Gemini `gemini-2.5-pro` por REST | Contexto de 1M tokens, nivel gratuito, sin dependencia de SDK |
| Tests | Vitest | Rápido, TS nativo |
| Caché | Interfaz `CacheStore` + adaptador filesystem | Supabase no disponible aún; el adaptador Postgres queda escrito |

---

## 3. Fuentes de datos

### 3.1 SEC EDGAR (fundamentales)

| Endpoint | Uso |
|---|---|
| `www.sec.gov/files/company_tickers.json` | Índice ticker → CIK + razón social. Base del buscador |
| `data.sec.gov/submissions/CIK##########.json` | Perfil: nombre, SIC, descripción de industria, exchange, historial de presentaciones |
| `data.sec.gov/api/xbrl/companyfacts/CIK##########.json` | Todos los hechos XBRL históricos de la empresa |
| `www.sec.gov/Archives/edgar/data/{cik}/{accn}/{doc}` | Documento HTML del 10-K para extraer el MD&A |

**Requisitos operativos no negociables:**

- Cabecera `User-Agent` con nombre y email de contacto reales. Sin ella la SEC devuelve **403**. Es la causa más común de que estos proyectos funcionen en local y fallen en producción.
- Límite de **10 peticiones por segundo**. El cliente incorpora rate-limiter y backoff exponencial.
- El CIK debe ir **rellenado a 10 dígitos con ceros** en las rutas del API, y **sin ceros a la izquierda** en las rutas de `Archives`.

### 3.2 FRED (macro)

Camino principal: `fred.stlouisfed.org/graph/fredgraph.csv?id={SERIE}` — CSV completo, **sin API key ni registro**. Esto permite que `/macro` funcione el día 1 con cero configuración.

Si existe `FRED_API_KEY` en el entorno, el cliente conmuta automáticamente al API JSON oficial (`api.stlouisfed.org/fred/series/observations`).

Series del MVP:

| Métrica | Serie | Transformación |
|---|---|---|
| Inflación | `CPIAUCSL` | Índice + variación interanual calculada |
| Tipos de interés FED | `FEDFUNDS` | Tal cual (%) |
| Desempleo | `UNRATE` | Tal cual (%) |

### 3.3 Stooq (precio EOD)

`stooq.com/q/d/l/?s={ticker}.us&i=d` → CSV `Date,Open,High,Low,Close,Volume`. Sin key, sin registro.

El SEC no publica precios; esta es la fuente pública gratuita con menor fricción de despliegue. Limitación aceptada y documentada: cobertura fuera de EE. UU./Europa más débil y sin SLA. La UI degrada con elegancia si la serie no está disponible — el resto del perfil sigue funcionando.

### 3.4 Google Gemini (copiloto MD&A)

`gemini-2.5-pro` vía REST `generativelanguage.googleapis.com/v1beta`. Ventana de contexto de 1M tokens, muy holgada para un MD&A completo (30–80k tokens típicos), y nivel gratuito generoso en Google AI Studio.

**Decisión de implementación:** se invoca por `fetch` contra el endpoint REST, sin SDK. El contrato `v1beta` es estable y documentado, mientras que los SDK de Google han cambiado de nombre y de forma varias veces (`@google/generative-ai` → `@google/genai`). Cero dependencias que se rompan, y el proveedor queda tras una interfaz de una sola función por si más adelante quieres cambiar de modelo.

Sin `GEMINI_API_KEY` el sistema degrada a un resumen extractivo determinista, nunca a texto generado sin fuente.

---

## 4. El motor de normalización XBRL

Es el componente crítico del producto. Vive en `src/lib/sec/normalize.ts` y `src/lib/sec/taxonomy.ts`.

### 4.1 Estructura del origen

`companyfacts` devuelve un árbol `facts → taxonomía (us-gaap|dei) → concepto → units → [hechos]`. Cada hecho:

```json
{"start":"2019-09-29","end":"2020-09-26","val":274515000000,
 "accn":"0000320193-20-000096","fy":2020,"fp":"FY",
 "form":"10-K","filed":"2020-10-30","frame":"CY2020"}
```

### 4.2 Los cinco problemas y sus soluciones

**Problema 1 — Reexpresiones.** El mismo periodo aparece múltiples veces con distinto `accn`: presentación original, enmienda 10-K/A, y valores reexpresados en informes posteriores.
*Solución:* agrupar por clave `(concepto, unidad, start, end)` y quedarse con el hecho de `filed` más reciente. Es el valor vigente según la propia empresa.

**Problema 2 — Duración frente a instante.** Las partidas de Pérdidas y Ganancias y Flujo de Caja son flujos y traen `start` y `end`. Las del Balance son fotografías y solo traen `end`.
*Solución:* dos rutas de extracción independientes. Nunca se mezclan, y la taxonomía declara el tipo de cada línea.

**Problema 3 — Los 10-Q contienen acumulados.** El 10-Q del tercer trimestre incluye el dato de nueve meses además del trimestral. Filtrar por `form` no basta.
*Solución:* filtrar por **longitud de la duración en días**. 80–100 días = trimestre. 350–380 días = ejercicio anual. Todo lo demás se descarta.

**Problema 4 — El cuarto trimestre no existe.** Ninguna empresa presenta un 10-Q de Q4; ese periodo solo aparece embebido en el anual.
*Solución:* derivar `Q4 = FY − (Q1 + Q2 + Q3)`, únicamente para partidas de flujo y solo cuando los cuatro componentes están presentes. Se marca visualmente como derivado y jamás se presenta como reportado. Las partidas de balance de Q4 sí son reportadas (instante de cierre) y se toman directamente.

**Problema 5 — Convención de signos.** `PaymentsToAcquirePropertyPlantAndEquipment` se reporta en positivo pero representa una salida de caja.
*Solución:* flag `negate` por línea en la taxonomía, aplicado en la capa de presentación.

### 4.3 Resolución de alias

Cada línea de Altius declara una **lista ordenada de conceptos candidatos**. Se toma el primero que produzca datos. Ejemplos representativos:

| Línea Altius | Cadena de candidatos |
|---|---|
| Ingresos | `RevenueFromContractWithCustomerExcludingAssessedTax` → `Revenues` → `SalesRevenueNet` → `RevenueFromContractWithCustomerIncludingAssessedTax` → `SalesRevenueGoodsNet` |
| Coste de ventas | `CostOfRevenue` → `CostOfGoodsAndServicesSold` → `CostOfGoodsSold` → `CostOfServices` |
| Resultado de explotación | `OperatingIncomeLoss` |
| Resultado neto | `NetIncomeLoss` → `ProfitLoss` → `NetIncomeLossAvailableToCommonStockholdersBasic` |
| Efectivo | `CashAndCashEquivalentsAtCarryingValue` → `CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents` |
| Patrimonio neto | `StockholdersEquity` → `StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest` |
| Flujo de caja de explotación | `NetCashProvidedByUsedInOperatingActivities` → `NetCashProvidedByUsedInOperatingActivitiesContinuingOperations` |
| CapEx | `PaymentsToAcquirePropertyPlantAndEquipment` → `PaymentsToAcquireProductiveAssets` |

Esta cadena es exactamente lo que hace que AAPL, TSLA y JNJ se rendericen en la misma tabla pese a etiquetar distinto: AAPL migró de `SalesRevenueNet` a `RevenueFromContractWithCustomer...`, TSLA usó `Revenues` en sus primeros ejercicios, JNJ viene de `SalesRevenueGoodsNet`.

---

## 5. Extracción del MD&A

1. Leer `submissions` y localizar la presentación de tipo `10-K` más reciente.
2. Construir la URL del documento principal y descargarlo.
3. Convertir HTML a texto plano preservando saltos de párrafo.
4. Aislar la sección: desde el encabezado `Item 7. Management's Discussion and Analysis` hasta `Item 7A.`.
   **Trampa conocida:** ese texto aparece también en el índice del documento. Se seleccionan todas las coincidencias candidatas y se toma **el intervalo más largo**, que corresponde siempre al cuerpo y nunca a la línea del índice.
5. Truncar a un tope de seguridad y enviar al modelo con un prompt que ancla la respuesta al texto suministrado.
6. Salida estructurada en tres bloques: **impulsores de ingresos**, **riesgos operativos**, **tono de la directiva**.

---

## 6. Arquitectura de caché

Interfaz única `CacheStore` con `get(key)` / `set(key, value, ttl)`.

- **Adaptador filesystem** (activo): escribe en `.cache/` en local y en `/tmp/altius-cache/` cuando detecta entorno serverless.
  **Matiz importante:** en Vercel el sistema de ficheros es de solo lectura salvo `/tmp`, y ese `/tmp` es efímero y no se comparte entre invocaciones concurrentes. Por tanto en producción este adaptador es una caché oportunista de instancia, no una caché compartida: reduce latencia en peticiones sucesivas que caen en la misma instancia caliente, pero no garantiza aciertos. La caché compartida real llega con el adaptador Supabase. Para mitigarlo, las rutas usan además `revalidate` de Next.js, que sí es una caché compartida gestionada por la plataforma.
- **Adaptador Supabase** (escrito, inactivo): tablas `sec_submissions_cache` y `sec_company_facts_cache`. Migración SQL incluida en `supabase/migrations/0001_cache_tables.sql`.

La conmutación es una variable de entorno. Ningún consumidor del caché conoce el adaptador.

TTL por tipo de dato: índice de tickers 24 h, submissions 12 h, companyfacts 12 h, precios 6 h, macro 24 h, resúmenes MD&A 30 días (el informe no cambia).

---

## 7. Alcance funcional

| Módulo | Ruta | Contenido |
|---|---|---|
| Buscador global | Cmd+K, disponible en toda la app | Autocompletado sobre ticker y razón social |
| Perfil | `/ticker/[ticker]` | Nombre, sector, industria, descripción, gráfico de precio EOD |
| Terminal financiera | `/ticker/[ticker]/financials` | P&G, Balance, Flujo de Caja. Mínimo 5 ejercicios anuales y 4 trimestres. Conmutador Anual/Trimestral |
| Copiloto | `/ticker/[ticker]/ai` | Resumen del MD&A en tres bloques |
| Macro | `/macro` | CPI, tipos FED, desempleo |

---

## 8. Manejo de errores

Cada fuente falla de forma independiente y ninguna tumba la página:

- **Ticker inexistente** → `not-found.tsx` con sugerencias del índice.
- **403 del SEC** → mensaje explícito señalando el `User-Agent` como causa, no un error genérico.
- **Empresa sin XBRL** (extranjeras que presentan 20-F, o registros muy antiguos) → aviso claro de que no hay datos estructurados disponibles.
- **Stooq caído o sin cobertura** → el perfil se renderiza sin gráfico de precio.
- **Sin `GEMINI_API_KEY`** → resumen extractivo, con aviso explícito de que no está generado por IA.
- **Cuota de Gemini agotada (429)** → degrada al resumen extractivo en lugar de romper la página.

---

## 9. Estrategia de pruebas

Desarrollo dirigido por tests en el motor de normalización, que es donde un error es invisible y caro.

- `normalize.test.ts` — fixtures reales recortados de `companyfacts` de **AAPL, TSLA y JNJ**. Verifica: resolución de alias entre las tres, deduplicación por reexpresión, separación duración/instante, descarte de acumulados de 10-Q, derivación de Q4, aplicación de signos.
- `taxonomy.test.ts` — integridad del mapa: sin líneas huérfanas, sin conceptos duplicados entre estados.
- `mdna.test.ts` — extracción del Item 7 sobre HTML real de un 10-K, incluyendo el caso del índice.
- `format.test.ts` — escalado a millones, porcentajes, negativos entre paréntesis, valor ausente.

Verificación visual con el navegador integrado en escritorio y móvil antes de dar por cerrado el MVP.

---

## 10. Orden de construcción

1. Scaffold Next.js + Tailwind + shadcn con tema oscuro
2. Capa SEC: cliente, tickers, submissions, companyfacts
3. `taxonomy.ts` y `normalize.ts` **con los tests escritos primero**
4. Terminal de estados financieros
5. Buscador Cmd+K, perfil de empresa y gráfico de precio
6. Panel macro
7. Copiloto MD&A
8. Verificación visual escritorio + móvil
9. Preparación para despliegue en Vercel

---

## 11. Configuración requerida

| Variable | Obligatoria | Para qué |
|---|---|---|
| `SEC_USER_AGENT` | **Sí, antes de desplegar** | Nombre y email real. Sin ella la SEC devuelve 403 |
| `GEMINI_API_KEY` | Solo para el copiloto | Resumen del MD&A. Se obtiene gratis en aistudio.google.com/apikey |
| `FRED_API_KEY` | No | Conmuta al API JSON; sin ella se usa el CSV público |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | No | Activa el adaptador Postgres de caché |

---

## 12. Fuera de alcance del MVP

Autenticación de usuarios, carteras, comparador entre empresas, ratios de valoración calculados, pantalla de screening, alertas, empresas no estadounidenses (20-F/40-F), y datos intradía.
