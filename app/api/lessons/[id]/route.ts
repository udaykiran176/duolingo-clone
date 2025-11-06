import { NextResponse } from "next/server";

import { getLesson, getUserProgress, getUserSubscription } from "@/db/queries";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = parseInt(params.id);
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
    }

    const [lesson, userProgress, userSubscription] = await Promise.all([
      getLesson(lessonId),
      getUserProgress(),
      getUserSubscription(),
    ]);

    if (!lesson || !userProgress) {
      return NextResponse.json(
        { error: "Lesson or user progress not found" },
        { status: 404 }
      );
    }

    const initialPercentage =
      (lesson.challenges.filter((challenge) => challenge.completed).length /
        lesson.challenges.length) *
      100;

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        unitId: lesson.unitId,
        order: lesson.order,
        challenges: lesson.challenges,
      },
      userProgress: {
        hearts: userProgress.hearts,
        points: userProgress.points,
      },
      userSubscription: userSubscription
        ? {
            isActive: userSubscription.isActive,
          }
        : null,
      initialPercentage,
    });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
