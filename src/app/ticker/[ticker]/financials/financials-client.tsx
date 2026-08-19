"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { StatementTabs } from "@/components/statement-tabs";
import type { StatementBundle } from "@/lib/sec/statements";
import type { Frequency } from "@/lib/sec/normalize";

export function FinancialsClient({
  bundle,
  ticker,
  frequency,
}: {
  bundle: StatementBundle;
  ticker: string;
  frequency: Frequency;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  return (
    <div className={pendiente ? "pointer-events-none opacity-60 transition-opacity" : undefined}>
      <StatementTabs
        bundle={bundle}
        frequency={frequency}
        onFrequencyChange={(f) =>
          startTransition(() => {
            router.push(`/ticker/${ticker}/financials?freq=${f}`, { scroll: false });
          })
        }
      />
    </div>
  );
}
