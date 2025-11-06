import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { announcements } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = (await request.json()) as {
      title?: string;
      message?: string;
      link?: string | null;
      isActive?: boolean;
    };
    const { title, message, link, isActive } = body;

    const updateData: {
      title?: string;
      message?: string;
      link?: string | null;
      isActive?: boolean;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (link !== undefined) updateData.link = link || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(announcements)
      .set(updateData)
      .where(eq(announcements.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await db.delete(announcements).where(eq(announcements.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}

