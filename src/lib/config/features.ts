/**
 * Control centralizado de flags y visibilidad de módulos en la plataforma Altius.
 * 
 * SHOW_TECHNICAL:
 * Cuando es `false`, oculta de forma íntegra todo el análisis técnico en la aplicación:
 * - Pestaña de análisis técnico en la ficha de empresas/acciones (/ticker/[ticker]/technical).
 * - Gráficos técnicos con osciladores (SMA, Bollinger, RSI, MACD) y cuadro de mando técnico
 *   en Índices (/indices/[symbol]), Materias Primas (/commodities/[slug]) y Divisas (/divisas/[pair]),
 *   sustituyéndolos por gráficos limpios de evolución histórica de cotización (`PriceChart`).
 * - Enlaces, textos y etiquetas de análisis técnico en listados generales y tarjetas.
 * 
 * Todo el código, cálculos matemáticos y componentes subyacentes se conservan intactos
 * sin ser borrados.
 */
export const SHOW_TECHNICAL = false;
