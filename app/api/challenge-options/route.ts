import { eq, desc, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { challengeOptions } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");

    if (!challengeId) {
      return NextResponse.json(
        { error: "challengeId is required" },
        { status: 400 }
      );
    }

    const options = await db
      .select()
      .from(challengeOptions)
      .where(eq(challengeOptions.challengeId, parseInt(challengeId)))
      .orderBy(asc(challengeOptions.order));

    return NextResponse.json(options);
  } catch (error) {
    console.error("Error fetching challenge options:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenge options" },
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
      challengeId: string | number;
      text: string;
      correct: boolean;
      imageSrc?: string | null;
      audioSrc?: string | null;
      order?: number;
    };
    const { challengeId, text, correct, imageSrc, audioSrc, order } = body;

    if (!challengeId || !text || typeof correct !== "boolean") {
      return NextResponse.json(
        { error: "ChallengeId, text, and correct are required" },
        { status: 400 }
      );
    }

    // Get the max order value for this challenge
    const maxOrderResult = await db
      .select({ maxOrder: challengeOptions.order })
      .from(challengeOptions)
      .where(eq(challengeOptions.challengeId, typeof challengeId === "string" ? parseInt(challengeId) : challengeId))
      .orderBy(desc(challengeOptions.order))
      .limit(1);

    const nextOrder = order !== undefined ? order : (maxOrderResult[0]?.maxOrder ? maxOrderResult[0].maxOrder + 1 : 1);

    const [newOption] = await db
      .insert(challengeOptions)
      .values({
        challengeId: typeof challengeId === "string" ? parseInt(challengeId) : challengeId,
        text,
        correct: Boolean(correct),
        imageSrc: imageSrc || null,
        audioSrc: audioSrc || null,
        order: nextOrder,
      })
      .returning();

    return NextResponse.json(newOption, { status: 201 });
  } catch (error) {
    console.error("Error creating challenge option:", error);
    return NextResponse.json(
      { error: "Failed to create challenge option" },
      { status: 500 }
    );
  }
}

