import type {
  OptionContractQuote,
  OptionExpirationAnalysis,
  OptionPressureLabel,
  OptionSideSnapshot,
  OptionStrikeSnapshot,
  OptionWall,
  UnusualOptionActivity,
} from "./types";

const DAY_MS = 86_400_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value !== null && value !== undefined && Number.isFinite(value) ? value : null;
}

function midpoint(contract: OptionContractQuote | null): number | null {
  if (!contract) return null;
  if (contract.bid !== null && contract.ask !== null && contract.ask >= contract.bid) {
    return (contract.bid + contract.ask) / 2;
  }
  return finiteOrNull(contract.last);
}

function ratioSignal(ratio: number | null): number | null {
  if (ratio === null || !Number.isFinite(ratio) || ratio < 0) return null;
  // La escala logarítmica trata 0,5 y 2,0 de forma simétrica y evita que un
  // único contrato extremo lleve toda la lectura a ±100.
  return clamp(-Math.tanh(Math.log(Math.max(ratio, 0.02))) * 100, -100, 100);
}

function pressureLabel(score: number): OptionPressureLabel {
  if (score >= 35) return "Fuerte inclinación compradora";
  if (score >= 12) return "Inclinación compradora";
  if (score <= -35) return "Fuerte inclinación vendedora";
  if (score <= -12) return "Inclinación vendedora";
  return "Equilibrio";
}

function sideSnapshot(contract: OptionContractQuote | null): OptionSideSnapshot | null {
  if (!contract) return null;
  return {
    symbol: contract.symbol,
    bid: contract.bid,
    ask: contract.ask,
    bidSize: contract.bidSize,
    askSize: contract.askSize,
    last: contract.last,
    volume: contract.volume,
    openInterest: contract.openInterest,
    impliedVolatility: contract.impliedVolatility,
    delta: contract.delta,
    gamma: contract.gamma,
  };
}

function buildStrikeRows(contracts: OptionContractQuote[], underlyingPrice: number): Array<{
  strike: number;
  call: OptionContractQuote | null;
  put: OptionContractQuote | null;
}> {
  const rows = new Map<number, { strike: number; call: OptionContractQuote | null; put: OptionContractQuote | null }>();
  for (const contract of contracts) {
    const row = rows.get(contract.strike) ?? { strike: contract.strike, call: null, put: null };
    // Si el proveedor devuelve raíces estándar y ajustadas para el mismo strike,
    // conservamos el contrato con más liquidez.
    const current = row[contract.side];
    if (!current || contract.volume + contract.openInterest > current.volume + current.openInterest) {
      row[contract.side] = contract;
    }
    rows.set(contract.strike, row);
  }
  return [...rows.values()].sort(
    (a, b) => Math.abs(a.strike - underlyingPrice) - Math.abs(b.strike - underlyingPrice),
  );
}

function calculateMaxPain(
  rows: Array<{ strike: number; call: OptionContractQuote | null; put: OptionContractQuote | null }>,
): number | null {
  if (rows.length === 0) return null;
  let bestStrike: number | null = null;
  let smallestPayout = Number.POSITIVE_INFINITY;

  for (const settlement of rows) {
    let payout = 0;
    for (const row of rows) {
      payout += Math.max(0, settlement.strike - row.strike) * (row.call?.openInterest ?? 0) * 100;
      payout += Math.max(0, row.strike - settlement.strike) * (row.put?.openInterest ?? 0) * 100;
    }
    if (payout < smallestPayout) {
      smallestPayout = payout;
      bestStrike = settlement.strike;
    }
  }
  return bestStrike;
}

function largestWall(
  rows: Array<{ strike: number; call: OptionContractQuote | null; put: OptionContractQuote | null }>,
  side: "call" | "put",
): OptionWall | null {
  let wall: OptionWall | null = null;
  for (const row of rows) {
    const openInterest = row[side]?.openInterest ?? 0;
    if (openInterest > (wall?.openInterest ?? 0)) wall = { strike: row.strike, openInterest };
  }
  return wall?.openInterest ? wall : null;
}

