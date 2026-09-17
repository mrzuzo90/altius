import {
  CID_MASCOTS,
  type CharacterPhase,
  type MascotPhaseConfig,
} from "@/components/statement-trend-animation";

export type InflationPreset = {
  id: string;
  label: string;
  rate: number;
  description: string;
};

export const INFLATION_PRESETS: readonly InflationPreset[] = [
  {
    id: "ecb_target",
    label: "Objetivo BCE (2,0 %)",
    rate: 2.0,
    description: "Meta oficial del Banco Central Europeo de estabilidad de precios.",
  },
  {
    id: "eurozone_recent",
    label: "Media Eurozona (2,8 %)",
    rate: 2.8,
    description: "Inflación media anual experimentada en la zona euro en el último lustro.",
  },
  {
    id: "us_recent",
    label: "Media EE.UU. (3,6 %)",
    rate: 3.6,
    description: "Inflación media anual del IPC de Estados Unidos en los últimos años.",
  },
  {
    id: "high_inflation",
    label: "Inflación Alta (5,0 %)",
    rate: 5.0,
    description: "Escenario de tensión de precios o crisis energética/suministros.",
  },
];

export type InvestmentPreset = {
  id: string;
  label: string;
  rate: number;
  description: string;
};

export const INVESTMENT_PRESETS: readonly InvestmentPreset[] = [
  {
    id: "cash",
    label: "Cuenta corriente / Efectivo (0 %)",
    rate: 0.0,
    description: "Dinero no remunerado que sufre toda la erosión de la inflación.",
  },
  {
    id: "bonds",
    label: "Letras del Tesoro / Depósitos (3,0 %)",
    rate: 3.0,
    description: "Renta fija conservadora a corto plazo para amortiguar la inflación.",
  },
  {
    id: "index_funds",
    label: "Fondos Indexados / Bolsa Global (7,0 %)",
    rate: 7.0,
    description: "Rentabilidad histórica promedio a largo plazo de la renta variable.",
  },
];

export type InflationProjectionYear = {
  year: number;
  cashNominal: number;
  cashReal: number;
  cashLoss: number;
  investedNominal: number;
  investedReal: number;
  investedGainReal: number;
};

export type InflationCalculationResult = {
  initialAmount: number;
  years: number;
  inflationRate: number;
  investmentRate: number;
  // Dinero en efectivo (0%)
  futurePurchasingPower: number; // Valor real que le queda al dinero
  silentLoss: number; // Dinero real perdido
  silentLossPct: number; // Porcentaje de poder adquisitivo perdido
  // Coste de la vida equivalente
  futureEquivalentCost: number; // Cuánto necesitarás en el futuro
  extraCostNeeded: number; // Diferencia nominal que habrá que pagar de más
  // Escenario de inversión
  futureInvestedNominal: number; // Saldo de la cuenta invertida
  futureInvestedReal: number; // Poder de compra real de la cuenta invertida
  realNetProfit: number; // Ganancia real neta por encima de la inflación
  realNetProfitPct: number; // Crecimiento real porcentual del patrimonio
  // Proyección anual
  timeline: InflationProjectionYear[];
  // Mascota Cid según el impacto (SIN etiquetas)
  mascotCash: MascotPhaseConfig;
  mascotInvested: MascotPhaseConfig;
};

export function calculatePersonalInflation(
  initialAmount: number,
  years: number,
  inflationRatePct: number,
  investmentRatePct: number = 0,
): InflationCalculationResult {
  const amount = Math.max(1, initialAmount);
  const n = Math.max(1, Math.min(40, years));
  const inf = Math.max(0, inflationRatePct) / 100;
  const inv = Math.max(0, investmentRatePct) / 100;

  const inflationFactor = Math.pow(1 + inf, n);
  const investmentFactor = Math.pow(1 + inv, n);

  // 1. Efectivo: se devalúa
  const futurePurchasingPower = Math.round((amount / inflationFactor) * 100) / 100;
  const silentLoss = Math.round((amount - futurePurchasingPower) * 100) / 100;
  const silentLossPct = Math.round(((futurePurchasingPower - amount) / amount) * 1000) / 10;

  // 2. Coste de vida equivalente
  const futureEquivalentCost = Math.round(amount * inflationFactor * 100) / 100;
  const extraCostNeeded = Math.round((futureEquivalentCost - amount) * 100) / 100;

  // 3. Inversión
  const futureInvestedNominal = Math.round(amount * investmentFactor * 100) / 100;
  const futureInvestedReal = Math.round((futureInvestedNominal / inflationFactor) * 100) / 100;
  const realNetProfit = Math.round((futureInvestedReal - amount) * 100) / 100;
  const realNetProfitPct = Math.round(((futureInvestedReal - amount) / amount) * 1000) / 10;

  // 4. Trayectoria año a año
  const timeline: InflationProjectionYear[] = [];
  for (let y = 0; y <= n; y++) {
    const yInf = Math.pow(1 + inf, y);
    const yInv = Math.pow(1 + inv, y);
    const cReal = Math.round((amount / yInf) * 100) / 100;
    const iNom = Math.round(amount * yInv * 100) / 100;
    const iReal = Math.round((iNom / yInf) * 100) / 100;

    timeline.push({
      year: y,
      cashNominal: amount,
      cashReal: cReal,
      cashLoss: Math.round((amount - cReal) * 100) / 100,
      investedNominal: iNom,
      investedReal: iReal,
      investedGainReal: Math.round((iReal - amount) * 100) / 100,
    });
  }

  // 5. Mascota de Cid para escenario de efectivo (pérdida)
  let cashPhase: CharacterPhase = "senor";
  if (silentLossPct > -8) cashPhase = "senor";
  else if (silentLossPct > -18) cashPhase = "piedra";
  else if (silentLossPct > -30) cashPhase = "flecha";
  else cashPhase = "apunalado";

  // 6. Mascota de Cid para escenario de inversión (crecimiento real)
  let invPhase: CharacterPhase = "senor";
  if (realNetProfitPct > 30) invPhase = "canon";
  else if (realNetProfitPct > 15) invPhase = "cuerda";
  else if (realNetProfitPct > 5) invPhase = "caballero";
  else if (realNetProfitPct >= -5) invPhase = "senor";
  else if (realNetProfitPct >= -15) invPhase = "piedra";
  else invPhase = "flecha";

  return {
    initialAmount: amount,
    years: n,
    inflationRate: inflationRatePct,
    investmentRate: investmentRatePct,
    futurePurchasingPower,
    silentLoss,
    silentLossPct,
    futureEquivalentCost,
    extraCostNeeded,
    futureInvestedNominal,
    futureInvestedReal,
    realNetProfit,
    realNetProfitPct,
    timeline,
    mascotCash: CID_MASCOTS[cashPhase] ?? CID_MASCOTS.senor,
    mascotInvested: CID_MASCOTS[invPhase] ?? CID_MASCOTS.senor,
  };
}
