"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Quest = {
  title: string;
  value: number;
  progress: number;
  completed: boolean;
  userPoints: number;
};

type QuestsResponse = {
  quests: Quest[];
  totalPoints: number;
};

async function fetchQuests(): Promise<QuestsResponse> {
  const response = await fetch("/api/quests");
  if (!response.ok) {
    throw new Error("Failed to fetch quests");
  }
  return response.json();
}

export function useQuests() {
  return useQuery({
    queryKey: ["quests"],
    queryFn: fetchQuests,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questId: string) => {
      // This would be a server action in real implementation
      // For now, we'll just invalidate the cache
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      // Optimistically update cache
      queryClient.invalidateQueries({ queryKey: ["quests"] });
    },
  });
}