function unusualActivity(contracts: OptionContractQuote[]): UnusualOptionActivity[] {
  return contracts
    .filter((contract) => contract.volume >= 100 && contract.volume / Math.max(contract.openInterest, 1) >= 1.5)
    .map((contract) => ({
      symbol: contract.symbol,
      side: contract.side,
      strike: contract.strike,
      volume: contract.volume,
      openInterest: contract.openInterest,
      volumeToOpenInterest: contract.volume / Math.max(contract.openInterest, 1),
      impliedVolatility: contract.impliedVolatility,
    }))
    .sort((a, b) => b.volumeToOpenInterest - a.volumeToOpenInterest || b.volume - a.volume)
    .slice(0, 6);
}

function isoDateToDays(expiration: string, now: Date): number {
  const expiry = Date.parse(`${expiration}T20:00:00Z`);
  return Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - now.getTime()) / DAY_MS)) : 0;
}

export function analyzeOptionExpiration(
  contracts: OptionContractQuote[],
  underlyingPrice: number,
  now = new Date(),
): OptionExpirationAnalysis | null {
  if (!Number.isFinite(underlyingPrice) || underlyingPrice <= 0 || contracts.length === 0) return null;
  const expiration = contracts[0]?.expiration;
  if (!expiration) return null;

  const callVolume = contracts.reduce((total, item) => total + (item.side === "call" ? item.volume : 0), 0);
  const putVolume = contracts.reduce((total, item) => total + (item.side === "put" ? item.volume : 0), 0);
  const callOpenInterest = contracts.reduce(
    (total, item) => total + (item.side === "call" ? item.openInterest : 0),
    0,
  );
  const putOpenInterest = contracts.reduce(
    (total, item) => total + (item.side === "put" ? item.openInterest : 0),
    0,
  );
  const putCallVolumeRatio = callVolume > 0 ? putVolume / callVolume : putVolume > 0 ? 10 : null;
  const putCallOpenInterestRatio = callOpenInterest > 0
    ? putOpenInterest / callOpenInterest
    : putOpenInterest > 0
      ? 10
      : null;

  const allRows = buildStrikeRows(contracts, underlyingPrice);
  const nearMoney = allRows.filter((row) => Math.abs(row.strike / underlyingPrice - 1) <= 0.15);
  let bookNumerator = 0;
  let bookDenominator = 0;
  for (const row of nearMoney) {
    const callBid = row.call?.bidSize ?? 0;
    const callAsk = row.call?.askSize ?? 0;
    const putBid = row.put?.bidSize ?? 0;
    const putAsk = row.put?.askSize ?? 0;
    // Demanda de calls y oferta de puts inclinan la lectura al alza; oferta de
    // calls y demanda de puts la inclinan a la baja. Es foto de libro, no flujo.
    bookNumerator += callBid + putAsk - callAsk - putBid;
    bookDenominator += callBid + callAsk + putBid + putAsk;
  }
  const displayedBookImbalancePct = bookDenominator > 0 ? (bookNumerator / bookDenominator) * 100 : null;

  const weightedSignals: Array<[number | null, number]> = [
    [ratioSignal(putCallVolumeRatio), 0.45],
    [ratioSignal(putCallOpenInterestRatio), 0.35],
    [displayedBookImbalancePct, 0.2],
  ];
  const availableWeight = weightedSignals.reduce(
    (sum, [signal, weight]) => sum + (signal === null ? 0 : weight),
    0,
  );
  const pressureScore = availableWeight > 0
    ? clamp(
        weightedSignals.reduce((sum, [signal, weight]) => sum + (signal ?? 0) * weight, 0) / availableWeight,
        -100,
        100,
      )
    : 0;

  const atm = allRows[0] ?? null;
  const daysToExpiration = isoDateToDays(expiration, now);
  const callMid = midpoint(atm?.call ?? null);
  const putMid = midpoint(atm?.put ?? null);
  let expectedMove: number | null = null;
  let expectedMoveMethod: OptionExpirationAnalysis["expectedMoveMethod"] = null;
  if (callMid !== null && putMid !== null && callMid + putMid > 0) {
    expectedMove = callMid + putMid;
    expectedMoveMethod = "Straddle ATM";
  } else if (atm) {
    const ivValues = [atm.call?.impliedVolatility, atm.put?.impliedVolatility]
      .filter((value): value is number => value !== null && value !== undefined && value > 0);
    if (ivValues.length > 0 && daysToExpiration > 0) {
      const averageIv = ivValues.reduce((sum, value) => sum + value, 0) / ivValues.length;
      expectedMove = underlyingPrice * averageIv * Math.sqrt(daysToExpiration / 365);
      expectedMoveMethod = "Volatilidad implícita";
    }
  }

  const maxPain = calculateMaxPain(allRows);
  const callWall = largestWall(allRows, "call");
  const putWall = largestWall(allRows, "put");
  const ladderRows: OptionStrikeSnapshot[] = allRows.slice(0, 17)
    .sort((a, b) => a.strike - b.strike)
    .map((row) => ({
      strike: row.strike,
      distancePct: ((row.strike - underlyingPrice) / underlyingPrice) * 100,
      call: sideSnapshot(row.call),
      put: sideSnapshot(row.put),
    }));

  const activity = unusualActivity(contracts);
  const confidenceInputs = [putCallVolumeRatio, putCallOpenInterestRatio, displayedBookImbalancePct]
    .filter((value) => value !== null).length;
  const pressureConfidence = contracts.length >= 20 && confidenceInputs === 3
    ? "Alta"
    : contracts.length >= 10 && confidenceInputs >= 2
      ? "Media"
      : "Baja";
  const expectedMovePct = expectedMove !== null ? (expectedMove / underlyingPrice) * 100 : null;
  const observations: string[] = [];
  if (expectedMove !== null && expectedMovePct !== null) {
    observations.push(
      `El precio de las opciones descuenta un recorrido aproximado de ±${expectedMovePct.toFixed(1)}% hasta el vencimiento; mide magnitud, no dirección.`,
    );
  }
  if (callWall) observations.push(`La mayor concentración de calls está en ${callWall.strike.toFixed(2)} (${callWall.openInterest.toLocaleString("es-ES")} contratos abiertos).`);
  if (putWall) observations.push(`La mayor concentración de puts está en ${putWall.strike.toFixed(2)} (${putWall.openInterest.toLocaleString("es-ES")} contratos abiertos).`);
  if (activity.length > 0) observations.push(`${activity.length} contrato${activity.length === 1 ? "" : "s"} presenta${activity.length === 1 ? "" : "n"} volumen muy superior a su interés abierto.`);

  const asOf = contracts
    .map((contract) => contract.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  return {
    expiration,
    daysToExpiration,
    asOf,
    contractCount: contracts.length,
    callVolume,
    putVolume,
    callOpenInterest,
    putOpenInterest,
    putCallVolumeRatio,
    putCallOpenInterestRatio,
    displayedBookImbalancePct,
    pressureScore,
    pressureLabel: pressureLabel(pressureScore),
    pressureConfidence,
    expectedMove,
    expectedMovePct,
    expectedRangeLow: expectedMove !== null ? Math.max(0, underlyingPrice - expectedMove) : null,
    expectedRangeHigh: expectedMove !== null ? underlyingPrice + expectedMove : null,
    expectedMoveMethod,
    atmStrike: atm?.strike ?? null,
    maxPain,
    callWall,
    putWall,
    strikes: ladderRows,
    unusualActivity: activity,
    observations,
  };
}
