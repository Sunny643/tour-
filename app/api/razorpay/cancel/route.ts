import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { getRazorpayClient } from "@/lib/billing/razorpay";

// Razorpay has no hosted Customer Portal, so cancellation is ours to expose.
// Cancels at the end of the paid cycle so the user keeps what they paid for;
// the subscription.cancelled webhook drops them back to the free plan.
export async function POST() {
  const appUser = await getOrCreateAppUser();
  if (!appUser.razorpaySubscriptionId) {
    return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
  }

  const subscription = await getRazorpayClient().subscriptions.cancel(
    appUser.razorpaySubscriptionId,
    true
  );

  return NextResponse.json({ status: subscription.status });
}
