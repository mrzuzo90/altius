/**
 * Diccionario de mercados globales, macro, materias primas, divisas,
 * presupuesto personal, interés compuesto, inflación, países y sectores.
 * Inglés cercano, directo y fácil de entender.
 */
export const MARKETS_DICTIONARY: Record<string, string> = {
  // --- PAÍSES, REGIONES Y SECTORES SIC ---
  "Estados Unidos": "United States",
  "Zona Euro": "Eurozone",
  "Eurozona": "Eurozone",
  "España": "Spain",
  "Alemania": "Germany",
  "Francia": "France",
  "Países Bajos": "Netherlands",
  "Reino Unido": "United Kingdom",
  "Suiza": "Switzerland",
  "Finlandia": "Finland",
  "Taiwán": "Taiwan",
  "Dinamarca": "Denmark",
  "Irlanda": "Ireland",
  "Canadá": "Canada",
  "Australia": "Australia",
  "Reino Unido/Australia": "UK / Australia",
  "Australia/global": "Australia / Global",
  "Agricultura, silvicultura y pesca": "Agriculture, Forestry & Fishing",
  "Minería": "Mining",
  "Construcción": "Construction",
  "Manufactura": "Manufacturing",
  "Transporte y servicios públicos": "Transportation & Utilities",
  "Comercio mayorista": "Wholesale Trade",
  "Comercio minorista": "Retail Trade",
  "Finanzas, seguros e inmobiliario": "Finance, Insurance & Real Estate",
  "Servicios": "Services",
  "Administración pública": "Public Administration",

  // --- ÍNDICES BURSÁTILES (/indices) ---
  "Índices Bursátiles Mundiales y Europeos | Altius": "Global & European Stock Indices | Altius",
  "MERCADOS GLOBALES · COBERTURA EE. UU. Y EUROPA": "GLOBAL MARKETS · US & EUROPE",
  "Índices Bursátiles de Referencia": "Major Stock Market Indices",
  "Seguimiento oficial de Wall Street (S&P 500, NASDAQ, Dow Jones, VIX) y los principales selectivos europeos (Euro Stoxx 50, DAX 40, IBEX 35, FTSE 100, CAC 40) sincronizados con FRED y bolsas internacionales.":
    "Track Wall Street (S&P 500, NASDAQ, Dow Jones, VIX) and Europe's top stock markets (Euro Stoxx 50, DAX 40, IBEX 35, FTSE 100, CAC 40) straight from official feeds.",
  "Series históricas y observaciones oficiales de selectivos bursátiles mundiales.":
    "Official historical price series for major global stock indices.",
  "Principales Índices Europeos": "Top European Indices",
  "Euro Stoxx 50, DAX 40 (Alemania), IBEX 35 (España), FTSE 100 (Reino Unido) y CAC 40 (Francia).":
    "Euro Stoxx 50, DAX 40 (Germany), IBEX 35 (Spain), FTSE 100 (UK), and CAC 40 (France).",
  "Wall Street & Mercado Estadounidense": "Wall Street & US Markets",
  "S&P 500, NASDAQ Composite, Dow Jones Industrial e Índice de Volatilidad VIX.":
    "S&P 500, NASDAQ Composite, Dow Jones Industrial, and the VIX Volatility Index.",
  "Transparencia de Datos en Índices Mundiales": "Where These Index Numbers Come From",
  "Las series de precios se sincronizan con los repositorios oficiales de FRED, Deutsche Börse, STOXX Ltd., BME y CBOE. Los cálculos de medias móviles (SMA), oscilador RSI y MACD se derivan matemáticamente sobre las observaciones históricas de cierre.":
    "Price history comes directly from FRED, Deutsche Börse, STOXX, BME, and CBOE. Moving averages, RSI, and MACD are calculated straight from official closing prices.",
  "Ver Materias Primas": "Explore Commodities",
  "Tendencia 30 sesiones": "30-day trend",
  "30 sesiones": "30 days",
  "1 AÑO": "1 YEAR",
  "1 DÍA": "1 DAY",
  "1 SEMANA": "1 WEEK",
  "1 MES": "1 MONTH",
  "MÁXIMO": "ALL-TIME HIGH",
  "MÁX. 52S": "52W HIGH",
  "MÍN. 52S": "52W LOW",
  "MÁXIMO HISTÓRICO (ATH)": "ALL-TIME HIGH (ATH)",
  "DRAWDOWN DESDE ATH": "DROP FROM HIGH",
  "Distancia a máximos históricos": "Distance below all-time high",
  "Distancia al pico histórico": "Distance below all-time high",
  "MÁXIMO 52 SEMANAS": "52-WEEK HIGH",
  "Cota superior últimos 12 meses": "Highest level in the past 12 months",
  "Cota superior anual": "Highest level in the past year",
  "MÍNIMO 52 SEMANAS": "52-WEEK LOW",
  "Soporte anual de mercado": "Lowest level in the past year",
  "Soporte anual": "Lowest level in the past year",
  "Evolución y cotización histórica": "Price history & performance",
  "Índice no encontrado": "Index not found",
  "Volver a todos los índices": "Back to all indices",
  "Evolución y Análisis Técnico Interactivo": "Chart & Technical Indicators",
  "Evolución del Índice": "Index Performance",
  "Puntos de índice nominales · SMA 20/50/200 · Bollinger · RSI · MACD":
    "Index points · 20/50/200-Day SMAs · Bollinger · RSI · MACD",
  "Puntos de índice nominales · Serie histórica oficial":
    "Index points · Official historical data",
  "Diagnóstico Técnico Cuantitativo": "Technical Signal Breakdown",
  "Estadísticas Históricas y Rendimientos": "Historical Stats & Returns",

  // Descripciones de Índices (lib/indices)
  "Índice de referencia compuesto por las 500 mayores corporaciones de Wall Street. Representa más del 80% de la capitalización bursátil estadounidense.":
    "Tracks 500 of the largest US public companies—covering over 80% of the total US stock market.",
  "Índice que agrupa a más de 3.000 acciones cotizadas en el mercado electrónico NASDAQ, con alto peso en semiconductores, software y tecnología.":
    "Includes over 3,000 stocks listed on the NASDAQ exchange, heavily tilted toward tech, software, and semiconductors.",
  "El selectivo más antiguo de Wall Street, ponderado por precio sobre 30 compañías industriales, financieras y de servicios emblemáticas.":
    "Wall Street's oldest benchmark, tracking 30 iconic American blue-chip companies.",
  "Medida líder de volatilidad implícita esperada a 30 días calculada a partir de las opciones sobre el S&P 500, conocida como el termómetro del miedo.":
    "Known as Wall Street's 'fear gauge'—measures how much market swing options traders expect over the next 30 days.",
  "Índice bursátil de referencia de la Eurozona compuesto por 50 de las empresas más grandes y líquidas de 8 países europeos.":
    "The Eurozone's flagship index, tracking 50 of the biggest blue-chip companies across 8 European countries.",
  "DAX 40 Index (Alemania)": "DAX 40 Index (Germany)",
  "Índice director de la economía alemana que agrupa a las 40 mayores compañías cotizadas en la Bolsa de Frankfurt (SAP, Siemens, Allianz, etc.).":
    "Germany's benchmark stock index covering 40 major companies on the Frankfurt Exchange (like SAP, Siemens, and Allianz).",
  "IBEX 35 Index (España)": "IBEX 35 Index (Spain)",
  "Selectivo de las 35 empresas con mayor liquidez cotizadas en el Sistema de Interconexión Bursátil Español (SIBE) en Madrid.":
    "Spain's main stock index tracking the 35 most actively traded companies on the Madrid Stock Exchange.",
  "FTSE 100 Index (Reino Unido)": "FTSE 100 Index (UK)",
  "Índice ponderado por capitalización de las 100 mayores empresas cotizadas en la Bolsa de Valores de Londres (London Stock Exchange).":
    "Tracks the 100 largest companies listed on the London Stock Exchange by market value.",
  "CAC 40 Index (Francia)": "CAC 40 Index (France)",
  "Índice de referencia de la Bolsa de París que agrupa a los 40 valores más significativos de Francia (LVMH, TotalEnergies, Sanofi, L'Oréal).":
    "France's flagship stock index tracking the 40 largest companies in Paris (like LVMH, TotalEnergies, Sanofi, and L'Oréal).",

  // --- MATERIAS PRIMAS (/commodities) ---
  "Materias Primas (Commodities) | Altius": "Commodities | Altius",
  "MERCADOS GLOBALES · PRECIOS SPOT Y FIXINGS OFICIALES": "GLOBAL MARKETS · SPOT PRICES & OFFICIAL BENCHMARKS",
  "Observatorio de Materias Primas": "Global Commodities Tracker",
  "Cotizaciones oficiales de petróleo crudo (Brent / WTI), gas natural, metales preciosos (oro, plata), cobre e insumos agrícolas leídos de la EIA, LBMA, FMI y Banco Mundial vía FRED.":
    "Official prices for crude oil (Brent & WTI), natural gas, precious metals (gold & silver), copper, and grains from EIA, LBMA, IMF & World Bank.",
  "Series continuas de precios al contado y fijaciones de Londres provistas por organismos oficiales.":
    "Official spot prices and London benchmark fixings from trusted global agencies.",
  "Energía & Petróleo": "Energy & Oil",
  "Petróleo crudo Brent, WTI y gas natural Henry Hub de referencia internacional.":
    "Global benchmarks for Brent crude, WTI crude oil, and Henry Hub natural gas.",
  "Metales Preciosos": "Precious Metals",
  "Oro y plata física con fijaciones del London Bullion Market (LBMA).":
    "Physical gold and silver benchmark prices from the London Bullion Market (LBMA).",
  "Metales Industriales": "Industrial Metals",
  "Cobre y metales básicos de la London Metal Exchange (LME).":
    "Copper and base metals tracked via the London Metal Exchange (LME).",
  "Agricultura & Granos": "Agriculture & Grains",
  "Trigo y maíz de referencia en los mercados globales de materias primas.":
    "Global export benchmark prices for wheat and corn.",
  "Evolución de cotización": "Price history",
  "Metodología y Fuentes Verificables": "Verified Data Sources",
  "Altius sincroniza directamente las fijaciones spot oficiales publicadas por la Administración de Información Energética de EE. UU. (EIA), la Asociación del Mercado de Lingotes de Londres (LBMA) y el Fondo Monetario Internacional.":
    "Altius syncs official spot prices directly from the US Energy Information Administration (EIA), London Bullion Market Association (LBMA), and the IMF.",
  "Explorar Índices Bursátiles": "Explore Stock Indices",
  "Materia prima no encontrada": "Commodity not found",
  "Volver a todas las materias primas": "Back to all commodities",
  "Evolución de Precio y Análisis Técnico": "Price History & Technical Indicators",
  "Evolución del Precio": "Price History",
  "activo": "asset",
  "activos": "assets",
  "selectivos": "indices",
  "pares oficiales": "official pairs",

  // Commodities Nombres & Unidades
  "Petróleo Crudo Brent (Spot Europa)": "Brent Crude Oil (Global Benchmark)",
  "Petróleo Brent": "Brent Crude",
  "USD / Barril": "USD / Barrel",
  "Precio de contado del crudo del Mar del Norte (Brent), referencia oficial del mercado petrolero internacional y europeo.":
    "Spot price of North Sea Brent crude—the main global and European oil benchmark.",
  "Petróleo Crudo WTI (Cushing, OK)": "WTI Crude Oil (US Benchmark)",
  "Petróleo WTI": "WTI Crude",
  "Precio de referencia del crudo ligero estadounidense (West Texas Intermediate) en el centro de entrega de Cushing, Oklahoma.":
    "US light sweet crude oil benchmark priced at Cushing, Oklahoma.",
  "Gas Natural (Henry Hub Spot)": "Natural Gas (Henry Hub)",
  "Gas Natural": "Natural Gas",
  "Precio de contado del gas natural en el punto de distribución de Henry Hub (Luisiana), referencia mundial de gasoductos y GNL.":
    "Spot natural gas price at Henry Hub, Louisiana—the main benchmark for US natural gas.",
  "Oro Fino (LBMA Fixing)": "Gold (London Benchmark)",
  "Oro": "Gold",
  "USD / Onza Troy": "USD / Troy Oz",
  "Precio oficial de liquidación del oro físico en el mercado mayorista de metales preciosos de Londres (LBMA Gold Price Fixing).":
    "Official settlement price for physical gold from the London Bullion Market (LBMA).",
  "Plata Fina (Mercado Global)": "Silver (Global Benchmark)",
  "Plata": "Silver",
  "USD / Tonelada": "USD / Metric Ton",
  "Fondo Monetario Internacional (FMI) / LBMA via FRED": "IMF / LBMA via FRED",
  "Cotización de referencia de la plata física como metal precioso de inversión y componente clave en transición energética e industrial.":
    "Benchmark physical silver price, driven by both safe-haven demand and industrial/solar uses.",
  "Cobre Grado A (Precio Global)": "Copper Grade A (Global)",
  "Cobre": "Copper",
  "Fondo Monetario Internacional (FMI) via FRED": "IMF via FRED",
  "Precio global del cobre de grado A en el mercado de metales de Londres (LME), considerado el barómetro de la actividad industrial mundial.":
    "Global Grade A copper price on the London Metal Exchange—widely watched as a barometer for world economic health.",
  "Trigo (Índice Global de Exportación)": "Wheat (Global Export)",
  "Trigo": "Wheat",
  "Fondo Monetario Internacional (FMI) / Banco Mundial via FRED": "IMF / World Bank via FRED",
  "Precio de referencia internacional del trigo rojo duro de invierno, cereal base de la alimentación mundial.":
    "Global benchmark price for hard red winter wheat, a staple grain worldwide.",
  "Maíz (Índice Global de Exportación)": "Corn (Global Export)",
  "Maíz": "Corn",
  "Precio de exportación del maíz amarillo grado 2 de EE. UU., base fundamental de la cadena agroalimentaria y forrajera global.":
    "US No. 2 yellow corn export price—essential across food production, livestock feed, and ethanol.",

  // --- DIVISAS / FOREX (/divisas) ---
  "Divisas y Tipos de Cambio (Forex) | Altius": "Currencies & Exchange Rates | Altius",
  "MERCADO FOREX · TIPOS DE CAMBIO OFICIALES FEDERAL RESERVE H.10":
    "FOREX · OFFICIAL FEDERAL RESERVE H.10 EXCHANGE RATES",
  "Observatorio de Divisas (Forex)": "Global Currencies (Forex)",
  "Tipos de cambio de las principales monedas globales (EUR/USD, GBP/USD, AUD/USD, USD/JPY, USD/CAD, etc.) e Índice Dólar, con FRED H.10 como fuente principal y respaldo de mercado si el servicio oficial no responde.":
    "Track major world currencies (EUR/USD, GBP/USD, USD/JPY, USD/CAD, and more) plus the US Dollar Index, powered by Federal Reserve data.",
  "Cotizaciones oficiales de tipos de cambio publicadas por el Banco de la Reserva Federal.":
    "Official foreign exchange reference rates published by the Federal Reserve Board.",
  "Analizar DXY": "Analyze DXY",
  "Pares de Divisas Principales (Majors)": "Major Currency Pairs",
  "Euro, Libra esterlina, Dólar australiano, Yen, Franco suizo, Dólar canadiense, Yuan y Peso mexicano frente al USD.":
    "Euro, British Pound, Australian Dollar, Japanese Yen, Swiss Franc, Canadian Dollar, Chinese Yuan & Mexican Peso vs USD.",
  "Evolución del tipo de cambio": "Exchange rate history",
  "Transparencia de Datos en Mercado Forex": "Where These Forex Rates Come From",
  "Los tipos de cambio se obtienen directamente de la publicación estadística H.10 de la Reserva Federal de San Luis. Los osciladores (RSI 14, MACD 12/26/9), Bandas de Bollinger y Medias Móviles Simples se calculan matemáticamente sobre el histórico oficial.":
    "Exchange rates come directly from the Federal Reserve H.10 release. RSI, MACD, Bollinger Bands, and moving averages are calculated directly on the official series.",
  "Los tipos de cambio se obtienen directamente de la publicación estadística H.10 del Federal Reserve Board (FRED), garantizando cotizaciones oficiales y transparencia metodológica.":
    "Exchange rates come directly from the Federal Reserve Board's H.10 statistical release via FRED.",
  "Divisa no encontrada": "Currency pair not found",
  "Volver a todas las divisas": "Back to all currencies",
  "Evolución del Tipo de Cambio y Análisis Técnico": "Exchange Rate & Technical Indicators",
  "Evolución del Tipo de Cambio": "Exchange Rate History",
  "Estadísticas Históricas y Rendimientos de Tipo de Cambio": "Historical Exchange Rate Stats",
  "Euro / Dólar Estadounidense (EUR/USD)": "Euro / US Dollar (EUR/USD)",
  "Tipo de cambio oficial de referencia del Euro frente al Dólar estadounidense publicado diariamente por la Reserva Federal.":
    "Official daily reference exchange rate between the Euro and US Dollar published by the Federal Reserve.",
  "Libra Esterlina / Dólar Estadounidense (GBP/USD)": "British Pound / US Dollar (GBP/USD)",
  "Cotización oficial de la Libra esterlina británica expresada en Dólares estadounidenses.":
    "Official exchange rate of the British Pound priced in US Dollars.",
  "Dólar Estadounidense / Yen Japonés (USD/JPY)": "US Dollar / Japanese Yen (USD/JPY)",
  "Tipo de cambio de referencia del Dólar estadounidense frente al Yen japonés fijado por el Banco de la Reserva Federal.":
    "Reference exchange rate between the US Dollar and Japanese Yen.",
  "Dólar Estadounidense / Franco Suizo (USD/CHF)": "US Dollar / Swiss Franc (USD/CHF)",
  "Cotización del Dólar estadounidense en Francos suizos, activo de reserva y refugio tradicional.":
    "US Dollar priced in Swiss Francs—a classic safe-haven currency.",
  "Dólar Estadounidense / Dólar Canadiense (USD/CAD)": "US Dollar / Canadian Dollar (USD/CAD)",
  "Tipo de cambio de referencia entre las economías de América del Norte (USD/CAD).":
    "Reference exchange rate between the US and Canadian Dollars.",
  "Dólar Australiano / Dólar Estadounidense (AUD/USD)": "Australian Dollar / US Dollar (AUD/USD)",
  "Cotización del Dólar australiano expresada en Dólares estadounidenses, con histórico oficial H.10.":
    "Australian Dollar priced in US Dollars, backed by official H.10 historical data.",
  "Dólar Estadounidense / Yuan Chino (USD/CNY)": "US Dollar / Chinese Yuan (USD/CNY)",
  "Tipo de cambio del Dólar estadounidense frente al Yuan Renminbi de la República Popular China.":
    "Reference exchange rate between the US Dollar and Chinese Yuan (Renminbi).",
  "Dólar Estadounidense / Peso Mexicano (USD/MXN)": "US Dollar / Mexican Peso (USD/MXN)",
  "Tipo de cambio representativo del Dólar estadounidense frente al Peso mexicano.":
    "Representative exchange rate between the US Dollar and Mexican Peso.",
  "Índice Dólar Ponderado (DXY Benchmark)": "US Dollar Index (DXY Benchmark)",
  "Índice DXY": "DXY Index",
  "Índice ponderado por el comercio exterior de EE. UU. que mide la fortaleza global del dólar frente a las principales divisas mundiales.":
    "Measures the overall strength of the US Dollar against a basket of major trading partner currencies.",

  // --- PANEL MACRO Y PODER ADQUISITIVO (/macro) ---
  "Macro · Eurozona y EE.UU.": "Macro · Eurozone & US",
  "Indicadores macroeconómicos oficiales de la Eurozona y Estados Unidos, gráfico de pérdida de poder adquisitivo del dinero y análisis educativo con Cid.":
    "Official Eurozone and US economic indicators, a real-world purchasing power tracker, and plain-English explanations.",
  "Panel Macroeconómico": "Macro Economy Dashboard",
  "Series oficiales del Banco Central Europeo, Eurostat y la Reserva Federal. Abre cualquier indicador para ver la evolución completa con Cid, el rendimiento anualizado y la guía didáctica.":
    "Official data from the European Central Bank, Eurostat, and the Federal Reserve. Click any indicator to explore its full history with Cid and read a plain-English guide.",
  "Oficina Estadística de la Unión Europea y Banco Central Europeo.":
    "Statistical Office of the European Union (Eurostat) and European Central Bank.",
  "Federal Reserve Economic Data del Banco de la Reserva Federal de San Luis.":
    "Federal Reserve Economic Data from the Federal Reserve Bank of St. Louis.",
  "Filtrar por región económica:": "Filter by region:",
  "Abrir gráfico con Cid": "Open chart with Cid",
  "Sin observaciones.": "No readings available.",
  "interanual": "year-over-year",
  "Ver análisis e histórico": "View chart & guide",
  "Última observación": "Latest Reading",
  "Variación en rango": "Change in Range",
  "Fuente oficial ↗": "Official source ↗",
  "Sin recorrido": "Not enough span",
  "Guía didáctica: ¿Qué significa este dato para tu economía?":
    "Plain-English Guide: What Does This Mean for Your Money?",
  "¿Qué mide exactamente?": "What does it actually measure?",
  "¿Cómo afecta a tu día a día?": "How does it affect your everyday life?",
  "¿Qué significa al invertir?": "What does it mean for investors?",

  // Métricas Macro individuales (macro/metrics.ts & fred/client.ts)
  "Inflación Eurozona (IPCA)": "Eurozone Inflation (HICP)",
  "Inflación Zona Euro": "Eurozone Inflation",
  "índice 2015 = 100": "index 2015 = 100",
  "Índice de Precios de Consumo Armonizado (IPCA) para la zona euro. Se representa la variación interanual anualizada.":
    "Harmonized consumer inflation across countries that use the euro, shown as year-over-year change.",
  "Mide la subida media de los precios de una cesta representativa de bienes y servicios (alimentación, energía, vivienda, transporte y ocio) en los países que usan el euro. El objetivo oficial del Banco Central Europeo es mantenerla en el 2 % anual.":
    "Tracks how fast everyday prices (groceries, energy, rent, travel) are rising across Eurozone countries. The ECB aims to keep this around 2% per year.",
  "Si la inflación es del 3 %, lo que costaba 100 € ahora cuesta 103 €. Tu dinero ahorrado pierde poder adquisitivo si no genera una rentabilidad que supere esta tasa.":
    "If inflation runs at 3%, something that cost €100 last year costs €103 today. Cash sitting idle slowly loses buying power unless it earns more than inflation.",
  "Una inflación moderada y estable permite a las empresas con fortaleza competitiva repercutir costes. Una inflación disparada fuerza al BCE a subir tipos, frenando la actividad económica y encareciendo el crédito.":
    "Steady, mild inflation lets strong companies raise prices naturally. Hot inflation forces the ECB to hike interest rates, making loans pricier and cooling the economy.",

  "Tipo de interés del BCE": "ECB Interest Rate",
  "Tipos de interés BCE": "ECB Rates",
  "Banco Central Europeo / FRED": "European Central Bank / FRED",
  "Tipo de interés de las operaciones principales de financiación del Banco Central Europeo.":
    "The benchmark interest rate set by the European Central Bank.",
  "Es el precio oficial del dinero que fija el Consejo de Gobierno del BCE. Determina el coste al que los bancos comerciales europeos pueden obtener liquidez del banco central.":
    "The official baseline price of money in the Eurozone—what European banks pay to borrow from the ECB.",
  "Es la brújula que mueve el Euríbor. Cuando el BCE sube los tipos, las hipotecas variables y los préstamos se encarecen, pero los depósitos pagan algo más. Cuando los baja, financiarse es más accesible.":
    "Drives Euribor and everyday borrowing costs. When the ECB hikes rates, mortgages and car loans cost more, though savings accounts pay a bit better too.",
  "Tipos altos aumentan la rentabilidad de la deuda pública y bonos seguros, compitiendo con la bolsa. Tipos bajos reducen el coste de capital para las empresas y suelen alentar las cotizaciones bursátiles.":
    "Higher rates make safe government bonds more attractive vs stocks. Lower rates make borrowing cheaper for companies and often give stock prices a tailwind.",

  "Tasa de paro Eurozona": "Eurozone Unemployment",
  "Desempleo Zona Euro": "Eurozone Unemployment",
  "Porcentaje de la población activa en desempleo desestacionalizado en la zona euro.":
    "Share of the Eurozone labor force that is actively looking for work.",
  "Representa la proporción de personas en edad y disposición de trabajar que no tienen empleo y están buscándolo activamente en los países miembros de la zona euro.":
    "The percentage of working-age people across Eurozone countries who want a job and are actively searching.",
  "Un desempleo contenido ofrece mayor seguridad en el puesto de trabajo, mayores probabilidades de encontrar nuevo empleo y mejor poder de negociación para aumentos de sueldo.":
    "Low unemployment gives workers more job security, easier job switching, and stronger bargaining power for raises.",
  "Un mercado laboral con alto empleo impulsa el consumo doméstico y las ventas de las compañías cotizadas, consolidando los beneficios empresariales de forma sostenible.":
    "When more people are employed, household spending stays healthy—supporting steady corporate sales and profits.",

  "Inflación EE.UU. (IPC)": "US Inflation (CPI)",
  "Inflación EE.UU.": "US Inflation",
  "índice 1982-84 = 100": "index 1982–84 = 100",
  "Índice de precios al consumo para consumidores urbanos de EE.UU., desestacionalizado. Se muestra la variación interanual.":
    "US Consumer Price Index (CPI), measuring how everyday prices are changing year over year.",
  "Indicador clave elaborado por la Oficina de Estadísticas Laborales de EE.UU. que mide el encarecimiento de la vida en la mayor economía del planeta.":
    "The main US cost-of-living gauge published monthly by the Bureau of Labor Statistics.",
  "Determina el valor y poder de compra del dólar estadounidense. Las variaciones inflacionarias en EE.UU. suelen propagarse rápidamente a materias primas y energía a escala global.":
    "Shows how fast the US dollar's buying power is shifting—and US inflation trends often ripple out to global commodities and prices.",
  "Es el dato más analizado por los inversores globales. Cada publicación influye decisivamente en las expectativas de tipos de la Fed y en la cotización de los índices bursátiles internacionales.":
    "One of the most closely watched numbers on Wall Street—every monthly release moves Fed rate expectations and global stock markets.",

  "Tipo de interés de la Fed": "Fed Interest Rate",
  "Tipos de interés Fed": "Fed Funds Rate",
  "Tipo efectivo de los fondos federales de EE.UU., media mensual establecida por la Reserva Federal.":
    "The effective US Federal Funds Rate, set by the Federal Reserve.",
  "Tipo al que las entidades depositarias de EE.UU. se prestan saldos en la Reserva Federal de un día para otro. Es el tipo de referencia monetaria por excelencia del mundo.":
    "The overnight interest rate US banks charge each other—effectively the baseline interest rate for the global financial system.",
  "Afecta al tipo de cambio entre el euro y el dólar. Si el dólar se fortalece por tipos altos de la Fed, las importaciones como el petróleo o la tecnología cotizadas en dólares resultan más caras.":
    "Directly affects mortgage rates, credit cards, savings yields, and the strength of the US dollar worldwide.",
  "Es la referencia libre de riesgo que fija el listón de rentabilidad exigido a cualquier inversión en el mundo. Subidas rápidas de tipos enfrían los múltiplos de valoración de las acciones de crecimiento.":
    "Acts as the global 'risk-free' benchmark. Sharp rate hikes raise the bar for stocks and tend to cool down high-growth valuations.",

  "Desempleo EE.UU.": "US Unemployment",
  "Tasa de paro civil en Estados Unidos, desestacionalizada, estimada mensualmente por el BLS.":
    "The monthly US civilian unemployment rate reported by the Bureau of Labor Statistics.",
  "Porcentaje de la fuerza laboral estadounidense que se encuentra sin trabajo pero buscando activamente empleo durante el periodo de referencia mensual.":
    "The percentage of Americans in the workforce who don't have a job and are actively looking for one.",
  "El estado del empleo estadounidense es el termómetro de la demanda de consumo del mayor importador del mundo, influyendo en la prosperidad del comercio internacional.":
    "US job health drives consumer spending in the world's largest economy, shaping global trade and business confidence.",
  "Un aumento repentino del desempleo suele ser el síntoma más claro de un cambio de ciclo o recesión, anticipando bajadas de tipos de interés para reactivar el mercado de trabajo.":
    "A sudden spike in unemployment is often an early recession warning—and usually pushes the Fed toward cutting rates to support growth.",

  // Pérdida de poder adquisitivo (purchasing-power-card.tsx)
  "Erosión de poder adquisitivo acumulada": "Cumulative Purchasing Power Loss",
  "¿Cuánto vale tu dinero?": "What Is Your Money Really Worth?",
  "Zona Euro (100 €)": "Eurozone (€100)",
  "EE.UU. (100 $)": "US ($100)",
  "Comparar ambos": "Compare Both",
  "Poder inicial de compra": "Starting Buying Power",
  "Inicio": "Start",
  "Valor real actual": "Real Value Today",
  "Actualidad": "Today",
  "Pérdida de compra": "Buying Power Lost",
  "Inflación media anual": "Avg. Yearly Inflation",
  "Fuente: BLS (CPI)": "Source: BLS (CPI)",
  "Fuente: Eurostat (IPCA)": "Source: Eurostat (HICP)",
  "Horizonte temporal:": "Timeframe:",
  "15 años": "15 Years",
  "20 años": "20 Years",
  "Máx.": "Max",
  "🇪🇺 Zona Euro (100 €)": "🇪🇺 Eurozone (€100)",
  "🇺🇸 Estados Unidos (100 $)": "🇺🇸 United States ($100)",
  "¿Por qué 100 € valen menos?": "Why Does €100 Buy Less Over Time?",
  "El número en el billete sigue siendo 100, pero como los precios de la comida, la energía y la vivienda suben con la inflación, necesitas más dinero para comprar exactamente la misma cesta.":
    "The bill still says 100 on it, but as groceries, rent, and energy get pricier every year, that same 100 buys less and less.",
  "El impuesto silencioso": "The Silent Tax",
  "Dejar el dinero parado en una cuenta corriente al 0 % garantiza perder poder de compra todos los meses. En 10 años, una inflación moderada del 2,5 % hace que tu dinero pierda más del 20 % de su valor.":
    "Leaving extra cash sitting at 0% interest guarantees it loses buying power every month. Even mild 2.5% inflation wipes out over 20% of its value in 10 years.",
  "La solución: invertir": "The Fix: Put Money to Work",
  "Para conservar y hacer crecer tu patrimonio es imprescindible invertir en activos productivos (empresas con ventajas competitivas, fondos o deuda remunerada) cuya rentabilidad supere la inflación.":
    "To protect and grow your wealth over time, your money needs to be in productive assets—quality businesses, index funds, or interest-bearing bonds that beat inflation.",

  // --- PRESUPUESTO PERSONAL, INTERÉS COMPUESTO E INFLACIÓN ---
  "Calculador de Presupuesto Personal e Interés Compuesto":
    "Personal Budget & Compound Interest Planner",
  "Desglosa tus ingresos mensuales en las 6 proporciones recomendadas (30% vivienda, 20% ahorro, 15% comida, 15% ocio, 10% suministros, 10% otros) y proyecta tu inversión con interés compuesto.":
    "Split your monthly income across 6 practical buckets and see how your savings can grow with compound interest.",
  "Regla Económica Recomendada de Gestión Financiera": "Simple 6-Bucket Money Rule",
  "Calculador de Presupuesto Personal": "Personal Budget Planner",
  "Introduce tus ingresos mensuales para desglosar automáticamente tus gastos e inversión según las proporciones recomendadas. Puedes ajustar cada porcentaje libremente.":
    "Enter your monthly take-home pay to automatically split your spending and savings—and feel free to tweak any slider to fit your life.",
  "Simular Interés Compuesto": "Compound Interest Simulator",
  "Calculadora de Inflación": "Inflation Calculator",
  "Ingresos Mensuales Totales (100%)": "Total Monthly Income (100%)",
  "Sueldo neto mensual tras impuestos o ingresos regulares de tu unidad familiar.":
    "Your monthly take-home pay after taxes (or combined household income).",
  "€ / mes": "€ / mo",
  "/ mes": "/ mo",
  "/mes": "/mo",
  "/ año": "/ yr",
  "/año": "/yr",
  "€/mes": "€/mo",
  "100% Asignado · Presupuesto equilibrado": "100% Allocated · Budget balanced",
  "Restablecer porcentajes recomendados": "Reset to recommended split",
  "Límite Máximo Asignado": "Max Monthly Budget",
  "¿Cuánto valdrá este ahorro invertido?": "How much could this savings grow?",

  // Categorías del presupuesto (budget/types.ts)
  "Gastos de Vivienda": "Housing",
  "Vivienda": "Housing",
  "Hipoteca, alquiler, comunidad, IBI y seguro de hogar.":
    "Rent or mortgage, HOA fees, property tax, and home insurance.",
  "Hipoteca/alquiler, IBI, comunidad": "Mortgage/rent, property tax, HOA",
  "Ahorro e Inversión": "Savings & Investing",
  "Ahorro": "Savings",
  "Fondo de emergencia, fondos indexados, acciones y jubilación.":
    "Emergency fund, index funds, individual stocks, and retirement.",
  "Inversión, colchón de emergencia, aportaciones":
    "Investing, emergency fund, retirement",
  "Comida": "Groceries & Food",
  "Compra de supermercado y alimentación básica familiar.":
    "Supermarket trips and everyday household groceries.",
  "Supermercado, carnicería, frutería": "Supermarket, fresh produce, pantry",
  "Ocio / Estilo de Vida": "Lifestyle & Fun",
  "Ocio": "Fun",
  "Restaurantes, viajes, salidas, aficiones, compras y suscripciones.":
    "Dining out, travel, hobbies, shopping, and streaming subscriptions.",
  "Cenas, viajes, cine, suscripciones": "Restaurants, trips, movies, subscriptions",
  "Suministros y Servicios": "Utilities & Bills",
  "Suministros": "Utilities",
  "Electricidad, gas, agua, telefonía móvil e internet.":
    "Electricity, gas, water, cell phone, and home internet.",
  "Luz, gas, agua, internet, móvil": "Power, gas, water, internet, phone",
  "Otros / Imprevistos": "Other & Unexpected",
  "Otros": "Other",
  "Transporte, combustible, salud, farmacia y gastos inesperados.":
    "Transit, gas, healthcare, pharmacy, and surprise expenses.",
  "Gasolina, transporte, averías, farmacia": "Fuel, transit, repairs, pharmacy",

  // Compound Interest Dialog (compound-interest-dialog.tsx & budget/types.ts)
  "Calculador de Interés Compuesto": "Compound Interest Calculator",
  "Simula el crecimiento exponencial de tu patrimonio a largo plazo con aportaciones periódicas.":
    "See how regular monthly contributions can snowball over time through compounding.",
  "Rentabilidad Anual": "Annual Return",
  "anual compuesto": "compounded yearly",
  "Total aportado por ti:": "Total you put in:",
  "Generado por intereses:": "Earned from compounding:",
  "Pérdida por depreciación:": "Loss from negative return:",
  "Aporte Inicial (Capital de partida)": "Starting Amount",
  "Aporte Mensual": "Monthly Contribution",
  "Plazo de Inversión": "Time Horizon",
  "Preajustes de Rentabilidad (Promedios Históricos)":
    "Return Benchmarks (Historical Averages)",
  "Empresa Singular": "Single Stock",
  "Buscador": "Search",
  "Busca una acción cotizada": "Pick any public stock",
  "Personalizado": "Custom Rate",
  "Ajusta la tasa anual libremente": "Set any annual return",
  "Tasa Anual Manual:": "Custom Annual Return:",
  "Buscador de Empresa Singular": "Single Stock Lookup",
  "Buscar empresa por nombre o ticker (ej. Apple, AAPL, Microsoft, Inditex...)":
    "Search by company or ticker (e.g. Apple, AAPL, Microsoft, ASML...)",
  "Sugerencias:": "Suggestions:",
  "Cotización inicial:": "Starting price:",
  "Cotización final:": "Ending price:",
  "Retorno acumulado total:": "Total cumulative return:",
  "Aviso Legal Importante: Rentabilidades pasadas no garantizan rendimientos futuros.":
    "Heads up: Past performance doesn't guarantee future results.",
  "Evolución del Patrimonio en el Tiempo": "How Your Money Grows Over Time",
  "Observa cómo la curva de intereses supera progresivamente a las aportaciones del bolsillo.":
    "Watch how investment gains eventually outpace the cash you put in yourself.",
  "Total aportado": "Money contributed",
  "Intereses generados": "Investment gains",
  "Capital acumulado:": "Total value:",
  "Total aportado:": "You contributed:",
  "Intereses ganados:": "Gains earned:",
  "No se encontraron cotizaciones para este valor.": "No price history found for that ticker.",
  "No hay suficientes datos de precios para este valor.": "Not enough price history for that ticker.",
  "Error al consultar cotizaciones.": "Couldn't load price quotes.",
  "Media histórica anualizada de los últimos 10 años.": "10-year historical average return.",
  "Las 500 mayores empresas cotizadas de Estados Unidos.": "The 500 largest US public companies.",
  "Media histórica de rendimiento tecnológico.": "Historical tech-heavy market average.",
  "Índice de referencia de las empresas líderes en tecnología e innovación.":
    "Benchmark index of leading technology and growth companies.",
  "Promedio global diversificado.": "Diversified global stock average.",
  "Renta variable global de más de 23 países desarrollados.":
    "Global equities across 23+ developed countries.",
  "Promedio europeo.": "European blue-chip average.",
  "Las 50 mayores empresas cotizadas de la Eurozona.": "The 50 largest Eurozone public companies.",
  "Promedio histórico con dividendos.": "Historical average including dividends.",
  "Principal selectivo bursátil del mercado español.": "Spain's main stock market benchmark.",
  "Bono Institucional / Renta Fija": "Government Bonds / Fixed Income",
  "Renta Fija": "Bonds",
  "Promedio de deuda pública a largo plazo.": "Long-term government bond average.",
  "Bonos soberanos e instrumentos de deuda gubernamental de alta calidad.":
    "High-grade sovereign debt and government bonds.",

  // Inflation Calculator Dialog
  "Calculadora de Inflación Personal": "Personal Inflation Calculator",
  "Comprueba la pérdida real de poder adquisitivo de tu dinero en cuenta bancaria y cómo protegerlo invirtiendo.":
    "See how inflation quietly shrinks idle bank cash—and how investing helps you stay ahead.",
  "Dinero ahorrado / Capital:": "Cash / Savings Amount:",
  "Inflación anual esperada:": "Expected yearly inflation:",
  "Rentabilidad inversión (opcional):": "Investment return (optional):",
  "Activado": "On",
  "Desactivado": "Off",
  "En cuenta corriente (0 %)": "Sitting in cash (0%)",
  "Erosión acumulada por no rentabilizar": "Buying power lost by holding 0% cash",
  "Coste futuro equivalente": "Future Price Tag",
  "Encarecimiento de la misma cesta de compras": "Same basket of goods, future cost",
  "Poder de compra real (ajustado a inflación)": "Real buying power (inflation-adjusted)",
  "Patrimonio protegido y multiplicado": "Purchasing power protected & growing",
  "Evolución del poder de compra real a lo largo de los años":
    "Real Buying Power Year by Year",
  "Dinero en cuenta (0 %)": "Cash in bank (0%)",
  "Poder real en cuenta corriente": "Real buying power in cash",
  "Poder real invertido": "Real buying power invested",
  "La regla para proteger tu ahorro: La única manera demostrada de no perder riqueza a largo plazo es mantener el dinero en activos productivos cuya rentabilidad neta supere la inflación.":
    "The golden rule: the only reliable way to keep your savings from shrinking is owning productive assets that earn more than inflation.",
  "Cero riesgo nominal no es cero riesgo real: Tener el dinero \"seguro\" en la cuenta corriente garantiza una pérdida segura del 100 % de la inflación acumulada.":
    "Safe on paper isn't safe in real life: leaving money at 0% interest guarantees it loses value to inflation every single year.",
  "Objetivo BCE (2,0 %)": "ECB Target (2.0%)",
  "Meta oficial del Banco Central Europeo de estabilidad de precios.":
    "The European Central Bank's official price stability target.",
  "Media Eurozona (2,8 %)": "Eurozone Avg. (2.8%)",
  "Inflación media anual experimentada en la zona euro en el último lustro.":
    "Average Eurozone inflation over the past 5 years.",
  "Media EE.UU. (3,6 %)": "US Avg. (3.6%)",
  "Inflación media anual del IPC de Estados Unidos en los últimos años.":
    "Average US CPI inflation in recent years.",
  "Inflación Alta (5,0 %)": "High Inflation (5.0%)",
  "Escenario de tensión de precios o crisis energética/suministros.":
    "Elevated price pressure or supply-shock scenario.",
  "Cuenta corriente / Efectivo (0 %)": "Checking / Cash (0%)",
  "Dinero no remunerado que sufre toda la erosión de la inflación.":
    "Uninvested cash taking the full hit from inflation.",
  "Letras del Tesoro / Depósitos (3,0 %)": "Treasury Bills / CDs (3.0%)",
  "Renta fija conservadora a corto plazo para amortiguar la inflación.":
    "Short-term safe fixed income to help cushion inflation.",
  "Fondos Indexados / Bolsa Global (7,0 %)": "Index Funds / Global Stocks (7.0%)",
  "Rentabilidad histórica promedio a largo plazo de la renta variable.":
    "Long-term historical average return for global stocks.",
};
