import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { challenges } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challenge = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, parseInt(params.id)))
      .limit(1);

    if (challenge.length === 0) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json(challenge[0]);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenge" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      lessonId?: string | number;
      type?: string;
      question?: string;
      imageSrc?: string;
      randomOrder?: boolean;
    };
    const { lessonId, type, question, imageSrc, randomOrder } = body;

    const updateData: Partial<{
      question: string;
      type: 'SELECT' | 'ASSIST';
      lessonId: number;
      imageSrc: string | null;
      randomOrder: boolean;
    }> = {};
    if (typeof question === 'string') updateData.question = question;
    if (type === "SELECT" || type === "ASSIST") {
      updateData.type = type;
    }
    if (typeof lessonId === 'string' && !isNaN(parseInt(lessonId))) {
      updateData.lessonId = parseInt(lessonId);
    } else if (typeof lessonId === 'number') {
      updateData.lessonId = lessonId;
    }
    if (imageSrc !== undefined) {
      updateData.imageSrc = imageSrc && imageSrc.trim() !== "" ? imageSrc : null;
    }
    if (randomOrder !== undefined) {
      updateData.randomOrder = randomOrder;
    }

    const [updatedChallenge] = await db
      .update(challenges)
      .set(updateData)
      .where(eq(challenges.id, parseInt(params.id)))
      .returning();

    if (!updatedChallenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json(
      { error: "Failed to update challenge" },
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

    await db.delete(challenges).where(eq(challenges.id, parseInt(params.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return NextResponse.json(
      { error: "Failed to delete challenge" },
      { status: 500 }
    );
  }
}

