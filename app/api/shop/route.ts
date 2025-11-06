import { NextResponse } from "next/server";

import { getUserProgress, getUserSubscription } from "@/db/queries";

export async function GET() {
  try {
    const [userProgress, userSubscription] = await Promise.all([
      getUserProgress(),
      getUserSubscription(),
    ]);

    if (!userProgress) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      hearts: userProgress.hearts,
      points: userProgress.points,
      hasActiveSubscription: !!userSubscription?.isActive,
    });
  } catch (error) {
    console.error("Error fetching shop data:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop data" },
      { status: 500 }
    );
  }
}

