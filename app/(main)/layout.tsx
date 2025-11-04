import type { PropsWithChildren } from "react";

import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileTopNav } from "@/components/mobile-top-nav";
import { Sidebar } from "@/components/sidebar";
import { getUserProgress, getUserSubscription } from "@/db/queries";


const MainLayout = async ({ children }: PropsWithChildren) => {
  const [userProgressData, userSubscriptionData] = await Promise.all([
    getUserProgress(),
    getUserSubscription(),
  ]);

  const activeCourse = userProgressData?.activeCourse ?? null;
  const hearts = userProgressData?.hearts ?? 0;
  const points = userProgressData?.points ?? 0;
  const hasActiveSubscription = !!userSubscriptionData?.isActive;

  return (
    <>
      <MobileTopNav
        activeCourse={activeCourse}
        hearts={hearts}
        points={points}
        hasActiveSubscription={hasActiveSubscription}
      />

      <Sidebar className="hidden md:flex" />
      <main className="h-full pt-[50px] md:pl-[72px] md:pt-0 lg:pl-[256px]">
        <div className="mx-auto h-full max-w-[1056px] pb-16 pt-6 md:pb-0">{children}</div>
      </main>
      <MobileBottomNav />
    </>
  );
};

export default MainLayout;
