import type { AppUser } from "@/lib/db/schema";
import { resetUsagePeriodIfElapsed } from "@/lib/db/queries/appUsers";

// Placeholder limits — adjust once real pricing is finalized.
export const PLAN_LIMITS: Record<AppUser["plan"], number> = {
  free: 2,
  pro: 50,
};

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
}

export async function checkAndPrepareRenderUsage(appUser: AppUser): Promise<UsageCheckResult> {
  await resetUsagePeriodIfElapsed(appUser.id);
  const limit = PLAN_LIMITS[appUser.plan];
  const stillOverPeriod = appUser.periodResetAt < new Date();
  const used = stillOverPeriod ? 0 : appUser.rendersUsedThisPeriod;
  return { allowed: used < limit, used, limit };
}
