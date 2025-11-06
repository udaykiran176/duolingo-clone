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
  return (await response.json()) as QuestsResponse;
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: async (_questId: string) => {
      // This would be a server action in a real implementation
      // For now, we'll just simulate a short delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      // Optimistically update cache
      void queryClient.invalidateQueries({ queryKey: ["quests"] });
    },
  });
}
