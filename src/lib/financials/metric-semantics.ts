import type { LineDef } from "@/lib/sec/taxonomy";

export type MetricDirection = "higher" | "lower" | "contextual";

export type MetricSemantics = {
  direction: MetricDirection;
  label: "Más es mejor" | "Menos es mejor" | "El contexto importa";
  explanation: string;
};

const HIGHER = (explanation: string): MetricSemantics => ({
  direction: "higher",
  label: "Más es mejor",
  explanation,
});

const LOWER = (explanation: string): MetricSemantics => ({
  direction: "lower",
  label: "Menos es mejor",
  explanation,
});

const CONTEXTUAL = (explanation: string): MetricSemantics => ({
  direction: "contextual",
  label: "El contexto importa",
  explanation,
});

export const METRIC_SEMANTICS: Record<string, MetricSemantics> = {
  // Cuenta de resultados
  revenue: HIGHER("Una facturación creciente amplía la base sobre la que la empresa puede generar beneficios."),
  costOfRevenue: LOWER("Un coste menor, para un nivel de ventas comparable, deja más beneficio bruto."),
  grossProfit: HIGHER("Más beneficio bruto indica que queda más dinero después del coste directo de vender."),
  researchAndDevelopment: CONTEXTUAL("Puede ser una inversión productiva o un gasto poco rentable; debe compararse con ventas y resultados futuros."),
  sellingGeneralAdmin: LOWER("Un gasto menor, con ventas comparables, suele reflejar una estructura más eficiente."),
  operatingExpenses: LOWER("Menos gastos operativos, manteniendo el negocio, favorecen el margen y el beneficio."),
  operatingIncome: HIGHER("Más resultado operativo significa que el negocio principal genera más beneficio."),
  interestExpense: LOWER("Menos gasto financiero deja más beneficio para el accionista y reduce la presión de la deuda."),
  otherNonOperating: CONTEXTUAL("Puede mezclar ingresos y gastos no recurrentes; su calidad importa más que su dirección."),
  pretaxIncome: HIGHER("Más beneficio antes de impuestos refleja una mayor capacidad de generar resultados."),
  incomeTax: LOWER("A igualdad de beneficio antes de impuestos, una carga fiscal menor deja más beneficio neto."),
  netIncome: HIGHER("Más beneficio neto aumenta la capacidad de reinvertir, reducir deuda o remunerar al accionista."),
  epsBasic: HIGHER("Más beneficio por acción significa que cada acción participa en una porción mayor del resultado."),
  epsDiluted: HIGHER("Más beneficio diluido por acción incorpora el efecto potencial de la dilución."),
  sharesDiluted: LOWER("Menos acciones diluidas reparten el beneficio entre menos títulos y protegen al accionista existente."),

  // Balance
  cash: HIGHER("Más efectivo aporta liquidez y capacidad para invertir, resistir o reducir deuda."),
  shortTermInvestments: HIGHER("Más inversiones líquidas refuerzan la disponibilidad financiera a corto plazo."),
  cashAndShortTermInvestments: HIGHER("Más efectivo e inversiones líquidas refuerzan la capacidad financiera inmediata."),
  receivables: LOWER("Menos cobros pendientes, con ventas comparables, suelen indicar una mejor conversión en caja."),
  inventory: LOWER("Menos existencias, con ventas comparables, inmovilizan menos capital y reducen riesgo de obsolescencia."),
  currentAssets: HIGHER("Más activo corriente mejora la cobertura de obligaciones próximas, si su calidad es buena."),
  ppe: CONTEXTUAL("Puede reflejar inversión para crecer o exceso de capital; debe relacionarse con ventas y retornos."),
  goodwill: LOWER("Menos fondo de comercio reduce el riesgo ligado a adquisiciones, aunque una caída por deterioro también exige revisión."),
  intangibles: LOWER("Menos intangibles reduce el peso de activos difíciles de valorar, pero depende de cómo se hayan originado."),
  totalAssets: CONTEXTUAL("Una empresa más grande no es necesariamente mejor; importa el retorno que obtiene de esos activos."),
  accountsPayable: LOWER("Menos pagos pendientes reducen obligaciones, aunque el plazo de proveedores también forma parte del circulante."),
  shortTermDebt: LOWER("Menos deuda próxima a vencer reduce el riesgo de refinanciación."),
  currentLiabilities: LOWER("Menos obligaciones a corto plazo alivian la presión inmediata sobre la caja."),
  longTermDebt: LOWER("Menos deuda financiera reduce intereses, riesgo y dependencia del crédito."),
  totalDebt: LOWER("Menos deuda financiera total reduce intereses, riesgo y dependencia del crédito."),
  netDebt: LOWER("Menos deuda neta —o una posición de caja neta— aporta mayor resistencia financiera."),
  totalLiabilities: LOWER("Menos pasivo total, a igualdad de negocio, suele dar un balance más resistente."),
  redeemableNci: LOWER("Menos participaciones rescatables reducen compromisos potenciales frente a terceros."),
  temporaryEquityParent: LOWER("Menos patrimonio temporal reduce instrumentos con posibles obligaciones de rescate."),
  retainedEarnings: HIGHER("Más reservas acumuladas muestran beneficios retenidos dentro de la compañía."),
  equityParent: HIGHER("Más patrimonio atribuible a la dominante amplía el colchón de los accionistas."),
  minorityInterest: CONTEXTUAL("Depende de la estructura de filiales y de cuánto beneficio pertenece a terceros."),
  equity: HIGHER("Más patrimonio neto ofrece un mayor colchón frente a pérdidas y deuda."),
  liabilitiesAndEquity: CONTEXTUAL("Es el total contable del balance; su tamaño por sí solo no mide calidad."),
  sharesOutstanding: LOWER("Menos acciones en circulación reparten el valor y los beneficios entre menos títulos."),

  // Flujo de caja
  cfNetIncome: HIGHER("Más resultado neto aporta una mejor base para generar caja."),
  depreciation: CONTEXTUAL("Es un gasto no monetario que depende de la intensidad de capital y de la edad de los activos."),
  stockComp: LOWER("Menos retribución en acciones reduce la dilución potencial del accionista."),
  operatingCashFlow: HIGHER("Más caja operativa indica que el negocio convierte mejor su actividad en dinero real."),
  capex: CONTEXTUAL("Más inversión puede impulsar el crecimiento o consumir caja sin retorno; debe juzgarse junto al negocio."),
  investingCashFlow: CONTEXTUAL("Suele ser negativo cuando la empresa invierte; la composición importa más que el signo."),
  dividends: CONTEXTUAL("Más dividendos remuneran al accionista, pero también dejan menos caja para reinvertir o reducir deuda."),
  buybacks: CONTEXTUAL("Las recompras crean valor si se hacen a buen precio y sin debilitar el balance."),
  financingCashFlow: CONTEXTUAL("Puede reflejar deuda, ampliaciones, dividendos o recompras; hay que revisar sus componentes."),
  freeCashFlow: HIGHER("Más flujo de caja libre amplía la capacidad de reinvertir, reducir deuda o remunerar al accionista."),

  // Ratios y márgenes
  grossMargin: HIGHER("Un margen bruto mayor indica más valor retenido después de los costes directos."),
  ebitda: HIGHER("Más EBITDA refleja una mayor generación operativa antes de amortizaciones e intereses."),
  ebitdaMargin: HIGHER("Un margen EBITDA mayor indica más resultado operativo por cada unidad vendida."),
  operatingMargin: HIGHER("Un margen operativo mayor muestra un negocio más rentable y eficiente."),
  netMargin: HIGHER("Un margen neto mayor convierte una mayor parte de las ventas en beneficio final."),
  fcfMargin: HIGHER("Un margen FCF mayor convierte una mayor parte de las ventas en caja libre."),
  roe: HIGHER("Un ROE mayor indica más beneficio por unidad de patrimonio, siempre que no dependa de deuda excesiva."),
  roa: HIGHER("Un ROA mayor muestra un uso más productivo de los activos."),
  roic: HIGHER("Un ROIC mayor indica una mejor rentabilidad del capital empleado en el negocio."),
  effectiveTaxRate: LOWER("Un tipo efectivo menor deja más beneficio neto, siempre que sea sostenible y conforme a la normativa."),
  fcfConversion: HIGHER("Una conversión mayor indica que más EBITDA termina convertido en caja libre."),
  revenueGrowthYoY: HIGHER("Un crecimiento mayor de ingresos señala una expansión más rápida del negocio."),
  epsGrowthYoY: HIGHER("Un crecimiento mayor del BPA aumenta el beneficio atribuible a cada acción."),
  fcfGrowthYoY: HIGHER("Un crecimiento mayor del FCF amplía la caja disponible para crear valor."),
};

const FALLBACK = CONTEXTUAL("Esta partida necesita compararse con el resto de los estados financieros antes de interpretarla.");

export function getMetricSemantics(line: Pick<LineDef, "id">): MetricSemantics {
  return METRIC_SEMANTICS[line.id] ?? FALLBACK;
}

export function changeIsFavorable(changePct: number | null, semantics: MetricSemantics): boolean | null {
  if (changePct === null || Math.abs(changePct) < 0.05 || semantics.direction === "contextual") return null;
  return semantics.direction === "higher" ? changePct > 0 : changePct < 0;
}
