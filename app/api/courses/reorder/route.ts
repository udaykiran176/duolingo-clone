import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { courses } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body; // items should be [{ id: number, order: number }]

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items must be an array" },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Validate items structure
    for (const item of items) {
      if (typeof item.id !== "number" || typeof item.order !== "number") {
        return NextResponse.json(
          { error: "Each item must have id (number) and order (number)" },
          { status: 400 }
        );
      }
    }

    // Update all courses in parallel (neon-http doesn't support transactions)
    // Using Promise.all for parallel updates
    await Promise.all(
      items.map((item) =>
        db
          .update(courses)
          .set({ order: item.order })
          .where(eq(courses.id, item.id))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering courses:", error);
    return NextResponse.json(
      { error: "Failed to reorder courses", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

