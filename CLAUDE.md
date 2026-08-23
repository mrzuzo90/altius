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

Antes de dar por terminado cualquier cambio: los tres últimos, en verde (`npm test`, `npx tsc --noEmit`, `npx eslint src`), y hacer commit y push a `origin/main` automáticamente.

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
- En Vercel, `/tmp` es efímero. La caché compartida real es Postgres, cuando
  esté cableada (ver «Estado actual» abajo).

## Convenciones

- TypeScript `strict`. Sin `any` en las firmas públicas de `src/lib`.
- Los componentes de servidor hacen el trabajo pesado; al cliente solo viajan
  estructuras ya reducidas.
- Cada fuente externa degrada de forma independiente y tipada. Un fallo de
  Alpha Vantage no puede tumbar los estados financieros.
- Los comentarios explican **por qué**, no qué. Si un comentario describe lo que
  hace la línea de al lado, sobra.

## Estado actual

El proyecto sigue un plan técnico por fases (Fase 0: eliminar datos fabricados y
hacer trazable cada cifra; Fase 1: valoración inversa y tesis de inversión;
fases posteriores, sin detallar todavía). Dentro de la Fase 0:

- ✅ Procedencia por celda en el motor de normalización y en los ratios
  (`src/lib/sec/provenance.ts`, `normalize.ts`, `ratios.ts`).
- ⏳ Pendiente: popover de procedencia en la interfaz, purga de datos de mercado
  fabricados en la portada, caché de Supabase cableada, degradación honesta sin
  cotización, marcado visual de supuestos, higiene de tema/paleta.

Si vas a tocar `src/lib/sec/`, `src/app/page.tsx`, `src/components/home/` o
`src/lib/cache/`, ten en cuenta que parte de esos ficheros está pendiente de una
reescritura ya planificada — evita dar por asumido que su estado actual es el
final.
