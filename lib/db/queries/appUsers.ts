import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { appUsers, type AppUser } from "@/lib/db/schema";

export async function findAppUserByClerkId(clerkUserId: string): Promise<AppUser | undefined> {
  const rows = await db.select().from(appUsers).where(eq(appUsers.clerkUserId, clerkUserId)).limit(1);
  return rows[0];
}

export async function createAppUser(input: { clerkUserId: string; email: string }): Promise<AppUser> {
  const rows = await db
    .insert(appUsers)
    .values({ clerkUserId: input.clerkUserId, email: input.email })
    .returning();
  return rows[0];
}

export async function updateAppUserBranding(
  appUserId: string,
  input: Partial<{
    brandLogoKey: string | null;
    brandContactName: string | null;
    brandContactPhone: string | null;
    brandContactEmail: string | null;
    brandContactWebsite: string | null;
    defaultPersona: "agent" | "host";
  }>
): Promise<AppUser> {
  const rows = await db
    .update(appUsers)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(appUsers.id, appUserId))
    .returning();
  return rows[0];
}

export async function incrementRenderUsage(appUserId: string): Promise<void> {
  await db
    .update(appUsers)
    .set({
      rendersUsedThisPeriod: sql`${appUsers.rendersUsedThisPeriod} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(appUsers.id, appUserId));
}

export async function resetUsagePeriodIfElapsed(appUserId: string): Promise<void> {
  await db
    .update(appUsers)
    .set({
      rendersUsedThisPeriod: 0,
      periodResetAt: sql`now() + interval '30 days'`,
      updatedAt: new Date(),
    })
    .where(sql`${appUsers.id} = ${appUserId} AND ${appUsers.periodResetAt} < now()`);
}
