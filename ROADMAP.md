Altius — Plan Maestro de Ejecución
De terminal financiera a Investment Thesis OS
Estado: Propuesto
Fecha: 20/08/2026
Objetivo: convertir Altius de una terminal que muestra datos financieros en un sistema que ayuda al inversor fundamental a construir, cuestionar y vigilar una tesis de inversión.
Principio rector:
Altius no debe decirme qué comprar. Debe ayudarme a saber qué tiene que ocurrir para que el precio actual tenga sentido, cuándo mi tesis está equivocada y cuándo sigue siendo válida.

0. La estrategia en una frase
Altius debe evolucionar de:
DATOS FINANCIEROS
       ↓
ANÁLISIS
       ↓
VALORACIÓN
a:
DATOS VERIFICABLES
       ↓
VALORACIÓN INVERSA
       ↓
TESIS DE INVERSIÓN
       ↓
REFUTACIÓN
       ↓
SEGUIMIENTO
       ↓
APRENDIZAJE
La diferencia es fundamental.
Los datos son la infraestructura.
La tesis es el producto.
La recurrencia es el negocio.
1. Qué NO estamos construyendo
Estas decisiones son tan importantes como las funcionalidades.
Altius NO será:
- Un chatbot financiero genérico.
- Un asesor que diga "compra X".
- Un terminal Bloomberg barato.
- Una colección de dashboards.
- Una máquina de predicciones bursátiles.
- Una herramienta que rellena datos faltantes mediante IA.
- Un sistema que presenta estimaciones como hechos.
- Una aplicación de trading.
- Una promesa de rentabilidad.
El documento original ya establece correctamente que Altius no debe dar recomendaciones de inversión ni prometer rendimientos. 20260820altiusthesisos.mdMD
2. Principios no negociables
Estas reglas gobiernan todo el proyecto.
Verdad
- Nunca inventar un valor.
- Dato ausente → —.
- No convertir 0 en sustituto de "desconocido".
- No utilizar datos ficticios para demos.
- No utilizar fallbacks numéricos que puedan confundirse con datos reales.
El documento original detectó precisamente varios problemas de este tipo en portada, valoración y macro. 
Procedencia
Cada dato financiero debe poder responder:
¿De dónde sale?

Debe conservar:
- concepto XBRL;
- unidad;
- periodo;
- formulario;
- fecha de presentación;
- accession number;
- documento EDGAR.
Los datos derivados deben indicar:
- fórmula;
- entradas;
- procedencia de cada entrada.
La procedencia por celda es la base de las capas posteriores. 
Supuestos
Nunca:
Margen = 20%
si el 20 % es un default.
Debe ser:
Margen
20 %

⚠ Supuesto
Editable
IA
La IA:
- no inventa;
- no completa huecos;
- no aporta conocimiento externo;
- cita su evidencia;
- diferencia hecho e inferencia;
- puede responder "no disponible".
La IA debe ser la capa de interpretación, no la fuente de verdad. 
3. La nueva regla del roadmap
El roadmap deja de ser:
Fase 1 → Fase 2 → Fase 3 → Fase 4...

y pasa a ser:
Fase → Construcción → Validación → Gate → siguiente fase

Ninguna fase se desbloquea simplemente porque el código esté terminado.
4. Los Gates
Gate A — ¿Alguien paga?
Antes de invertir meses en infraestructura:
¿Hay usuarios que pagan por Reverse Valuation + Thesis?

Gate B — ¿Los datos son fiables a escala?
Antes de construir interpretación:
¿Podemos ampliar el motor sin degradar la calidad?

Gate C — ¿La refutación aporta valor?
Antes de construir alertas:
¿Los usuarios consideran que Altius encuentra cosas que ellos no habrían encontrado?

Gate D — ¿Existe recurrencia?
Antes de construir el ecosistema:
¿Los usuarios vuelven porque Altius está vigilando sus tesis?

Gate E — ¿Existe PMF?
Antes de internacionalizar/integrar/API:
¿Existe un producto que la gente paga y no quiere perder?

