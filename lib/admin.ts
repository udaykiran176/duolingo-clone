import { auth, currentUser } from "@clerk/nextjs/server";

interface ClerkPublicMetadata {
  role?: string;
  admin?: boolean;
  [key: string]: unknown;
}

// Note: Avoid duplicating global env type augmentations here to prevent conflicts

export const getIsAdmin = async (): Promise<boolean> => {
  const { userId } = await auth();
  const raw = process.env.CLERK_ADMIN_IDS || "";
  const adminIds = raw ? raw.split(/\s*,\s*/) : [];

  if (!userId) return false;

  // Check explicit list fallback
  if (adminIds.includes(userId)) return true;

  // Check Clerk user metadata flags
  try {
    const user = await currentUser();
    if (!user) return false;
    
    const metadata = user.publicMetadata as ClerkPublicMetadata;
    const role = metadata?.role;
    const adminFlag = metadata?.admin;
    
    return role === "admin" || adminFlag === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
