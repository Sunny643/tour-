import Stripe from "stripe";

let client: Stripe | undefined;

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}
