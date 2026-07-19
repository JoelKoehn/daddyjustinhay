"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { createBankSetupIntent, confirmBankLinked } from "@/app/lib/actions/stripe";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function BankLinkButton({ email }: { email: string | null | undefined }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setStatus("loading");
    setError(null);

    if (!stripePromise) {
      setError("Stripe isn't configured yet.");
      setStatus("error");
      return;
    }

    const intentResult = await createBankSetupIntent();
    if (!intentResult.clientSecret) {
      setError(intentResult.error ?? "Could not start bank linking.");
      setStatus("error");
      return;
    }

    const stripe = await stripePromise;
    if (!stripe) {
      setError("Stripe failed to load.");
      setStatus("error");
      return;
    }

    const { setupIntent, error: collectError } = await stripe.collectBankAccountForSetup({
      clientSecret: intentResult.clientSecret,
      params: {
        payment_method_type: "us_bank_account",
        payment_method_data: {
          billing_details: { email: email ?? undefined },
        },
      },
      expand: ["payment_method"],
    });

    if (collectError) {
      setError(collectError.message ?? "Bank linking was cancelled.");
      setStatus("error");
      return;
    }

    let finalIntent = setupIntent;

    if (finalIntent?.status === "requires_confirmation") {
      const confirmResult = await stripe.confirmUsBankAccountSetup(intentResult.clientSecret);
      if (confirmResult.error) {
        setError(confirmResult.error.message ?? "Could not confirm bank account.");
        setStatus("error");
        return;
      }
      finalIntent = confirmResult.setupIntent;
    }

    if (finalIntent?.status === "succeeded") {
      const paymentMethod = finalIntent.payment_method;
      const paymentMethodId =
        typeof paymentMethod === "string" ? paymentMethod : paymentMethod?.id;

      if (paymentMethodId) {
        const confirmed = await confirmBankLinked(paymentMethodId);
        if (confirmed.error) {
          console.error("Failed to save bank link locally:", confirmed.error);
        }
      }
      setStatus("success");
      return;
    }

    // Not succeeded yet (e.g. micro-deposit verification pending) — the
    // webhook will finish this once Stripe confirms it.
    setStatus("success");
  }

  if (status === "success") {
    return (
      <p className="text-sm text-emerald-600">
        Bank account linked! Refresh this page if the status below doesn&apos;t update.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {status === "loading" ? "Connecting…" : "Link your bank account"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
