"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

type LessonChallenge = {
  id: number;
  lessonId: number;
  type: "SELECT" | "ASSIST";
  question: string;
  order: number;
  completed: boolean;
  challengeOptions: Array<{
    id: number;
    challengeId: number;
    text: string;
    correct: boolean;
    imageSrc: string | null;
    audioSrc: string | null;
  }>;
};

type LessonData = {
  id: number;
  title: string;
  unitId: number;
  order: number;
  challenges: LessonChallenge[];
};

type LessonResponse = {
  lesson: LessonData;
  userProgress: {
    hearts: number;
    points: number;
  };
  userSubscription: {
    isActive: boolean;
  } | null;
};

async function fetchLesson(lessonId: number): Promise<LessonResponse> {
  const response = await fetch(`/api/lessons/${lessonId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch lesson");
  }
  return (await response.json()) as LessonResponse;
}

export function useLesson(lessonId: number) {
  return useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLesson(lessonId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!lessonId,
  });
}

export function usePrefetchLesson() {
  const queryClient = useQueryClient();

  return (lessonId: number) => {
    void queryClient.prefetchQuery({
      queryKey: ["lesson", lessonId],
      queryFn: () => fetchLesson(lessonId),
      staleTime: 5 * 60 * 1000,
    });
  };
}

