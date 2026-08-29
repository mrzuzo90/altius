import { describe, expect, it } from "vitest";
import { buildStatementChartData, normalizeStatementBarRect } from "@/components/statement-series-dialog";
import {
  analyzeStatementTrend,
  analyzeBusinessProfile,
  buildInteractiveMotionPlan,
  buildPhaseOpacityTimeline,
  characterMoodForPhase,
  type StatementBarGeometry,
  type TrendPoint,
} from "@/components/statement-trend-animation";
import { getMetricSemantics, METRIC_SEMANTICS } from "@/lib/financials/metric-semantics";
import { BALANCE_SHEET, CASH_FLOW, INCOME_STATEMENT, RATIOS_STATEMENT } from "@/lib/sec/taxonomy";
import {
  analyzeTenYearPriceProfile,
  buildPriceMotionPlan,
  buildThreeMonthTrendPoints,
  type PricePointGeometry,
} from "@/components/price-trend-animation";
import type { LineSeries, Period } from "@/lib/sec/normalize";

const periods: Period[] = [
  { key: "FY2025", label: "FY 2025", end: "2025-12-31", fiscalYear: 2025, quarter: 4, derived: false },
  { key: "FY2024", label: "FY 2024", end: "2024-12-31", fiscalYear: 2024, quarter: 4, derived: false },
  { key: "FY2023", label: "FY 2023", end: "2023-12-31", fiscalYear: 2023, quarter: 4, derived: false },
];

const row: LineSeries = {
  line: { id: "revenue", label: "Ingresos", concepts: [], unit: "USD", kind: "duration" },
  cells: {
    FY2025: { value: 125, derived: false, provenance: { kind: "absent" } },
    FY2024: { value: null, derived: false, provenance: { kind: "absent" } },
    FY2023: { value: 80, derived: true, provenance: { kind: "absent" } },
  },
};

describe("buildStatementChartData", () => {
  it("ordena de antiguo a reciente y omite ausentes sin convertirlos en cero", () => {
    expect(buildStatementChartData(periods, row)).toEqual([
      { key: "FY2023", label: "FY 2023", end: "2023-12-31", value: 80, derived: true },
      { key: "FY2025", label: "FY 2025", end: "2025-12-31", value: 125, derived: false },
    ]);
  });

  it("normaliza la altura negativa de Recharts sin perder el extremo de la barra", () => {
    const negative = normalizeStatementBarRect(278.15, -220.15);
    expect(negative.y).toBeCloseTo(58);
    expect(negative.height).toBeCloseTo(220.15);
    expect(normalizeStatementBarRect(58, 120)).toEqual({ y: 58, height: 120 });
  });
});

describe("semántica financiera de Alti", () => {
  it("define una lectura explícita para todas las partidas visibles", () => {
    const lines = [...INCOME_STATEMENT, ...BALANCE_SHEET, ...CASH_FLOW, ...RATIOS_STATEMENT];
    expect(lines.filter((line) => METRIC_SEMANTICS[line.id] === undefined).map((line) => line.id)).toEqual([]);
  });

  it("distingue qué subidas crean valor, cuáles lo destruyen y cuáles necesitan contexto", () => {
    expect(getMetricSemantics({ id: "revenue" }).direction).toBe("higher");
    expect(getMetricSemantics({ id: "netIncome" }).direction).toBe("higher");
    expect(getMetricSemantics({ id: "longTermDebt" }).direction).toBe("lower");
    expect(getMetricSemantics({ id: "incomeTax" }).direction).toBe("lower");
    expect(getMetricSemantics({ id: "sharesDiluted" }).direction).toBe("lower");
    expect(getMetricSemantics({ id: "capex" }).direction).toBe("contextual");
  });

  it("mantiene el movimiento físico pero cambia la expresión según el significado económico", () => {
    expect(characterMoodForPhase("climb", "higher")).toBe("happy");
    expect(characterMoodForPhase("climb", "lower")).toBe("sad");
    expect(characterMoodForPhase("rocket", "lower")).toBe("worried");
    expect(characterMoodForPhase("snowboard", "lower")).toBe("happy");
    expect(characterMoodForPhase("parachute", "higher")).toBe("worried");
    expect(characterMoodForPhase("climb", "contextual")).toBe("neutral");
  });
});

