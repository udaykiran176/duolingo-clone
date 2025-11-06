import { Skeleton } from "@/components/ui/skeleton";

export default function LessonLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b-2 px-6 py-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-full flex-col gap-y-4 px-6 lg:min-h-[350px] lg:w-[600px] lg:px-0">
          <Skeleton className="h-8 w-full lg:h-12" />

          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="border-t-2 px-6 py-4">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

