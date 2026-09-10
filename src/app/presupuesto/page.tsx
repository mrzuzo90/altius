import type { Metadata } from "next";
import { BudgetCalculator } from "@/components/budget/budget-calculator";

export const metadata: Metadata = {
  title: "Calculador de Presupuesto Personal e Interés Compuesto",
  description:
    "Desglosa tus ingresos mensuales en las 6 proporciones recomendadas (30% vivienda, 20% ahorro, 15% comida, 15% ocio, 10% suministros, 10% otros) y proyecta tu inversión con interés compuesto.",
};

export default function PresupuestoPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:py-10">
      <BudgetCalculator />
    </div>
  );
}
