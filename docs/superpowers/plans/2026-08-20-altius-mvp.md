# Altius MVP — Plan de Implementación

> **Para trabajadores agénticos:** SUB-SKILL REQUERIDO: usar `superpowers:subagent-driven-development` o `superpowers:executing-plans` para implementar tarea a tarea. Los pasos usan casillas (`- [ ]`).

**Goal:** Terminal de análisis fundamental de acciones sobre SEC EDGAR, FRED y Stooq, con copiloto de MD&A vía Gemini, desplegable en Vercel.

**Architecture:** Next.js App Router. Los datos crudos (XBRL de 30 MB, HTML de 10-K de 10 MB) se descargan y normalizan **siempre en servidor**; al cliente solo viajan estructuras ya reducidas. Una interfaz `CacheStore` aísla el almacenamiento: adaptador filesystem hoy, Supabase el día que haya credenciales. Cada fuente externa falla de forma independiente sin tumbar la página.

**Tech Stack:** Next.js (App Router) · TypeScript estricto · Tailwind · shadcn/ui (base slate, dark) · Recharts · Framer Motion · Vitest · Gemini `gemini-2.5-pro` vía REST.

## Global Constraints

- **Toda petición a `sec.gov` o `data.sec.gov` debe llevar cabecera `User-Agent`** con nombre y email de contacto. Sin ella la SEC responde 403.
- **Límite de 10 req/s contra la SEC.** El cliente serializa mediante rate-limiter; ningún módulo llama a `fetch` contra la SEC directamente.
- **CIK a 10 dígitos con ceros** en rutas de `data.sec.gov/api` y `data.sec.gov/submissions`; **sin ceros a la izquierda** en rutas de `www.sec.gov/Archives`.
- **Nunca inventar un valor.** Concepto ausente → celda vacía. Solo `GrossProfit`, `FreeCashFlow` y Q4 son derivados, y van marcados.
- **Ninguna clave de API es obligatoria para arrancar.** SEC, FRED y Stooq funcionan sin credenciales. Solo el copiloto requiere `GEMINI_API_KEY`, y sin ella degrada a resumen extractivo.
- TypeScript en modo `strict`. Sin `any` en las firmas públicas de `src/lib`.

---

## Estructura de ficheros

| Fichero | Responsabilidad |
|---|---|
| `src/lib/cache/store.ts` | Interfaz `CacheStore` y selección de adaptador |
| `src/lib/cache/fs-store.ts` | Adaptador filesystem (`.cache/` local, `/tmp/altius-cache/` en serverless) |
| `src/lib/cache/supabase-store.ts` | Adaptador Postgres, inactivo hasta que existan credenciales |
| `src/lib/sec/client.ts` | Único punto de salida HTTP hacia la SEC: User-Agent, rate-limit, backoff |
| `src/lib/sec/types.ts` | Tipos compartidos de la capa SEC |
| `src/lib/sec/tickers.ts` | Índice ticker→CIK y búsqueda difusa |
| `src/lib/sec/submissions.ts` | Perfil de empresa y localización de informes |
| `src/lib/sec/company-facts.ts` | Descarga cacheada de `companyfacts` |
| `src/lib/sec/taxonomy.ts` | Mapa declarativo línea Altius → conceptos XBRL candidatos |
| `src/lib/sec/normalize.ts` | Motor: dedupe, duración/instante, filtro de acumulados, Q4 derivado |
| `src/lib/sec/statements.ts` | Ensamblado de los tres estados a partir del motor |
| `src/lib/sec/mdna.ts` | Localización del 10-K, HTML→texto, aislamiento del Item 7 |
| `src/lib/fred/client.ts` | CSV público sin clave; conmuta a JSON si hay `FRED_API_KEY` |
| `src/lib/prices/stooq.ts` | CSV EOD → serie tipada |
| `src/lib/ai/gemini.ts` | Cliente REST de Gemini con degradación |
| `src/lib/ai/prompts.ts` | Prompt anclado al texto, salida JSON estructurada |
| `src/lib/format.ts` | Escalado, porcentajes, negativos entre paréntesis, ausencia |
| `src/components/financial-table.tsx` | Tabla densa con primera columna fija |
| `src/components/command-palette.tsx` | Cmd+K global |

---

### Task 1: Scaffold y tema

**Files:** `package.json`, `tsconfig.json`, `vitest.config.ts`, `components.json`, `src/app/{layout,page,globals.css}`, `.env.example`, `.gitignore`

**Produces:** proyecto que compila; `npm test` ejecutable; utilidad `cn` en `src/lib/utils.ts`.

