import { courses } from "@/db/schema";

import { UserProgress } from "./user-progress";

type MobileHeaderProps = {
  activeCourse: typeof courses.$inferSelect;
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
};

export const MobileHeader = ({
  activeCourse,
  hearts,
  points,
  hasActiveSubscription,
}: MobileHeaderProps) => {
  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-white px-3 py-2 lg:hidden">
      <UserProgress
        activeCourse={activeCourse}
        hearts={hearts}
        points={points}
        hasActiveSubscription={hasActiveSubscription}
      />
    </nav>
  );
};
