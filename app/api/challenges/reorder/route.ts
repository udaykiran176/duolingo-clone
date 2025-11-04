import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { challenges } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { items: { id: number; order: number }[] };
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items must be an array" },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json({ success: true });
    }

    for (const item of items) {
      if (typeof item.id !== "number" || typeof item.order !== "number") {
        return NextResponse.json(
          { error: "Each item must have id (number) and order (number)" },
          { status: 400 }
        );
      }
    }

    await Promise.all(
      items.map((item) =>
        db
          .update(challenges)
          .set({ order: item.order })
          .where(eq(challenges.id, item.id))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering challenges:", error);
    return NextResponse.json(
      {
        error: "Failed to reorder challenges",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

