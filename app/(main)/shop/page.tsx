import { Suspense } from "react";

import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserProgress, getUserSubscription } from "@/db/queries";

import ShopLoading from "./loading";
import { ShopContent } from "./shop-content";

// Lazy load heavy components

const Quests = dynamic(
  () => import("@/components/quests").then((mod) => ({ default: mod.Quests })),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
  }
);

const UserProgress = dynamic(
  () =>
    import("@/components/user-progress").then((mod) => ({
      default: mod.UserProgress,
    })),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
  }
);

const ShopPage = async () => {
  const [userProgressData, userSubscriptionData] = await Promise.all([
    getUserProgress(),
    getUserSubscription(),
  ]);

  const [userProgress, userSubscription] = await Promise.all([
    userProgressData,
    userSubscriptionData,
  ]);

  if (!userProgress || !userProgress.activeCourse) redirect("/courses");

  const isPro = !!userSubscription?.isActive;

  return (
    <div className="flex flex-row-reverse gap-[48px] ">
      <StickyWrapper>
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <UserProgress
            activeCourse={userProgress.activeCourse}
            hearts={userProgress.hearts}
            points={userProgress.points}
            hasActiveSubscription={isPro}
          />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <Quests points={userProgress.points} />
        </Suspense>
      </StickyWrapper>

      <FeedWrapper>
        <Suspense fallback={<ShopLoading />}>
          <ShopContent />
        </Suspense>
      </FeedWrapper>
    </div>
  );
};

export default ShopPage;
