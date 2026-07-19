import Stripe from "stripe";

let stripe: Stripe | null = null;

// Lazily constructed so a missing key doesn't crash routes that never
// touch Stripe (mirrors the same guard used for Supabase in proxy.ts).
export function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set.");
    }
    stripe = new Stripe(key);
  }
  return stripe;
}