FASE 0 — VERDAD
Objetivo
Eliminar cualquier dato falso, supuesto oculto, inconsistencia de infraestructura o ambigüedad de procedencia.
Esta fase no añade "features sexy".
Hace que Altius sea digno de confianza.
0.1 Procedencia auditable
Implementar Provenance por celda.
Debe conservar:
concepto
unidad
periodo
formulario
fecha de filing
accession number
documento EDGAR
Para valores derivados:
fórmula
entradas
procedencia de entradas
El documento original ya detalla esta implementación y sus interfaces. 
0.2 "¿De dónde sale este número?"
Crear:
ProvenancePopover
Debe funcionar sobre:
- ingresos;
- EBIT;
- FCF;
- deuda;
- acciones;
- ratios;
- valoración;
- métricas derivadas.
0.3 Eliminar datos ficticios
Eliminar:
- leaders-data.ts;
- precios hardcodeados;
- datos financieros falsos;
- fallback macro ficticio;
- PREVIEW_DATA;
- cualquier cifra financiera de demostración.
El documento original ya identifica estos problemas explícitamente. 
0.4 Caché compartida
Activar SupabaseCacheStore.
La caché de producción no puede depender de /tmp, porque Vercel no garantiza persistencia ni compartición entre invocaciones. 
0.5 Degradación honesta
Si falta precio:
Precio actual
—
No:
Precio = 1
El precio objetivo puede calcularse.
El margen de seguridad no.
0.6 Supuestos explícitos
Todo default de valoración debe ser:
Assumed<T>
y estar visualmente marcado.
0.7 Higiene visual
Una única paleta.
Un único sistema de tema.
Eliminar tokens legacy.
El objetivo es que la interfaz transmita:
"Esta aplicación no intenta engañarme."

0.8 Documentación
Actualizar:
- README;
- .env.example;
- CLAUDE.md;
- arquitectura;
- procedencia;
- número real de tests;
- modelo Gemini.
Gate F0
No continuar hasta que:
- npm test esté verde.
- tsc esté limpio.
- ESLint esté limpio.
- No existan cifras financieras ficticias.
- Un dato real pueda rastrearse hasta EDGAR.
- Un dato derivado muestre su fórmula.
- Un precio ausente no produzca un margen de seguridad ficticio.
- La aplicación pueda funcionar degradando fuentes sin mentir.
FASE 1 — KILLER FEATURE
Reverse Investment Analysis + Investment Thesis
Esta es la fase más importante del proyecto.
No construiría F2 completa antes de validar esta fase.
1.1 Reverse Investment Analysis
La pregunta principal:
¿Qué tiene que ocurrir para que el precio actual genere un 12 % anual durante los próximos 5 años?

El motor debe despejar:
- crecimiento necesario;
- ingresos terminales;
- margen requerido;
- beneficio/FCF requerido;
- acciones finales;
- capitalización;
- enterprise value.
El motor matemático ya está definido en el documento original. 
1.2 Plausibilidad
No basta con:
"Necesitas crecer un 17,4 %."

Debe responder:
¿Es razonable?

Comparar contra:
- histórico de la empresa;
- ventanas móviles;
- tamaño de muestra.
Y ser explícito sobre la debilidad estadística de muestras pequeñas. El documento original señala correctamente que con diez ejercicios sólo existen cinco ventanas de CAGR a cinco años. 
1.3 Investment Thesis
El usuario puede guardar:
TESIS
─────
Empresa
Precio
Fecha

Hipótesis:
- Revenue CAGR
- Margen
- FCF
- Múltiplo
- Recompras/dilución
- Deuda
1.4 Escenarios
Cada tesis debe soportar:
BEAR
BASE
BULL
Cada escenario contiene:
- hipótesis;
- resultado;
- CAGR;
- valoración;
- riesgos.
1.5 Versionado
Nunca sobrescribir una tesis.
Revision 1
Revision 2
Revision 3
...
Debe ser posible responder:
"¿Qué pensaba yo sobre esta empresa hace 8 meses?"

El documento original ya establece esta arquitectura versionada. 
1.6 La tesis debe convertirse en el centro del producto
A partir de aquí:
Datos
   ↓
Valoración
   ↓
Hipótesis
   ↓
Tesis
No al revés.
🔥 VALIDACIÓN COMERCIAL 1
Antes de continuar:
Conseguir 10 usuarios reales.
No:
- 10 registros;
- 10 amigos;
- 10 personas que digan "está genial".
Sino:
10 personas dispuestas a pagar.

Puede ser Early Access.
No necesitamos todavía:
- Stripe perfecto;
- billing sofisticado;
- onboarding perfecto.
Necesitamos comprobar:
¿Existe willingness-to-pay?

