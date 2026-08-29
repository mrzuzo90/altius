# Altius

Terminal de análisis fundamental de acciones construido sobre fuentes públicas y
verificables. Estados financieros leídos directamente del XBRL de la SEC,
contexto macroeconómico de la Reserva Federal y un copiloto que resume el
análisis de la dirección del último informe anual.

## El principio que gobierna el código

Todo dato mostrado es trazable a un documento público. En concreto:

- **Nunca se inventa un valor.** Si una empresa no reporta un concepto, la celda
  muestra una raya. No hay interpolación, estimación ni relleno.
- **Lo calculado se marca.** Solo tres magnitudes se derivan —beneficio bruto
  cuando la empresa no lo publica, flujo de caja libre y el cuarto trimestre— y
  las tres se señalan visualmente.
- **Se muestra el dato vigente.** Cuando una empresa reexpresa un ejercicio,
  Altius muestra la versión más reciente. Johnson & Johnson rebajó sus ingresos
  de 2022 de 94.943 a 79.990 millones tras escindir Kenvue: aquí verás 79.990,
  porque la cifra original ya no es lo que la empresa sostiene.
- **Cada celda declara su procedencia.** Si es un hecho publicado: concepto
  XBRL, unidad, periodo, formulario, fecha de presentación y número de acceso.
  Si es un cálculo de Altius: la fórmula y la procedencia de cada entrada.
  Tipos en `src/lib/sec/provenance.ts`. Cada celda de los estados financieros
  abre un panel con el hecho o fórmula exactos y el enlace al filing de EDGAR.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
