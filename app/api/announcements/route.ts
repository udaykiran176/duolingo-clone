import { NextResponse } from "next/server";

import { getActiveAnnouncement } from "@/db/queries-announcements";

export async function GET() {
  try {
    const announcement = await getActiveAnnouncement();

    return NextResponse.json({
      announcement,
    });
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcement" },
      { status: 500 }
    );
  }
}

