/**
 * Diccionario de empresa: perfil, las 6 claves, estados financieros, ratios,
 * valoración, técnico, opciones, copiloto, noticias y animaciones de Cid.
 * Traducción cercana, natural y fácil de entender (sin calcos literales).
 */
export const COMPANY_DICTIONARY: Record<string, string> = {
  // --- CABECERA Y PESTAÑAS DE EMPRESA ---
  "Perfil": "Overview",
  "Estados financieros": "Financials",
  "Valoración": "Valuation",
  "Análisis técnico": "Technicals",
  "Copiloto": "AI Copilot",
  "Cotización histórica": "Price History",
  "Análisis fundamental": "Company Fundamentals",
  "Evolución histórica agregada": "Historical Financial Trends",
  "Evolución histórica": "Historical Trends",
  "Las seis claves": "The 6 Keys",
  "Cuenta de resultados": "Income Statement",
  "Balance de situación": "Balance Sheet",
  "Flujo de caja": "Cash Flow",
  "Ratios y márgenes": "Ratios & Margins",
  "Múltiplos y Valoración": "Valuation & Multiples",
  "Múltiplos y valoración": "Valuation & multiples",
  "Calculadora de proyecciones": "5-Year Calculator",
  "Panel de auditoría": "Data Audit",
  "Constitución": "Incorporated",
  "Sin clasificar": "Unclassified",
  "No clasificado": "Unclassified",
  "Empresa Cotizada": "Public Company",

  // Sidebar de perfil
  "Identidad": "Company Info",
  "Razón social": "Legal Name",
  "Sector": "Sector",
  "Industria": "Industry",
  "Mercado": "Exchange",
  "Domicilio": "Location",
  "Web": "Website",
  "Último informe anual": "Latest Annual Report",
  "Último informe regulatorio": "Latest Official Filing",
  "Formulario": "Filing Type",
  "Presentado": "Filed",
  "Actualizado": "Updated",
  "Referencia": "Reference",
  "Número de acceso": "Accession No.",
  "Abrir el documento en EDGAR": "Open filing on SEC EDGAR",
  "Explorar": "Jump To",
  "Análisis técnico e indicadores": "Technical charts & indicators",
  "Copiloto de informe 10-K": "10-K Report Copilot",
  "Fuente regulatoria": "Official Filing",
  "fuente regulatoria": "official filing",
  "informe ESEF": "ESEF filing",
  "Estados financieros estructurados publicados por la empresa.":
    "Official financial statements reported by the company.",
  "No hay estados regulatorios estructurados suficientes para esta frecuencia y este emisor. Prueba la vista anual o el ticker local con su sufijo de mercado.":
    "Not enough structured financial data for this timeframe. Try switching to Annual view or searching with the local market ticker suffix.",
  "No hay una serie de cotización disponible. Altius no la sustituye por ceros.":
    "No stock price history available. Altius never fills missing prices with zeros.",
  "No hay observaciones entre las fechas seleccionadas. Amplía el intervalo.":
    "No price data in that date range—try widening the dates.",
  "No hay proveedor de cotizaciones configurado. Añade ALPHAVANTAGE_API_KEY en el entorno para activar el gráfico; el resto de la aplicación no lo necesita.":
    "Price history provider is not configured (set ALPHAVANTAGE_API_KEY). All fundamental filings still work normally.",
  "No hay proveedor de cotizaciones configurado. Añade ALPHAVANTAGE_API_KEY en el entorno para activar el análisis técnico completo; el resto de la aplicación no lo necesita.":
    "Price history provider is not configured (set ALPHAVANTAGE_API_KEY) for technical charts.",

  // --- EL NEGOCIO EN 30 SEGUNDOS (COMPANY SNAPSHOT) ---
  "El negocio en 30 segundos": "30-Second Snapshot",
  "Qué hace y cómo gana dinero": "What They Do & How They Make Money",
  "A qué se dedica": "What they do",
  "Cómo gana dinero": "How they make money",
  "División que más beneficio aporta": "Biggest Profit Driver",
  "Beneficio por divisiones": "Profit by Division",
  "No publicado de forma comparable": "Not broken out by profit",
  "El informe no desglosa un beneficio operativo comparable para al menos dos divisiones. Por eso no se señala una como la más rentable basándose solo en ventas.":
    "The annual report doesn't break out profit across at least two business lines, so we won't guess which division is most profitable from sales alone.",
  "Ver el texto localizado en el informe anual": "Read the matching excerpt from the annual report",
  "Lectura rápida": "Quick Read",
  "Tres cosas que llaman la atención": "3 Key Takeaways",

  // Copias de industria (company-research.ts)
  "Opera plataformas digitales que conectan usuarios, creadores y anunciantes, apoyadas por software, datos e infraestructura tecnológica.":
    "Runs digital platforms connecting everyday users, creators, and advertisers using proprietary software and cloud tech.",
  "Cobra a los anunciantes por mostrar anuncios a públicos concretos. También puede cobrar suscripciones, servicios digitales o uso de infraestructura.":
    "Makes money primarily from digital ads shown to targeted audiences, alongside subscriptions and cloud or digital services.",
  "Combina comercio electrónico, logística y una plataforma de infraestructura tecnológica en la nube.":
    "Blends massive online retail and delivery logistics with a major cloud computing platform.",
  "Ingresa por ventas directas, comisiones a vendedores, suscripciones, publicidad y consumo de servicios cloud.":
    "Earns money from direct product sales, third-party seller fees, memberships, ads, and cloud usage.",
  "Desarrolla software y servicios tecnológicos que empresas y particulares usan en sus procesos, datos y operaciones digitales.":
    "Builds software and cloud tools that businesses and individuals rely on for everyday work and data.",
  "Cobra por licencias de software, suscripciones mensuales o anuales, uso de la nube, soporte y servicios para empresas.":
    "Charges for software licenses, recurring subscriptions, cloud usage, support, and enterprise services.",
  "Facilita pagos electrónicos entre consumidores, comercios, bancos y otras entidades mediante una red o plataforma tecnológica.":
    "Powers electronic payments between shoppers, merchants, and banks over a global payment network.",
  "Se queda con una pequeña comisión cada vez que procesa un pago y cobra por servicios adicionales a bancos y comercios; normalmente no presta el dinero de la compra.":
    "Takes a tiny cut every time a payment goes through and charges for value-added merchant/bank tools—usually without lending the money itself.",
  "Diseña, fabrica o comercializa semiconductores y tecnologías esenciales para computación, comunicaciones y centros de datos.":
    "Designs, manufactures, or sells microchips and tech critical for computing, devices, and AI data centers.",
  "Gana dinero vendiendo chips, sistemas y componentes; algunas compañías añaden licencias de propiedad intelectual y software.":
    "Makes money selling chips, systems, and hardware components, often paired with software and IP licensing.",
  "Fabrica máquinas y software que los fabricantes de chips necesitan para dibujar circuitos diminutos sobre las obleas de silicio.":
    "Builds the specialized machines and software that chipmakers need to print tiny circuits onto silicon wafers.",
  "Cobra al vender cada máquina y sigue ingresando durante años por instalación, mantenimiento, repuestos, mejoras y software para los equipos ya instalados.":
    "Sells high-value machines upfront and earns years of recurring revenue from installation, upkeep, spare parts, and upgrades.",
  "Diseña y comercializa dispositivos tecnológicos, componentes, software y servicios conectados alrededor de su ecosistema.":
    "Designs and sells consumer tech devices along with connected software and services built around its ecosystem.",
  "Cobra al vender los dispositivos y vuelve a ingresar dinero con aplicaciones, contenidos, almacenamiento, garantías y suscripciones.":
    "Makes money selling hardware devices, then keeps earning from apps, content, cloud storage, warranties, and subscriptions.",
  "Intermedia ahorro y crédito y presta servicios bancarios a particulares, empresas e inversores.":
    "Takes in deposits, issues loans, and provides banking and investment services to people and businesses.",
  "Gana con el margen entre intereses cobrados y pagados, además de comisiones por pagos, gestión, mercados y otros servicios financieros.":
    "Earns the spread between interest charged on loans and interest paid on deposits, plus fees from payments, wealth management, and trading.",
  "Asume y administra riesgos mediante seguros o reaseguros para particulares y empresas.":
    "Provides insurance and reinsurance coverage to help people and businesses manage risk.",
  "Ingresa primas y obtiene rendimiento al invertir temporalmente el capital recibido antes de pagar siniestros y prestaciones.":
    "Collects upfront premiums and invests that float until claims need to be paid out.",
  "Gestiona inversiones y soluciones de cartera para clientes institucionales y particulares.":
    "Manages investment funds and portfolios for institutions and everyday investors.",
  "Cobra comisiones sobre los activos gestionados, productos de inversión, tecnología y, en ciertos casos, resultados obtenidos.":
    "Earns fees based on assets under management, investment products, financial tech, and performance fees.",
  "Presta, coordina o financia servicios sanitarios para pacientes, empresas y administraciones.":
    "Provides, manages, or funds healthcare services for patients, employers, and government programs.",
  "Ingresa primas, cuotas o pagos por servicios médicos y gana según el equilibrio entre esos ingresos y el coste asistencial.":
    "Collects insurance premiums or medical service fees, profiting when revenue outweighs care costs.",
  "Investiga, desarrolla y comercializa medicamentos, terapias o productos sanitarios protegidos por regulación y propiedad intelectual.":
    "Researches, develops, and sells medicines, therapies, or medical devices protected by patents.",
  "Gana con la venta de tratamientos y productos médicos; el precio, las patentes, el volumen y el éxito clínico determinan la economía del negocio.":
    "Makes money selling approved treatments and medical products—where pricing, patent life, and clinical results drive profits.",
  "Participa en la producción, transformación, transporte o comercialización de petróleo, gas y otros productos energéticos.":
    "Produces, refines, transports, or sells oil, natural gas, and energy products.",
  "Sus ingresos dependen del volumen producido o refinado, los precios de la energía y los márgenes de transformación y comercialización.":
    "Earnings depend on production volumes, energy prices, and refining/marketing margins.",
  "Extrae y procesa minerales y materias primas que abastecen a industrias globales.":
    "Extracts and processes metals and raw materials that supply global industry.",
  "Gana vendiendo producción minera; los precios de las materias primas, el coste de extracción y la calidad de los activos marcan el margen.":
    "Makes money selling mined output, with margins driven by commodity prices, mining costs, and ore quality.",
  "Produce, transporta o distribuye electricidad, gas u otros servicios esenciales mediante infraestructuras de larga duración.":
    "Generates, transmits, or delivers electricity, gas, and essential utilities through long-term infrastructure.",
  "Cobra por energía y capacidad suministrada, a menudo con tarifas reguladas o contratos de largo plazo.":
    "Earns steady revenue for power and capacity delivered, typically under regulated rates or long-term contracts.",
  "Opera redes de comunicaciones que conectan personas, dispositivos y empresas.":
    "Runs telecom networks that keep people, mobile devices, and businesses connected.",
  "Cobra cuotas mensuales por conexión y datos, además de vender teléfonos, equipos y servicios a empresas.":
    "Charges monthly bills for mobile and internet plans, plus device sales and business connectivity.",
  "Mueve mercancías o pasajeros mediante una red logística y activos de transporte.":
    "Moves freight or passengers using logistics networks, fleets, or rail.",
  "Cobra por trayectos, envíos y servicios logísticos; volumen, precio por unidad, combustible y utilización de la red determinan el beneficio.":
    "Charges per shipment or trip—profit depends on volume, pricing, fuel costs, and how full the network runs.",
  "Diseña, fabrica y comercializa vehículos, componentes y servicios asociados a la movilidad.":
    "Designs, builds, and sells vehicles, auto parts, and mobility services.",
  "Gana con la venta o financiación de vehículos y con servicios, software, recambios o energía vinculados al parque instalado.":
    "Earns from selling or financing vehicles, plus ongoing revenue from parts, service, software, or charging.",
  "Compra y distribuye productos de consumo a través de tiendas físicas, comercio electrónico o clubes de socios.":
    "Sources and sells everyday consumer goods through physical stores, online shopping, or membership clubs.",
  "Gana con el margen entre el precio de venta y el coste del producto; algunas cadenas añaden cuotas de membresía, publicidad o servicios.":
    "Profits on the markup between wholesale cost and retail price, sometimes boosted by membership fees and ads.",
  "Diseña y vende ropa, calzado, accesorios y artículos para el hogar a través de tiendas y comercio electrónico.":
    "Designs and sells clothing, shoes, accessories, and home goods in stores and online.",
  "Gana con la diferencia entre lo que cobra por cada prenda o artículo y lo que cuesta diseñarlo, fabricarlo, transportarlo y venderlo. La rotación rápida del inventario y las tiendas propias son claves.":
    "Profits on each item sold minus design, manufacturing, shipping, and store costs—where fast inventory turnover is key.",
  "Desarrolla y vende marcas y productos de consumo que se venden de forma recurrente a hogares y consumidores.":
    "Creates and markets household brands and everyday products bought again and again.",
  "Gana por volumen, precio y mezcla de productos, apoyándose en marca, distribución y repetición de compra.":
    "Makes money from repeat everyday purchases, leaning on brand loyalty, pricing power, and wide distribution.",
  "Reúne marcas de lujo que venden moda, bolsos, perfumes, cosméticos, relojes, joyas, vinos y bebidas de alta gama.":
    "Owns luxury brands selling high-end fashion, leather goods, fragrances, watches, jewelry, and fine spirits.",
  "Gana al vender productos de lujo con márgenes altos, sobre todo a través de tiendas propias y distribución selectiva. Cada grupo de marcas aporta ventas y beneficio por separado.":
    "Commands high margins selling luxury goods mostly through its own boutiques and selective retail.",
  "Opera o licencia establecimientos de restauración y una marca de consumo con presencia física y digital.":
    "Runs or franchises restaurants and food brands across physical locations and digital ordering.",
  "Ingresa por ventas en locales propios y, cuando franquicia, por alquileres y royalties vinculados a las ventas de terceros.":
    "Makes money from company-owned store sales plus rent and royalties collected from franchisees.",
  "Distribuye contenidos, entretenimiento o servicios digitales que conectan audiencias con una plataforma.":
    "Produces or distributes entertainment, media, and digital content to large audiences.",
  "Monetiza suscripciones, publicidad, comisiones o licencias; la escala de audiencia y el coste de contenido son determinantes.":
    "Earns from subscriptions, ads, fees, and licensing—balancing audience size against content costs.",
  "Diseña y vende equipos, sistemas o componentes industriales para clientes empresariales y administraciones.":
    "Builds industrial equipment, machinery, and systems for business and government customers.",
  "Combina venta de equipos con recambios, mantenimiento, contratos de servicio y proyectos de larga duración.":
    "Combines upfront equipment sales with high-margin spare parts, servicing, and long-term contracts.",
  "Posee, desarrolla o gestiona inmuebles y activos reales destinados a alquiler o explotación.":
    "Owns, develops, or manages properties and real estate assets.",
  "Gana con rentas, ocupación, revalorizaciones y, en ocasiones, desarrollo o venta de activos.":
    "Makes money from rental income, high occupancy, property appreciation, and asset sales.",
  "Agrupa negocios de distintas industrias bajo una misma matriz y asigna capital entre ellos.":
    "Owns a collection of businesses across different industries and allocates capital among them.",
  "Gana con el beneficio de sus filiales, primas e inversiones, dividendos y plusvalías de las participaciones que controla.":
    "Earns from subsidiary profits, insurance float, investment income, dividends, and asset gains.",
  "Presta servicios especializados y soluciones operativas o tecnológicas a empresas y profesionales.":
    "Provides specialized services, software, and operational support to businesses and professionals.",
  "Monetiza contratos, suscripciones, uso de plataforma y servicios recurrentes ligados al volumen de sus clientes.":
    "Charges via contracts, recurring subscriptions, platform usage, and volume-based service fees.",
  "Genera ingresos vendiendo los productos o servicios propios de esa actividad; el informe anual enlazado permite comprobar el detalle operativo.":
    "Earns revenue selling its core products and services—check the linked annual report for full operating details.",

  // Segmentos conocidos (segments.ts)
  "Productividad y procesos empresariales": "Productivity & Business Processes",
  "Nube inteligente": "Intelligent Cloud",
  "Informática personal": "More Personal Computing",
  "Banca comercial y de inversión": "Commercial & Investment Bank",
  "Banca para particulares y pequeños negocios": "Consumer & Community Banking",
  "Gestión de activos y patrimonios": "Asset & Wealth Management",
  "Norteamérica": "North America",
  "Internacional": "International",
  "Vinos y bebidas espirituosas": "Wines & Spirits",
  "Moda y marroquinería": "Fashion & Leather Goods",
  "Perfumes y cosméticos": "Perfumes & Cosmetics",
  "Relojes y joyería": "Watches & Jewelry",
  "Distribución selectiva": "Selective Retailing",
  "beneficio neto por segmento": "segment net profit",
  "beneficio operativo por segmento": "segment operating profit",
  "resultado operativo recurrente por división": "recurring operating profit by division",

  // Lectura rápida (ATTENTION_TITLES)
  "El crecimiento llega al beneficio por acción": "Growth is reaching the bottom line",
  "El crecimiento todavía no es redondo": "Growth is still a mixed bag",
  "Ventas y beneficio no avanzan juntos": "Sales and profits aren't growing together",
  "Falta histórico para juzgar el crecimiento": "Not enough history to judge growth",
  "El capital trabaja con fuerza": "Strong return on invested money",
  "La rentabilidad del capital es intermedia": "Middle-of-the-road return on capital",
  "El capital produce poco retorno": "Low return on invested money",
  "No se puede medir bien el retorno": "Hard to measure capital returns",
  "El beneficio sí termina en caja": "Profits turn into real cash",
  "La conversión en caja merece seguimiento": "Cash conversion is worth watching",
  "La caja no acompaña al beneficio": "Cash flow isn't backing up earnings",
  "La calidad del beneficio no está cubierta": "Not enough cash flow history",
  "El balance da margen de maniobra": "Healthy balance sheet with breathing room",
  "La deuda exige vigilancia": "Debt levels need keeping an eye on",
  "El balance es un punto de riesgo": "Heavy debt makes the balance sheet risky",
  "No hay cobertura suficiente del balance": "Not enough balance sheet data",
  "El accionista no se diluye": "No shareholder dilution",
  "Hay una ligera dilución por acción": "Mild share dilution",
  "La emisión de acciones resta crecimiento": "New shares are diluting your stake",
  "Falta la serie de acciones diluidas": "Share count history missing",
  "La valoración no supera su historia": "Fairly priced vs its own history",
  "El precio incorpora una prima moderada": "Trading slightly above its usual price",
  "El precio exige más que su valoración habitual": "Priced richer than its usual average",
  "El precio no puede compararse con su historia": "Can't compare valuation to history yet",

  // --- LAS SEIS CLAVES (QUALITY SCORECARD & QUALITY.TS) ---
  "Criterios cumplidos": "Keys passed",
  "Cobertura": "Coverage",
  "Cómo se calcula": "How it works",
  "Crecimiento duradero": "Steady Growth",
  "Rentabilidad del capital": "Return on Capital",
  "Beneficio convertido en caja": "Real Cash Flow",
  "Beneficio fiable": "Consistent Profits",
  "Balance resistente": "Solid Balance Sheet",
  "Disciplina por acción": "Shareholder Discipline",
  "Precio con margen": "Fair Valuation",
  "Negocio": "Business",
  "Calidad": "Quality",
  "Beneficio": "Earnings",
  "Caja": "Cash Flow",
  "Solvencia": "Balance Sheet",
  "Accionista": "Shareholders",
  "Por qué cumple": "Why it passes",
  "Qué vigilar": "What to watch",
  "Qué no cumple": "Why it misses",
  "Sin dato": "No data",
  "PASA": "PASS",
  "VIGILAR": "WATCH",
  "NO PASA": "FAIL",
  "SIN DATO": "NO DATA",
  "Cumple el requisito": "Meets the benchmark",
  "En vigilancia": "Borderline — keep watching",
  "No cumple el requisito": "Below the benchmark",
  "Sin dato comparable": "No comparable data",
  "Caja neta": "Net Cash",
  "Deuda neta": "Net Debt",
  "Foro ValueInvesting": "ValueInvesting Forum",

  // Descripciones cortas de las 6 claves (KEY_MEANINGS)
  "Comprueba que ventas y beneficio por acción crezcan juntos durante varios años.":
    "Checks that revenue and earnings per share actually grow together over multiple years.",
  "Mide cuánto beneficio genera la empresa con el capital que necesita para operar.":
    "Shows how efficiently the business turns invested money into real profit.",
  "Verifica que el beneficio contable termine convirtiéndose en caja real.":
    "Makes sure reported accounting profits actually turn into real cash flow.",
  "Evalúa si la deuda y la liquidez permiten resistir años difíciles.":
    "Checks if the company has enough cash and low enough debt to handle tough years.",
  "Comprueba que el crecimiento no se pierda al emitir demasiadas acciones.":
    "Checks that growth isn't watered down by issuing too many new shares.",
  "Compara el PER actual con la valoración habitual de la propia empresa.":
    "Compares today's P/E ratio against what this company normally trades for.",

  // Criterios / umbrales
  "Ingresos y beneficio ≥ 5 % CAGR": "Sales & EPS growth ≥ 5% / yr",
  "ROIC mediano ≥ 12 %": "Median ROIC ≥ 12%",
  "CFO/beneficio ≥ 90 % y FCF recurrente": "Cash conversion ≥ 90% & steady FCF",
  "Beneficio positivo ≥ 80 % de los años": "Profitable in ≥ 80% of years",
  "Caja neta o deuda neta ≤ 2x EBITDA": "Net cash or Net Debt ≤ 2x EBITDA",
  "Acciones estables o decrecientes": "Flat or shrinking share count",
  "PER ≤ su mediana histórica": "P/E ≤ its historical median",
  "PER ≤ 20x (sin historia)": "P/E ≤ 20x (limited history)",
  "Sin PER · pérdidas": "No P/E · unprofitable",
  "ROE sectorial mediano ≥ 12 %": "Median sector ROE ≥ 12%",
  "ROE (proxy) mediano ≥ 12 %": "Median ROE (proxy) ≥ 12%",
  "Patrimonio/activo ≥ 7 %": "Equity / assets ≥ 7%",
  "Patrimonio/activo ≥ 10 %": "Equity / assets ≥ 10%",
  "negocio y beneficio avanzan juntos por encima del umbral, sin depender de un único salto.":
    "sales and EPS are both clearing the 5% bar consistently, without relying on a single lucky year.",
  "una de las dos series retrocede; ingresos y beneficio por acción no avanzan juntos.":
    "at least one metric is shrinking—sales and EPS aren't moving up together.",
  "ambas series se mantienen o crecen, pero alguna todavía no alcanza el 5 % anual.":
    "both are holding steady or growing, though one hasn't quite cleared the 5%/yr mark yet.",
  "solo hay una de las dos series comparables; Cid no da el crecimiento por completo.":
    "only one of the two series has enough comparable history—Cid needs both to call growth complete.",
  "Al no haber una historia suficiente, se usa una banda absoluta conservadora.":
    "Without enough history to compare, we use a conservative rule of thumb instead.",

  // Metodología popover
  "Método para empresas operativas": "Standard Operating Company Method",
  "Método para empresas operativas.": "Standard Operating Company Method.",
  "Método sectorial para bancos, aseguradoras y mercados de capitales":
    "Financial Sector Method (Banks, Insurers & Capital Markets)",
  "Método sectorial para bancos, aseguradoras y mercados de capitales.":
    "Financial Sector Method (Banks, Insurers & Capital Markets).",
  "El análisis compara tendencias de varios ejercicios en crecimiento, retorno sobre capital, caja, balance, disciplina por acción y valoración. Un dato ausente se identifica como tal y nunca se inventa.":
    "We look at multi-year trends across growth, returns on capital, cash generation, debt, share count, and valuation. If a number isn't reported, we leave it blank—never guessed.",
  "No hay datos comparables suficientes para evaluar las claves.":
    "Not enough comparable history yet to score The 6 Keys.",

  // Por qué importa (whyItMatters) & fallbacks en sec/quality.ts
  "El valor sostenible nace de vender más y convertir ese avance en más beneficio por acción.":
    "Long-term value comes from growing sales and turning that growth into higher earnings per share.",
  "Un retorno alto y repetible es la mejor señal cuantitativa de ventaja competitiva y buena reinversión.":
    "Consistently high returns on capital are one of the clearest signs of a strong competitive moat.",
  "La regularidad del beneficio ayuda a separar una franquicia financiera sólida de un resultado puntual.":
    "Steady year-after-year profits show a solid financial business rather than one-off luck.",
  "La caja confirma que el beneficio contable es utilizable para reinvertir, reducir deuda o remunerar al accionista.":
    "Real cash proves profits aren't just on paper—they can pay down debt, fund growth, or reward shareholders.",
  "En bancos y aseguradoras importa el colchón que absorbe pérdidas, no una deuda/EBITDA industrial.":
    "For banks and insurers, capital cushion matters far more than traditional debt-to-EBITDA.",
  "Un balance prudente permite atravesar recesiones y seguir invirtiendo cuando el crédito se encarece.":
    "Low debt lets a company survive recessions and keep investing even when borrowing gets expensive.",
  "El crecimiento solo crea valor por título si la dirección no lo diluye con nuevas acciones de forma persistente.":
    "Growth only helps you as a shareholder if management isn't constantly issuing new shares and shrinking your slice.",
  "Una valoración muy alta implica expectativas más exigentes y reduce el margen frente a resultados peores de lo previsto.":
    "Paying a steep price leaves very little room for error if the company hits a bump.",
  "No hay retornos sobre capital comparables en los estados disponibles.":
    "No comparable return-on-capital data in available filings.",
  "No hay una serie suficiente de resultado neto para medir su estabilidad.":
    "Not enough profit history to judge consistency.",
  "La conversión y la recurrencia se sostienen al agregar hasta cinco ejercicios, no solo el último año.":
    "Cash conversion holds up across up to 5 years of data—not just a single lucky year.",
  "No hay flujo operativo, beneficio y FCF comparables suficientes.":
    "Not enough comparable cash flow and net income figures.",
  "No hay activo y patrimonio comparables para estimar el colchón contable.":
    "Missing comparable asset and equity figures to measure the capital cushion.",
  "Falta deuda, liquidez o EBITDA comparable para calcular el apalancamiento sin inventar datos.":
    "Missing debt, cash, or EBITDA data to calculate leverage accurately.",
  "No hay al menos dos ejercicios de acciones diluidas, ni datos para derivarlas con beneficio y BPA.":
    "Fewer than two years of share count data available.",
  "No hay precio y BPA en la misma divisa para juzgar la valoración sin mezclar unidades.":
    "Stock price and EPS aren't in the same currency, so we won't mix units to fake a P/E.",

  // --- QUALITY SCREENER (/companies) ---
  "Empresas por Las seis claves": "Stocks by The 6 Keys",
  "Buscador fundamental de 100 grandes cotizadas comparadas mediante seis claves cuantitativas.":
    "Compare 100 major global companies using The 6 Quality Keys.",
  "El universo reúne 100 grandes cotizadas de Estados Unidos, Europa, Canadá y Australia/global con filings regulatorios accesibles. Los cálculos se actualizan por lotes y se conservan durante seis horas para proteger las fuentes públicas. Una empresa sin datos aparece como no disponible, nunca como suspenso automático.":
    "Covers 100 major public companies across the US, Europe, Canada, and Australia with accessible filings. Scores refresh in batches every 6 hours. Missing data shows as unavailable—never an automatic fail.",
  "Universo fundamental global": "Global Stock Screener",
  "Comparador por las seis claves": "Compare Stocks by The 6 Keys",
  "Hasta 100 grandes cotizadas ordenadas por las mismas seis claves del perfil. Puedes exigir una puntuación, una clave concreta o cobertura completa.":
    "Screen up to 100 major companies using the exact same 6 Keys. Filter by score, a specific key, region, or full data coverage.",
  "Buscar empresa, ticker, país o sector": "Search company, ticker, country, or sector",
  "Cualquier puntuación": "Any score",
  "3 o más claves": "3+ keys passed",
  "4 o más claves": "4+ keys passed",
  "5 o más claves": "5+ keys passed",
  "Solo 6/6": "6/6 only",
  "Cualquier clave": "Any key",
  "Crecimiento": "Growth",
  "Rentabilidad": "Returns",
  "Caja/beneficio": "Cash Quality",
  "Balance": "Balance Sheet",
  "Por acción": "Per-Share",
  "Todas las regiones": "All regions",
  "Solo cobertura 6/6": "Full 6/6 data only",
  "Crec.": "Growth",
  "Acción": "Shares",
  "Región": "Region",
  "Claves": "Score",
  "Calidad del beneficio y caja": "Cash conversion & quality",
  "La carga se ha detenido. Los resultados ya calculados siguen disponibles.":
    "Loading paused—already loaded companies are still shown below.",
  "Calculando este tramo del universo…": "Scoring this batch of companies…",
  "Ninguna empresa cargada cumple todos los filtros seleccionados.":
    "No companies match all of your active filters.",
  "Resultados cuantitativos basados en datos comparables.":
    "Quantitative scores based on comparable multi-year filings.",

  // --- ESTADOS FINANCIEROS Y TABLAS ---
  "Resumen financiero": "Financial Summary",
  "Concepto": "Line Item",
  "Tendencia": "Trend",
  "Último dato": "Latest",
  "Sin datos disponibles": "No data available",
  "La empresa, de un vistazo": "The Company at a Glance",
  "Lectura esencial": "Key Numbers",
  "Nueve cifras para entender crecimiento, fortaleza financiera y generación de caja. Pulsa cualquiera para ver todo su histórico con Cid.":
    "9 core numbers to understand growth, financial strength, and cash generation. Click any card to see its full history with Cid.",
  "Vista anual": "Annual view",
  "Vista trimestral": "Quarterly view",
  "01 · Resultados": "01 · Performance",
  "¿Crece y gana dinero?": "Is it growing & profitable?",
  "Ventas, beneficio operativo y resultado final.": "Sales, operating profit, and net income.",
  "02 · Balance": "02 · Balance Sheet",
  "¿Es financieramente resistente?": "Is the balance sheet solid?",
  "Liquidez, deuda y colchón patrimonial.": "Cash cushion, debt load, and equity.",
  "03 · Caja y calidad": "03 · Cash & Quality",
  "¿Convierte el negocio en caja?": "Does profit turn into real cash?",
  "Caja operativa, caja libre y retorno del capital.": "Operating cash, free cash flow, and return on capital.",
  "La fuente regulatoria no publica datos XBRL estructurados para esta combinación.":
    "Official filings don't have structured XBRL data for this selection.",

  // Partidas de estados financieros (taxonomy.ts)
  "Ingresos": "Revenue",
  "Coste de ventas": "Cost of Revenue (COGS)",
  "Beneficio bruto": "Gross Profit",
  "Investigación y desarrollo": "R&D Expenses",
  "Gastos generales, comerciales y administrativos": "SG&A Expenses",
  "Total gastos de explotación": "Total Operating Expenses",
  "Resultado de explotación": "Operating Income (EBIT)",
  "Gasto financiero": "Interest Expense",
  "Otros resultados no de explotación": "Non-Operating Income / (Expense)",
  "Resultado antes de impuestos": "Pretax Income",
  "Impuesto sobre beneficios": "Income Taxes",
  "Resultado neto": "Net Income",
  "BPA básico": "Basic EPS",
  "BPA diluido": "Diluted EPS",
  "Acciones diluidas medias": "Diluted Shares",
  "Efectivo y equivalentes": "Cash & Equivalents",
  "Inversiones a corto plazo": "Short-Term Investments",
  "Efectivo e inversiones a corto plazo": "Cash & Short-Term Investments",
  "Deudores comerciales": "Accounts Receivable",
  "Existencias": "Inventory",
  "Activo corriente": "Current Assets",
  "Inmovilizado material neto": "Property, Plant & Equipment",
  "Fondo de comercio": "Goodwill",
  "Otros intangibles": "Intangible Assets",
  "Total activo": "Total Assets",
  "Acreedores comerciales": "Accounts Payable",
  "Deuda a corto plazo": "Short-Term Debt",
  "Pasivo corriente": "Current Liabilities",
  "Deuda a largo plazo": "Long-Term Debt",
  "Deuda financiera total": "Total Debt",
  "Deuda financiera neta": "Net Debt",
  "Total pasivo": "Total Liabilities",
  "Participaciones rescatables": "Redeemable Minority Interest",
  "Patrimonio temporal de la dominante": "Temporary Equity",
  "Reservas acumuladas": "Retained Earnings",
  "Patrimonio de la dominante": "Shareholders' Equity",
  "Intereses minoritarios": "Minority Interest",
  "Patrimonio neto total": "Total Equity",
  "Total pasivo y patrimonio neto": "Total Liabilities & Equity",
  "Acciones en circulación": "Shares Outstanding",
  "Flujo de caja de explotación": "Operating Cash Flow",
  "Amortizaciones": "Depreciation & Amortization",
  "Retribución en acciones": "Stock-Based Compensation",
  "Inversión en inmovilizado": "Capital Expenditures (CapEx)",
  "Flujo de caja de inversión": "Investing Cash Flow",
  "Dividendos pagados": "Dividends Paid",
  "Recompra de acciones": "Share Buybacks",
  "Flujo de caja de financiación": "Financing Cash Flow",
  "Flujo de caja libre": "Free Cash Flow (FCF)",
  "Margen bruto": "Gross Margin",
  "Margen EBITDA": "EBITDA Margin",
  "Margen operativo (EBIT)": "Operating Margin",
  "Margen operativo": "Operating Margin",
  "Margen neto": "Net Margin",
  "Margen FCF": "FCF Margin",
  "Rentabilidad sobre patrimonio (ROE)": "Return on Equity (ROE)",
  "Rentabilidad sobre activos (ROA)": "Return on Assets (ROA)",
  "Retorno sobre capital invertido (ROIC)": "Return on Invested Capital (ROIC)",
  "Tipo impositivo efectivo": "Effective Tax Rate",
  "Conversión de EBITDA en FCF": "EBITDA to FCF Conversion",
  "Crecimiento de ingresos YoY": "Revenue Growth YoY",
  "Crecimiento de BPA diluido YoY": "Diluted EPS Growth YoY",
  "Crecimiento de FCF YoY": "FCF Growth YoY",
  "Beneficio Neto": "Net Income",
  "Margen Neto": "Net Margin",
  "Margen Neto (%)": "Net Margin (%)",
  "Flujo Caja Libre": "Free Cash Flow",
  "Margen Operativo (%)": "Operating Margin (%)",
  "Margen Op.": "Op. Margin",

  // Semántica y procedencia (metric-semantics.ts, provenance-popover.tsx, ratios.ts, normalize.ts)
  "Más es mejor": "Higher is better",
  "Menos es mejor": "Lower is better",
  "El contexto importa": "Context matters",
  "La empresa no reporta este concepto en este periodo.":
    "The company didn't report this figure for this period.",
  "Calculado por Altius": "Calculated by Altius",
  "Dato anual agregado para mantener la actualidad":
    "Annual figure added from market data to stay up to date",
  "Dato publicado por la empresa": "Reported directly by the company",
  "¿De dónde sale este número?": "Where does this number come from?",
  "Concepto XBRL": "XBRL Tag",
  "Unidad": "Unit",
  "Periodo": "Period",
  "Valor reportado": "Reported Value",
  "Valor calculado": "Calculated Value",
  "Hechos XBRL": "XBRL Facts",
  "Datos estructurados": "Structured Data",
  "Informe anual oficial": "Official Annual Report",
  "Hechos XBRL US-GAAP o IFRS publicados en SEC EDGAR; se conserva la última reexpresión.":
    "Official US-GAAP or IFRS facts from SEC EDGAR, keeping the latest restated figures.",
  "Último ejercicio": "Latest Fiscal Year",
  "Ejercicio completo": "Full Fiscal Year",
  "Ingresos del periodo": "Period Revenue",
  "Ingresos del año anterior": "Prior Year Revenue",
  "BPA diluido del periodo": "Period Diluted EPS",
  "BPA diluido del año anterior": "Prior Year Diluted EPS",
  "Flujo de caja libre del periodo": "Period FCF",
  "Flujo de caja libre del año anterior": "Prior Year FCF",
  "Patrimonio neto": "Total Equity",
  "Activo total": "Total Assets",
  "Efectivo e inversiones": "Cash & Investments",
  "Ejercicio completo − Q1 − Q2 − Q3": "Full Year − Q1 − Q2 − Q3",
  "Ingresos − Coste de ventas": "Revenue − Cost of Revenue",
  "Ingresos − Total gastos de explotación": "Revenue − Operating Expenses",
  "Flujo de caja de explotación − Inversión en inmovilizado": "Operating Cash Flow − CapEx",
  "Beneficio bruto ÷ Ingresos × 100": "Gross Profit ÷ Revenue × 100",
  "Resultado de explotación + Amortizaciones": "Operating Income + D&A",
  "EBITDA ÷ Ingresos × 100": "EBITDA ÷ Revenue × 100",
  "Resultado de explotación ÷ Ingresos × 100": "Operating Income ÷ Revenue × 100",
  "Resultado neto ÷ Ingresos × 100": "Net Income ÷ Revenue × 100",
  "Flujo de caja libre ÷ Ingresos × 100": "Free Cash Flow ÷ Revenue × 100",
  "Resultado neto ÷ Patrimonio neto × 100": "Net Income ÷ Total Equity × 100",
  "Resultado neto ÷ Activo total × 100": "Net Income ÷ Total Assets × 100",
  "Resultado de explotación × (1 − tipo efectivo) ÷ (Patrimonio neto + Deuda − Caja) × 100":
    "EBIT × (1 − Tax Rate) ÷ (Equity + Debt − Cash) × 100",
  "Impuesto sobre beneficios ÷ Resultado antes de impuestos × 100": "Income Taxes ÷ Pretax Income × 100",
  "Flujo de caja libre ÷ EBITDA × 100": "Free Cash Flow ÷ EBITDA × 100",
  "Ingresos del periodo ÷ Ingresos del mismo periodo del año anterior − 1":
    "Period Revenue ÷ Prior Year Revenue − 1",
  "BPA diluido ÷ BPA diluido del mismo periodo del año anterior − 1":
    "Diluted EPS ÷ Prior Year Diluted EPS − 1",
  "Flujo de caja libre ÷ Flujo de caja libre del año anterior − 1":
    "Free Cash Flow ÷ Prior Year FCF − 1",

  // Explicaciones de metric-semantics.ts (lenguaje cercano)
  "Una facturación creciente amplía la base sobre la que la empresa puede generar beneficios.":
    "Growing sales give the company a bigger base to earn profits from.",
  "Un coste menor, para un nivel de ventas comparable, deja más beneficio bruto.":
    "Lower direct costs leave more gross profit for every dollar sold.",
  "Más beneficio bruto indica que queda más dinero después del coste directo de vender.":
    "More gross profit means more money left over after making the product.",
  "Puede ser una inversión productiva o un gasto poco rentable; debe compararse con ventas y resultados futuros.":
    "Can be smart R&D investing or wasted spending—watch if it leads to future sales.",
  "Un gasto menor, con ventas comparables, suele reflejar una estructura más eficiente.":
    "Lower overhead for the same level of sales usually points to a leaner business.",
  "Menos gastos operativos, manteniendo el negocio, favorecen el margen y el beneficio.":
    "Keeping operating costs in check boosts profit margins.",
  "Más resultado operativo significa que el negocio principal genera más beneficio.":
    "Higher operating income means the core business itself is making more money.",
  "Menos gasto financiero deja más beneficio para el accionista y reduce la presión de la deuda.":
    "Lower interest payments leave more profit for shareholders and mean less debt stress.",
  "Puede mezclar ingresos y gastos no recurrentes; su calidad importa más que su dirección.":
    "Often includes one-off gains or losses—look closely before treating it as recurring.",
  "Más beneficio antes de impuestos refleja una mayor capacidad de generar resultados.":
    "Higher pretax earnings show stronger profit power before the tax bill.",
  "A igualdad de beneficio antes de impuestos, una carga fiscal menor deja más beneficio neto.":
    "A lower tax bill leaves more profit on the bottom line.",
  "Más beneficio neto aumenta la capacidad de reinvertir, reducir deuda o remunerar al accionista.":
    "Higher net income means more profit to reinvest, pay down debt, or return to you.",
  "Más beneficio por acción significa que cada acción participa en una porción mayor del resultado.":
    "Higher EPS means each share earns a bigger slice of the company's profits.",
  "Más beneficio diluido por acción incorpora el efecto potencial de la dilución.":
    "Shows profit per share after accounting for stock options and convertible shares.",
  "Menos acciones diluidas reparten el beneficio entre menos títulos y protegen al accionista existente.":
    "Fewer shares mean profits are split among fewer slices—great for existing owners.",
  "Más efectivo aporta liquidez y capacidad para invertir, resistir o reducir deuda.":
    "More cash gives the company flexibility to invest, pay off debt, or survive downturns.",
  "Más inversiones líquidas refuerzan la disponibilidad financiera a corto plazo.":
    "Quickly accessible investments add to the company's safety cushion.",
  "Más efectivo e inversiones líquidas refuerzan la capacidad financiera inmediata.":
    "Combined cash and liquid assets give immediate financial breathing room.",
  "Menos cobros pendientes, con ventas comparables, suelen indicar una mejor conversión en caja.":
    "Fewer unpaid customer bills usually means the company collects cash faster.",
  "Menos existencias, con ventas comparables, inmovilizan menos capital y reducen riesgo de obsolescencia.":
    "Keeping inventory lean frees up cash and avoids unsold stock piling up.",
  "Más activo corriente mejora la cobertura de obligaciones próximas, si su calidad es buena.":
    "More short-term assets help cover upcoming bills comfortably.",
  "Puede reflejar inversión para crecer o exceso de capital; debe relacionarse con ventas y retornos.":
    "Could mean investing for growth or heavy upkeep costs—compare against sales and returns.",
  "Menos fondo de comercio reduce el riesgo ligado a adquisiciones, aunque una caída por deterioro también exige revisión.":
    "Lower goodwill means less risk of future write-downs from overpriced acquisitions.",
  "Menos intangibles reduce el peso de activos difíciles de valorar, pero depende de cómo se hayan originado.":
    "Fewer intangible assets mean a cleaner balance sheet, depending on how they were built.",
  "Una empresa más grande no es necesariamente mejor; importa el retorno que obtiene de esos activos.":
    "Bigger isn't always better—what matters is how much profit those assets generate.",
  "Menos pagos pendientes reducen obligaciones, aunque el plazo de proveedores también forma parte del circulante.":
    "Fewer unpaid supplier bills, though longer payment terms can sometimes help cash flow.",
  "Menos deuda próxima a vencer reduce el riesgo de refinanciación.":
    "Less debt due soon means less near-term cash crunch risk.",
  "Menos obligaciones a corto plazo alivian la presión inmediata sobre la caja.":
    "Fewer short-term bills take immediate pressure off cash.",
  "Menos deuda financiera reduce intereses, riesgo y dependencia del crédito.":
    "Less long-term debt cuts interest costs and keeps risk low.",
  "Menos deuda financiera total reduce intereses, riesgo y dependencia del crédito.":
    "Less total debt lowers interest costs and reduces reliance on lenders.",
  "Menos deuda neta —o una posición de caja neta— aporta mayor resistencia financiera.":
    "Lower net debt—or having more cash than debt—makes the company much safer.",
  "Menos pasivo total, a igualdad de negocio, suele dar un balance más resistente.":
    "Lower overall liabilities generally mean a stronger, safer balance sheet.",
  "Menos participaciones rescatables reducen compromisos potenciales frente a terceros.":
    "Fewer redeemable stakes mean fewer potential buyout obligations.",
  "Menos patrimonio temporal reduce instrumentos con posibles obligaciones de rescate.":
    "Less temporary equity reduces potential future payout obligations.",
  "Más reservas acumuladas muestran beneficios retenidos dentro de la compañía.":
    "Growing retained earnings show years of profits reinvested back into the business.",
  "Más patrimonio atribuible a la dominante amplía el colchón de los accionistas.":
    "More equity belonging to shareholders builds a bigger safety cushion.",
  "Depende de la estructura de filiales y de cuánto beneficio pertenece a terceros.":
    "Reflects the share of subsidiaries owned by outside partners.",
  "Más patrimonio neto ofrece un mayor colchón frente a pérdidas y deuda.":
    "More net equity gives a stronger buffer against losses and debt.",
  "Es el total contable del balance; su tamaño por sí solo no mide calidad.":
    "Total balance sheet size—size alone doesn't tell you if the business is high quality.",
  "Menos acciones en circulación reparten el valor y los beneficios entre menos títulos.":
    "Fewer shares outstanding mean each share owns a bigger piece of the business.",
  "Más resultado neto aporta una mejor base para generar caja.":
    "Stronger net income gives a solid starting point for real cash flow.",
  "Es un gasto no monetario que depende de la intensidad de capital y de la edad de los activos.":
    "A non-cash accounting expense reflecting wear and tear on equipment and assets.",
  "Menos retribución en acciones reduce la dilución potencial del accionista.":
    "Lower stock-based pay means less dilution for everyday shareholders.",
  "Más caja operativa indica que el negocio convierte mejor su actividad en dinero real.":
    "More operating cash means day-to-day operations are bringing in real cash.",
  "Más inversión puede impulsar el crecimiento o consumir caja sin retorno; debe juzgarse junto al negocio.":
    "Capital spending can fuel future growth or burn cash—judge it by the returns it earns.",
  "Suele ser negativo cuando la empresa invierte; la composición importa más que el signo.":
    "Usually negative when a healthy company invests in growth or acquisitions.",
  "Más dividendos remuneran al accionista, pero también dejan menos caja para reinvertir o reducir deuda.":
    "Higher dividends pay cash directly to you, though that cash can't be reinvested inside the business.",
  "Las recompras crean valor si se hacen a buen precio y sin debilitar el balance.":
    "Buybacks boost per-share value when done at fair prices without taking on risky debt.",
  "Puede reflejar deuda, ampliaciones, dividendos o recompras; hay que revisar sus componentes.":
    "Shows money raised or paid back via debt, shares, buybacks, and dividends.",
  "Más flujo de caja libre amplía la capacidad de reinvertir, reducir deuda o remunerar al accionista.":
    "More free cash flow gives the company real cash left over to grow, cut debt, or reward owners.",
  "Un margen bruto mayor indica más valor retenido después de los costes directos.":
    "A higher gross margin means the company keeps more of every sale after product costs.",
  "Más EBITDA refleja una mayor generación operativa antes de amortizaciones e intereses.":
    "Higher EBITDA shows stronger core operating cash generation before taxes and financing.",
  "Un margen EBITDA mayor indica más resultado operativo por cada unidad vendida.":
    "A higher EBITDA margin means stronger operating profits per dollar of sales.",
  "Un margen operativo mayor muestra un negocio más rentable y eficiente.":
    "A higher operating margin signals a more efficient, profitable core business.",
  "Un margen neto mayor convierte una mayor parte de las ventas en beneficio final.":
    "A higher net margin means more of each dollar in sales reaches the bottom line.",
  "Un margen FCF mayor convierte una mayor parte de las ventas en caja libre.":
    "A higher FCF margin means more sales turn directly into spendable free cash.",
  "Un ROE mayor indica más beneficio por unidad de patrimonio, siempre que no dependa de deuda excesiva.":
    "Higher ROE shows strong returns on shareholder money (as long as debt isn't artificially inflating it).",
  "Un ROA mayor muestra un uso más productivo de los activos.":
    "Higher ROA means the company gets more profit out of its total assets.",
  "Un ROIC mayor indica una mejor rentabilidad del capital empleado en el negocio.":
    "Higher ROIC means the company invests its money into high-return projects.",
  "Un tipo efectivo menor deja más beneficio neto, siempre que sea sostenible y conforme a la normativa.":
    "A lower effective tax rate leaves more profit for shareholders.",
  "Una conversión mayor indica que más EBITDA termina convertido en caja libre.":
    "Higher conversion means operating earnings aren't getting stuck in capital spending.",
  "Un crecimiento mayor de ingresos señala una expansión más rápida del negocio.":
    "Faster revenue growth shows rising demand for the company's products or services.",
  "Un crecimiento mayor del BPA aumenta el beneficio atribuible a cada acción.":
    "Faster EPS growth means earnings per share are compounding rapidly.",
  "Un crecimiento mayor del FCF amplía la caja disponible para crear valor.":
    "Faster FCF growth gives the company more real cash every year.",
  "Esta partida necesita compararse con el resto de los estados financieros antes de interpretarla.":
    "This item is best viewed alongside the rest of the financial statements.",

  // --- CONTROLES DE GRÁFICOS, CID Y DIALOGS ---
  "Activar Cid": "Show Cid",
  "Desactivar Cid": "Hide Cid",
  "Cid activado": "Cid On",
  "Cid desactivado": "Cid Off",
  "Cid: Activado": "Cid: On",
  "Cid: Desactivado": "Cid: Off",
  "Activar Cid en el gráfico": "Show Cid on chart",
  "Desactivar Cid en el gráfico": "Hide Cid on chart",
  "Mostrar a Cid y su evaluación animada": "Show Cid and his animated walkthrough",
  "Ocultar a Cid y su evaluación animada": "Hide Cid and his animated walkthrough",
  "Repetir animación de Cid": "Replay Cid animation",
  "Repetir recorrido de Cid por el gráfico agregado": "Replay Cid's walk across the chart",
  "Cid · activo": "Cid · on",
  "Cid · oculto": "Cid · off",
  "Cid ·": "Cid ·",
  "activo": "on",
  "oculto": "off",
  "Ver gráfico": "Show chart",
  "Ocultar gráfico": "Hide chart",
  "Minimizar": "Collapse",
  "Ver gráfico superior": "Expand overview chart",
  "Minimizar gráfico superior": "Collapse overview chart",
  "Métricas en el gráfico:": "Metrics on chart:",
  "Métricas mostradas": "Visible Metrics",
  "✦ Cid recorre la agregación de todos los gráficos activos":
    "✦ Cid walks across the combined trend of your active charts",
  "Cid evalúa:": "Cid's take:",
  "Escala:": "Scale:",
  "Margen / Ratios (%)": "Margins & Ratios (%)",
  "Índice Agregado Cid": "Cid Combined Score",
  "Movimiento de Cid": "Cid Motion",
  "Animación de Cid": "Cid Animation",
  "Restablecer": "Reset",
  "Horizonte": "Timeframe",
  "3 Años": "3 Years",
  "5 Años": "5 Years",
  "10 Años": "10 Years",
  "3 años": "3 Years",
  "5 años": "5 Years",
  "10 años": "10 Years",
  "1 año": "1 Year",
  "3A": "3Y",
  "5A": "5Y",
  "10A": "10Y",
  "Todo": "All",
  "Todo el Histórico": "All History",
  "Todo el histórico": "Full History",
  "Escala": "Scale",
  "Miles": "Thousands",
  "Millones": "Millions",
  "Miles M": "Billions",
  "Frecuencia": "Frequency",
  "Anual": "Annual",
  "Trimestral": "Quarterly",
  "Trimestral TTM": "Quarterly TTM",
  "Descargar CSV": "Download CSV",
  "Autosuma de métricas": "Combined Metric Trends",
  "Último periodo": "Latest Period",
  "Variación interanual": "YoY Change",
  "Sin comparable": "No prior match",
  "Sin datos": "No data",
  "Primer periodo de la serie": "First period in series",
  "Oficial SEC": "SEC Filing",
  "Calculado": "Calculated",
  "Castillo (positivo)": "Positive (Gain)",
  "Foso (negativo)": "Negative (Loss)",
  "Rendimiento anual": "Annualized Growth",
  "Datos insuficientes": "Not enough data",
  "Sin variación significativa": "Little to no change",
  "Ha subido": "Trending Up",
  "Ha bajado": "Trending Down",
  "Aún no hay suficiente histórico": "Not enough history yet",
  "Sin datos registrados": "No data recorded",
  "Se necesitan al menos dos periodos comparables para clasificar el patrón general de Cid.":
    "At least two comparable periods are needed for Cid to read the overall trend.",

  // Fases y perfiles de Cid (statement-trend-animation.tsx)
  "Cid cañon": "Rocket Cid",
  "Cid cuerda": "Climber Cid",
  "Cid caballero": "Knight Cid",
  "Cid señor": "Stroller Cid",
  "Cid piedra": "Downhill Cid",
  "Cid flecha": "Freefall Cid",
  "Cid apuñalado": "Crash Cid",
  "Subida explosiva (+30%)": "Explosive growth (+30%+)",
  "Crecimiento fuerte (+15% a +30%)": "Strong growth (+15% to +30%)",
  "Crecimiento moderado (+5% a +15%)": "Steady growth (+5% to +15%)",
  "Caída moderada (-5% a -15%)": "Mild dip (-5% to -15%)",
  "Caída grande (-15% a -30%)": "Sharp drop (-15% to -30%)",
  "Desplome (<-30%)": "Steep crash (below -30%)",
  "Estancado o plano (-5% a +5%)": "Flat or sideways (-5% to +5%)",

  "Crecimiento de alto impacto en todas las magnitudes activas":
    "Breakout growth across every selected metric",
  "Expansión sólida y equilibrada en los gráficos seleccionados":
    "Strong, balanced growth across these metrics",
  "Trayectoria agregada con progresión constructiva y estable":
    "Healthy, steady upward progress overall",
  "Consolidación general y resultados agregados sin grandes variaciones":
    "Holding steady with little overall change",
  "Contracción o desaceleración moderada en el conjunto de métricas":
    "Mild slowdown across these metrics",
  "Corrección generalizada en los indicadores seleccionados":
    "Broad pullback across the selected numbers",
  "Presión estructural o caída simultánea en los gráficos activos":
    "Sharp drop across all selected metrics",

  "Aún no hay recorrido": "No trend yet",
  "Se necesitan al menos dos periodos comparables para interpretar la trayectoria.":
    "We need at least two comparable periods to read the trend.",
  "Trayectoria no comparable": "Not comparable yet",
  "Todavía no hay periodos interanuales comparables para calcular el recorrido.":
    "Not enough year-over-year periods yet to map the path.",
  "Caída extrema (Desplome)": "Sharp Crash",
  "El último dato interanual pierde más del 30 % y el personaje abre el paracaídas.":
    "The latest drop exceeded 30%, so Cid pops open his parachute.",
  "La serie pierde más del 30 % de su altura y el personaje desciende con paracaídas.":
    "The chart drops over 30%, sending Cid down with his parachute.",
  "Pendiente descendente": "Downward Slope",
  "El último dato rompe a la baja la trayectoria reciente y el personaje desciende sobre su snowboard.":
    "The latest period broke lower, so Cid rides down on his snowboard.",
  "La trayectoria interanual apunta hacia abajo y el personaje baja sobre su snowboard.":
    "The multi-year trend slopes downward, and Cid snowboards down.",
  "Años planos y despegue": "Flat Years, Then Liftoff",
  "Tras una meseta prolongada, el personaje recorre las barras aburridas y salta sobre el punto exacto del despegue.":
    "After a quiet stretch, Cid walks across the flat years and leaps right where growth takes off.",
  "Salto repentino": "Sudden Jump",
  "El último dato rompe una trayectoria estable y el personaje salta sobre la barra que provoca el cambio.":
    "The latest period broke out of a flat stretch, and Cid leaps onto the breakout bar.",
  "Subida explosiva": "Rocket Liftoff",
  "El crecimiento supera el 30 % y el personaje recorre el salto montado en su cohete.":
    "Growth topped 30%, so Cid hops on his rocket to ride the surge.",
  "Empresa ascensor": "Fast Compounder",
  "El personaje asciende con el piolet y una expresión alegre.":
    "Cid climbs steadily upward with his ice axe and a big grin.",
  "Empresa de escalera": "Step-by-Step Climber",
  "El personaje sube peldaño a peldaño siguiendo el crecimiento real de la empresa.":
    "Cid climbs step by step along with the company's steady growth.",
  "Empresa de paseo": "Steady Stroller",
  "El caminante veterano avanza despacio sobre una sucesión de barras casi planas.":
    "Our veteran hiker strolls calmly across a mostly flat set of bars.",
  "Lectura pendiente": "Waiting for More Data",
  "Se necesitan al menos dos periodos comparables para clasificar la evolución de esta empresa.":
    "At least two comparable periods are needed to classify this company's pattern.",
  "Empresa terremoto": "Rollercoaster Business",
  "La serie presenta los dos extremos: al menos un periodo supera el +30 % y otro cae por debajo del −30 %.":
    "Big swings both ways—at least one year jumped over +30% and another dropped below -30%.",
  "Los últimos años apenas cambian: la serie avanza tranquila, sin pendientes importantes.":
    "Barely any big swings lately—the business chugs along nice and flat.",
  "La serie muestra una subida ordenada y repetida de entre el 5 % y el 10 %: peldaño tras peldaño.":
    "Clean, repeatable 5%–10% growth year after year—climbing one step at a time.",
  "Empresa ascensor (compounder)": "Fast Compounder",
  "La serie mantiene crecimiento compuesto superior al 15 % de forma continua: no sube escalones, sube en ascensor.":
    "Consistent 15%+ compounding growth—not taking the stairs, taking the express elevator.",
  "Empresa en transición": "Company in Transition",
  "Todavía no hay un patrón dominante: combina años tranquilos con movimientos más exigentes.":
    "No single pattern yet—a mix of quiet years and sharper swings.",

  // --- GRÁFICO DE COTIZACIÓN (PRICE CHART) ---
  "Rentabilidad anualizada": "Annualized Return",
  "Rentabilidad acumulada": "Total Return",
  "CAGR 1 año": "1-Year CAGR",
  "CAGR 5 años": "5-Year CAGR",
  "CAGR 10 años": "10-Year CAGR",
  "Diario": "Daily",
  "Semanal": "Weekly",
  "Mensual": "Monthly",
  "Apertura": "Open",
  "Cierre": "Close",
  "Máximo": "High",
  "Mínimo": "Low",
  "Volumen": "Volume",
  "Sin datos en el periodo": "No data in this range",
  "1 Año (1Y)": "1 Year (1Y)",
  "3 Años (3Y)": "3 Years (3Y)",
  "10 Años (10Y)": "10 Years (10Y)",
  "Rango Personalizado": "Custom Range",
  "Periodo personalizado": "Custom Date Range",
  "Periodo personalizado:": "Custom range:",
  "Desde": "From",
  "Hasta": "To",

  // --- VALORACIÓN Y MÚLTIPLOS ---
  "PER histórico": "Historical P/E",
  "Mediana histórica": "Historical Median",
  "Mínimo histórico": "Historical Low",
  "Máximo histórico": "Historical High",
  "PER de salida": "Exit P/E",
  "Tasa de descuento": "Discount Rate",
  "Rendimiento anual estimado": "Expected Annual Return",
  "Margen de seguridad": "Margin of Safety",
  "Margen de Seguridad": "Margin of Safety",
  "Valor intrínseco": "Intrinsic Value",
  "Rentabilidad por dividendo": "Dividend Yield",
  "No hay estados financieros estructurados suficientes para calcular la valoración.":
    "Not enough financial statement data to build a valuation yet.",
  "Múltiplos calculados únicamente cuando la cotización y los beneficios están expresados en la misma divisa.":
    "Multiples are only calculated when the stock price and financials share the same currency.",
  "Precio disponible al presentar cada resultado trimestral ÷ BPA de los cuatro trimestres conocidos entonces. No usa reexpresiones posteriores.":
    "Stock price on each quarterly filing date divided by trailing 12-month EPS as reported at that time (no later revisions).",
  "Precio disponible cuando el beneficio anual quedó publicado ÷ BPA anual conocido entonces. Los ejercicios con pérdidas no generan PER.":
    "Stock price when the annual report came out divided by that year's EPS. Loss-making years don't produce a P/E.",
  "No hay datos suficientes.": "Not enough data.",
  "No hay observaciones de PER utilizables en este intervalo.":
    "No usable P/E readings in this date range.",
  "Observaciones del periodo": "Data Points in Range",
  "Mínimo del periodo": "Range Low",
  "Mediana del periodo": "Range Median",
  "Máximo del periodo": "Range High",
  "PER actual / último FY": "Current / Latest P/E",
  "Mediana últimos 20 años": "20-Year Median",
  "Cobertura de la mediana": "Median History",
  "Frente a mediana 20a": "vs 20Y Median",
  "Cierre usado": "Price Date",
  "BPA TTM": "TTM EPS",
  "BPA anual": "Annual EPS",
  "PER": "P/E",
  "Pérdidas": "Net Loss",

  // Calculadora de proyecciones (projection-calculator.tsx & valuation/index.ts)
  "Modelo de Proyección a 5 Años y Precio Objetivo":
    "5-Year Projection & Price Target Calculator",
  "Ajusta las hipótesis de crecimiento, rentabilidad operativa y múltiplo objetivo de salida.":
    "Tweak your assumptions for sales growth, profit margins, and exit multiple to test different scenarios.",
  "Todos los controles son supuestos editables, no estimaciones publicadas por la empresa.":
    "All sliders are your own assumptions—not official company forecasts.",
  "Múltiplo de salida:": "Exit multiple:",
  "Crecimiento ventas (YoY)": "Annual Sales Growth",
  "Margen EBIT (Año 5)": "Operating Margin (Year 5)",
  "Múltiplo objetivo": "Target Multiple",
  "Tasa impositiva (Tax Rate)": "Tax Rate",
  "Mediana efectiva · 20 años": "20Y median tax rate",
  "Mediana 20 años no disponible · sin observaciones": "20Y median unavailable · no data",
  "Ajusta tu estimación": "Adjust your estimate",
  "Precio Objetivo (Año 5)": "Target Price (Year 5)",
  "Potencial frente al precio de mercado": "Upside / downside vs current price",
  "Retorno Anualizado (CAGR)": "Expected Annual Return (CAGR)",
  "Rentabilidad anual estimada 5 años": "Estimated yearly return over 5 years",
  "Valoración inversa · expectativa implícita": "Reverse Valuation · What's Priced In?",
  "Crecimiento anual de ventas necesario para que, con los supuestos elegidos, el precio objetivo dentro de cinco años sea igual a la cotización de hoy.":
    "The yearly sales growth needed over the next 5 years to justify today's stock price under your margin and multiple assumptions.",
  "Resultado matemático según estos supuestos": "Calculated from your inputs",
  "Ventas proyectadas": "Projected Revenue",
  "Resultado de explotación (EBIT)": "Projected Operating Income (EBIT)",
  "Resultado neto estimado": "Projected Net Income",
  "Flujo de caja libre (FCF)": "Projected Free Cash Flow (FCF)",
  "Capitalización objetivo": "Target Market Cap",
  "Faltan ventas, acciones diluidas o ejercicio fiscal para construir la proyección.":
    "Missing revenue, share count, or fiscal year data needed to run this projection.",
  "El múltiplo elegido requiere datos históricos que la empresa no ha reportado.":
    "The selected multiple needs historical data that this company hasn't reported.",
  "Faltan ventas o capitalización de mercado.": "Missing revenue or market cap data.",
  "El margen y el múltiplo deben ser positivos.": "Margin and exit multiple must be positive.",
  "El múltiplo elegido requiere conversión de caja, depreciación o deuda neta no disponibles.":
    "This multiple requires cash conversion, depreciation, or net debt data that isn't available.",

  // Valuation summary & audit
  "Capitalización / Beneficio Neto": "Market Cap / Net Income",
  "Años de beneficio neto necesarios para pagar el valor en bolsa actual.":
    "How many years of current profits it would take to pay back the stock's price.",
  "Múltiplo operativo total que tiene en cuenta la deuda neta y la caja.":
    "Total business price tag (including debt and cash) compared to operating cash earnings.",
  "Valoración frente a la caja libre real que genera el negocio.":
    "Total business value compared to the actual free cash it generates.",
  "Rentabilidad anual en flujo de caja libre por cada unidad monetaria invertida.":
    "How much free cash the business generates each year relative to its market price.",
  "Estructura de Capital y Magnitudes": "Capital Structure & Key Figures",
  "Precio acción": "Share Price",
  "Acciones diluidas": "Diluted Shares",
  "Deuda total": "Total Debt",
  "Deuda Neta / EBITDA": "Net Debt / EBITDA",
  "Cómo se construye esta valoración": "How These Numbers Are Built",
  "Base financiera": "Financial Base",
  "Precio × acciones diluidas": "Share price × diluted shares",
  "Market Cap + deuda neta": "Market Cap + Net Debt",

  // --- ANÁLISIS TÉCNICO Y OPCIONES ---
  "Análisis Técnico e Indicadores Cuantitativos": "Technical Charts & Signals",
  "Tendencia de precio, momentum y una lectura separada del mercado de opciones: volumen, posiciones abiertas, bid/ask, volatilidad y rango implícito.":
    "Price trends, momentum indicators, and an options market breakdown—volume, open interest, bid/ask, implied volatility, and expected move.",
  "Diagnóstico de Señales Técnicas": "Technical Signal Breakdown",
  "DIAGNÓSTICO TÉCNICO CUANTITATIVO": "TECHNICAL SIGNAL SUMMARY",
  "Volatilidad (1A)": "1Y Volatility",
  "Medias Móviles": "Moving Averages",
  "Momentum (RSI/MACD)": "Momentum (RSI & MACD)",
  "Línea MACD": "MACD Line",
  "Señal": "Signal Line",
  "Histograma": "Histogram",
  "Sobrecompra técnica": "Overbought zone",
  "Sobreventa técnica": "Oversold zone",
  "Zona de oscilación normal": "Normal trading range",
  "Bandas Bollinger": "Bollinger Bands",
  "Bandas de Bollinger (%B)": "Bollinger Bands (%B)",
  "Banda Sup.": "Upper Band",
  "Banda Media": "Middle Band",
  "Banda Inf.": "Lower Band",
  "Bollinger Sup.": "Upper Bollinger",
  "Bollinger Inf.": "Lower Bollinger",
  "Rango 52 Semanas": "52-Week Range",
  "Máx. 52s": "52W High",
  "Mín. 52s": "52W Low",
  "vs Máximo": "vs 52W High",
  "Detalle de Señales Cuantitativas": "Signal-by-Signal Details",
  "Soportes Cuantitativos Clave": "Key Support Levels",
  "Resistencias Cuantitativas Clave": "Key Resistance Levels",
  "Superposiciones:": "Overlays:",
  "Oscilador:": "Oscillator:",
  "Ocultar": "Hide",
  "Restablecer a 1 año": "Reset to 1 Year",
  "1 mes": "1M",
  "3 meses": "3M",
  "6 meses": "6M",
  "Año actual": "YTD",
  "Máx": "Max",
  "Índice de Fuerza Relativa (RSI 14)": "Relative Strength Index (RSI 14)",
  "Sobrecompra ≥ 70": "Overbought ≥ 70",
  "Sobreventa ≤ 30": "Oversold ≤ 30",
  "Fuerte Sesgo Alcista": "Strong Bullish Trend",
  "Sesgo Alcista": "Bullish Trend",
  "Sesgo Neutral / Consolidación": "Neutral / Sideways",
  "Sesgo Bajista / Corrección": "Bearish Trend",
  "Fuerte Sesgo Bajista": "Strong Bearish Trend",
  "SMA 200 (Tendencia Principal)": "200-Day SMA (Long-Term Trend)",
  "Tendencia Alcista a L/P": "Long-Term Uptrend",
  "Tendencia Bajista a L/P": "Long-Term Downtrend",
  "Cruce SMA 50 / 200": "50 / 200-Day Crossover",
  "Estructura Golden Cross": "Golden Cross",
  "Estructura Death Cross": "Death Cross",
  "La media de medio plazo (50) se sitúa sobre la de largo plazo (200), confirmando soporte dinámico.":
    "The 50-day average sits above the 200-day average, showing healthy medium-term strength.",
  "La media de medio plazo (50) se sitúa bajo la de largo plazo (200), indicando presión de fondo.":
    "The 50-day average sits below the 200-day average, showing lingering downward pressure.",
  "SMA 20 (Impulso Corto Plazo)": "20-Day SMA (Short-Term Trend)",
  "Impulso Positivo C/P": "Short-Term Uptrend",
  "Corrección C/P": "Short-Term Pullback",
  "El activo mantiene tracción sobre su promedio móvil de 20 periodos.":
    "Price is holding nicely above its 20-day moving average.",
  "El precio se encuentra temporalmente por debajo de su media de corto plazo.":
    "Price is currently trading below its 20-day moving average.",
  "RSI 14 (Fuerza Relativa)": "RSI 14 (Momentum)",
  "RSI Neutral": "Neutral RSI",
  "Sobrecompra (RSI ≥ 70)": "Overbought (RSI ≥ 70)",
  "Sobreventa (RSI ≤ 30)": "Oversold (RSI ≤ 30)",
  "Momentum Favorable (55-70)": "Strong Momentum (55–70)",
  "Debilidad de Momentum (30-45)": "Soft Momentum (30–45)",
  "MACD Histograma": "MACD Histogram",
  "Aceleración Alcista": "Bullish Momentum",
  "Presión Vendedora": "Selling Pressure",
  "Línea MACD cruzada al alza sobre su señal de 9 periodos.":
    "The MACD line has crossed above its 9-day signal line.",
  "Línea MACD cotizando bajo su señal de 9 periodos.":
    "The MACD line is trading below its 9-day signal line.",
  "Dentro del Canal Bollinger": "Inside Bollinger Bands",
  "Toque de Banda Superior": "At Upper Band",
  "Precio cotiza en la banda superior de Bollinger (alta volatilidad / expansión alcista).":
    "Price is pushing against the upper Bollinger Band—strong upward momentum with higher volatility.",
  "Toque de Banda Inferior": "At Lower Band",
  "Precio apoyando en la banda inferior de Bollinger (posible soporte dinámico).":
    "Price is resting near the lower Bollinger Band—often a potential bounce area.",
  "Estructura técnica de fuerte sesgo alcista: cotización firme sobre las medias móviles clave (SMA 200 y SMA 50) y momentum positivo consistente.":
    "Strong bullish setup: price is comfortably above key moving averages (50 & 200-day) with solid upward momentum.",
  "Sesgo técnico predominantemente alcista: el precio mantiene soportes de medio plazo y los osciladores muestran tracción favorable.":
    "Mostly bullish setup: price is holding medium-term support with positive momentum.",
  "Estructura técnica de fuerte sesgo bajista: cotización bajo la media de 200 periodos y momentum vendedor dominante.":
    "Strong bearish setup: price sits below the 200-day average with sellers in control.",
  "Sesgo técnico defensivo / bajista: presión sobre medias móviles clave y osciladores en territorio desfavorable.":
    "Cautious / bearish setup: pressure around key moving averages and weak momentum.",
  "Estructura técnica neutral o en consolidación: equilibrio entre fuerzas compradoras y vendedoras en torno a medias móviles intermedias.":
    "Neutral / sideways setup: buyers and sellers are roughly balanced around mid-term averages.",

  // Opciones
  "Nuevo módulo": "New",
  "Presión compradora y vendedora en opciones": "Options Flow & Positioning",
  "Volumen, interés abierto, bid/ask, tamaños publicados, volatilidad y rango implícito para los próximos meses.":
    "Volume, open interest, bid/ask quotes, implied volatility, and expected move across upcoming expirations.",
  "Solo opciones listadas en EE. UU.": "US-listed options only",
  "Derivados · próximos meses": "Options · Upcoming Expirations",
  "Qué se está negociando, dónde se acumulan las posiciones y cuánto movimiento está descontando el mercado.":
    "See what contracts traders are buying, where open interest is piling up, and how big a move the market expects.",
  "Vencimiento": "Expiration",
  "Fuerte inclinación compradora": "Strong Call Tilt",
  "Inclinación compradora": "Call Tilt",
  "Fuerte inclinación vendedora": "Strong Put Tilt",
  "Inclinación vendedora": "Put Tilt",
  "Equilibrio": "Balanced",
  "Más presión bajista": "More Bearish",
  "Más presión alcista": "More Bullish",
  "Volumen 45% · OI 35% · libro visible 20%": "45% Volume · 35% Open Interest · 20% Order Book",
  "Concentración de posiciones abiertas": "Where Open Contracts Are Stacked",
  "Calls arriba · puts abajo · contratos, no dinero negociado":
    "Calls above · Puts below · shown in number of contracts",
  "Calls arriba · puts abajo": "Calls above · Puts below",
  "Put / Call · volumen": "Put / Call · Volume",
  "Put / Call · interés abierto": "Put / Call · Open Interest",
  "Movimiento implícito": "Expected Move",
  "No hay precios suficientes para calcularlo": "Not enough option quotes to calculate",
  "Desequilibrio bid/ask": "Bid / Ask Imbalance",
  "Solo el mejor nivel publicado; no es profundidad completa":
    "Based on top-of-book quotes only—not full market depth",
  "Niveles que concentran posiciones": "Key Price Levels",
  "Libro visible por precio de ejercicio": "Visible Order Book by Strike Price",
  "Bid = mejor compra publicada · Ask = mejor venta publicada · tamaño en contratos":
    "Bid = best buy offer · Ask = best sell offer · size in contracts",
  "Bid × tamaño": "Bid × Size",
  "Ask × tamaño": "Ask × Size",
  "Actividad estadísticamente llamativa": "Unusual Options Activity",
  "Volumen ≥ 100 y al menos 1,5 veces el interés abierto. No revela si la operación fue compra o venta.":
    "Volume ≥ 100 contracts and at least 1.5x open interest. Note: this doesn't tell us whether trades were buys or sells.",
  "Volatilidad implícita": "Implied Volatility",
  "Alta": "High",
  "Media": "Medium",
  "Baja": "Low",
  "hora no informada": "time not reported",
  "Market Data · capa gratuita": "Market Data · free tier",
  "100 créditos diarios, cadenas con 24 h de retraso. Usa MARKETDATA_API_TOKEN.":
    "100 daily requests, 24h delayed chains (set MARKETDATA_API_TOKEN).",
  "Tradier · preferido para tiempo real": "Tradier · real-time option chains",
  "Tiempo real para titulares de cuenta de brokerage. Usa TRADIER_API_TOKEN.":
    "Real-time chains for brokerage account holders (set TRADIER_API_TOKEN).",
  "Qué sí sabemos: precios bid/ask, tamaños del mejor nivel, contratos negociados hoy, posiciones que permanecen abiertas y volatilidad implícita.":
    "What we know: bid/ask quotes, top-of-book size, today's volume, open contracts, and implied volatility.",
  "Qué no sabemos con esta foto: la intención del inversor, si una call se compró o se vendió para abrir, ni todas las órdenes ocultas o niveles de profundidad. Cada contrato ejecutado tiene comprador y vendedor; la dirección es una inferencia, no un hecho.":
    "What we can't see: trader intent, whether a contract was bought or sold to open, or hidden orders. Every trade has both a buyer and a seller.",

  // --- COPILOTO 10-K (AI PAGE & MD&A) ---
  "Copiloto de Informe Anual 10-K": "10-K Report Copilot",
  "Análisis de la dirección (MD&A)": "Management's Discussion & Analysis (MD&A)",
  "Resumen del apartado «Management’s Discussion and Analysis» del último informe anual, elaborado exclusivamente a partir del texto oficial presentado ante la SEC.":
    "A quick, plain-English summary of Management's Discussion & Analysis straight from the company's latest official SEC annual report.",
  "Esta empresa no tiene ningún formulario 10-K reciente en EDGAR.":
    "This company doesn't have a recent 10-K filing on SEC EDGAR.",
  "No se ha localizado el apartado Item 7 en el documento. Algunos emisores lo presentan como anexo o dentro de un documento aparte.":
    "Couldn't find the Item 7 MD&A section in this filing—some companies attach it as a separate exhibit.",
  "01 Impulsores de ingresos": "01 What's Driving Sales",
  "02 Riesgos operativos": "02 Key Risks",
  "03 Tono de la directiva": "03 Management's Tone",
  "Impulsores de ingresos": "What's Driving Sales",
  "Riesgos operativos": "Key Risks",
  "Tono de la directiva": "Management's Tone",
  "Leer el informe original": "Read the full original filing",
  "El informe no aporta material suficiente para este apartado.":
    "The filing doesn't include enough detail on this topic.",
  "Resumen generado por Gemini a partir exclusivamente del texto del apartado de análisis de la dirección. No incorpora conocimiento externo ni hechos posteriores a la presentación del informe.":
    "Summarized by Gemini strictly from the filing's official MD&A section—nothing invented or pulled from outside sources.",
  "Frases seleccionadas literalmente del informe, sin intervención de un modelo de lenguaje.":
    "Direct quotes pulled straight from the official filing with zero AI rewriting.",

  // --- NOTICIAS ---
  "Noticias y Pulso de Mercado": "News & Market Pulse",
  "Noticias y Pulso del Mercado": "News & Market Pulse",
  "Noticias y Política Monetaria": "News & Central Bank Updates",
  "Flujo de Noticias y Hechos Relevantes": "Latest News & Official SEC Filings",
  "“Las noticias siguen el precio de cotización, serán buenas si el precio de la acción sube y serán malas si el precio de la acción baja. Ningún periodista, ningún analista, ninguna persona, es capaz de predecir el futuro”":
    "“Headlines follow stock prices—news looks good when the stock goes up and bad when it drops. Nobody—no journalist, no analyst—can reliably predict the future.”",
  "No hay noticias ni hechos registrados en esta categoría recientemente.":
    "No recent news or filings in this category.",
  "Destacada": "Featured",
  "SEC 8-K oficial": "Official SEC 8-K",
  "Resultados": "Earnings",
  "Leer noticia completa": "Read full story",
  "Hechos regulatorios leídos directamente de la SEC y cobertura de medios financieros en tiempo real.":
    "Official SEC Form 8-K filings paired with real-time financial news.",
  "Sin contenidos inventados": "No AI-generated fluff",
};