Gate F1
Continuar si:
- usuarios crean tesis;
- utilizan Reverse Analysis;
- recuperan la tesis posteriormente;
- entienden la propuesta sin explicación del fundador;
- al menos 10 pagan.
Si no:
No construir F2 completa.
Investigar por qué.
FASE 2 — FOSO DE DATOS
Objetivo
Convertir el excelente motor XBRL existente en una capa de fundamentales consultable a escala.
El plan original propone aproximadamente:
4.500+ emisores

con cinco ejercicios de ingresos y balance. 
Mi modificación:
No trataría 4.500 como requisito inicial.
2.1 Etapa 2A — 500 empresas
Construir primero un universo deliberadamente difícil:
- grandes empresas;
- distintos sectores;
- distintos modelos de negocio;
- casos contables complicados.
Objetivo:
500 empresas muy fiables.

2.2 Etapa 2B — 4.500+
Sólo cuando la cobertura esté demostrada.
El sistema debe medir:
% cobertura por métrica
% cobertura por sector
% cobertura por empresa
Nunca:
"dato ausente = cero".

El riesgo de huecos por aliases es reconocido explícitamente en el plan original. 
2.3 Métricas precalculadas
Construir:
- P/E;
- EV/EBIT;
- EV/EBITDA;
- EV/FCF;
- FCF Yield;
- P/S;
- P/B cuando corresponda.
2.4 Histórico de valoración
Comparar:
Empresa hoy
vs
propia historia
vs
sector
2.5 Comparables
Automatizar comparables mediante clasificación/SIC.
2.6 Señales
QUALITY
BALANCE
CASH GENERATION
GROWTH
VALUATION
THESIS RISK
Pero ningún score opaco.
Todo debe poder desmontarse:
Score
 ↓
componentes
 ↓
métrica
 ↓
fórmula
 ↓
dato
 ↓
EDGAR
El documento original establece precisamente este requisito de auditabilidad. 
Gate F2
- 500 empresas fiables.
- Cobertura cuantificada.
- Sin falsos ceros.
- Percentiles reproducibles.
- Consultas rápidas.
- Procedencia conservada.
- Job reanudable.
Sólo entonces:
escalar a 4.500+.

FASE 3 — EL REFUTADOR
Aquí Altius empieza a hacer algo que considero realmente diferencial.
No:
"Analiza mi tesis."

Sino:
"Intenta demostrar que estoy equivocado."
3.1 Motor de refutación
Para cada hipótesis:
HIPÓTESIS
   ↓
Histórico
   ↓
Comparables
   ↓
10-K / 10-Q
   ↓
Guidance
   ↓
Riesgos
   ↓
Impacto cuantitativo
El LLM sólo redacta.
3.2 Evidencia
Cada afirmación debe poder abrir:
Documento
↓
Sección
↓
Fragmento
3.3 Hecho vs inferencia
Visualmente:
HECHO
o:
INFERENCIA
Nunca mezclar.
3.4 "¿Qué ha cambiado?"
Comparar:
- QoQ;
- YoY;
- TTM;
- 3 años;
- 5 años;
- 10 años.
Pero el ranking de importancia debe responder:
¿Cuánto afecta esto a mi tesis?

No:
"¿Cuánto cambió el número?"

El plan original hace esta distinción correctamente. 
🧪 Validación antes de automatizar
Probar con:
10 empresas reales.
Preguntar a usuarios:
"¿Este contraargumento cambia tu opinión?"

No basta con que técnicamente produzca texto.
Debe producir insight accionable.
Gate F3
Continuar sólo si:
- las citas son verificables;
- no aparecen datos sin fuente;
- la IA sabe decir "no disponible";
- el refutador encuentra contradicciones reales;
- los usuarios consideran útiles esas contradicciones.
FASE 4 — RECURRENCIA
Aquí aparece el producto que el usuario necesita volver a utilizar.
4.1 Monitor de tesis
Cada nueva publicación relevante:
Nueva información
      ↓
¿Afecta a alguna hipótesis?
      ↓
Sí
      ↓
Recalcular tesis
      ↓
Mostrar impacto
4.2 Alertas
No alertar por:
"Apple publicó resultados."

Alertar por:
🔴 Tu hipótesis de margen ya no se cumple.

o:
🟢 El precio cayó pero las hipótesis fundamentales permanecen intactas.

4.3 Móvil
El móvil debe responder en 30 segundos:
¿Ha cambiado algo importante en mi tesis?

