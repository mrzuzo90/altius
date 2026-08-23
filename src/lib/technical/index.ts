import type { PricePoint } from "@/lib/prices/types";
import type {
  IndicatorPoint,
  SupportResistanceLevel,
  TechnicalBias,
  TechnicalDataset,
  TechnicalSignal,
  TechnicalStats,
} from "./types";

export * from "./types";

/**
 * Calcula la Media Móvil Simple (SMA) para un periodo dado.
 * Si no hay suficientes puntos previos para la ventana, devuelve null.
 */
export function calculateSMA(values: number[], period: number): (number | null)[] {
  if (period <= 0) return values.map(() => null);
  const result: (number | null)[] = [];
  let sum = 0;

  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      result.push(sum / period);
    } else {
      result.push(null);
    }
  }
  return result;
}

/**
 * Calcula la Media Móvil Exponencial (EMA) para un periodo dado.
 */
export function calculateEMA(values: number[], period: number): (number | null)[] {
  if (period <= 0 || values.length === 0) return values.map(() => null);
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);

  let initialSum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      initialSum += values[i];
      result.push(null);
    } else if (i === period - 1) {
      initialSum += values[i];
      const initialEma = initialSum / period;
      result.push(initialEma);
    } else {
      const prevEma = result[i - 1]!;
      const currentEma = values[i] * k + prevEma * (1 - k);
      result.push(currentEma);
    }
  }
  return result;
}

/**
 * Calcula las Bandas de Bollinger (SMA 20 + 2 stdDev).
 */
export function calculateBollingerBands(
  values: number[],
  period = 20,
  multiplier = 2,
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
  percentB: (number | null)[];
  bandwidth: (number | null)[];
} {
  const middle = calculateSMA(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  const percentB: (number | null)[] = [];
  const bandwidth: (number | null)[] = [];

  for (let i = 0; i < values.length; i++) {
    const sma = middle[i];
    if (sma === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
      percentB.push(null);
      bandwidth.push(null);
      continue;
    }

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(values[j] - sma, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    const up = sma + multiplier * stdDev;
    const low = sma - multiplier * stdDev;
    const bandWidthVal = sma !== 0 ? ((up - low) / sma) * 100 : 0;
    const bandSpan = up - low;
    const pctB = bandSpan > 0 ? (values[i] - low) / bandSpan : 0.5;

    upper.push(up);
    lower.push(low);
    percentB.push(pctB);
    bandwidth.push(bandWidthVal);
  }

  return { upper, middle, lower, percentB, bandwidth };
}

/**
 * Calcula el Índice de Fuerza Relativa (RSI de Wilder) a 14 periodos.
 */
export function calculateRSI(values: number[], period = 14): (number | null)[] {
  if (values.length <= period) {
    return values.map(() => null);
  }

  const result: (number | null)[] = [null]; // el primer día no tiene variación
  let prevGainSum = 0;
  let prevLossSum = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) {
      prevGainSum += diff;
    } else {
      prevLossSum += Math.abs(diff);
    }
    if (i < period) {
      result.push(null);
    }
  }

  let avgGain = prevGainSum / period;
  let avgLoss = prevLossSum / period;

  const firstRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const firstRSI = avgLoss === 0 ? 100 : 100 - 100 / (1 + firstRS);
  result.push(firstRSI);

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const currentGain = diff >= 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      result.push(rsi);
    }
  }

  return result;
}

/**
 * Calcula el indicador MACD (Fast EMA 12, Slow EMA 26, Signal EMA 9).
 */
