import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { courses } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allCourses = await db
      .select()
      .from(courses)
      .orderBy(courses.order);

    return NextResponse.json(allCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
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
    const { title, imageSrc } = body;

    if (!title || !imageSrc) {
      return NextResponse.json(
        { error: "Title and imageSrc are required" },
        { status: 400 }
      );
    }

    // Get the max order value
    const maxOrderResult = await db
      .select({ maxOrder: courses.order })
      .from(courses)
      .orderBy(desc(courses.order))
      .limit(1);

    const nextOrder = maxOrderResult[0]?.maxOrder
      ? maxOrderResult[0].maxOrder + 1
      : 1;

    const [newCourse] = await db
      .insert(courses)
      .values({
        title,
        imageSrc,
        order: nextOrder,
      })
      .returning();

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}

