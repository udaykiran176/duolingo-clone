import { NextResponse } from "next/server";

import { getCourses, getUserProgress } from "@/db/queries";

export async function GET() {
  try {
    const [courses, userProgress] = await Promise.all([
      getCourses(),
      getUserProgress(),
    ]);

    return NextResponse.json({
      courses,
      activeCourseId: userProgress?.activeCourseId ?? null,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

