import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { lessons } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get("unitId");

    let allLessons;
    if (unitId) {
      allLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.unitId, parseInt(unitId)))
        .orderBy(lessons.order);
    } else {
      allLessons = await db.select().from(lessons).orderBy(lessons.order);
    }

    return NextResponse.json(allLessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
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

    const body = await request.json();
    const { title, unitId } = body;

    if (!title || !unitId) {
      return NextResponse.json(
        { error: "Title and unitId are required" },
        { status: 400 }
      );
    }

    // Get the max order value for this unit
    const maxOrderResult = await db
      .select({ maxOrder: lessons.order })
      .from(lessons)
      .where(eq(lessons.unitId, parseInt(unitId)))
      .orderBy(desc(lessons.order))
      .limit(1);

    const nextOrder = maxOrderResult[0]?.maxOrder
      ? maxOrderResult[0].maxOrder + 1
      : 1;

    const [newLesson] = await db
      .insert(lessons)
      .values({
        title,
        unitId: parseInt(unitId),
        order: nextOrder,
      })
      .returning();

    return NextResponse.json(newLesson, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}