- [ ] **Step 1:** `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --yes`
- [ ] **Step 2:** Instalar `vitest @vitejs/plugin-react jsdom recharts framer-motion lucide-react cmdk`
- [ ] **Step 3:** `npx shadcn@latest init` con base **slate**; añadir `button card table tabs dialog command skeleton badge tooltip separator select scroll-area`
- [ ] **Step 4:** Forzar tema oscuro en `layout.tsx` (`<html className="dark">`) y fijar tokens en `globals.css`
- [ ] **Step 5:** Crear `.env.example` con `SEC_USER_AGENT`, `GEMINI_API_KEY`, `FRED_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **Step 6:** `npm run build` debe pasar. Commit.

---

### Task 2: Caché y cliente SEC

**Files:** Create `src/lib/cache/{store,fs-store,supabase-store}.ts`, `src/lib/sec/{client,types}.ts`. Test `src/test/cache.test.ts`.

**Interfaces — Produces:**
```ts
interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}
function getCacheStore(): CacheStore;
function secFetchJson<T>(url: string, ttlSeconds: number): Promise<T>;
function secFetchText(url: string, ttlSeconds: number): Promise<string>;
function padCik(cik: string | number): string;   // 320193 -> "0000320193"
function trimCik(cik: string | number): string;  // "0000320193" -> "320193"
```

- [ ] **Step 1:** Test: `set` seguido de `get` devuelve el valor; pasado el TTL devuelve `null`; clave inexistente devuelve `null`; clave con `/` no rompe el fichero.
- [ ] **Step 2:** Ejecutar `npx vitest run src/test/cache.test.ts` → debe fallar por módulo inexistente.
- [ ] **Step 3:** Implementar `fs-store.ts`: hash SHA-1 de la clave como nombre de fichero, JSON `{expiresAt, value}`, directorio `/tmp/altius-cache` si `process.env.VERCEL`, `.cache` si no. Fallos de escritura se tragan (la caché nunca debe romper una petición).
- [ ] **Step 4:** Implementar `client.ts`: cola con ventana deslizante de 10 req/s, cabeceras `User-Agent` (desde `SEC_USER_AGENT`, con aviso en consola si falta) y `Accept-Encoding: gzip`. Reintentos con backoff en 429/503. Mensaje de error explícito si 403 menciona el User-Agent.
- [ ] **Step 5:** Tests en verde. Commit.

---

### Task 3: Índice de tickers y búsqueda

**Files:** Create `src/lib/sec/tickers.ts`, `src/app/api/search/route.ts`. Test `src/test/tickers.test.ts`.

**Consumes:** `secFetchJson`, `padCik`.
**Produces:** `searchTickers(query: string, limit?: number): Promise<TickerHit[]>` donde `TickerHit = { ticker: string; cik: string; name: string }`; `resolveTicker(ticker: string): Promise<TickerHit | null>`.

- [ ] **Step 1:** Test con fixture del formato real de `company_tickers.json` (objeto indexado por número, cada valor `{cik_str, ticker, title}`): buscar `"AAPL"` devuelve Apple primero; buscar `"apple"` lo encuentra por nombre; coincidencia exacta de ticker gana a la parcial; query vacía devuelve lista vacía.
- [ ] **Step 2:** Ejecutar → falla.
- [ ] **Step 3:** Implementar: normalizar el objeto a array, puntuar (exacto ticker 100, prefijo ticker 50, prefijo nombre 25, subcadena nombre 10), ordenar y truncar. Cachear el índice 24 h.
- [ ] **Step 4:** Ruta `GET /api/search?q=` devolviendo los hits.
- [ ] **Step 5:** Tests en verde. Commit.

---

### Task 4: Perfil de empresa

**Files:** Create `src/lib/sec/submissions.ts`. Test `src/test/submissions.test.ts`.

**Consumes:** `secFetchJson`, `padCik`, `trimCik`.
**Produces:**
```ts
type CompanyProfile = {
  cik: string; name: string; tickers: string[]; exchanges: string[];
  sic: string; sicDescription: string; sector: string;
  fiscalYearEnd: string | null; website: string | null;
  address: string | null; employeesAsOf: string | null;
};
type FilingRef = { form: string; accessionNumber: string; filingDate: string;
                   primaryDocument: string; reportDate: string; documentUrl: string };
