import { Skeleton } from "@/components/ui/skeleton";

export default function CargandoMacro() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8">
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-mist rounded-[20px] border p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-4 h-[180px] w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