4.4 Historial
Guardar:
Tesis original
↓
Evento
↓
Cambio
↓
Impacto
↓
Nueva tesis
Gate F4
Medir:
Thesis Activation Rate
Porcentaje de usuarios que:
crean tesis
→ vuelven
→ actualizan
→ reciben alerta
Y:
Thesis Return Rate
¿Cuántos usuarios vuelven específicamente por sus tesis?
🔥 VALIDACIÓN COMERCIAL 2
Objetivo:
- 30–50 usuarios de pago.
- uso recurrente;
- usuarios que vuelven sin ser perseguidos;
- usuarios que consideran las alertas útiles;
- churn razonable.
Si nadie vuelve:
No construir más features.

Hay que solucionar la recurrencia.
FASE 5 — WORKFLOW COMPLETO
Sólo después de demostrar que:
tesis + refutación + monitorización

funcionan.
5.1 Screening
Permitir:
ROIC > 15%
FCF margin > 10%
Revenue CAGR > 10%
Net Debt / EBITDA < 2x
P/E < 25
Pero cada resultado debe explicar:
por qué apareció.

5.2 Portfolio
Inicialmente:
entrada manual.

No integración con brokers.
El portfolio debe conectar con las tesis:
Portfolio
 ↓
Tesis
 ↓
Expected CAGR
 ↓
Peso
 ↓
Concentración
5.3 Diario de decisiones
Registrar:
- compra;
- venta;
- precio;
- fecha;
- tesis vigente.
Y posteriormente:
Predicción vs realidad.

El documento original propone utilizar la revisión de tesis vigente en el momento de la compra, no la última revisión. Esto es fundamental para evitar hindsight bias. 
5.4 Investment Memo
Exportar:
- tesis;
- escenarios;
- valoración;
- riesgos;
- datos;
- fuentes.
Sin ninguna cifra sin procedencia.
5.5 Aprendizaje del inversor
Con suficientes datos:
"Tus previsiones de crecimiento han sido demasiado optimistas un 23 %."

Esto puede convertirse en una funcionalidad tremendamente diferenciadora.
Gate F5
El usuario debe poder hacer:
Descubrir empresa
      ↓
Analizar
      ↓
Valorar
      ↓
Crear tesis
      ↓
Refutar
      ↓
Guardar
      ↓
Comprar
      ↓
Vigilar
      ↓
Revisar
      ↓
Aprender
Sin necesitar salir de Altius.
FASE 6 — NEGOCIO
Aquí hay que cambiar ligeramente el plan original.
No esperar hasta F6 para empezar a cobrar.
La monetización empieza en F1.
F6 sirve para optimizar y escalar el negocio, no para descubrir si alguien paga.
6.1 Modelo inicial
Free
- una empresa;
- una tesis.
Pro
- tesis ilimitadas;
- Reverse Analysis;
- alertas;
- screening;
- exportación.
El plan original propone una estructura similar. 
6.2 Métricas
Instrumentar desde el primer usuario de pago:
- WAU;
- MAU;
- retención;
- churn;
- ARPU;
- MRR;
- conversion rate;
- Thesis Activation Rate;
- Thesis Return Rate;
- alert engagement;
- CAC;
- payback period.
6.3 Objetivo inicial
La referencia del plan original es:
1.000 usuarios activos
150 pagando
€25 ARPU
€3.750 MRR
>60 % retención a 6 meses
Pero estos números deben tratarse como objetivos, no como consecuencias inevitables de completar el roadmap.
El propio documento advierte correctamente que construir las features no produce automáticamente los 150 clientes. 
6.4 Backtesting
Retrasado.
No es prioritario para demostrar PMF.
Además requiere resolver:
- histórico de precios;
- corporate actions;
- proveedor;
- survivorship bias;
- look-ahead bias.
El plan original reconoce que el límite actual de Alpha Vantage hace de esto un problema real. 
6.5 Data API
También retrasada.
Sólo tiene sentido cuando:
- universo estable;
- procedencia sólida;
- usuarios externos;
- demanda de API demostrada.
Entonces:
Altius Data API
puede monetizar directamente el activo XBRL.
🛑 Gate F6 — PMF
Antes de escalar:
- usuarios pagan;
- usuarios permanecen;
- usuarios vuelven;
- usuarios crean tesis;
- usuarios reciben alertas;
- existe crecimiento orgánico;
- CAC es razonable;
- el fundador no tiene que vender personalmente cada cuenta.
FASE 7 — ESCALA
Sólo aquí.
7.1 Cobertura internacional
La arquitectura debe poder soportar:
- US GAAP;
- IFRS;
- ESEF;
- EDINET;
- SEDAR+.
El plan original contempla precisamente separar la taxonomía del modelo normalizado para conseguirlo. 
7.2 Integraciones
Después de PMF:
- brokers;
- importación de cartera;
- Google Sheets;
- Excel;
- Notion;
- webhooks.
7.3 API
Si existe demanda:
Altius Data API
7.4 Backtesting avanzado
Sólo cuando:
- exista proveedor de precios adecuado;
- exista infraestructura histórica;
- haya suficiente demanda.
8. Lo que deliberadamente NO construiría todavía
🔴 No ahora
- Internacional.
- Integraciones.
- API.
- Backtesting sofisticado.
- Broker integrations.
- Features sociales.
- Recomendaciones de compra/venta.
- Chatbot financiero generalista.
9. Orden definitivo de prioridades
Si mañana sólo pudiera trabajar en cinco cosas:
#1
Procedencia + verdad
↓
#2
Reverse Investment Analysis
↓
#3
Investment Thesis persistente
↓
#4
Refutador basado en evidencia
↓
#5
Monitorización de tesis
Todo lo demás es secundario.
10. La arquitectura conceptual final
El producto debería terminar pareciéndose a esto:
                    ┌───────────────────┐
                    │  FUENTES PRIMARIAS│
                    │ SEC / FRED / etc. │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │ NORMALIZACIÓN XBRL│
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │ DATOS + EVIDENCIA │
                    └─────────┬─────────┘
                              ↓
                 ┌────────────────────────┐
                 │ REVERSE VALUATION      │
                 └────────────┬───────────┘
                              ↓
                 ┌────────────────────────┐
                 │ INVESTMENT THESIS      │
                 │ + ESCENARIOS            │
                 └────────────┬───────────┘
                              ↓
                 ┌────────────────────────┐
                 │ REFUTATION ENGINE       │
                 └────────────┬───────────┘
                              ↓
                 ┌────────────────────────┐
                 │ THESIS MONITOR          │
                 └────────────┬───────────┘
                              ↓
                 ┌────────────────────────┐
                 │ ALERTAS                 │
                 └────────────┬───────────┘
                              ↓
                 ┌────────────────────────┐
                 │ DECISION JOURNAL        │
                 └────────────┬───────────┘
                              ↓
                 ┌────────────────────────┐
                 │ LEARNING LOOP           │
                 └────────────────────────┘
