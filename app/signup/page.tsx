"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, signInWithGoogle } from "@/app/lib/actions/auth";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">
        Create an account
      </h1>

      <form action={action} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-muted">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="mt-1 w-full rounded-sm border border-border bg-background-elevated px-3 py-2 text-foreground"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-muted">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-sm border border-border bg-background-elevated px-3 py-2 text-foreground"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-muted">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-sm border border-border bg-background-elevated px-3 py-2 text-foreground"
          />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        {state?.message && <p className="text-sm text-success">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-accent px-4 py-2 font-heading uppercase tracking-wide text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <form action={signInWithGoogle} className="mt-3">
        <button
          type="submit"
          className="w-full rounded-sm border border-border px-4 py-2 text-foreground transition-colors hover:border-accent"
        >
          Continue with Google
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
