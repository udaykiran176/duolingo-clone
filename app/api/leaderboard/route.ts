import { NextResponse } from "next/server";

import { getTopTenUsers, getUserProgress } from "@/db/queries";

export async function GET() {
  try {
    const [leaderboard, userProgress] = await Promise.all([
      getTopTenUsers(),
      getUserProgress(),
    ]);

    // Find user's rank
    const userRank = userProgress
      ? leaderboard.findIndex((u) => u.userId === userProgress.userId) + 1
      : null;

    return NextResponse.json({
      leaderboard,
      userRank: userRank || null,
      userPoints: userProgress?.points ?? null,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

