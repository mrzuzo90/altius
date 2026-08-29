# Cobertura financiera internacional

Actualizado: 25 de agosto de 2026.

## Objetivo y regla de calidad

Altius separa tres piezas que no deben confundirse:

1. Identidad del instrumento: ticker, mercado, divisa, ISIN/LEI y clase de acción.
2. Estados financieros: cifras reportadas, periodo, unidad, fecha de publicación y documento fuente.
3. Mercado: cierres históricos y eventos corporativos necesarios para poner precio y BPA en la misma base por acción.

El PER histórico se calcula como `precio ajustado por splits en la última sesión disponible antes de publicarse el beneficio anual / BPA diluido anual`. Los ejercicios con pérdidas no tienen PER. El PER actual de esta primera versión usa la última cotización y el último BPA anual publicado; no debe etiquetarse como LTM.

## Europa: implementado con ESEF

- ESEF es obligatorio para emisores sujetos a la Directiva de Transparencia. Los informes anuales son XHTML y los estados IFRS consolidados se etiquetan en Inline XBRL.
- Fuente normativa: https://www.esma.europa.eu/issuer-disclosure/electronic-reporting
- Índice y API pública: https://filings.xbrl.org/docs/api
- Identidad LEI abierta: https://www.gleif.org/en/lei-data/gleif-api

La implementación resuelve primero el ticker y la razón social, exige una coincidencia exacta en GLEIF, confirma que el LEI tenga filings ESEF y consolida todos los xBRL-JSON disponibles. Se excluyen hechos con dimensiones de segmento para no sumarlos o confundirlos con el total consolidado. Cada celda conserva el enlace al informe de origen.

Limitaciones reales: ESEF empieza en la práctica con ejercicios iniciados en 2020, existen huecos de recolección por país en filings.xbrl.org y el servicio gratuito puede imponer límites o retirarse. Para 10 o 20 años hay que completar la serie con PDFs históricos o con un proveedor licenciado.

## Canadá: no hacer scraping masivo de SEDAR+

- SEDAR+ declara que no acepta XBRL: https://systems.securities-administrators.ca/onlinehelp/faqs/continuous-disclosure/
- La CSA indicó que una API es un objetivo a largo plazo, no una función disponible: https://www.securities-administrators.ca/wp-content/uploads/2024/02/2023-12-06-SEDAR-Update-webinar-QA.pdf
- Sus términos prohíben scraping, búsquedas automatizadas, crear una base de datos y la distribución masiva/comercial sin permiso: https://systems.securities-administrators.ca/terms-of-use/

Por ello, una aplicación pública no debe construir el universo canadiense raspando SEDAR+. Las rutas viables son:

1. contratar la distribución bulk y una licencia de visualización/redistribución de SEDAR+;
2. contratar fundamentales globales normalizados;
3. para un conjunto limitado y con revisión jurídica, ingerir documentos enlazados por la propia web de relaciones con inversores del emisor.

## Australia: PDF primero

- ASIC permite presentar XBRL/iXBRL de forma voluntaria y anima a quien lo haga a publicarlo en su web: https://www.asic.gov.au/regulatory-resources/financial-reporting-and-audit/preparers-of-financial-reports/digital-financial-reports
- ASX ofrece servicios licenciados de precios, referencia y noticias corporativas: https://www.asx.com.au/connectivity-and-data/information-services

No existe un flujo XBRL universal comparable con SEC/ESEF. La cobertura amplia exige informes ASX/IR en PDF más extracción, reconciliación y control de calidad, o un feed licenciado.

## Pipeline PDF/IR recomendado

1. Descubrir el informe desde el regulador/bolsa y usar IR solo como respaldo.
2. Guardar URL, hash, fecha de descarga, periodo y versión; nunca sobrescribir una reexpresión.
3. Extraer tablas nativas; usar OCR solo para páginas escaneadas.
4. Mapear conceptos originales a una taxonomía común, conservando etiqueta y unidad originales.
5. Validar `activo = pasivo + patrimonio`, subtotales, signo del flujo de caja y BPA frente al informe.
6. Publicar únicamente cifras que pasen validación y enlazar la página exacta del PDF.
7. Mantener una cola de revisión humana para extensiones, cambios de presentación y clases de acción.

## Proveedores a considerar

- Gratis para la capa regulatoria: SEC EDGAR, ESEF/filings.xbrl.org, GLEIF y FRED. Son la base preferida, pero no dan por sí solos 20 años de todas las cotizadas.
- EODHD: útil para un prototipo y cubre fundamentales de más de 70 bolsas; la capa gratuita es limitada y hay que contratar licencia adecuada para mostrar o redistribuir datos. https://eodhd.com/lp/fundamental-data-api
- Financial Modeling Prep: API sencilla y hasta 30 años en parte de su catálogo; la visualización/redistribución requiere acuerdo comercial específico. https://site.financialmodelingprep.com/developer/docs/pricing?planType=commercial
- Twelve Data: buena unificación de precios y fundamentales globales; los derechos de uso dependen del plan y una plataforma pública debe usar su oferta de negocio. https://twelvedata.com/pricing-business
- LSEG Company Fundamentals: opción institucional recomendada si la promesa comercial es “casi todo el mundo”. Publica cobertura de más de 120.000 compañías, más de 150 bolsas, datos point-in-time y décadas de histórico. https://www.lseg.com/en/data-catalogue/company-data

## Decisión recomendada

Mantener SEC + ESEF como capa gratuita y auditable. Añadir PDF/IR solo como pipeline controlado para huecos prioritarios. Antes de prometer Canadá y Australia completos o 20 años globales, contratar y probar un feed con derechos de display/redistribución; LSEG es la referencia de máxima cobertura y FMP/EODHD son las alternativas de coste menor para validar producto.
