import { Skeleton } from "@/components/ui/skeleton";

export default function QuestsLoading() {
  return (
    <div className="flex w-full flex-col items-center">
      <Skeleton className="h-[90px] w-[90px]" />

      <Skeleton className="my-6 h-8 w-32" />
      <Skeleton className="mb-6 h-6 w-64" />

      <div className="w-full space-y-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex w-full items-center gap-x-4 border-t-2 p-4"
          >
            <Skeleton className="h-[60px] w-[60px]" />

            <div className="flex w-full flex-col gap-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
