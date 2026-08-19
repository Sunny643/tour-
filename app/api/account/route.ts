import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { updateAppUserBranding } from "@/lib/db/queries/appUsers";
import { updateBrandingSchema } from "@/lib/validation/schemas";
import { PLAN_LIMITS } from "@/lib/billing/limits";

export async function GET() {
  const appUser = await getOrCreateAppUser();
  return NextResponse.json({
    appUser,
    usage: { used: appUser.rendersUsedThisPeriod, limit: PLAN_LIMITS[appUser.plan] },
  });
}

export async function PATCH(req: NextRequest) {
  const appUser = await getOrCreateAppUser();
  const body = await req.json();
  const parsed = updateBrandingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await updateAppUserBranding(appUser.id, parsed.data);
  return NextResponse.json({ appUser: updated });
}
