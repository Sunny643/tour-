/**
 * Razorpay adapter — verified against razorpay@2.9.8 type definitions and the
 * live API docs on 2026-08-19.
 *
 *   subscriptions.create({ plan_id, total_count, ... }) -> { id, status, short_url }
 *   subscriptions.fetch(id)                             -> subscription entity
 *   subscriptions.cancel(id, cancelAtCycleEnd)          -> subscription entity
 *   Razorpay.validateWebhookSignature(body, sig, secret): boolean  (static)
 *
 * Unlike Stripe there is no hosted Customer Portal. `short_url` on a created
 * subscription is the hosted authorization page we redirect the user to, and
 * cancellation is an API call we expose ourselves.
 */
import Razorpay from "razorpay";

export type RazorpaySubscriptionStatus =
  | "created"
  | "authenticated"
  | "active"
  | "pending"
  | "halted"
  | "cancelled"
  | "completed"
  | "expired";

let client: Razorpay | undefined;

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
  }
  if (!client) {
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return client;
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  return Razorpay.validateWebhookSignature(rawBody, signature, secret);
}

/**
 * Which plan a Razorpay subscription status entitles the user to.
 * `pending` is a failed-charge retry window — we keep access rather than
 * cutting it off mid-cycle; `halted` is after retries are exhausted.
 */
export function planForSubscriptionStatus(status: RazorpaySubscriptionStatus): "free" | "pro" {
  switch (status) {
    case "authenticated":
    case "active":
    case "pending":
      return "pro";
    case "created":
    case "halted":
    case "cancelled":
    case "completed":
    case "expired":
      return "free";
  }
}
