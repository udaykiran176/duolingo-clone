import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
  return (
    <div className="mx-auto h-full max-w-[912px] px-3">
      <Skeleton className="mb-6 h-8 w-48" />

      <div className="grid grid-cols-2 gap-4 pt-6 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-full min-h-[217px] min-w-[200px] flex-col items-center justify-between rounded-xl border-2 border-b-[4px] p-3 pb-6"
          >
            <div className="flex min-h-[24px] w-full items-center justify-end">
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>

            <Skeleton className="h-[70px] w-[93.33px] rounded-lg" />

            <Skeleton className="mt-3 h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