function getCompanyProfile(cik: string): Promise<CompanyProfile>;
function findLatestFiling(cik: string, forms: string[]): Promise<FilingRef | null>;
```

- [ ] **Step 1:** Test: mapea `sicDescription` a industria y el prefijo SIC a sector (código 3xxx → Manufacturing, 6xxx → Finance, 7372 → Technology, etc.); `findLatestFiling` con `["10-K"]` devuelve el de `filingDate` mayor e ignora `10-Q`; construye `documentUrl` **sin ceros a la izquierda** en el CIK y **sin guiones** en el accession number.
- [ ] **Step 2:** Ejecutar → falla.
- [ ] **Step 3:** Implementar. `filings.recent` viene como arrays paralelos, no como array de objetos: hay que transponerlos.
- [ ] **Step 4:** Tests en verde. Commit.

---

### Task 5: Taxonomía y motor de normalización  ← núcleo del producto

**Files:** Create `src/lib/sec/taxonomy.ts`, `src/lib/sec/normalize.ts`, `src/lib/sec/company-facts.ts`. Test `src/test/normalize.test.ts`, `src/test/taxonomy.test.ts`, fixtures en `src/test/fixtures/`.

**Consumes:** `secFetchJson`, `padCik`.
**Produces:**
```ts
type LineKind = 'duration' | 'instant';
type LineDef = { id: string; label: string; concepts: string[]; kind: LineKind;
                 unit: 'USD' | 'shares' | 'USD/shares' | 'pure';
                 negate?: boolean; emphasis?: 'total' | 'subtotal'; indent?: number };
type PeriodKey = string;               // "FY2024" | "Q3-2024"
type Period = { key: PeriodKey; label: string; end: string;
                fiscalYear: number; fiscalPeriod: string; derived: boolean };
type LineSeries = { line: LineDef; values: Record<PeriodKey, number | null>;
                    derivedAt: PeriodKey[] };
function normalizeStatement(facts: CompanyFacts, lines: LineDef[],
                            freq: 'annual' | 'quarterly'): { periods: Period[]; rows: LineSeries[] };
function getCompanyFacts(cik: string): Promise<CompanyFacts>;
```

- [ ] **Step 1: Escribir los tests primero.** Fixtures recortados de `companyfacts` reales de **AAPL, TSLA y JNJ**. Casos obligatorios:
  - **Alias:** las tres empresas producen fila de Ingresos no vacía pese a usar conceptos distintos (`RevenueFromContractWithCustomerExcludingAssessedTax` / `Revenues` / `SalesRevenueGoodsNet`).
  - **Reexpresión:** dos hechos con mismo `(concepto, unidad, start, end)` y distinto `filed` → gana el `filed` más reciente.
  - **Duración vs instante:** una línea `instant` ignora hechos con `start`; una `duration` ignora hechos sin `start`.
  - **Acumulados de 10-Q:** un hecho de 273 días dentro de un 10-Q no aparece en la vista trimestral.
  - **Q4 derivado:** con FY y Q1–Q3 presentes, Q4 aparece con el valor de la resta y figura en `derivedAt`. Si falta Q2, Q4 **no** se genera.
  - **Signos:** una línea con `negate: true` invierte el valor.
  - **Ausencia:** concepto inexistente → `null`, nunca `0`.
- [ ] **Step 2:** Ejecutar `npx vitest run src/test/normalize.test.ts` → todo en rojo.
- [ ] **Step 3:** Implementar `taxonomy.ts` con las tres listas de líneas (P&G, Balance, Flujo de Caja) y sus cadenas de conceptos candidatos.
- [ ] **Step 4:** Implementar `normalize.ts`: recolectar hechos de todos los conceptos candidatos, deduplicar por `filed`, clasificar periodos por longitud de duración (350–380 anual, 80–100 trimestral), ordenar descendente por `end`, derivar Q4.
- [ ] **Step 5:** `npx vitest run` en verde. Commit.

---

### Task 6: Ensamblado de estados y formato

**Files:** Create `src/lib/sec/statements.ts`, `src/lib/format.ts`, `src/app/api/financials/[cik]/route.ts`. Test `src/test/format.test.ts`.

**Produces:** `buildStatements(cik, freq): Promise<{ income; balance; cashflow }>`; `formatValue(v: number | null, unit, scale): string`.

- [ ] **Step 1:** Test de formato: `1234567890` → `1.234,57` en escala millones; negativo → `(1.234)`; `null` → `—`; unidad `pure` sin escalar; `USD/shares` con dos decimales.
- [ ] **Step 2:** Ejecutar → falla. **Step 3:** Implementar. **Step 4:** Verde. Commit.

---

### Task 7: Terminal de estados financieros

**Files:** Create `src/components/{financial-table,statement-tabs,data-source-badge,company-header}.tsx`, `src/app/ticker/[ticker]/{layout,page,loading,error,not-found}.tsx`, `src/app/ticker/[ticker]/financials/{page,loading}.tsx`.

- [ ] **Step 1:** `financial-table.tsx`: primera columna fija (`sticky left-0`), filas alternas sutiles, totales en negrita con borde superior, números tabulares alineados a la derecha, indicador de celda derivada.
- [ ] **Step 2:** `statement-tabs.tsx`: tres pestañas de estado + conmutador Anual/Trimestral, con transición de Framer Motion.
- [ ] **Step 3:** Skeleton denso en `loading.tsx` que reproduzca la retícula de la tabla.
- [ ] **Step 4:** `npm run build` pasa. Commit.

---

### Task 8: Buscador Cmd+K, perfil y precio

**Files:** Create `src/components/{command-palette,price-chart}.tsx`, `src/lib/prices/stooq.ts`, `src/app/api/prices/[ticker]/route.ts`. Test `src/test/stooq.test.ts`.

**Produces:** `getDailyPrices(ticker: string): Promise<PricePoint[] | null>` con `PricePoint = { date: string; close: number }`.

- [ ] **Step 1:** Test: parsea CSV `Date,Open,High,Low,Close,Volume`; ignora cabecera; descarta filas con `N/D`; respuesta `"No data"` de Stooq → `null` (no excepción).
- [ ] **Step 2:** Ejecutar → falla. **Step 3:** Implementar.
- [ ] **Step 4:** `command-palette.tsx` con `cmdk`, atajo `Cmd+K`/`Ctrl+K`, consulta con debounce a `/api/search`, navegación a `/ticker/{ticker}`.
- [ ] **Step 5:** Página de perfil con cabecera, descripción y `price-chart.tsx` (Recharts, degradado, selector 1A/5A/Máx). Si `getDailyPrices` devuelve `null`, se renderiza un aviso en lugar del gráfico.
- [ ] **Step 6:** Verde y build. Commit.

---

### Task 9: Panel macro

**Files:** Create `src/lib/fred/client.ts`, `src/components/macro-chart.tsx`, `src/app/macro/{page,loading}.tsx`, `src/app/api/macro/route.ts`. Test `src/test/fred.test.ts`.

**Produces:** `getFredSeries(id: string): Promise<FredPoint[]>`; `yoyChange(points: FredPoint[]): FredPoint[]`.

- [ ] **Step 1:** Test: parsea CSV de `fredgraph` (`observation_date,SERIES`); filas con `.` (dato ausente en FRED) se descartan; `yoyChange` sobre 13 meses produce 1 punto con el porcentaje correcto.
- [ ] **Step 2:** Falla → implementar → verde.
- [ ] **Step 3:** `/macro` con tres tarjetas: CPI (índice + interanual), `FEDFUNDS`, `UNRATE`. Cada una con último valor, variación y gráfico.
- [ ] **Step 4:** Commit.

---

### Task 10: Copiloto de MD&A

**Files:** Create `src/lib/sec/mdna.ts`, `src/lib/ai/{gemini,prompts}.ts`, `src/components/mdna-summary.tsx`, `src/app/ticker/[ticker]/ai/page.tsx`, `src/app/api/mdna/[cik]/route.ts`. Test `src/test/mdna.test.ts`.

**Produces:**
```ts
function extractMdna(html: string): string | null;
type MdnaSummary = { drivers: string[]; risks: string[]; tone: string;
                     source: 'gemini' | 'extractive'; filing: FilingRef };
