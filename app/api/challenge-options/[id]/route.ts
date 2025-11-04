import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { challengeOptions } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text, correct, imageSrc, audioSrc } = body;

    const updateData: any = {};
    if (text !== undefined) updateData.text = text;
    if (typeof correct === "boolean") updateData.correct = correct;
    if (imageSrc !== undefined) updateData.imageSrc = imageSrc || null;
    if (audioSrc !== undefined) updateData.audioSrc = audioSrc || null;

    const [updatedOption] = await db
      .update(challengeOptions)
      .set(updateData)
      .where(eq(challengeOptions.id, parseInt(params.id)))
      .returning();

    if (!updatedOption) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    return NextResponse.json(updatedOption);
  } catch (error) {
    console.error("Error updating challenge option:", error);
    return NextResponse.json(
      { error: "Failed to update challenge option" },
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

    await db
      .delete(challengeOptions)
      .where(eq(challengeOptions.id, parseInt(params.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting challenge option:", error);
    return NextResponse.json(
      { error: "Failed to delete challenge option" },
      { status: 500 }
    );
  }
}

