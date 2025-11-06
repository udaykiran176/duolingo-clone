"use client";

import { useQuery } from "@tanstack/react-query";

type LeaderboardUser = {
  userId: string;
  userName: string;
  userImageSrc: string;
  points: number;
};

type LeaderboardResponse = {
  leaderboard: LeaderboardUser[];
  userRank: number | null;
  userPoints: number | null;
};

async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const response = await fetch("/api/leaderboard");
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  return (await response.json()) as LeaderboardResponse;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 30 * 1000, // 30 seconds (ISR-like)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

