import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getStripeClient } from "@/lib/billing/stripe";
import { db } from "@/lib/db/client";
import { appUsers } from "@/lib/db/schema";

// Signature verification needs the raw body, so this route must not rely on
// any parsed-body helper. Node runtime is required for the Stripe SDK's crypto.
export const runtime = "nodejs";

async function setPlanByCustomerId(
  customerId: string,
  plan: "free" | "pro",
  subscriptionId: string | null
): Promise<void> {
  await db
    .update(appUsers)
    .set({ plan, stripeSubscriptionId: subscriptionId, updatedAt: new Date() })
    .where(eq(appUsers.stripeCustomerId, customerId));
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.customer === "string") {
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        await setPlanByCustomerId(session.customer, "pro", subscriptionId);
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      if (typeof subscription.customer === "string") {
        const active = subscription.status === "active" || subscription.status === "trialing";
        await setPlanByCustomerId(subscription.customer, active ? "pro" : "free", subscription.id);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      if (typeof subscription.customer === "string") {
        await setPlanByCustomerId(subscription.customer, "free", null);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
