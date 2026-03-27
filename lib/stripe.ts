import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }

  if (!stripe) {
    stripe = new Stripe(key);
  }

  return stripe;
}
