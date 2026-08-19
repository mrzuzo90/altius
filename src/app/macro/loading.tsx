import { Skeleton } from "@/components/ui/skeleton";

export default function CargandoMacro() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-96" />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-border/60 rounded-lg border p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-4 h-[180px] w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
