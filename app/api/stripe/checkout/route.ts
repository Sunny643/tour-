import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { getStripeClient } from "@/lib/billing/stripe";
import { db } from "@/lib/db/client";
import { appUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const appUser = await getOrCreateAppUser();
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Billing is not configured (STRIPE_PRO_PRICE_ID missing)" }, { status: 500 });
  }

  const stripe = getStripeClient();

  let customerId = appUser.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: appUser.email, metadata: { appUserId: appUser.id } });
    customerId = customer.id;
    await db.update(appUsers).set({ stripeCustomerId: customerId }).where(eq(appUsers.id, appUser.id));
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account/billing?checkout=success`,
    cancel_url: `${origin}/account/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
