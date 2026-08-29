# Plan de mejora ejecutado

Fecha: 25/08/2026

## Objetivo

Alinear el comportamiento real de Altius con su promesa: ningún dato ausente se
presenta como cero, ningún supuesto se confunde con un hecho y toda degradación
es visible y segura.

## Bloque 1 — Verdad de datos

- [x] Retirar el previsualizador con precios y ratios escritos a mano.
- [x] Representar cotización, variación y capitalización ausentes con `null`.
- [x] Eliminar las bases ficticias de valoración (`precio = 1`, ventas y acciones
  sintéticas y defaults históricos presentados como hechos).
- [x] Marcar todos los controles de proyección como supuestos editables.
- [x] No calcular margen de seguridad ni CAGR cuando falta la cotización.
- [x] Añadir pruebas de regresión para los datos ausentes.

## Bloque 2 — Diferenciación de producto

- [x] Añadir valoración inversa: crecimiento de ventas implícito para que el
  precio objetivo a cinco años coincida con la cotización actual.
- [x] Añadir un panel de auditoría con fuente, fecha y fórmulas principales.
- [ ] Persistir escenarios bear/base/bull por usuario.
- [ ] Convertir escenarios en una tesis versionada con condiciones de refutación.

## Bloque 3 — Fiabilidad operativa

- [x] Activar `SupabaseCacheStore` automáticamente cuando existen credenciales.
- [x] Mantener disco como respaldo oportunista.
- [x] Añadir timeout a proveedores externos.
- [x] Mostrar en portada cuándo una fuente ha fallado.
- [x] Identificar Yahoo Finance de forma explícita, sin llamarlo fuente oficial.
- [ ] Configurar la migración de Supabase y `pg_cron` en el entorno desplegado.
- [ ] Conectar logs estructurados a la plataforma de observabilidad elegida.

## Bloque 4 — Superficie API

- [x] Validar CIK, ticker, categorías y longitud de búsquedas.
- [x] Limpiar textos controlados por el usuario.
- [x] Limitar por IP las rutas de SEC, precios, noticias, búsqueda y Gemini.
- [x] Devolver errores públicos seguros con identificador de diagnóstico.
- [x] Añadir cabeceras HTTP defensivas.
- [ ] Aplicar rate limiting distribuido en el WAF o edge store de producción; el
  limitador incluido es deliberadamente oportunista y funciona por instancia.
- [ ] Decidir si el copiloto requiere sesión o cuota por usuario antes de abrirlo
  a tráfico no controlado.

## Bloque 5 — Entrega

- [x] Añadir scripts `typecheck` y `check`.
- [x] Añadir CI para tipos, lint, tests y build.
- [x] Actualizar README, configuración y estado técnico.
- [ ] Añadir pruebas end-to-end de los recorridos búsqueda → ficha → financieros
  → valoración cuando se elija una herramienta de navegador para CI.

## Gate para la siguiente fase

Antes de construir seguimiento de tesis debe validarse con usuarios la
valoración inversa. La métrica propuesta es: porcentaje de sesiones de ficha que
abren valoración, modifican al menos un supuesto y guardan o copian el escenario.