```

Edita `.env.local` y pon tu nombre y un email real en `SEC_USER_AGENT`. **Es
obligatorio**: la SEC responde `403` a cualquier petición sin User-Agent
identificable, y es la causa más común de que estos proyectos funcionen en local
y fallen en producción.

```bash
npm run dev
```

Ninguna otra clave hace falta para arrancar. Los estados financieros y el panel
macro funcionan sin credenciales.

## Configuración

| Variable | ¿Obligatoria? | Para qué |
|---|---|---|
| `SEC_USER_AGENT` | **Sí** | Nombre y email reales. Sin ella, la SEC devuelve 403 |
| `GEMINI_API_KEY` | No | Activa el copiloto. Clave gratuita en [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Sin ella, el resumen es extractivo y se marca como tal |
| `ALPHAVANTAGE_API_KEY` | No | Activa el gráfico de cotización. Clave gratuita en [alphavantage.co](https://www.alphavantage.co/support/#api-key). Su plan gratuito permite 25 peticiones diarias |
| `GEMINI_MODEL` | No | Modelo de Gemini. Por defecto `gemini-flash-latest`, con salto automático a `gemini-flash-lite-latest` si falla |
| `FRED_API_KEY` | No | Conmuta al API JSON de FRED. Sin ella se usa el CSV público, que da los mismos datos |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | No | Activa la caché compartida de producción; el disco queda como respaldo oportunista |

## Fuentes de datos

| Fuente | Qué aporta | Clave |
|---|---|---|
| [SEC EDGAR](https://www.sec.gov/edgar) | Estados financieros, perfil de empresa, texto de los informes | No, pero exige User-Agent |
| [FRED](https://fred.stlouisfed.org/) | IPC, tipo de los fondos federales, tasa de paro | No |
| [Alpha Vantage](https://www.alphavantage.co/) | Cotización semanal de cierre | Sí, gratuita |
| Yahoo Finance | Cotización y sparkline de portada; fallback de precios históricos | No |
| [Google Gemini](https://ai.google.dev/) | Resumen del MD&A | Sí, gratuita |

**Sobre las cotizaciones:** con Alpha Vantage se usa la serie **semanal**, no la diaria. En el plan
gratuito de Alpha Vantage el histórico completo del endpoint diario es una
función de pago, y sin ella quedan unas cien sesiones —cinco meses—, lo que
vacía de sentido cualquier rango de años. La serie semanal sí devuelve el
histórico entero: veintisiete años en el caso de Apple. Para un terminal de
fundamentales el compromiso es favorable, porque importa la tendencia plurianual
junto a las cuentas, no el tick del día.

El diseño original usaba Stooq, que servía CSV sin
registro. Desde 2026 responde con un reto de prueba de trabajo en JavaScript
para bloquear el acceso automatizado, y sortearlo sería evadir una medida
antibot deliberada del sitio. Por eso la capa de precios está tras una interfaz
de proveedor. Cuando Alpha Vantage no está configurado o falla, se usa el feed
de mercado de Yahoo Finance y se declara expresamente en la interfaz; no se
presenta como fuente oficial.

## Arquitectura

```
src/lib/sec/       Cliente de la SEC, taxonomía XBRL, motor de normalización y procedencia
src/lib/fred/      Series macroeconómicas
src/lib/prices/    Cotizaciones, tras una interfaz de proveedor
src/lib/valuation/ Métricas de mercado y calculadora de proyección a 5 años
src/lib/ai/        Copiloto del MD&A, con degradación extractiva
src/lib/cache/     Interfaz CacheStore: adaptador de disco y de Postgres
src/components/    Interfaz
src/app/           Rutas y API
```

### El motor de normalización

Vive en `src/lib/sec/normalize.ts` y es donde está la dificultad real. Los cinco
problemas que resuelve, todos verificados contra datos reales:

1. **Reexpresiones.** El mismo periodo aparece varias veces con distinto número
   de acceso. Los ingresos de Apple en 2023 figuran en tres 10-K. Gana el de
   fecha de presentación más reciente.
2. **El campo `fy` engaña.** Es el ejercicio de la *presentación*, no del hecho:
   el periodo 2022-09 → 2023-09 de Apple aparece etiquetado como `fy` 2023, 2024
   y 2025 según quién lo reexprese. El ejercicio se deriva de la fecha de cierre.
3. **Duración frente a instante.** Resultados y flujo de caja son flujos; el
   balance es una fotografía. Se extraen por rutas separadas.
4. **Los 10-Q traen acumulados.** El informe del tercer trimestre incluye el dato
   de nueve meses. Se filtra por longitud de la duración, no por tipo de
   formulario.
5. **El cuarto trimestre no existe.** Se deriva restando los tres primeros al
   ejercicio, solo si están los cuatro componentes, y se marca como derivado.

Además, la resolución de conceptos es **por periodo**. Apple etiquetó sus
ingresos como `SalesRevenueNet` hasta 2018 y como
`RevenueFromContractWithCustomerExcludingAssessedTax` desde 2019. Eligiendo un
concepto único para toda la serie, el histórico se cortaría; resolviendo periodo
a periodo, quedan diez ejercicios contiguos.

## Pruebas

```bash
npm test
```

La suite completa corre sobre fixtures reales de Apple, Tesla y Johnson & Johnson.
Además de las cifras concretas, se comprueban dos invariantes:

- El activo total iguala pasivo más patrimonio en las tres empresas y en todos
  los periodos. Este test destapó que faltaban los intereses minoritarios y las
  participaciones rescatables de Tesla.
- Las líneas con varios conceptos candidatos resuelven al correcto. Este test
  fijó que la I+D de Johnson & Johnson son 14.665 millones y no los 109 que
  produce el concepto genérico, que en su caso recoge I+D adquirida.

## Despliegue en Vercel

```bash
npx vercel
```

Define las variables de entorno en el panel del proyecto. `SEC_USER_AGENT` es la
única imprescindible.

**Sobre la caché en producción:** si existen las dos variables de Supabase,
Altius usa Postgres como capa compartida y `/tmp` como respaldo oportunista de
instancia. Hay que aplicar primero `supabase/migrations/0001_cache_tables.sql`.
Sin credenciales, se conserva el comportamiento local basado en disco.

## Calidad y seguridad

```bash
npm run check
```

El comando ejecuta TypeScript, lint, tests y build. La misma secuencia corre en
GitHub Actions. Las APIs públicas validan sus parámetros, tienen límites
oportunistas por instancia y devuelven un identificador de diagnóstico sin
exponer detalles internos. En producción, el endpoint de Gemini debe
complementarse con límites distribuidos en el WAF o autenticación por usuario.

El estado del plan de mejora está en `docs/IMPROVEMENT_PLAN.md`.

## Alcance

Cubre empresas que presentan cuentas en Estados Unidos. Los emisores extranjeros
que presentan formulario 20-F y los registros anteriores a la obligatoriedad del
XBRL no tienen datos estructurados en la SEC, y la aplicación lo dice
explícitamente en lugar de mostrar una tabla vacía.
