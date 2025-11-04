import { desc, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";
import { userProgress, userSubscription, courses } from "@/db/schema";
import { getIsAdmin } from "@/lib/admin";

const DAY_IN_MS = 86_400_000;

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build where condition for search
    let whereCondition;
    if (search) {
      whereCondition = or(
        ilike(userProgress.userName, `%${search}%`),
        ilike(userProgress.userId, `%${search}%`)
      );
    }

    // Get total count for pagination
    const allUsers = await db.select().from(userProgress);
    const filteredUsers = whereCondition
      ? allUsers.filter((user) => {
          const nameMatch = user.userName
            .toLowerCase()
            .includes(search.toLowerCase());
          const idMatch = user.userId.toLowerCase().includes(search.toLowerCase());
          return nameMatch || idMatch;
        })
      : allUsers;
    const total = filteredUsers.length;

    // Get paginated user progress
    const usersProgress = await (
      whereCondition
        ? db
            .select()
            .from(userProgress)
            .where(whereCondition)
            .orderBy(desc(userProgress.points))
            .limit(limit)
            .offset(offset)
        : db
            .select()
            .from(userProgress)
            .orderBy(desc(userProgress.points))
            .limit(limit)
            .offset(offset)
    );

    // Get all subscriptions for these users
    const userIds = usersProgress.map((u) => u.userId);
    const allSubscriptions =
      userIds.length > 0
        ? await db.select().from(userSubscription)
        : [];
    const subscriptions = allSubscriptions.filter((sub) =>
      userIds.includes(sub.userId)
    );

    // Get courses for active course IDs
    const courseIds = usersProgress
      .map((u) => u.activeCourseId)
      .filter((id): id is number => id !== null);
    const allCourses = await db.select().from(courses);
    const coursesData = allCourses.filter((c) => courseIds.includes(c.id));

    // Create maps for quick lookup
    const subscriptionMap = new Map(
      subscriptions.map((sub) => [sub.userId, sub])
    );
    const courseMap = new Map(coursesData.map((c) => [c.id, c]));

    // Format the response with subscription status
    const formattedUsers = usersProgress.map((user) => {
      const subscription = subscriptionMap.get(user.userId);
      const course = user.activeCourseId
        ? courseMap.get(user.activeCourseId)
        : null;

      const isActive =
        subscription?.stripeCurrentPeriodEnd &&
        new Date(subscription.stripeCurrentPeriodEnd).getTime() + DAY_IN_MS >
          Date.now();

      return {
        userId: user.userId,
        userName: user.userName,
        userImageSrc: user.userImageSrc,
        hearts: user.hearts,
        points: user.points,
        activeCourse: course?.title || "None",
        hasSubscription: !!subscription,
        isActive: !!isActive,
        subscriptionEndDate: subscription?.stripeCurrentPeriodEnd
          ? new Date(subscription.stripeCurrentPeriodEnd).toISOString()
          : null,
        stripeCustomerId: subscription?.stripeCustomerId || null,
        stripeSubscriptionId: subscription?.stripeSubscriptionId || null,
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