export function calculateMACD(
  values: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEma = calculateEMA(values, fastPeriod);
  const slowEma = calculateEMA(values, slowPeriod);

  const rawMacd: (number | null)[] = [];
  const validMacdValues: number[] = [];
  const validMacdIndices: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const f = fastEma[i];
    const s = slowEma[i];
    if (f !== null && s !== null) {
      const macdVal = f - s;
      rawMacd.push(macdVal);
      validMacdValues.push(macdVal);
      validMacdIndices.push(i);
    } else {
      rawMacd.push(null);
    }
  }

  const signalOnValid = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: (number | null)[] = values.map(() => null);
  const histogram: (number | null)[] = values.map(() => null);

  for (let k = 0; k < validMacdIndices.length; k++) {
    const origIdx = validMacdIndices[k];
    const sig = signalOnValid[k];
    signalLine[origIdx] = sig;
    const macdVal = rawMacd[origIdx];
    if (macdVal !== null && sig !== null) {
      histogram[origIdx] = macdVal - sig;
    }
  }

  return {
    macdLine: rawMacd,
    signalLine,
    histogram,
  };
}

/**
 * Calcula niveles de soporte y resistencia cuantitativos basados en mínimos y máximos locales.
 */
export function calculateSupportResistance(points: PricePoint[], lookback = 100): {
  supports: SupportResistanceLevel[];
  resistances: SupportResistanceLevel[];
} {
  if (points.length < 5) return { supports: [], resistances: [] };

  const recent = points.slice(-lookback);
  const currentPrice = points.at(-1)?.close ?? 0;
  if (currentPrice === 0) return { supports: [], resistances: [] };

  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  for (let i = 2; i < recent.length - 2; i++) {
    const pPrev2 = recent[i - 2].close;
    const pPrev1 = recent[i - 1].close;
    const pCurr = recent[i].close;
    const pNext1 = recent[i + 1].close;
    const pNext2 = recent[i + 2].close;

    if (pCurr > pPrev1 && pCurr > pPrev2 && pCurr > pNext1 && pCurr > pNext2) {
      pivotHighs.push(pCurr);
    }
    if (pCurr < pPrev1 && pCurr < pPrev2 && pCurr < pNext1 && pCurr < pNext2) {
      pivotLows.push(pCurr);
    }
  }

  // Agrupar niveles cercanos dentro del 2%
  function cluster(levels: number[], type: "support" | "resistance"): SupportResistanceLevel[] {
    const filtered =
      type === "resistance"
        ? levels.filter((lvl) => lvl >= currentPrice)
        : levels.filter((lvl) => lvl <= currentPrice);

    filtered.sort((a, b) => (type === "resistance" ? a - b : b - a));

    const clusters: { price: number; count: number }[] = [];
    for (const lvl of filtered) {
      const match = clusters.find((c) => Math.abs((c.price - lvl) / c.price) < 0.025);
      if (match) {
        match.price = (match.price * match.count + lvl) / (match.count + 1);
        match.count += 1;
      } else {
        clusters.push({ price: lvl, count: 1 });
      }
    }

    return clusters.slice(0, 3).map((c) => ({
      price: c.price,
      type,
      distancePct: ((c.price - currentPrice) / currentPrice) * 100,
      strength: Math.min(3, c.count) as 1 | 2 | 3,
    }));
  }

  return {
    supports: cluster(pivotLows, "support"),
    resistances: cluster(pivotHighs, "resistance"),
  };
}

/**
 * Calcula la volatilidad anualizada a partir de los rendimientos de los puntos.
 */
export function calculateAnnualizedVolatility(points: PricePoint[], periodsPerYear = 52): number {
  if (points.length < 3) return 0;
  const returns: number[] = [];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].close;
    if (prev > 0) {
      returns.push((points[i].close - prev) / prev);
    }
  }

  if (returns.length < 2) return 0;

  const mean = returns.reduce((acc, r) => acc + r, 0) / returns.length;
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  return stdDev * Math.sqrt(periodsPerYear) * 100;
}

/**
 * Evalúa las señales cuantitativas y genera un diagnóstico estructurado.
 */
