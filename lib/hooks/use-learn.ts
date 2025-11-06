"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

type Unit = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Array<{
    id: number;
    title: string;
    order: number;
    completed: boolean;
  }>;
};

type LearnData = {
  units: Unit[];
  activeLesson: {
    id: number;
    title: string;
    unitId: number;
  } | null;
  activeLessonPercentage: number;
  userProgress: {
    hearts: number;
    points: number;
  };
  userSubscription: {
    isActive: boolean;
  } | null;
};

async function fetchLearnData(): Promise<LearnData> {
  const response = await fetch("/api/learn");
  if (!response.ok) {
    throw new Error("Failed to fetch learn data");
  }
  return (await response.json()) as LearnData;
}

export function useLearn() {
  return useQuery({
    queryKey: ["learn"],
    queryFn: fetchLearnData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePrefetchNextLesson() {
  const queryClient = useQueryClient();

  return (lessonId: number) => {
    // Prefetch the next lesson data
    void queryClient.prefetchQuery({
      queryKey: ["lesson", lessonId],
      queryFn: async () => {
        const response = await fetch(`/api/lessons/${lessonId}`);
        if (!response.ok) throw new Error("Failed to fetch lesson");
        return (await response.json()) as unknown;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

