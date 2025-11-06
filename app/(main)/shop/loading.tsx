import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="flex w-full flex-col items-center">
      <Skeleton className="h-[90px] w-[90px]" />

      <Skeleton className="my-6 h-8 w-24" />
      <Skeleton className="mb-6 h-6 w-64" />

      <ul className="w-full">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex w-full items-center gap-x-4 border-t-2 p-4"
          >
            <Skeleton className="h-[60px] w-[60px]" />

            <div className="flex-1">
              <Skeleton className="h-6 w-32" />
            </div>

            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </ul>
    </div>
  );
}