describe("analyzeStatementTrend", () => {
  it.each([
    { name: "avance en escalera", values: [100, 110], scene: "stairs" },
    { name: "crecimiento con piolet", values: [100, 120], scene: "climb" },
    { name: "recorrido casi plano", values: [100, 103], scene: "flat" },
    { name: "pendiente descendente", values: [100, 90], scene: "ski" },
    { name: "caída extrema", values: [100, 49], scene: "distress" },
  ])("clasifica $name por su ritmo anual", ({ values, scene }) => {
    expect(analyzeStatementTrend(points(values)).scene).toBe(scene);
  });

  it("solo llama salto repentino a una ruptura final tras tres años previos estables", () => {
    expect(analyzeStatementTrend(points([100, 105, 110.25, 115.76, 180])).scene).toBe("surge");
  });

  it("conserva el relato de años planos aunque después haya varios años de crecimiento muy alto", () => {
    const analysis = analyzeStatementTrend(points([100, 102, 99, 101, 100, 170, 185]));

    expect(analysis.scene).toBe("surge");
    expect(analysis.title).toBe("Años planos y despegue");
    expect(analysis.breakoutIndex).toBe(5);
  });

  it("detecta una meseta visual larga antes de un despegue histórico que cambia la escala", () => {
    const analysis = analyzeStatementTrend(points([3, 3.2, 3.4, 4, 4.5, 5, 6, 9, 15, 27, 60, 130, 216]));

    expect(analysis.scene).toBe("surge");
    expect(analysis.title).toBe("Años planos y despegue");
    expect(analysis.breakoutIndex).toBe(10);
  });

  it("no confunde un crecimiento fuerte sostenido con un salto repentino", () => {
    expect(analyzeStatementTrend(points([100, 120, 144, 172.8, 207.36])).scene).toBe("climb");
  });

  it("no convierte un salto histórico antiguo en la escena repentina actual", () => {
    expect(analyzeStatementTrend(points([100, 170, 183.6, 198.29, 214.15])).scene).toBe("stairs");
  });

  it("exige histórico suficiente antes de declarar un salto repentino", () => {
    expect(analyzeStatementTrend(points([100, 105, 170])).scene).toBe("climb");
  });

  it("distingue una caída reciente de un crecimiento histórico todavía positivo", () => {
    const analysis = analyzeStatementTrend(points([100, 120, 144, 172.8, 207.36, 145.15]));

    expect(analysis.scene).toBe("ski");
    expect(analysis.annualGrowthPct).toBeGreaterThan(15);
    expect(analysis.latestChangePct).toBeLessThan(-29);
  });

  it("compara cada trimestre con el mismo trimestre anterior y no con el trimestre contiguo", () => {
    const quarterly: TrendPoint[] = [
      { key: "2023Q1", end: "2023-03-31", value: 100 },
      { key: "2023Q2", end: "2023-06-30", value: 200 },
      { key: "2023Q3", end: "2023-09-30", value: 120 },
      { key: "2023Q4", end: "2023-12-31", value: 240 },
      { key: "2024Q1", end: "2024-03-31", value: 108 },
      { key: "2024Q2", end: "2024-06-30", value: 216 },
      { key: "2024Q3", end: "2024-09-30", value: 129.6 },
      { key: "2024Q4", end: "2024-12-31", value: 259.2 },
    ];

    expect(analyzeStatementTrend(quarterly).scene).toBe("stairs");
  });

  it("no inventa una tendencia cuando solo hay un periodo", () => {
    expect(analyzeStatementTrend(points([100])).scene).toBe("insufficient");
  });
});

