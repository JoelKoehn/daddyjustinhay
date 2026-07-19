import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/lib/actions/auth";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  return (
    <header className="border-b border-border bg-background-elevated">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-heading text-xl font-semibold uppercase tracking-wide text-foreground"
        >
          Daddy Justin <span className="text-accent">Hay</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-muted transition-colors hover:text-foreground">
            Lots
          </Link>
          {role === "admin" && (
            <Link href="/admin" className="text-muted transition-colors hover:text-foreground">
              Admin
            </Link>
          )}
          {user ? (
            <>
              <Link href="/account" className="text-muted transition-colors hover:text-foreground">
                Account
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-muted transition-colors hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted transition-colors hover:text-foreground">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-sm bg-accent px-4 py-2 font-heading uppercase tracking-wide text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
