import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { getLesson, getUserProgress, getUserSubscription } from "@/db/queries";
import { lessons } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      title?: string;
      unitId?: string | number;
    };
    const { title, unitId } = body;

    const updateData: Partial<{
      title: string;
      unitId: number;
    }> = {};
    if (typeof title === 'string') updateData.title = title;
    if (typeof unitId === 'string' && !isNaN(parseInt(unitId))) {
      updateData.unitId = parseInt(unitId);
    } else if (typeof unitId === 'number') {
      updateData.unitId = unitId;
    }

    const [updatedLesson] = await db
      .update(lessons)
      .set(updateData)
      .where(eq(lessons.id, parseInt(params.id)))
      .returning();

    if (!updatedLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.delete(lessons).where(eq(lessons.id, parseInt(params.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