describe("analyzeBusinessProfile", () => {
  it("reconoce una empresa de paseo cuando los últimos años apenas cambian", () => {
    expect(analyzeBusinessProfile(points([100, 102, 101, 103, 102])).kind).toBe("walk");
    expect(analyzeBusinessProfile(points([100, 95.4, 96.9, 103.2, 107.6, 114.1])).kind).toBe("walk");
  });

  it("reconoce una empresa de escalera", () => {
    expect(analyzeBusinessProfile(points([100, 108, 116.64, 125.97, 136.05])).kind).toBe("stairs");
  });

  it("reconoce una empresa ascensor cuando compone por encima del 15 %", () => {
    const profile = analyzeBusinessProfile(points([100, 120, 144, 172.8, 207.36]));
    expect(profile.kind).toBe("elevator");
    expect(profile.title).toContain("compounder");
  });

  it("solo llama terremoto a la combinación de un pico superior al 30 % y otro inferior al -30 %", () => {
    expect(analyzeBusinessProfile(points([100, 112, 70, 101, 108])).kind).toBe("earthquake");
    expect(analyzeBusinessProfile(points([100, 135, 125, 140, 130])).kind).not.toBe("earthquake");
  });

  it("deja en transición una trayectoria sin continuidad suficiente", () => {
    expect(analyzeBusinessProfile(points([100, 115, 105, 120, 108, 122])).kind).toBe("mixed");
  });
});

describe("analyzeTenYearPriceProfile", () => {
  it("aplica la calificación de ascensor a los cierres anuales del gráfico de 10 años", () => {
    const profile = analyzeTenYearPriceProfile([
      { date: "2021-12-31", close: 100 },
      { date: "2022-12-30", close: 120 },
      { date: "2023-12-29", close: 145 },
      { date: "2024-12-31", close: 176 },
    ]);

    expect(profile.kind).toBe("elevator");
  });

  it("detecta un terremoto también en la cotización de 10 años", () => {
    const profile = analyzeTenYearPriceProfile([
      { date: "2021-12-31", close: 100 },
      { date: "2022-12-30", close: 140 },
      { date: "2023-12-29", close: 80 },
      { date: "2024-12-31", close: 95 },
    ]);

    expect(profile.kind).toBe("earthquake");
  });
});

describe("buildInteractiveMotionPlan", () => {
  const bars: StatementBarGeometry[] = [
    { index: 0, key: "FY2022", x: 70, y: 230, width: 30, height: 40, value: 100 },
    { index: 1, key: "FY2023", x: 125, y: 228, width: 30, height: 42, value: 102 },
    { index: 2, key: "FY2024", x: 180, y: 92, width: 30, height: 178, value: 260 },
  ];

  it("usa al anciano con +2 % y el cohete cuando el salto supera el 50 %", () => {
    const plan = buildInteractiveMotionPlan(bars);

    expect(plan.phases).toEqual(["elderly", "rocket"]);
    expect(plan.changesPct[0]).toBeCloseTo(2);
    expect(plan.changesPct[1]).toBeGreaterThan(150);
    expect(plan.path).toMatch(/^M 85 230/);
    expect(plan.path).toContain("Q 167.5 58");
    expect(plan.path).toMatch(/195 92$/);
  });

  it("usa el snowboard en una caída fuerte que no supera el 50 %", () => {
    const descent: StatementBarGeometry[] = [
      { index: 0, key: "FY2023", x: 70, y: 80, width: 30, height: 190, value: 100 },
      { index: 1, key: "FY2024", x: 125, y: 172, width: 30, height: 98, value: 60 },
      { index: 2, key: "FY2025", x: 180, y: 180, width: 30, height: 90, value: 58 },
    ];
    const plan = buildInteractiveMotionPlan(descent);

    expect(plan.phases).toEqual(["snowboard", "elderly"]);
    expect(plan.changesPct[0]).toBeCloseTo(-40);
    expect(plan.path).toContain("Q");
    expect(plan.path).toMatch(/195 180$/);
  });

  it("aplica los umbrales de paseo, peldaños, piolet, cohete, snowboard y paracaídas", () => {
    const transition = (currentValue: number) => buildInteractiveMotionPlan([
      { index: 0, key: "FY2024", x: 70, y: 170, width: 30, height: 100, value: 100 },
      { index: 1, key: "FY2025", x: 125, y: currentValue >= 100 ? 120 : 200, width: 30, height: 150, value: currentValue },
    ]).phases[0];

    expect(transition(102)).toBe("elderly");
    expect(transition(105)).toBe("elderly");
    expect(transition(106)).toBe("stairs");
    expect(transition(114)).toBe("stairs");
    expect(transition(115)).toBe("climb");
    expect(transition(150)).toBe("climb");
    expect(transition(151)).toBe("rocket");
    expect(transition(95)).toBe("elderly");
    expect(transition(70)).toBe("snowboard");
    expect(transition(50)).toBe("snowboard");
    expect(transition(49)).toBe("parachute");
  });

  it("reserva el paracaídas a cada tramo individual que pierde más de la mitad", () => {
    const descent: StatementBarGeometry[] = [
      { index: 0, key: "FY2022", x: 70, y: 70, width: 30, height: 200, value: 100 },
      { index: 1, key: "FY2023", x: 125, y: 185, width: 30, height: 85, value: 40 },
      { index: 2, key: "FY2024", x: 180, y: 205, width: 30, height: 65, value: 30 },
    ];

    expect(buildInteractiveMotionPlan(descent).phases).toEqual(["parachute", "snowboard"]);
  });

  it("mantiene un tramo largo como anciano y conserva la escalada mientras el crecimiento continúa", () => {
    const values = [100, 102, 101, 103, 102, 145, 166, 185];
    const geometry = values.map((value, index): StatementBarGeometry => ({
      index,
      key: `FY${2018 + index}`,
      x: 60 + index * 45,
      y: 250 - (value - 100) * 1.5,
      width: 28,
      height: 20 + (value - 100) * 1.5,
      value,
    }));

    expect(buildInteractiveMotionPlan(geometry).phases).toEqual([
      "elderly", "elderly", "elderly", "elderly", "climb", "stairs", "stairs",
    ]);
  });

  it("funde las poses durante unas décimas en lugar de sustituir el personaje de golpe", () => {
    const timeline = buildPhaseOpacityTimeline({
      phases: ["elderly", "climb", "parachute"],
      keyTimes: [0, 0.4, 0.7, 1],
    }, 10);

    expect(timeline.keyTimes).toHaveLength(6);
    expect((timeline.keyTimes[2] - timeline.keyTimes[1]) * 10).toBeCloseTo(0.76);
    expect(timeline.values.elderly.slice(0, 3)).toEqual([1, 1, 0]);
    expect(timeline.values.climb.slice(0, 4)).toEqual([0, 0, 1, 1]);
    expect(timeline.values.parachute.at(-1)).toBe(1);
  });
});

