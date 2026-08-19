import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { getRazorpayClient } from "@/lib/billing/razorpay";
import { db } from "@/lib/db/client";
import { appUsers } from "@/lib/db/schema";

// Razorpay subscriptions need a finite cycle count; ~10 years of monthly
// billing stands in for "until cancelled".
const MONTHLY_CYCLES = 120;

export async function POST() {
  const appUser = await getOrCreateAppUser();
  const planId = process.env.RAZORPAY_PRO_PLAN_ID;
  if (!planId) {
    return NextResponse.json(
      { error: "Billing is not configured (RAZORPAY_PRO_PLAN_ID missing)" },
      { status: 500 }
    );
  }

  const subscription = await getRazorpayClient().subscriptions.create({
    plan_id: planId,
    total_count: MONTHLY_CYCLES,
    customer_notify: 1,
    // Lets the webhook map the subscription back to our user even if the
    // subscription id write below were to fail.
    notes: { appUserId: appUser.id },
  });

  // Record the id now so webhooks can resolve the user by subscription id.
  // The plan stays "free" until subscription.activated arrives.
  await db
    .update(appUsers)
    .set({ razorpaySubscriptionId: subscription.id, updatedAt: new Date() })
    .where(eq(appUsers.id, appUser.id));

  return NextResponse.json({ url: subscription.short_url });
}
