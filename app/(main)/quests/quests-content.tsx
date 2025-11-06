"use client";

import Image from "next/image";
import { useQuests } from "@/lib/hooks/use-quests";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function QuestsContent() {
  const { data, isLoading, error } = useQuests();

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-center">
        <div className="h-[90px] w-[90px] animate-pulse rounded bg-gray-200" />
        <div className="my-6 h-8 w-32 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex w-full flex-col items-center">
        <p className="text-red-500">Failed to load quests</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <Image
        src="/quests.png"
        alt="Quests"
        height={90}
        width={90}
        priority
        quality={85}
      />

      <h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
        Quests
      </h1>
      <p className="mb-6 text-center text-lg text-muted-foreground">
        Complete quests by earning points.
      </p>

      <ul className="w-full">
        {data.quests.map((quest, index) => (
          <motion.div
            key={quest.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex w-full items-center gap-x-4 border-t-2 p-4"
          >
            <div className="relative">
              <Image
                src="/points.png"
                alt="Points"
                width={60}
                height={60}
                loading="lazy"
                quality={85}
              />
              {quest.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-2 rounded-full bg-green-500 p-1"
                >
                  <Check className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </div>

            <div className="flex w-full flex-col gap-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-neutral-700">
                  {quest.title}
                </p>
                {quest.completed && (
                  <span className="text-sm font-semibold text-green-600">
                    Completed!
                  </span>
                )}
              </div>

              <Progress
                value={quest.progress}
                className="h-3"
                aria-label={`Progress: ${Math.round(quest.progress)}%`}
              />
              <p className="text-xs text-muted-foreground">
                {quest.userPoints} / {quest.value} XP
              </p>
            </div>
          </motion.div>
        ))}
      </ul>
    </div>
  );
}

