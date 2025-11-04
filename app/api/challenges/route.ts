import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { challenges } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");

    let allChallenges;
    if (lessonId) {
      allChallenges = await db
        .select()
        .from(challenges)
        .where(eq(challenges.lessonId, parseInt(lessonId)))
        .orderBy(challenges.order);
    } else {
      allChallenges = await db.select().from(challenges).orderBy(challenges.order);
    }

    return NextResponse.json(allChallenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      lessonId: string | number;
      type: string;
      question: string;
    };
    const { lessonId, type, question } = body;

    if (!lessonId || !type || !question) {
      return NextResponse.json(
        { error: "LessonId, type, and question are required" },
        { status: 400 }
      );
    }

    if (type !== "SELECT" && type !== "ASSIST") {
      return NextResponse.json(
        { error: "Type must be either SELECT or ASSIST" },
        { status: 400 }
      );
    }

    // Get the max order value for this lesson
    const maxOrderResult = await db
      .select({ maxOrder: challenges.order })
      .from(challenges)
      .where(eq(challenges.lessonId, typeof lessonId === "string" ? parseInt(lessonId) : lessonId))
      .orderBy(desc(challenges.order))
      .limit(1);

    const nextOrder = maxOrderResult[0]?.maxOrder
      ? maxOrderResult[0].maxOrder + 1
      : 1;

    const challengeType: "SELECT" | "ASSIST" =
      type === "SELECT" || type === "ASSIST" ? type : "SELECT";

    const [newChallenge] = await db
      .insert(challenges)
      .values({
        lessonId: typeof lessonId === "string" ? parseInt(lessonId) : lessonId,
        type: challengeType,
        question,
        order: nextOrder,
      })
      .returning();

    return NextResponse.json(newChallenge, { status: 201 });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}