function summarizeMdna(text: string): Promise<Omit<MdnaSummary,'filing'>>;
```

- [ ] **Step 1:** Test de `extractMdna` con HTML que contiene **dos** apariciones de "Item 7. Management's Discussion and Analysis" —una en el índice, otra en el cuerpo— y verifica que devuelve el intervalo largo, no la línea del índice. Segundo test: documento sin Item 7 → `null`.
- [ ] **Step 2:** Falla → implementar: HTML→texto preservando párrafos, localizar todas las coincidencias de inicio y fin, quedarse con el intervalo más largo, truncar al tope de seguridad.
- [ ] **Step 3:** `gemini.ts`: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent` con cabecera `x-goog-api-key`, `responseMimeType: application/json` y esquema de respuesta. Sin `GEMINI_API_KEY` o ante 429 → resumen extractivo determinista con `source: 'extractive'`.
- [ ] **Step 4:** `prompts.ts`: instrucción explícita de usar **solo** el texto suministrado y no aportar conocimiento externo.
- [ ] **Step 5:** Página con los tres bloques y distintivo visible cuando la fuente es extractiva.
- [ ] **Step 6:** Verde y build. Commit.

---

### Task 11: Verificación visual y despliegue

- [ ] **Step 1:** `npm run build` y `npm start`; recorrer con el navegador integrado: home, `/ticker/AAPL`, `/ticker/AAPL/financials` anual y trimestral, `/ticker/TSLA/financials`, `/ticker/JNJ/financials`, `/macro`.
- [ ] **Step 2:** Repetir a 375 px de ancho comprobando el desbordamiento horizontal de la tabla.
- [ ] **Step 3:** `supabase/migrations/0001_cache_tables.sql` y `README.md` con instrucciones de despliegue y de obtención de la clave de Gemini.
- [ ] **Step 4:** Commit final.
