import { courses } from "@/db/schema";

import { UserProgress } from "./user-progress";

type MobileTopNavProps = {
  activeCourse?: typeof courses.$inferSelect | null;
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
};

export const MobileTopNav = ({
  activeCourse,
  hearts,
  points,
  hasActiveSubscription,
}: MobileTopNavProps) => {
  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-white px-2 py-0.5 md:hidden">
      <UserProgress
        activeCourse={activeCourse}
        hearts={hearts}
        points={points}
        hasActiveSubscription={hasActiveSubscription}
      />
    </nav>
  );
};