export function evaluateTechnicalDiagnostics(
  points: PricePoint[],
  sma20Vals: (number | null)[],
  sma50Vals: (number | null)[],
  sma200Vals: (number | null)[],
  rsiVals: (number | null)[],
  macdHistogramVals: (number | null)[],
  bollingerPercentBVals: (number | null)[],
): {
  signals: TechnicalSignal[];
  overallBias: TechnicalBias;
  summaryText: string;
} {
  const currentPrice = points.at(-1)?.close ?? 0;
  const lastSma20 = sma20Vals.at(-1) ?? null;
  const lastSma50 = sma50Vals.at(-1) ?? null;
  const lastSma200 = sma200Vals.at(-1) ?? null;
  const lastRsi = rsiVals.at(-1) ?? null;
  const lastMacdHist = macdHistogramVals.at(-1) ?? null;
  const lastPctB = bollingerPercentBVals.at(-1) ?? null;

  const signals: TechnicalSignal[] = [];
  let score = 0; // Escala de -5 a +5

  // 1. Tendencia de Largo Plazo (Precio vs SMA 200)
  if (lastSma200 !== null && lastSma200 > 0) {
    const dist200 = ((currentPrice - lastSma200) / lastSma200) * 100;
    const isAbove = currentPrice >= lastSma200;
    score += isAbove ? 1.5 : -1.5;
    signals.push({
      indicator: "SMA 200 (Tendencia Principal)",
      value: `$${lastSma200.toFixed(2)} (${isAbove ? "+" : ""}${dist200.toFixed(1)}%)`,
      label: isAbove ? "Tendencia Alcista a L/P" : "Tendencia Bajista a L/P",
      bias: isAbove ? "bullish" : "bearish",
      description: isAbove
        ? `El precio cotiza un ${dist200.toFixed(1)}% por encima de su media institucional de 200 periodos.`
        : `El precio cotiza un ${Math.abs(dist200).toFixed(1)}% por debajo de su media de 200 periodos.`,
    });
  }

  // 2. Cruce de Medias (SMA 50 vs SMA 200)
  if (lastSma50 !== null && lastSma200 !== null) {
    const isGolden = lastSma50 >= lastSma200;
    score += isGolden ? 1 : -1;
    signals.push({
      indicator: "Cruce SMA 50 / 200",
      value: `SMA50: $${lastSma50.toFixed(2)} | SMA200: $${lastSma200.toFixed(2)}`,
      label: isGolden ? "Estructura Golden Cross" : "Estructura Death Cross",
      bias: isGolden ? "bullish" : "bearish",
      description: isGolden
        ? "La media de medio plazo (50) se sitúa sobre la de largo plazo (200), confirmando soporte dinámico."
        : "La media de medio plazo (50) se sitúa bajo la de largo plazo (200), indicando presión de fondo.",
    });
  }

  // 3. Momento de Corto Plazo (Precio vs SMA 20)
  if (lastSma20 !== null && lastSma20 > 0) {
    const dist20 = ((currentPrice - lastSma20) / lastSma20) * 100;
    const isAbove20 = currentPrice >= lastSma20;
    score += isAbove20 ? 0.75 : -0.75;
    signals.push({
      indicator: "SMA 20 (Impulso Corto Plazo)",
      value: `$${lastSma20.toFixed(2)} (${isAbove20 ? "+" : ""}${dist20.toFixed(1)}%)`,
      label: isAbove20 ? "Impulso Positivo C/P" : "Corrección C/P",
      bias: isAbove20 ? "bullish" : "bearish",
      description: isAbove20
        ? "El activo mantiene tracción sobre su promedio móvil de 20 periodos."
        : "El precio se encuentra temporalmente por debajo de su media de corto plazo.",
    });
  }

  // 4. Momentum Oscilador (RSI 14)
  if (lastRsi !== null) {
    let rsiBias: TechnicalBias = "neutral";
    let rsiLabel = "RSI Neutral";
    let rsiDesc = `RSI en ${lastRsi.toFixed(1)}, oscilando en rango intermedio de equilibrio.`;

    if (lastRsi >= 70) {
      rsiBias = "bearish";
      score -= 0.5;
      rsiLabel = "Sobrecompra (RSI ≥ 70)";
      rsiDesc = `RSI en ${lastRsi.toFixed(1)}, zona de extensión alcista susceptible de consolidación.`;
    } else if (lastRsi <= 30) {
      rsiBias = "bullish";
      score += 0.5;
      rsiLabel = "Sobreventa (RSI ≤ 30)";
      rsiDesc = `RSI en ${lastRsi.toFixed(1)}, nivel de agotamiento vendedor susceptible de rebote técnico.`;
    } else if (lastRsi > 55) {
      rsiBias = "bullish";
      score += 0.75;
      rsiLabel = "Momentum Favorable (55-70)";
      rsiDesc = `RSI en ${lastRsi.toFixed(1)}, demostrando fuerza compradora sin signos de agotamiento.`;
    } else if (lastRsi < 45) {
      rsiBias = "bearish";
      score -= 0.75;
      rsiLabel = "Debilidad de Momentum (30-45)";
      rsiDesc = `RSI en ${lastRsi.toFixed(1)}, reflejando debilidad en la presión compradora.`;
    }

    signals.push({
      indicator: "RSI 14 (Fuerza Relativa)",
      value: `${lastRsi.toFixed(1)} / 100`,
      label: rsiLabel,
      bias: rsiBias,
      description: rsiDesc,
    });
  }

  // 5. Convergencia/Divergencia (MACD Histograma)
  if (lastMacdHist !== null) {
    const isHistPositive = lastMacdHist >= 0;
    score += isHistPositive ? 0.75 : -0.75;
    signals.push({
      indicator: "MACD Histograma",
      value: `${lastMacdHist >= 0 ? "+" : ""}${lastMacdHist.toFixed(2)}`,
      label: isHistPositive ? "Aceleración Alcista" : "Presión Vendedora",
      bias: isHistPositive ? "bullish" : "bearish",
      description: isHistPositive
        ? "Línea MACD cruzada al alza sobre su señal de 9 periodos."
        : "Línea MACD cotizando bajo su señal de 9 periodos.",
    });
  }

  // 6. Bandas de Bollinger (%B)
  if (lastPctB !== null) {
    let bbBias: TechnicalBias = "neutral";
    let bbLabel = "Dentro del Canal Bollinger";
    let bbDesc = `Posición %B en ${(lastPctB * 100).toFixed(0)}%, dentro de rangos normales de volatilidad.`;

    if (lastPctB >= 1.0) {
      bbBias = "neutral";
      bbLabel = "Toque de Banda Superior";
      bbDesc = "Precio cotiza en la banda superior de Bollinger (alta volatilidad / expansión alcista).";
    } else if (lastPctB <= 0.0) {
      bbBias = "neutral";
      bbLabel = "Toque de Banda Inferior";
      bbDesc = "Precio apoyando en la banda inferior de Bollinger (posible soporte dinámico).";
    }

    signals.push({
      indicator: "Bandas de Bollinger (%B)",
      value: `${(lastPctB * 100).toFixed(0)}%`,
      label: bbLabel,
      bias: bbBias,
      description: bbDesc,
    });
  }

  // Determinar Sesgo Global
  let overallBias: TechnicalBias = "neutral";
  let summaryText = "";

  if (score >= 3.0) {
    overallBias = "strong_bullish";
    summaryText =
      "Estructura técnica de fuerte sesgo alcista: cotización firme sobre las medias móviles clave (SMA 200 y SMA 50) y momentum positivo consistente.";
  } else if (score >= 1.0) {
    overallBias = "bullish";
    summaryText =
      "Sesgo técnico predominantemente alcista: el precio mantiene soportes de medio plazo y los osciladores muestran tracción favorable.";
  } else if (score <= -3.0) {
    overallBias = "strong_bearish";
    summaryText =
      "Estructura técnica de fuerte sesgo bajista: cotización bajo la media de 200 periodos y momentum vendedor dominante.";
  } else if (score <= -1.0) {
    overallBias = "bearish";
    summaryText =
      "Sesgo técnico defensivo / bajista: presión sobre medias móviles clave y osciladores en territorio desfavorable.";
  } else {
    overallBias = "neutral";
    summaryText =
      "Estructura técnica neutral o en consolidación: equilibrio entre fuerzas compradoras y vendedoras en torno a medias móviles intermedias.";
  }

  return { signals, overallBias, summaryText };
}

