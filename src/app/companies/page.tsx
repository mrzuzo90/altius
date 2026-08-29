import type { Metadata } from "next";
import { QualityScreener } from "@/components/quality-screener";

export const metadata: Metadata = {
  title: "Empresas por Las seis claves",
  description: "Buscador fundamental de 100 grandes cotizadas comparadas mediante seis claves cuantitativas.",
};

export default function CompaniesPage() {
  return (
    <div className="min-h-screen bg-void-black px-5 py-10 text-frost sm:py-14">
      <div className="mx-auto max-w-[1200px]">
        <QualityScreener />
        <div className="mx-auto mt-6 max-w-4xl text-center text-[11px] leading-5 text-muted-steel">
          <p>
            El universo reúne 100 grandes cotizadas de Estados Unidos, Europa, Canadá y Australia/global con filings
            regulatorios accesibles. Los cálculos se actualizan por lotes y se conservan durante seis horas para proteger
            las fuentes públicas. Una empresa sin datos aparece como no disponible, nunca como suspenso automático.
          </p>
        </div>
      </div>
    </div>
  );
}
