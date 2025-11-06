import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCourseProgress,
  getLessonPercentage,
  getUnits,
  getUserProgress,
  getUserSubscription,
} from "@/db/queries";

import { Header } from "./header";
import { LearnContent } from "./learn-content";

// Lazy load heavy components
import dynamic from "next/dynamic";

const Promo = dynamic(() => import("@/components/promo").then((mod) => ({ default: mod.Promo })), {
  loading: () => <Skeleton className="h-32 w-full" />,
});

const Quests = dynamic(() => import("@/components/quests").then((mod) => ({ default: mod.Quests })), {
  loading: () => <Skeleton className="h-32 w-full" />,
});

const UserProgress = dynamic(() => import("@/components/user-progress").then((mod) => ({ default: mod.UserProgress })), {
  loading: () => <Skeleton className="h-32 w-full" />,
});

const LearnPage = async () => {
  const userProgressData = getUserProgress();
  const courseProgressData = getCourseProgress();
  const lessonPercentageData = getLessonPercentage();
  const unitsData = getUnits();
  const userSubscriptionData = getUserSubscription();

  const [
    userProgress,
    units,
    courseProgress,
    lessonPercentage,
    userSubscription,
  ] = await Promise.all([
    userProgressData,
    unitsData,
    courseProgressData,
    lessonPercentageData,
    userSubscriptionData,
  ]);

  if (!courseProgress || !userProgress || !userProgress.activeCourse)
    redirect("/courses");

  const isPro = !!userSubscription?.isActive;

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
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
        <Header title={userProgress.activeCourse.title} />
        <Suspense
          fallback={
            <div className="space-y-10">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          }
        >
          <LearnContent
            units={units}
            activeLesson={
              courseProgress.activeLesson
                ? {
                    id: courseProgress.activeLesson.id,
                    title: courseProgress.activeLesson.title,
                    unitId: courseProgress.activeLesson.unitId,
                  }
                : null
            }
            activeLessonPercentage={lessonPercentage}
          />
        </Suspense>
      </FeedWrapper>
    </div>
  );
};

export default LearnPage;