11. El verdadero moat
No asumir:
"Nuestro moat es XBRL."

El moat potencial es:
Datos normalizados
       +
Procedencia
       +
Histórico de valoración
       +
Hipótesis del usuario
       +
Versiones de tesis
       +
Decisiones
       +
Resultados
       +
Patrones de error del inversor
Después de tres años:
Altius conoce cómo piensa y cómo se equivoca cada inversor.

Eso es mucho más difícil de sustituir que una tabla de ratios.
12. Métricas que definirían el éxito real
No quiero que el equipo se obsesione con:
"¿Cuántas funcionalidades hemos terminado?"

Quiero:
Producto
- tiempo hasta primera tesis;
- porcentaje que crea una tesis;
- tiempo desde ticker hasta tesis;
- tesis actualizadas;
- sesiones por tesis;
- alertas abiertas;
- alertas que provocan modificación de tesis.
Negocio
- usuarios de pago;
- MRR;
- ARPU;
- churn;
- retención;
- CAC;
- payback.
La métrica reina
¿Cuántos usuarios dicen que no quieren perder sus tesis de Altius?
Si esa cifra crece, estamos construyendo algo.
13. Kill Criteria
Esto lo añadiría obligatoriamente al documento.
Después de F1
Si no conseguimos:
10 usuarios pagando

→ revisar propuesta de valor.
Después de F2
Si no conseguimos datos fiables:
no construir F3.

Después de F3
Si el refutador no produce insights útiles:
no construir F4.

Después de F4
Si nadie vuelve por sus tesis:
no construir F5.

Después de F5
Si el workflow no aumenta retención:
no construir F6/F7 como si el PMF estuviera demostrado.

14. La regla más importante de todo el documento
No confundir software terminado con producto validado.

Una feature está terminada cuando funciona.
Un producto está validado cuando:
alguien paga por ella, vuelve a utilizarla y se enfada si desaparece.

15. El objetivo final
Altius no debería aspirar a que el usuario diga:
"Qué buenos datos."

Ni siquiera:
"Qué buena herramienta."

La frase que queremos conseguir es:
"No quiero tomar una decisión de inversión importante sin pasar primero por Altius."
Ese es el verdadero "POR DIOS, SÍ. TOMA MI DINERO."