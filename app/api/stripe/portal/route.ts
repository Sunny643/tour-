import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/auth/getOrCreateAppUser";
import { getStripeClient } from "@/lib/billing/stripe";

export async function POST() {
  const appUser = await getOrCreateAppUser();
  if (!appUser.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet — subscribe first" }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await getStripeClient().billingPortal.sessions.create({
    customer: appUser.stripeCustomerId,
    return_url: `${origin}/account/billing`,
  });

  return NextResponse.json({ url: session.url });
}
