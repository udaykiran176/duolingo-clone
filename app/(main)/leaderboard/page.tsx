import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { getUserProgress, getUserSubscription } from "@/db/queries";

import { LeaderboardContent } from "./leaderboard-content";
import LeaderboardLoading from "./loading";

// Lazy load heavy components
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const Promo = dynamic(
  () => import("@/components/promo").then((mod) => ({ default: mod.Promo })),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
  }
);

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

const LeaderboardPage = async () => {
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
    <div className="flex flex-row-reverse gap-[48px]">
      <StickyWrapper>
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <UserProgress
            activeCourse={userProgress.activeCourse}
            hearts={userProgress.hearts}
            points={userProgress.points}
            hasActiveSubscription={isPro}
          />
        </Suspense>

        {!isPro && (
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <Promo />
          </Suspense>
        )}

        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <Quests points={userProgress.points} />
        </Suspense>
      </StickyWrapper>

      <FeedWrapper>
        <Suspense fallback={<LeaderboardLoading />}>
          <LeaderboardContent userPoints={userProgress.points} />
        </Suspense>
      </FeedWrapper>
    </div>
  );
};

export default LeaderboardPage;
