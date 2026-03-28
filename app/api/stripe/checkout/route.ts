import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/stripe";

const FALLBACK_URL = "https://dashboard.stripe.com/test/payments";

export async function POST() {
  const stripe = getStripeClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!stripe || !process.env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json({
      ok: true,
      mode: "fallback",
      url: FALLBACK_URL,
      message: "Configure STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID for live checkout.",
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${site}/?upgrade=success`,
    cancel_url: `${site}/?upgrade=cancelled`,
    metadata: {
      tier: "pro",
      cadence: "25_per_year",
    },
  });

  return NextResponse.json({ ok: true, url: session.url });
}
