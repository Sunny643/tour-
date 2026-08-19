import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  verifyWebhookSignature,
  planForSubscriptionStatus,
  type RazorpaySubscriptionStatus,
} from "@/lib/billing/razorpay";
import { db } from "@/lib/db/client";
import { appUsers } from "@/lib/db/schema";

// Signature verification needs the exact raw body — never parse it first.
export const runtime = "nodejs";

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
        status?: RazorpaySubscriptionStatus;
        notes?: Record<string, string>;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RAZORPAY_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing x-razorpay-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  let valid = false;
  try {
    valid = verifyWebhookSignature(rawBody, signature, secret);
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const body = JSON.parse(rawBody) as RazorpayWebhookBody;
  const entity = body.payload?.subscription?.entity;

  // Only subscription lifecycle events change entitlement.
  if (!body.event?.startsWith("subscription.") || !entity?.status) {
    return NextResponse.json({ received: true });
  }

  const plan = planForSubscriptionStatus(entity.status);
  const isTerminal = plan === "free" && entity.status !== "created";

  // Prefer the subscription id we stored at checkout; fall back to the
  // appUserId we stamped into notes.
  const where = entity.id
    ? eq(appUsers.razorpaySubscriptionId, entity.id)
    : entity.notes?.appUserId
      ? eq(appUsers.id, entity.notes.appUserId)
      : null;

  if (!where) {
    return NextResponse.json({ received: true });
  }

  await db
    .update(appUsers)
    .set({
      plan,
      // Clear the link once the subscription is truly over so the user can
      // start a fresh one.
      razorpaySubscriptionId: isTerminal ? null : (entity.id ?? null),
      updatedAt: new Date(),
    })
    .where(where);

  return NextResponse.json({ received: true });
}
