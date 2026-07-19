"use server";

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

export async function createBankSetupIntent(): Promise<
  { clientSecret: string; error?: undefined } | { error: string; clientSecret?: undefined }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const stripe = getStripe();
  let customerId = profile?.stripe_customer_id as string | null | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["us_bank_account"],
    payment_method_options: {
      us_bank_account: {
        financial_connections: {
          permissions: ["payment_method", "balances"],
        },
      },
    },
    metadata: { supabase_user_id: user.id },
  });

  if (!setupIntent.client_secret) {
    return { error: "Could not start bank linking. Try again." };
  }

  return { clientSecret: setupIntent.client_secret };
}

// Optimistic confirmation so the UI updates immediately after the client
// reports success, without waiting on the webhook round-trip. The webhook
// (setup_intent.succeeded) remains the authoritative source of truth —
// it's what fires for delayed micro-deposit verification, for example.
export async function confirmBankLinked(paymentMethodId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ bank_linked: true, stripe_payment_method_id: paymentMethodId })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return {};
}
