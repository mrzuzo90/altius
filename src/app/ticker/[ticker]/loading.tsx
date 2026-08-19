import { Skeleton } from "@/components/ui/skeleton";

export default function Cargando() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="mt-3 h-4 w-96" />
      <Skeleton className="mt-8 h-[320px] w-full" />
    </div>
  );
}
