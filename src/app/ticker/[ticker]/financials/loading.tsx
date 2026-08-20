import { Skeleton } from "@/components/ui/skeleton";

/** Reproduce la retícula de la tabla para que la carga no desplace el contenido. */
export default function CargandoFinancials() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-9 w-72 rounded-md max-w-full" />
        <Skeleton className="ml-auto h-8 w-44 rounded-md" />
      </div>
      <div className="border-mist overflow-hidden rounded-[20px] border">
        <div className="bg-ash border-mist flex items-center gap-3 border-b px-3 py-2.5">
          <Skeleton className="h-3 w-40" />
          <div className="ml-auto flex gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-14" />
            ))}
          </div>
        </div>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="border-mist flex items-center gap-3 border-b px-3 py-2 last:border-0">
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
