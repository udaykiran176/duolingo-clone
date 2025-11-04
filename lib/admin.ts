import { auth, currentUser } from "@clerk/nextjs/server";

export const getIsAdmin = async () => {
  const { userId } = await auth();
  const raw = process.env.CLERK_ADMIN_IDS || "";
  const adminIds = raw ? raw.split(/,\s*/) : [];

  if (!userId) return false;

  // Check explicit list fallback
  if (adminIds.indexOf(userId) !== -1) return true;

  // Check Clerk user metadata flags
  try {
    const user = await currentUser();
    const role = (user?.publicMetadata as any)?.role;
    const adminFlag = (user?.publicMetadata as any)?.admin;
    if (role === "admin" || adminFlag === true) return true;
  } catch (_) {
    // ignore
  }

  return false;
};
