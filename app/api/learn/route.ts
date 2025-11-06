import { NextResponse } from "next/server";

import {
  getCourseProgress,
  getLessonPercentage,
  getUnits,
  getUserProgress,
  getUserSubscription,
} from "@/db/queries";

export async function GET() {
  try {
    const [
      userProgress,
      units,
      courseProgress,
      lessonPercentage,
      userSubscription,
    ] = await Promise.all([
      getUserProgress(),
      getUnits(),
      getCourseProgress(),
      getLessonPercentage(),
      getUserSubscription(),
    ]);

    if (!userProgress || !userProgress.activeCourse) {
      return NextResponse.json(
        { error: "No active course" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      units,
      activeLesson: courseProgress?.activeLesson ?? null,
      activeLessonPercentage: lessonPercentage ?? 0,
      userProgress: {
        hearts: userProgress.hearts,
        points: userProgress.points,
      },
      userSubscription: userSubscription
        ? {
            isActive: userSubscription.isActive,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching learn data:", error);
    return NextResponse.json(
      { error: "Failed to fetch learn data" },
      { status: 500 }
    );
  }
}

