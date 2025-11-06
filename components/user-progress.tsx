import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { InfinityIcon, Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { courses } from "@/db/schema";

type UserProgressProps = {
  activeCourse?: typeof courses.$inferSelect | null;
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
};

export const UserProgress = ({
  activeCourse,
  hearts,
  points,
  hasActiveSubscription,
}: UserProgressProps) => {
  return (
    <div className="sticky top-0 z-40 flex w-full items-center justify-between gap-x-2  bg-white px-2 py-2 lg:static lg:border-none lg:bg-transparent lg:px-0 lg:py-0">
      <Link href="/courses">
        <Button variant="ghost" size="sm" className="h-9 px-2 lg:h-10 lg:px-3">
          <Image
            src={activeCourse?.imageSrc ?? "/smartbit-logo.svg"}
            alt={activeCourse?.title ?? "Course"}
            className="h-7 w-7 rounded-md border lg:h-8 lg:w-8"
            width={28}
            height={28}
          />
        </Button>
      </Link>

      <Link href="/shop">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-orange-500 lg:h-10 lg:px-3"
        >
          <Image
            src="/points.png"
            height={24}
            width={24}
            alt="Points"
            className="mr-2 h-5 w-5 lg:h-7 lg:w-7"
          />
          <span className="whitespace-nowrap text-sm leading-none lg:text-base">{points}</span>
        </Button>
      </Link>

      <Link href="/shop">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-rose-500 lg:h-10 lg:px-3"
        >
          <Image
            src="/heart.png"
            height={20}
            width={20}
            alt="Hearts"
            className="mr-2 h-5 w-5 lg:h-6 lg:w-6"
          />
          <span className="whitespace-nowrap text-sm leading-none lg:text-base flex items-center gap-1">
            {hearts}
            {hasActiveSubscription && (
              <InfinityIcon className="stroke-3 inline h-4 w-4 align-[-2px]" />
            )}
          </span>
        </Button>
      </Link>

      {/* Mobile profile button */}
      <div className="lg:hidden">
        <ClerkLoading>
          <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
        </ClerkLoading>
        <ClerkLoaded>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: { userButtonPopoverCard: { pointerEvents: "initial" } },
            }}
          />
        </ClerkLoaded>
      </div>
    </div>
  );
};
