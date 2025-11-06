import { NextResponse } from "next/server";

import { refillHearts } from "@/actions/user-progress";

export async function POST() {
  try {
    await refillHearts();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error refilling hearts:", error);
    return NextResponse.json(
      { error: "Failed to refill hearts" },
      { status: 500 }
    );
  }
}

