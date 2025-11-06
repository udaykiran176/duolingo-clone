import { cache } from "react";
import { eq, desc } from "drizzle-orm";

import db from "./drizzle";
import { announcements } from "./schema";

export const getActiveAnnouncement = cache(async () => {
  try {
    const data = await db.query.announcements.findFirst({
      where: eq(announcements.isActive, true),
      orderBy: [desc(announcements.createdAt)],
    });

    return data || null;
  } catch (error) {
    console.error("Error fetching active announcement:", error);
    return null;
  }
});

export const getAllAnnouncements = cache(async () => {
  const data = await db.query.announcements.findMany({
    orderBy: [desc(announcements.createdAt)],
  });

  return data;
});

