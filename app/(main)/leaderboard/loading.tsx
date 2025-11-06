import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="flex w-full flex-col items-center">
      <Skeleton className="h-[90px] w-[90px] rounded-full" />

      <Skeleton className="my-6 h-8 w-48" />
      <Skeleton className="mb-6 h-6 w-96" />

      <div className="mb-4 h-0.5 w-full rounded-full bg-gray-200" />

      <div className="w-full space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex w-full items-center rounded-xl p-2 px-4"
          >
            <Skeleton className="mr-4 h-6 w-6" />
            <Skeleton className="ml-3 mr-6 h-12 w-12 rounded-full" />
            <Skeleton className="flex-1 h-6" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
