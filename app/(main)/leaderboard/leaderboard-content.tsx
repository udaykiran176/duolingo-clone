"use client";

import Image from "next/image";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

type LeaderboardContentProps = {
  userPoints: number;
};

export function LeaderboardContent({ userPoints }: LeaderboardContentProps) {
  const { data, isLoading, error } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-center">
        <div className="h-[90px] w-[90px] animate-pulse rounded-full bg-gray-200" />
        <div className="my-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mb-6 h-6 w-96 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex w-full flex-col items-center">
        <p className="text-red-500">Failed to load leaderboard</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <Image
        src="/leaderboard.png"
        alt="Leaderboard"
        height={90}
        width={90}
        priority
        quality={85}
      />

      <h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
        Leaderboard
      </h1>
      <p className="mb-6 text-center text-lg text-muted-foreground">
        See where you stand among other learners in the community.
      </p>

      {data.userRank && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700"
        >
          Your rank: #{data.userRank} • {data.userPoints} XP
        </motion.div>
      )}

      <Separator className="mb-4 h-0.5 rounded-full" />
      <AnimatePresence mode="popLayout">
        {data.leaderboard.map((userProgress, i) => (
          <motion.div
            key={userProgress.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className="flex w-full items-center rounded-xl p-2 px-4 hover:bg-gray-200/50"
          >
            <p
              className={`mr-4 font-bold ${
                i < 3 ? "text-yellow-600" : "text-lime-700"
              }`}
            >
              {i + 1}
            </p>

            <Avatar className="ml-3 mr-6 h-12 w-12 border bg-orange-500">
              <AvatarImage
                src={userProgress.userImageSrc}
                className="object-cover"
                alt={userProgress.userName}
              />
            </Avatar>

            <p className="flex-1 font-bold text-neutral-800">
              {userProgress.userName}
            </p>
            <p className="text-muted-foreground">{userProgress.points} XP</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

