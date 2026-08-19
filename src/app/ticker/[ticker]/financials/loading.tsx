import { Skeleton } from "@/components/ui/skeleton";

/** Reproduce la retícula de la tabla para que la carga no desplace el contenido. */
export default function CargandoFinancials() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-9 w-72 rounded-md" />
        <Skeleton className="ml-auto h-8 w-44 rounded-md" />
      </div>
      <div className="border-border/60 overflow-hidden rounded-lg border">
        <div className="bg-muted/30 border-border/60 flex items-center gap-3 border-b px-3 py-2.5">
          <Skeleton className="h-3 w-40" />
          <div className="ml-auto flex gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-14" />
            ))}
          </div>
        </div>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="border-border/40 flex items-center gap-3 border-b px-3 py-2 last:border-0">
            <Skeleton className="h-3" style={{ width: `${120 + ((i * 37) % 110)}px` }} />
            <div className="ml-auto flex gap-6">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-3 w-14" style={{ opacity: 1 - j * 0.1 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
