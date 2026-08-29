# Datos de opciones y presión de mercado

## Qué puede medir Altius de forma honesta

- **Volumen:** contratos ejecutados durante la sesión. Cada ejecución tiene comprador y vendedor; por sí solo no revela quién inició la operación.
- **Interés abierto (OI):** contratos que seguían abiertos tras la última compensación. No es volumen del día ni indica dirección por sí solo.
- **Bid / ask y tamaño:** mejor precio de compra y de venta publicado y contratos visibles en ese primer nivel. No incluye órdenes ocultas ni profundidad completa.
- **Agresor estimado:** con un feed de transacciones se puede comparar cada ejecución con el bid/ask vigente. Una ejecución cerca del ask suele clasificarse como compra agresiva y una cercana al bid como venta agresiva, pero sigue siendo una inferencia.
- **Rango implícito:** el straddle más próximo al dinero o, como respaldo, `spot × IV × √(días/365)`. Estima magnitud, no dirección.

El score actual combina put/call por volumen (45%), put/call por OI (35%) y desequilibrio del mejor bid/ask visible (20%). Se muestra expresamente como **proxy**, nunca como recomendación.

## Proveedores integrados

### Tradier — preferido para una cuenta de brokerage

- Cadena completa, bid/ask, tamaños, volumen, OI e IV/Greeks.
- Mercado estadounidense en tiempo real para titulares de cuenta; sandbox retrasado.
- Variables: `TRADIER_API_TOKEN` y, para paper trading, `TRADIER_ENV=sandbox`.
- Fuente: <https://docs.tradier.com/docs/market-data>

### Market Data — alternativa con capa gratuita

- Free Forever: 100 créditos diarios, 24 horas de retraso y un año de histórico.
- Altius pide 14 strikes cercanos al dinero en dos vencimientos para no agotar una cadena completa.
- Variable: `MARKETDATA_API_TOKEN`. AAPL funciona como demo sin clave.
- Fuentes: <https://www.marketdata.app/docs/account/free-accounts/> y <https://www.marketdata.app/docs/api/options/chain/>

## Siguiente nivel de precisión

1. **Massive Options Developer/Advanced:** trades y quotes por tick, timestamps y condiciones de OPRA; permite estimar ejecución al bid/ask. Tiene capa Basic gratuita de fin de día, pero trades y quotes útiles para flujo son de pago. <https://massive.com/pricing?product=options>
2. **Intrinio Unusual Activity:** entrega operaciones grandes, sweeps y bloques; su sentimiento ya se estima con bid/ask en el momento de ejecución. Es la mejora más directa para un panel de flujo institucional. <https://docs.intrinio.com/documentation/web_api/get_unusual_activity_universal_v2>
3. **Cboe Trade Alert:** producto profesional de order-flow para el mercado estadounidense. Conviene para una aplicación comercial que necesite clasificación de flujo y no solo snapshots. <https://cdn.cboe.com/resources/tradealert/Cboe_WebAPI_Factsheet.pdf>
4. **ORATS:** histórico desde 2007, superficie de volatilidad, skew, valores teóricos e indicadores propios. Merece la pena para backtesting y análisis de volatilidad, no solo para una foto del día. <https://orats.com/data-api>
5. **Alpha Vantage Historical Options:** cadena histórica de más de 15 años con IV y Greeks; es premium. Útil como respaldo histórico, no como feed principal intradía. <https://www.alphavantage.co/documentation/>

## Cobertura internacional

La capa gratuita práctica está centrada en opciones listadas en EE. UU. Las acciones europeas solo aparecen si tienen una opción estadounidense o ADR compatible. Para profundidad real en derivados europeos se necesitan feeds licenciados por mercado. Por ejemplo, **Eurex EOBI** publica cada orden y ejecución visible sin netear, pero es infraestructura profesional, no una API gratuita de consumo. <https://www.eurex.com/resource/blob/304154/d4a961beb23c02dee27138be126f5b9e/data/Eurex-Enhanced-Order-Book-Interface-Manual.pdf>

## Límites que la interfaz debe conservar

- No llamar “compras” al volumen de calls ni “ventas” al volumen de puts.
- No tratar call wall, put wall o máximo dolor como soportes/resistencias garantizados.
- Mostrar siempre proveedor, hora de la observación, retraso y cobertura de strikes.
- No mezclar snapshots de diferentes horas al comparar vencimientos.
- Para producción comercial, confirmar licencias de redistribución de OPRA y de cada bolsa antes de mostrar datos a usuarios finales.
