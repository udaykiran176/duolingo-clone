"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { MAX_HEARTS } from "@/constants";
import db from "@/db/drizzle";
import { getUserProgress, getUserSubscription } from "@/db/queries";
import { challengeProgress, challenges, userProgress } from "@/db/schema";

type AnswerResult = {
  success: boolean;
  isCorrect: boolean;
  error?: "hearts" | "subscription";
  hearts?: number;
  points?: number;
};

export const checkAnswer = async (
  challengeId: number,
  selectedOptionId: number
): Promise<AnswerResult> => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized.");

  const currentUserProgress = await getUserProgress();
  const userSubscription = await getUserSubscription();

  if (!currentUserProgress) throw new Error("User progress not found.");

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
    with: {
      challengeOptions: true,
    },
  });

  if (!challenge) throw new Error("Challenge not found.");

  const lessonId = challenge.lessonId;
  const correctOption = challenge.challengeOptions.find((opt) => opt.correct);
  const isCorrect = correctOption?.id === selectedOptionId;

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId)
    ),
  });

  const isPractice = !!existingChallengeProgress;

  // If wrong answer, check hearts first
  if (!isCorrect) {
    // In practice lessons, don't reduce hearts for wrong answers
    if (isPractice) {
      return {
        success: true,
        isCorrect: false,
        hearts: currentUserProgress.hearts,
        points: currentUserProgress.points,
      };
    }

    if (userSubscription?.isActive) {
      // With subscription, wrong answers don't reduce hearts
      return {
        success: true,
        isCorrect: false,
        hearts: currentUserProgress.hearts,
        points: currentUserProgress.points,
      };
    }

    if (currentUserProgress.hearts === 0) {
      return {
        success: false,
        isCorrect: false,
        error: "hearts",
        hearts: 0,
        points: currentUserProgress.points,
      };
    }

    // Reduce hearts for wrong answer (only in regular lessons without subscription)
    await db
      .update(userProgress)
      .set({
        hearts: Math.max(currentUserProgress.hearts - 1, 0),
      })
      .where(eq(userProgress.userId, userId));

    revalidatePath("/shop");
    revalidatePath("/learn");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");
    revalidatePath(`/lesson/${lessonId}`);

    return {
      success: true,
      isCorrect: false,
      hearts: Math.max(currentUserProgress.hearts - 1, 0),
      points: currentUserProgress.points,
    };
  }

  // Correct answer handling
  if (
    currentUserProgress.hearts === 0 &&
    !isPractice &&
    !userSubscription?.isActive
  ) {
    return {
      success: false,
      isCorrect: true,
      error: "hearts",
      hearts: 0,
      points: currentUserProgress.points,
    };
  }

  if (isPractice) {
    // Update existing progress
    await db
      .update(challengeProgress)
      .set({
        completed: true,
      })
      .where(eq(challengeProgress.id, existingChallengeProgress.id));

    // Add heart and points for practice
    const newHearts = Math.min(currentUserProgress.hearts + 1, MAX_HEARTS);
    const newPoints = currentUserProgress.points + 10;

    await db
      .update(userProgress)
      .set({
        hearts: newHearts,
        points: newPoints,
      })
      .where(eq(userProgress.userId, userId));

    revalidatePath("/learn");
    revalidatePath("/lesson");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");
    revalidatePath(`/lesson/${lessonId}`);

    return {
      success: true,
      isCorrect: true,
      hearts: newHearts,
      points: newPoints,
    };
  }

  // New challenge - insert progress
  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
  });

  // Add points for new challenge
  const newPoints = currentUserProgress.points + 10;

  await db
    .update(userProgress)
    .set({
      points: newPoints,
    })
    .where(eq(userProgress.userId, userId));

  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath(`/lesson/${lessonId}`);

  return {
    success: true,
    isCorrect: true,
    hearts: currentUserProgress.hearts,
    points: newPoints,
  };
};

