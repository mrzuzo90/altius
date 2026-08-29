import type { Frequency } from "@/lib/sec/normalize";
import type { StatementBundle } from "@/lib/sec/statements";

export type FinancialProviderId = "sec" | "esef" | "sedar-plus" | "asx-ir";

export interface FinancialStatementProvider<TCompany> {
  id: FinancialProviderId;
  supports(frequency: Frequency): boolean;
  build(company: TCompany, frequency: Frequency): Promise<StatementBundle>;
}

export const INTERNATIONAL_COVERAGE = {
  europe: {
    provider: "esef" as const,
    structured: true,
    status: "active" as const,
    note: "ESEF/iXBRL anual desde ejercicios iniciados en 2020; ESAP centralizará el acceso desde 2027.",
  },
  canada: {
    provider: "sedar-plus" as const,
    structured: false,
    status: "requires-licensed-bulk-or-pdf" as const,
    note: "SEDAR+ no acepta XBRL; el uso masivo y la redistribución requieren su servicio de datos por suscripción.",
  },
  australia: {
    provider: "asx-ir" as const,
    structured: false,
    status: "pdf-first" as const,
    note: "ASIC admite XBRL voluntario; las cotizadas publican principalmente informes PDF en ASX y en relaciones con inversores.",
  },
} as const;
