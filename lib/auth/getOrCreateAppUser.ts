import { auth, currentUser } from "@clerk/nextjs/server";
import { createAppUser, findAppUserByClerkId } from "@/lib/db/queries/appUsers";
import type { AppUser } from "@/lib/db/schema";

// On-demand upsert (not a Clerk webhook) — simplest for v1, no public callback
// URL needed during local dev. Tradeoff: email changes in Clerk won't sync
// here automatically. Acceptable for v1; a webhook can replace this later.
export async function getOrCreateAppUser(): Promise<AppUser> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const existing = await findAppUserByClerkId(userId);
  if (existing) return existing;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    throw new Error("Unable to resolve email for authenticated user");
  }

  return createAppUser({ clerkUserId: userId, email });
}
