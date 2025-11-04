import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { units } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    let allUnits;
    if (courseId) {
      allUnits = await db
        .select()
        .from(units)
        .where(eq(units.courseId, parseInt(courseId)))
        .orderBy(units.order);
    } else {
      allUnits = await db.select().from(units).orderBy(units.order);
    }

    return NextResponse.json(allUnits);
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
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
      title: string;
      description: string;
      courseId: string | number;
    };
    const { title, description, courseId } = body;

    if (!title || !description || !courseId) {
      return NextResponse.json(
        { error: "Title, description, and courseId are required" },
        { status: 400 }
      );
    }

    // Get the max order value for this course
    const maxOrderResult = await db
      .select({ maxOrder: units.order })
      .from(units)
      .where(eq(units.courseId, typeof courseId === "string" ? parseInt(courseId) : courseId))
      .orderBy(desc(units.order))
      .limit(1);

    const nextOrder = maxOrderResult[0]?.maxOrder
      ? maxOrderResult[0].maxOrder + 1
      : 1;

    const [newUnit] = await db
      .insert(units)
      .values({
        title,
        description,
        courseId: typeof courseId === "string" ? parseInt(courseId) : courseId,
        order: nextOrder,
      })
      .returning();

    return NextResponse.json(newUnit, { status: 201 });
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 }
    );
  }
}