/**
 * Transforma una serie de precios crudos en un dataset técnico completo enriquecido.
 */
export function buildTechnicalDataset(
  ticker: string,
  source: string,
  points: PricePoint[],
): TechnicalDataset {
  const closes = points.map((p) => p.close);

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const bollinger = calculateBollingerBands(closes, 20, 2);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes, 12, 26, 9);

  const enrichedPoints: IndicatorPoint[] = points.map((p, idx) => ({
    date: p.date,
    close: p.close,
    sma20: sma20[idx],
    sma50: sma50[idx],
    sma200: sma200[idx],
    ema20: ema20[idx],
    ema50: ema50[idx],
    bollingerUpper: bollinger.upper[idx],
    bollingerMiddle: bollinger.middle[idx],
    bollingerLower: bollinger.lower[idx],
    bollingerPercentB: bollinger.percentB[idx],
    bollingerBandwidth: bollinger.bandwidth[idx],
    rsi14: rsi[idx],
    macdLine: macd.macdLine[idx],
    macdSignal: macd.signalLine[idx],
    macdHistogram: macd.histogram[idx],
  }));

  const currentPrice = closes.at(-1) ?? 0;
  const recent1Year = points.slice(-52);
  const high52w = recent1Year.length > 0 ? Math.max(...recent1Year.map((p) => p.close)) : currentPrice;
  const low52w = recent1Year.length > 0 ? Math.min(...recent1Year.map((p) => p.close)) : currentPrice;

  const distHigh = high52w > 0 ? ((currentPrice - high52w) / high52w) * 100 : 0;
  const distLow = low52w > 0 ? ((currentPrice - low52w) / low52w) * 100 : 0;

  const vol = calculateAnnualizedVolatility(recent1Year);
  const { supports, resistances } = calculateSupportResistance(points);

  const diagnostics = evaluateTechnicalDiagnostics(
    points,
    sma20,
    sma50,
    sma200,
    rsi,
    macd.histogram,
    bollinger.percentB,
  );

  const prev1W = points.length >= 2 ? points[points.length - 2].close : null;
  const prev1M = points.length >= 5 ? points[points.length - 5].close : null;
  const prev1Y = points.length >= 53 ? points[points.length - 53].close : null;

  const stats: TechnicalStats = {
    currentPrice,
    priceChange1W: prev1W && prev1W > 0 ? ((currentPrice - prev1W) / prev1W) * 100 : undefined,
    priceChange1M: prev1M && prev1M > 0 ? ((currentPrice - prev1M) / prev1M) * 100 : undefined,
    priceChange1Y: prev1Y && prev1Y > 0 ? ((currentPrice - prev1Y) / prev1Y) * 100 : undefined,
    high52w,
    low52w,
    distanceFrom52wHighPct: distHigh,
    distanceFrom52wLowPct: distLow,
    annualizedVolatilityPct: vol,
    sma20: sma20.at(-1) ?? null,
    sma50: sma50.at(-1) ?? null,
    sma200: sma200.at(-1) ?? null,
    rsi14: rsi.at(-1) ?? null,
    macdLine: macd.macdLine.at(-1) ?? null,
    macdSignal: macd.signalLine.at(-1) ?? null,
    macdHistogram: macd.histogram.at(-1) ?? null,
    bollingerUpper: bollinger.upper.at(-1) ?? null,
    bollingerLower: bollinger.lower.at(-1) ?? null,
    bollingerMiddle: bollinger.middle.at(-1) ?? null,
    supports,
    resistances,
    signals: diagnostics.signals,
    overallBias: diagnostics.overallBias,
    summaryText: diagnostics.summaryText,
  };

  return {
    points: enrichedPoints,
    stats,
    source,
    ticker,
  };
}
