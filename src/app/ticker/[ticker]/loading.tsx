import { Skeleton } from "@/components/ui/skeleton";

export default function Cargando() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8">
      <Skeleton className="h-8 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <Skeleton className="mt-8 h-[320px] w-full" />
    </div>
  );
}
