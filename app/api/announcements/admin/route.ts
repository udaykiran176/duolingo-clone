import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { announcements } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
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
      title?: string;
      message?: string;
      link?: string | null;
      isActive?: boolean;
    };
    const { title, message, link, isActive } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        title,
        message,
        link: link || null,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json(newAnnouncement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