describe("buildPriceMotionPlan", () => {
  it("suaviza la geometría con una media móvil de tres meses", () => {
    const trend = buildThreeMonthTrendPoints([
      { index: 0, date: "2024-01-01", value: 100, x: 0, y: 200 },
      { index: 1, date: "2024-02-01", value: 110, x: 50, y: 180 },
      { index: 2, date: "2024-03-01", value: 130, x: 100, y: 140 },
    ]);

    expect(trend[2].averageValue).toBeCloseTo(113.33, 2);
    expect(trend[2].y).toBeCloseTo(173.33, 2);
  });

  it("clasifica la tendencia trimestral y recorre una curva continua", () => {
    const geometry: PricePointGeometry[] = [
      { index: 0, date: "2015-01-02", value: 100, x: 70, y: 210 },
      { index: 1, date: "2015-05-02", value: 104, x: 140, y: 204 },
      { index: 2, date: "2015-09-02", value: 110, x: 210, y: 195 },
      { index: 3, date: "2016-01-02", value: 127, x: 280, y: 170 },
      { index: 4, date: "2016-05-02", value: 200, x: 350, y: 80 },
      { index: 5, date: "2016-09-02", value: 90, x: 420, y: 230 },
      { index: 6, date: "2017-01-02", value: 80, x: 490, y: 245 },
    ];

    const plan = buildPriceMotionPlan(geometry);

    expect(plan.phases).toEqual(["elderly", "stairs", "climb", "rocket", "parachute", "snowboard"]);
    expect(plan.path).toMatch(/^M 70 210/);
    expect(plan.path).toContain(" C ");
    expect(plan.path).toMatch(/490 245$/);
    expect(plan.keyTimes.at(-1)).toBe(1);
  });
});

function points(values: number[]): TrendPoint[] {
  return values.map((value, index) => ({
    key: `FY${2023 + index}`,
    value,
    end: `${2023 + index}-12-31`,
  }));
}
