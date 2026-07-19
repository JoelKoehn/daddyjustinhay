"use client";

import { useActionState } from "react";
import { createSeller } from "@/app/lib/actions/admin";

export function SellerForm() {
  const [state, formAction, pending] = useActionState(createSeller, undefined);
  const inputClass = "rounded-sm border border-border bg-background px-3 py-2 text-foreground";

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <input name="name" placeholder="Seller name" required className={inputClass} />
      <input name="contact_email" placeholder="Contact email" type="email" className={inputClass} />
      <input name="region" placeholder="Region" className={inputClass} />
      <div className="sm:col-span-3">
        {state?.error && <p className="mb-2 text-sm text-danger">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-accent px-4 py-2 text-sm font-heading uppercase tracking-wide text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add seller"}
        </button>
      </div>
    </form>
  );
}
