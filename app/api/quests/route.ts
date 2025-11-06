import { NextResponse } from "next/server";

import { QUESTS } from "@/constants";
import { getUserProgress } from "@/db/queries";

export async function GET() {
  try {
    const userProgress = await getUserProgress();

    if (!userProgress) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate quest progress
    const quests = QUESTS.map((quest) => {
      const progress = Math.min((userProgress.points / quest.value) * 100, 100);
      const completed = userProgress.points >= quest.value;

      return {
        ...quest,
        progress,
        completed,
        userPoints: userProgress.points,
      };
    });

    return NextResponse.json({
      quests,
      totalPoints: userProgress.points,
    });
  } catch (error) {
    console.error("Error fetching quests:", error);
    return NextResponse.json(
      { error: "Failed to fetch quests" },
      { status: 500 }
    );
  }
}

